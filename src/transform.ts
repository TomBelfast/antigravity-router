// ============================================================================
// Transform: OpenAI / Anthropic format <-> Antigravity Unified Gateway API
// ============================================================================

import type { ModelInfo } from "./constants.js";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenAIContentPart[];
}

export interface OpenAIContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface OpenAIChatRequest {
  model?: string;
  messages?: OpenAIMessage[];
  stream?: boolean;
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
}

export interface OpenAIChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: string;
  }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// ── OpenAI -> Antigravity ──────────────────────────────────────────────────

function messageToAntigravityContent(msg: OpenAIMessage): { role: string; parts: unknown[] } {
  const role = msg.role === "assistant" ? "model" : "user";

  if (typeof msg.content === "string") {
    return { role, parts: [{ text: msg.content }] };
  }

  if (Array.isArray(msg.content)) {
    const parts = msg.content.map((p) => {
      if (p.type === "text") return { text: p.text ?? "" };
      if (p.type === "image_url" && p.image_url) {
        const match = p.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          return { inlineData: { mimeType: match[1], data: match[2] } };
        }
      }
      return { text: "" };
    });
    return { role, parts };
  }

  return { role, parts: [{ text: "" }] };
}

export function openAIToAntigravity(
  req: OpenAIChatRequest,
  modelInfo: ModelInfo,
  projectId: string,
): Record<string, unknown> {
  const rawMessages = req.messages || [];
  const systemMessages = rawMessages.filter((m) => m.role === "system");
  const chatMessages = rawMessages.filter((m) => m.role !== "system");

  if (chatMessages.length === 0) {
    chatMessages.push({ role: "user", content: "Hello" });
  }

  const contents = chatMessages.map(messageToAntigravityContent);

  let maxTokens = req.max_tokens ?? req.max_completion_tokens ?? 8192;
  if (modelInfo.thinkingBudget && maxTokens <= modelInfo.thinkingBudget) {
    maxTokens = Math.max(64000, modelInfo.thinkingBudget + 4096);
  }
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    ...(req.temperature != null ? { temperature: req.temperature } : {}),
  };

  if (modelInfo.thinkingLevel) {
    generationConfig["thinkingConfig"] = {
      thinkingLevel: modelInfo.thinkingLevel,
    };
  } else if (modelInfo.thinkingBudget) {
    generationConfig["thinkingConfig"] = {
      thinkingBudget: modelInfo.thinkingBudget,
    };
  }

  const request: Record<string, unknown> = {
    contents,
    generationConfig,
  };

  if (systemMessages.length > 0) {
    const sysText = systemMessages
      .map((m) => (typeof m.content === "string" ? m.content : ""))
      .filter(Boolean)
      .join("\n\n");
    if (sysText) {
      request["systemInstruction"] = {
        parts: [{ text: sysText }],
      };
    }
  }

  return {
    project: projectId,
    model: modelInfo.antigravityModel,
    request,
  };
}

// ── Antigravity -> OpenAI (non-streaming) ──────────────────────────────────

export function antigravityToOpenAI(
  raw: any,
  model: string,
  requestId: string,
): OpenAIChatResponse {
  const root = raw?.response ?? raw ?? {};
  const candidate = root?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts.map((p: any) => (!p.thought ? (p?.text ?? "") : "")).join("");

  return {
    id: `chatcmpl-${requestId}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: candidate?.finishReason?.toLowerCase() === "stop" ? "stop" : (candidate?.finishReason ?? "stop"),
      },
    ],
    usage: root?.usageMetadata
      ? {
          prompt_tokens: root.usageMetadata.promptTokenCount ?? 0,
          completion_tokens: root.usageMetadata.candidatesTokenCount ?? 0,
          total_tokens: root.usageMetadata.totalTokenCount ?? 0,
        }
      : undefined,
  };
}

// ── Antigravity -> OpenAI (SSE chunk) ──────────────────────────────────────

export function antigravityChunkToSSE(
  chunk: string,
  model: string,
  requestId: string,
  isFirstChunk = false,
): { sseText: string | null; isDone: boolean } {
  try {
    const raw = JSON.parse(chunk);
    const root = raw?.response ?? raw ?? {};
    const candidate = root?.candidates?.[0];

    const parts = candidate?.content?.parts ?? [];
    const text = parts.map((p: any) => (!p.thought ? (p?.text ?? "") : "")).join("");
    const finishReason = candidate?.finishReason ?? null;

    const delta: Record<string, unknown> = {};
    if (isFirstChunk) {
      delta["role"] = "assistant";
      delta["content"] = text || "";
    } else if (text) {
      delta["content"] = text;
    }

    const payload = {
      id: `chatcmpl-${requestId}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          delta,
          finish_reason: finishReason ? (finishReason.toLowerCase() === "stop" ? "stop" : finishReason) : null,
        },
      ],
    };

    return {
      sseText: `data: ${JSON.stringify(payload)}\n\n`,
      isDone: !!finishReason,
    };
  } catch {
    return { sseText: null, isDone: false };
  }
}

// ── Anthropic Messages format support ─────────────────────────────────────

export interface AnthropicRequest {
  model?: string;
  messages?: { role: "user" | "assistant"; content: string | any[] }[];
  system?: string | { type: string; text: string }[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export function anthropicToAntigravity(
  req: AnthropicRequest,
  modelInfo: ModelInfo,
  projectId: string,
): Record<string, unknown> {
  const rawMessages = req.messages || [];
  const contents = rawMessages.map((m) => {
    const role = m.role === "assistant" ? "model" : "user";
    const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    return { role, parts: [{ text }] };
  });

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  let maxTokens = req.max_tokens ?? 8192;
  if (modelInfo.thinkingBudget && maxTokens <= modelInfo.thinkingBudget) {
    maxTokens = Math.max(64000, modelInfo.thinkingBudget + 4096);
  }
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    ...(req.temperature != null ? { temperature: req.temperature } : {}),
  };

  if (modelInfo.thinkingLevel) {
    generationConfig["thinkingConfig"] = {
      thinkingLevel: modelInfo.thinkingLevel,
    };
  } else if (modelInfo.thinkingBudget) {
    generationConfig["thinkingConfig"] = {
      thinkingBudget: modelInfo.thinkingBudget,
    };
  }

  const request: Record<string, unknown> = {
    contents,
    generationConfig,
  };

  if (req.system) {
    const sysText = typeof req.system === "string"
      ? req.system
      : Array.isArray(req.system)
      ? req.system.map((s) => s.text ?? "").join("\n\n")
      : "";
    if (sysText) {
      request["systemInstruction"] = { parts: [{ text: sysText }] };
    }
  }

  return {
    project: projectId,
    model: modelInfo.antigravityModel,
    request,
  };
}

export function antigravityToAnthropic(
  raw: any,
  model: string,
  requestId: string,
): Record<string, unknown> {
  const root = raw?.response ?? raw ?? {};
  const candidate = root?.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts.map((p: any) => (!p.thought ? (p?.text ?? "") : "")).join("");

  return {
    id: `msg_${requestId}`,
    type: "message",
    role: "assistant",
    model,
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: root?.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: root?.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}
