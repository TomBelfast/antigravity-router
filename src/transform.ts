// ============================================================================
// Transform: OpenAI / Anthropic format <-> Antigravity Unified Gateway API
// ============================================================================

import { randomUUID } from "node:crypto";
import type { ModelInfo } from "./constants.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface OpenAIFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface OpenAITool {
  type: "function";
  function: OpenAIFunction;
}

export interface OpenAIToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool" | "function" | "developer";
  content?: string | OpenAIContentPart[] | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: OpenAIToolCall[];
}

export interface OpenAIChatRequest {
  model?: string;
  messages?: OpenAIMessage[];
  stream?: boolean;
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
  tools?: OpenAITool[];
  tool_choice?: unknown;
}

export interface OpenAIChatResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: OpenAIToolCall[];
    };
    finish_reason: string;
  }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// ── Thought Signature & Tool Call Cache ─────────────────────────────────────

export const DEFAULT_FALLBACK_SIG =
  "EswBCskBARFNMg+HeGtUAeFe/GxuxRuuBMi0N8ZS9tmzuLQQ0ikPX/OQnB7I6zEbP9/nCDgOoZ2atgra8br7ao353RZaF0PStOBnxxlSjS++k61ptIPLPAySCNApRoR7+h25Ve5VtSRV202Hu9CeF1eVbuQg5P8TaGo5TsYiD34L3HY7spSRixfar5++pJ/ZX7n0jyDtimwx+NOjwsbXq7+vRYZKZpDByf31NBU9PRFQyfIC5umvwsf6Y4vNhiHo39CzRCacZXjx4ytxcG4I";

interface ToolCallCacheEntry {
  name: string;
  thoughtSignature?: string;
  timestamp: number;
}

const toolCallCache = new Map<string, ToolCallCacheEntry>();
const lastSignatureByName = new Map<string, string>();

export function storeToolCallInfo(id: string, name: string, thoughtSignature?: string): void {
  const sig = thoughtSignature || lastSignatureByName.get(name) || DEFAULT_FALLBACK_SIG;
  toolCallCache.set(id, { name, thoughtSignature: sig, timestamp: Date.now() });
  if (thoughtSignature) {
    lastSignatureByName.set(name, thoughtSignature);
  }
  if (toolCallCache.size > 2000) {
    const oldestKey = toolCallCache.keys().next().value;
    if (oldestKey) toolCallCache.delete(oldestKey);
  }
}

export function getToolCallInfo(id?: string, name?: string): { name: string; thoughtSignature?: string } {
  if (id && toolCallCache.has(id)) {
    const entry = toolCallCache.get(id)!;
    return { name: entry.name, thoughtSignature: entry.thoughtSignature };
  }
  if (name && lastSignatureByName.has(name)) {
    return { name, thoughtSignature: lastSignatureByName.get(name) };
  }
  return { name: name || "tool", thoughtSignature: DEFAULT_FALLBACK_SIG };
}

// ── OpenAI -> Antigravity ──────────────────────────────────────────────────

function safeJsonParse(val: unknown): Record<string, unknown> {
  if (typeof val === "object" && val !== null) return val as Record<string, unknown>;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return { raw: val };
    }
  }
  return {};
}

export function sanitizeSchemaForGemini(raw: any): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    return { type: "STRING" };
  }

  let target = raw;
  if (Array.isArray(raw.anyOf) && raw.anyOf.length > 0) {
    const nonNull = raw.anyOf.find((b: any) => b.type !== "null") || raw.anyOf[0];
    const isNullable = raw.anyOf.some((b: any) => b.type === "null");
    target = { ...nonNull, ...(isNullable ? { nullable: true } : {}) };
  } else if (Array.isArray(raw.oneOf) && raw.oneOf.length > 0) {
    const nonNull = raw.oneOf.find((b: any) => b.type !== "null") || raw.oneOf[0];
    const isNullable = raw.oneOf.some((b: any) => b.type === "null");
    target = { ...nonNull, ...(isNullable ? { nullable: true } : {}) };
  } else if (Array.isArray(raw.allOf) && raw.allOf.length > 0) {
    target = Object.assign({}, ...raw.allOf);
  }

  const result: Record<string, unknown> = {};

  let typeStr = target.type;
  if (Array.isArray(typeStr)) {
    if (typeStr.includes("null")) {
      result.nullable = true;
    }
    typeStr = typeStr.find((t: string) => t !== "null") || "string";
  }

  if (typeof typeStr === "string") {
    const upper = typeStr.toUpperCase();
    if (["STRING", "NUMBER", "INTEGER", "BOOLEAN", "ARRAY", "OBJECT"].includes(upper)) {
      result.type = upper;
    } else {
      result.type = "STRING";
    }
  } else if (target.properties && typeof target.properties === "object") {
    result.type = "OBJECT";
  } else if (target.items) {
    result.type = "ARRAY";
  } else {
    result.type = "STRING";
  }

  if (typeof target.description === "string" && target.description) {
    result.description = target.description;
  }

  if (target.nullable === true || target.nullable === "true") {
    result.nullable = true;
  }

  if (Array.isArray(target.enum) && target.enum.length > 0) {
    result.enum = target.enum.map((e: any) => String(e));
  }

  if (typeof target.format === "string" && target.format) {
    result.format = target.format;
  }

  if (result.type === "OBJECT") {
    const cleanProps: Record<string, unknown> = {};
    if (target.properties && typeof target.properties === "object") {
      for (const [key, propVal] of Object.entries(target.properties)) {
        cleanProps[key] = sanitizeSchemaForGemini(propVal);
      }
    }
    result.properties = cleanProps;

    if (Array.isArray(target.required)) {
      result.required = target.required.map(String).filter((k: string) => k in cleanProps);
    }
  }

  if (result.type === "ARRAY") {
    if (target.items) {
      result.items = sanitizeSchemaForGemini(target.items);
    } else {
      result.items = { type: "STRING" };
    }
  }

  return result;
}

function convertOpenAITools(tools?: OpenAITool[]): any[] | undefined {
  if (!tools || !Array.isArray(tools) || tools.length === 0) return undefined;
  const functionDeclarations: any[] = [];
  for (const t of tools) {
    const fn = (t as any).function || t;
    if (fn && fn.name) {
      functionDeclarations.push({
        name: fn.name,
        description: fn.description || "",
        parameters: sanitizeSchemaForGemini(fn.parameters || { type: "OBJECT", properties: {} }),
      });
    }
  }
  return functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined;
}

function convertOpenAIToolChoice(toolChoice?: unknown): Record<string, unknown> | undefined {
  if (!toolChoice) return undefined;
  if (typeof toolChoice === "string") {
    const norm = toolChoice.toLowerCase();
    if (norm === "auto") return { functionCallingConfig: { mode: "AUTO" } };
    if (norm === "required") return { functionCallingConfig: { mode: "ANY" } };
    if (norm === "none") return { functionCallingConfig: { mode: "NONE" } };
  }
  if (typeof toolChoice === "object" && toolChoice !== null) {
    const tc = toolChoice as any;
    const fnName = tc?.function?.name || tc?.name;
    if (fnName) {
      return {
        functionCallingConfig: {
          mode: "ANY",
          allowedFunctionNames: [fnName],
        },
      };
    }
  }
  return undefined;
}

function messageToAntigravityContent(msg: OpenAIMessage): { role: string; parts: any[] } {
  const parts: any[] = [];

  if (msg.role === "assistant") {
    // 1. Assistant text
    if (typeof msg.content === "string" && msg.content.trim()) {
      parts.push({ text: msg.content });
    }

    // 2. Assistant tool calls
    if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const info = getToolCallInfo(tc.id, tc.function?.name);
        const sig = info.thoughtSignature || DEFAULT_FALLBACK_SIG;
        const name = tc.function?.name || info.name;
        const args = safeJsonParse(tc.function?.arguments);
        parts.push({
          thoughtSignature: sig,
          functionCall: {
            name,
            args,
            ...(tc.id ? { id: tc.id } : {}),
          },
        });
      }
    }

    if (parts.length === 0) {
      parts.push({ text: " " });
    }

    return { role: "model", parts };
  }

  if (msg.role === "tool" || msg.role === "function") {
    const info = getToolCallInfo(msg.tool_call_id, msg.name);
    const toolName = msg.name || info.name || "tool";
    const toolId = msg.tool_call_id || undefined;
    let output = "";
    if (typeof msg.content === "string") {
      output = msg.content;
    } else if (msg.content != null) {
      output = JSON.stringify(msg.content);
    }
    parts.push({
      functionResponse: {
        name: toolName,
        ...(toolId ? { id: toolId } : {}),
        response: { output },
      },
    });
    return { role: "user", parts };
  }

  // User message
  if (typeof msg.content === "string") {
    parts.push({ text: msg.content || " " });
    return { role: "user", parts };
  }

  if (Array.isArray(msg.content)) {
    for (const p of msg.content) {
      if (p.type === "text" && p.text) {
        parts.push({ text: p.text });
      } else if (p.type === "image_url" && p.image_url) {
        const match = p.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }
    }
  }

  if (parts.length === 0) {
    parts.push({ text: " " });
  }

  return { role: "user", parts };
}

export function openAIToAntigravity(
  req: OpenAIChatRequest,
  modelInfo: ModelInfo,
  projectId: string,
): Record<string, unknown> {
  const rawMessages = req.messages || [];
  const systemMessages = rawMessages.filter(
    (m) => m.role === "system" || m.role === "developer",
  );
  const chatMessages = rawMessages.filter(
    (m) => m.role !== "system" && m.role !== "developer",
  );

  if (chatMessages.length === 0) {
    chatMessages.push({ role: "user", content: "Hello" });
  }

  const rawContents = chatMessages.map(messageToAntigravityContent);
  const contents: { role: string; parts: any[] }[] = [];
  for (const item of rawContents) {
    if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
      contents[contents.length - 1].parts.push(...item.parts);
    } else {
      contents.push(item);
    }
  }
  if (contents.length > 0 && contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: "Hello" }] });
  }

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

  const tools = convertOpenAITools(req.tools);
  if (tools) {
    request["tools"] = tools;
    const toolConfig = convertOpenAIToolChoice(req.tool_choice);
    if (toolConfig) {
      request["toolConfig"] = toolConfig;
    }
  }

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

  const toolCalls: OpenAIToolCall[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.functionCall) {
      const id = p.functionCall.id || `call_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
      storeToolCallInfo(id, p.functionCall.name, p.thoughtSignature);
      let argsStr = "{}";
      try {
        argsStr =
          typeof p.functionCall.args === "string"
            ? p.functionCall.args
            : JSON.stringify(p.functionCall.args || {});
      } catch {
        argsStr = "{}";
      }
      toolCalls.push({
        id,
        type: "function",
        function: {
          name: p.functionCall.name,
          arguments: argsStr,
        },
      });
    }
  }

  const hasToolCalls = toolCalls.length > 0;
  const finishReason = hasToolCalls
    ? "tool_calls"
    : candidate?.finishReason?.toLowerCase() === "max_tokens" ||
      candidate?.finishReason?.toLowerCase() === "maximum_tokens"
    ? "length"
    : "stop";

  const message: {
    role: "assistant";
    content: string | null;
    tool_calls?: OpenAIToolCall[];
  } = {
    role: "assistant",
    content: text || (hasToolCalls ? null : ""),
  };
  if (hasToolCalls) {
    message.tool_calls = toolCalls;
  }

  return {
    id: `chatcmpl-${requestId}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message,
        finish_reason: finishReason,
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

export interface StreamState {
  hadToolCalls: boolean;
  isFirstChunk: boolean;
}

export function antigravityChunkToSSE(
  chunk: string,
  model: string,
  requestId: string,
  state: StreamState,
): { sseText: string | null; isDone: boolean } {
  try {
    const raw = JSON.parse(chunk);
    const root = raw?.response ?? raw ?? {};
    const candidate = root?.candidates?.[0];

    const parts = candidate?.content?.parts ?? [];
    const text = parts.map((p: any) => (!p.thought ? (p?.text ?? "") : "")).join("");
    const finishReason = candidate?.finishReason ?? null;

    const toolCalls: any[] = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.functionCall) {
        const id = p.functionCall.id || `call_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
        storeToolCallInfo(id, p.functionCall.name, p.thoughtSignature);
        let argsStr = "{}";
        try {
          argsStr =
            typeof p.functionCall.args === "string"
              ? p.functionCall.args
              : JSON.stringify(p.functionCall.args || {});
        } catch {
          argsStr = "{}";
        }
        toolCalls.push({
          index: i,
          id,
          type: "function",
          function: {
            name: p.functionCall.name,
            arguments: argsStr,
          },
        });
      }
    }

    if (toolCalls.length > 0) {
      state.hadToolCalls = true;
    }

    const delta: Record<string, unknown> = {};
    if (state.isFirstChunk) {
      delta["role"] = "assistant";
      delta["content"] = text || "";
      state.isFirstChunk = false;
    } else if (text) {
      delta["content"] = text;
    }

    if (toolCalls.length > 0) {
      delta["tool_calls"] = toolCalls;
    }

    if (!text && toolCalls.length === 0 && !finishReason) {
      return { sseText: null, isDone: false };
    }

    let normFinish: string | null = null;
    if (finishReason) {
      if (state.hadToolCalls || finishReason === "MALFORMED_FUNCTION_CALL") {
        normFinish = "tool_calls";
      } else {
        const lower = finishReason.toLowerCase();
        if (lower === "stop") {
          normFinish = "stop";
        } else if (lower === "max_tokens" || lower === "maximum_tokens") {
          normFinish = "length";
        } else {
          normFinish = "stop";
        }
      }
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
          finish_reason: normFinish,
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

export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
}

export interface AnthropicRequest {
  model?: string;
  messages?: { role: "user" | "assistant"; content: string | any[] }[];
  system?: string | { type: string; text: string }[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  tools?: AnthropicTool[];
}

export function anthropicToAntigravity(
  req: AnthropicRequest,
  modelInfo: ModelInfo,
  projectId: string,
): Record<string, unknown> {
  const rawMessages = req.messages || [];
  const rawContents: { role: string; parts: any[] }[] = [];

  for (const m of rawMessages) {
    const role = m.role === "assistant" ? "model" : "user";
    const parts: any[] = [];

    if (typeof m.content === "string") {
      parts.push({ text: m.content || " " });
    } else if (Array.isArray(m.content)) {
      for (const block of m.content) {
        if (block.type === "text" && block.text) {
          parts.push({ text: block.text });
        } else if (block.type === "tool_use") {
          const info = getToolCallInfo(block.id, block.name);
          const sig = info.thoughtSignature || DEFAULT_FALLBACK_SIG;
          parts.push({
            thoughtSignature: sig,
            functionCall: {
              name: block.name,
              args: block.input || {},
              id: block.id,
            },
          });
        } else if (block.type === "tool_result") {
          const info = getToolCallInfo(block.tool_use_id);
          const toolName = info.name || "tool";
          const toolId = block.tool_use_id || undefined;
          let output = "";
          if (typeof block.content === "string") {
            output = block.content;
          } else if (Array.isArray(block.content)) {
            output = block.content.map((c: any) => c.text || JSON.stringify(c)).join("\n");
          } else if (block.content != null) {
            output = JSON.stringify(block.content);
          }
          parts.push({
            functionResponse: {
              name: toolName,
              ...(toolId ? { id: toolId } : {}),
              response: { output },
            },
          });
        }
      }
    }

    if (parts.length === 0) {
      parts.push({ text: " " });
    }

    rawContents.push({ role, parts });
  }

  if (rawContents.length === 0) {
    rawContents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  const contents: { role: string; parts: any[] }[] = [];
  for (const item of rawContents) {
    if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
      contents[contents.length - 1].parts.push(...item.parts);
    } else {
      contents.push(item);
    }
  }
  if (contents.length > 0 && contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: "Hello" }] });
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

  if (req.tools && Array.isArray(req.tools) && req.tools.length > 0) {
    const functionDeclarations = req.tools.map((t) => ({
      name: t.name,
      description: t.description || "",
      parameters: sanitizeSchemaForGemini(t.input_schema || { type: "OBJECT", properties: {} }),
    }));
    request["tools"] = [{ functionDeclarations }];
  }

  if (req.system) {
    const sysText =
      typeof req.system === "string"
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

  const content: any[] = [];
  if (text) {
    content.push({ type: "text", text });
  }

  let hasToolUse = false;
  for (const p of parts) {
    if (p.functionCall) {
      hasToolUse = true;
      const id = p.functionCall.id || `toolu_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
      storeToolCallInfo(id, p.functionCall.name, p.thoughtSignature);
      content.push({
        type: "tool_use",
        id,
        name: p.functionCall.name,
        input: p.functionCall.args || {},
      });
    }
  }

  if (content.length === 0) {
    content.push({ type: "text", text: "" });
  }

  return {
    id: `msg_${requestId}`,
    type: "message",
    role: "assistant",
    model,
    content,
    stop_reason: hasToolUse ? "tool_use" : "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: root?.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: root?.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}
