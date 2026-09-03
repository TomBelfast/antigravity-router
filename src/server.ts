import path from "node:path";
import express, { type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { loadApiKeys, createApiKey, deleteApiKey, validateApiKey, getAdminPassword } from "./keys.js";
import { recordUsage, getUsageStats } from "./stats.js";
import { removeAccount, addOrUpdateAccount } from "./token.js";
import { buildAuthUrl, exchangeCode } from "./oauth.js";
import { renderDashboardHtml } from "./ui.js";
import {
  ANTIGRAVITY_ENDPOINTS,
  ANTIGRAVITY_DEFAULT_PROJECT_ID,
  ANTIGRAVITY_HEADERS,
  MODEL_MAP,
  PROXY_PORT,
  resolveModelInfo,
} from "./constants.js";
import {
  getCandidateAccounts,
  getValidAccessTokenForAccount,
  markAccountRateLimited,
  markAccountSuccess,
  advanceAccountIndex,
  getAccountsStatus,
  refreshAllAccountsQuota,
} from "./token.js";
import {
  openAIToAntigravity,
  antigravityToOpenAI,
  antigravityChunkToSSE,
  anthropicToAntigravity,
  antigravityToAnthropic,
  type OpenAIChatRequest,
  type AnthropicRequest,
} from "./transform.js";

const app = express();
app.use(express.json({ limit: "20mb" }));

// ── Static file: Docker package download ─────────────────────────────────
import { createReadStream, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname2 = dirname(fileURLToPath(import.meta.url));
const DOWNLOAD_FILE = join(__dirname2, "../downloads/antigravity-proxy-docker.zip");
app.get("/downloads/antigravity-proxy-docker.zip", (_req: Request, res: Response) => {
  if (!existsSync(DOWNLOAD_FILE)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  const stat = statSync(DOWNLOAD_FILE);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=antigravity-proxy-docker.zip");
  res.setHeader("Content-Length", stat.size);
  createReadStream(DOWNLOAD_FILE).pipe(res);
});

// ── Universal Request Logger ──────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[REQ] ${new Date().toLocaleTimeString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
app.options("*", (_req: Request, res: Response) => {
  res.sendStatus(200);
});

// ── Security & Authentication Middlewares ────────────────────────────────
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const keys = loadApiKeys();
  if (keys.length === 0) {
    return next();
  }
  const authHeader = req.headers.authorization;
  const xApiKey = req.headers["x-api-key"] as string | undefined;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : (authHeader || xApiKey);

  if (!token) {
    return res.status(401).json({
      error: {
        message: "Missing API Key. Provide Authorization: Bearer <key> or x-api-key header.",
        type: "authentication_error"
      }
    });
  }

  const { valid, keyObj } = validateApiKey(token);
  if (!valid) {
    return res.status(401).json({
      error: {
        message: "Invalid or inactive API Key. Generate a valid key in the dashboard.",
        type: "authentication_error"
      }
    });
  }
  (req as any).apiKeyInfo = keyObj;
  next();
}

function isAdminAuthorized(req: Request): boolean {
  const pass = req.headers["x-admin-password"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : undefined);
  return pass === getAdminPassword();
}

// ── Web UI Dashboard ──────────────────────────────────────────────────────
app.get(["/dashboard", "/ui", "/admin"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderDashboardHtml());
});

// ── Root Handler (HTML -> Dashboard, JSON -> Healthcheck) ─────────────────
app.get("/", (req: Request, res: Response) => {
  if (req.headers.accept?.includes("text/html")) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(renderDashboardHtml());
  }
  const accountsStatus = getAccountsStatus();
  res.json({
    status: "ok",
    service: "antigravity-cursor-proxy",
    totalAccounts: accountsStatus.length,
    activeAccounts: accountsStatus.filter((a) => a.status === "active").length,
  });
});

// ── Public Healthcheck ────────────────────────────────────────────────────
app.get(["/favicon.ico", "/favicon.svg"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.sendFile(path.join(process.cwd(), "favicon.svg"));
});

app.get(["/health", "/v1", "/v1/health"], (_req: Request, res: Response) => {
  const accountsStatus = getAccountsStatus();
  res.json({
    status: "ok",
    service: "antigravity-cursor-proxy",
    totalAccounts: accountsStatus.length,
    activeAccounts: accountsStatus.filter((a) => a.status === "active").length,
  });
});

// ── Admin API Endpoints ───────────────────────────────────────────────────
app.post("/api/admin/verify", (req: Request, res: Response) => {
  const { password } = req.body || {};
  res.json({ ok: password === getAdminPassword() });
});

app.post("/api/admin/accounts/refresh-quota", async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });
  await refreshAllAccountsQuota();
  res.json({ ok: true, accounts: getAccountsStatus() });
});

app.get("/api/admin/data", (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const accountsStatus = getAccountsStatus();
  const keys = loadApiKeys();
  res.json({
    totalAccounts: accountsStatus.length,
    activeAccounts: accountsStatus.filter((a) => a.status === "active").length,
    accounts: accountsStatus,
    keys,
  });
});

app.post("/api/admin/keys", (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { name } = req.body || {};
  const key = createApiKey(name || "Default Key");
  res.json({ key });
});

app.delete("/api/admin/keys/:id", (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const ok = deleteApiKey(req.params.id);
  res.json({ ok });
});

// ── Admin Stats Endpoint (24h, 7d, 30d) ──────────────────────────────────
app.get("/api/admin/stats", (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const range = (req.query.range as "24h" | "7d" | "30d" | "all") || "24h";
  const keyId = req.query.keyId ? String(req.query.keyId) : undefined;
  const model = req.query.model ? String(req.query.model) : undefined;
  const accountEmail = req.query.accountEmail ? String(req.query.accountEmail) : undefined;
  const stats = getUsageStats({ range, keyId, model, accountEmail });
  res.json(stats);
});

// ── Admin Account Management Endpoints ────────────────────────────────────
app.get("/api/admin/oauth-url", async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { url } = await buildAuthUrl();
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/admin/accounts/oauth-exchange", async (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { callbackUrl } = req.body || {};
    let code: string | null = null;
    let state: string | null = null;
    if (callbackUrl) {
      const u = new URL(callbackUrl.startsWith("http") ? callbackUrl : `http://localhost/?${callbackUrl.replace(/^\?/, "")}`);
      code = u.searchParams.get("code");
      state = u.searchParams.get("state");
    }
    if (!code || !state) {
      return res.status(400).json({ error: "Missing code or state in URL" });
    }
    const result = await exchangeCode(code, state);
    addOrUpdateAccount({
      email: result.email,
      refreshToken: result.refreshToken,
      accessToken: result.accessToken,
      accessTokenExpires: result.expiresAt,
      projectId: result.projectId,
    });
    res.json({ success: true, email: result.email });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.delete("/api/admin/accounts/:email", (req: Request, res: Response) => {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const email = decodeURIComponent(req.params.email);
  const success = removeAccount(email);
  res.json({ success });
});

// ── GET /models and /v1/models (with/without trailing slash) ───────────────
const ALLOWED_MODELS = [
  "claude-3-7-sonnet",
  "claude-opus-4-6-thinking",
  "gemini-3.8-flash-high"
];

app.get(["/v1/models", "/models", "/v1/models/", "/models/"], requireApiKey, (_req: Request, res: Response) => {
  const models = ALLOWED_MODELS.map((id) => ({
    id,
    object: "model",
    created: 1700000000,
    owned_by: "antigravity",
  }));
  res.json({ object: "list", data: models });
});

// ── Check if error indicates rate limit / quota exhaustion ────────────────
function isRateLimitOrQuotaError(status: number, message: string): boolean {
  if (status === 429 || status === 529 || status === 503) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes("resource_exhausted") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("quota exceeded") ||
    lower.includes("quota_exhausted") ||
    lower.includes("exhausted") ||
    lower.includes("capacity")
  );
}

// ── Call Antigravity with Multi-Account Failover ───────────────────────────
async function executeWithFailover(
  buildPayload: (effectiveProjectId: string) => Record<string, unknown>,
  isStreaming: boolean,
  requestId: string,
): Promise<{ ok: boolean; response?: globalThis.Response; activeAccount?: string; error?: string }> {
  const candidates = getCandidateAccounts();
  if (candidates.length === 0) {
    return { ok: false, error: "No accounts configured. Run: npm run login" };
  }

  const apiMethod = isStreaming ? "streamGenerateContent" : "generateContent";
  const streamParam = isStreaming ? "?alt=sse" : "";

  let lastError = "";

  for (const { account } of candidates) {
    try {
      const { accessToken, projectId, email } = await getValidAccessTokenForAccount(account);
      const effectiveProjectId = projectId || ANTIGRAVITY_DEFAULT_PROJECT_ID;
      const payload = buildPayload(effectiveProjectId);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": ANTIGRAVITY_HEADERS["User-Agent"],
        "X-Goog-Api-Client": ANTIGRAVITY_HEADERS["X-Goog-Api-Client"],
        "Client-Metadata": ANTIGRAVITY_HEADERS["Client-Metadata"],
      };

      if (isStreaming) {
        headers["Accept"] = "text/event-stream";
      }

      let accountFailedWithQuota = false;

      for (const baseEndpoint of ANTIGRAVITY_ENDPOINTS) {
        const url = `${baseEndpoint}/v1internal:${apiMethod}${streamParam}`;
        try {
          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            markAccountSuccess(email);
            advanceAccountIndex();
            return { ok: true, response: res, activeAccount: email };
          }

          const errText = await res.text().catch(() => "");
          lastError = `[${res.status}] ${errText.slice(0, 300)}`;

          if (isRateLimitOrQuotaError(res.status, errText)) {
            console.warn(
              `[${requestId}] Account ${email} rate-limited on ${baseEndpoint} (${res.status}). Switching to next account...`,
            );
            markAccountRateLimited(email, 60_000, `HTTP ${res.status}: ${errText.slice(0, 80)}`);
            accountFailedWithQuota = true;
            break;
          }

          if (res.status < 500 && res.status !== 429) {
            break;
          }
        } catch (fetchErr) {
          lastError = `Network error on ${baseEndpoint}: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`;
        }
      }

      if (accountFailedWithQuota) {
        continue;
      }
    } catch (tokenErr) {
      lastError = `Account ${account.email} token error: ${tokenErr instanceof Error ? tokenErr.message : String(tokenErr)}`;
      console.warn(`[${requestId}] ${lastError}`);
    }
  }

  return { ok: false, error: lastError || "All accounts failed" };
}

// ── POST /chat/completions (OpenAI compatible, Zed & Cursor) ──────────────
app.post(
  ["/v1/chat/completions", "/chat/completions", "/v1/chat/completions/", "/chat/completions/"],
  requireApiKey,
  async (req: Request, res: Response) => {
    const requestId = randomUUID().replace(/-/g, "").slice(0, 16);
    const startTime = Date.now();

    try {
      const body = req.body as OpenAIChatRequest;
      const requestedModel = body.model || "claude-sonnet-4-6";
      const modelInfo = resolveModelInfo(requestedModel);
      const isStreaming = body.stream === true;

      console.log(
        `[${requestId}] POST ${req.path} -> model: ${requestedModel} (Antigravity: ${modelInfo.antigravityModel}, stream: ${isStreaming})`,
      );

      const result = await executeWithFailover(
        (effectiveProjectId) => openAIToAntigravity(body, modelInfo, effectiveProjectId),
        isStreaming,
        requestId,
      );

      if (!result.ok || !result.response) {
        console.error(`[${requestId}] All accounts failed: ${result.error}`);
        res.status(502).json({
          error: { message: result.error || "All accounts failed", type: "rate_limit_or_api_error" },
        });
        return;
      }

      const apiRes = result.response;
      console.log(`[${requestId}] Response success via account: ${result.activeAccount}`);

      if (isStreaming) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        const reader = apiRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let isFirstChunk = true;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6).trim();
                if (jsonStr === "[DONE]") {
                  res.write("data: [DONE]\n\n");
                  continue;
                }
                const { sseText } = antigravityChunkToSSE(jsonStr, requestedModel, requestId, isFirstChunk);
                if (sseText) {
                  res.write(sseText);
                  isFirstChunk = false;
                }
              }
            }
          }
          res.write("data: [DONE]\n\n");
        } catch (streamErr) {
          console.error(`[${requestId}] Stream reading error:`, streamErr);
        } finally {
          const latencyMs = Date.now() - startTime;
          const keyInfo = (req as any).apiKeyInfo || {};
          recordUsage({
            model: requestedModel,
            promptTokens: 50,
            completionTokens: 120,
            keyId: keyInfo.id,
            keyName: keyInfo.name,
            accountEmail: result.activeAccount,
            latencyMs,
            status: "success",
          });
          res.end();
        }
      } else {
        const data = await apiRes.json();
        const openAIResp = antigravityToOpenAI(data, requestedModel, requestId);
        const latencyMs = Date.now() - startTime;
        const keyInfo = (req as any).apiKeyInfo || {};
        recordUsage({
          model: requestedModel,
          promptTokens: openAIResp.usage?.prompt_tokens || 20,
          completionTokens: openAIResp.usage?.completion_tokens || 10,
          keyId: keyInfo.id,
          keyName: keyInfo.name,
          accountEmail: result.activeAccount,
          latencyMs,
          status: "success",
        });
        res.json(openAIResp);
      }
    } catch (err) {
      console.error(`[${requestId}] Handler error:`, err);
      res.status(500).json({
        error: { message: err instanceof Error ? err.message : String(err), type: "internal_error" },
      });
    }
  },
);

// ── POST /messages (Anthropic compatible) ─────────────────────────────────
app.post(
  ["/v1/messages", "/messages", "/v1/messages/", "/messages/"],
  requireApiKey,
  async (req: Request, res: Response) => {
    const requestId = randomUUID().replace(/-/g, "").slice(0, 16);

    try {
      const body = req.body as AnthropicRequest;
      const requestedModel = body.model || "claude-sonnet-4-6";
      const modelInfo = resolveModelInfo(requestedModel);
      const isStreaming = body.stream === true;

      console.log(
        `[${requestId}] POST ${req.path} (Anthropic) -> model: ${requestedModel} (Antigravity: ${modelInfo.antigravityModel}, stream: ${isStreaming})`,
      );

      const result = await executeWithFailover(
        (effectiveProjectId) => anthropicToAntigravity(body, modelInfo, effectiveProjectId),
        isStreaming,
        requestId,
      );

      if (!result.ok || !result.response) {
        res.status(502).json({
          type: "error",
          error: { type: "api_error", message: result.error || "All accounts failed" },
        });
        return;
      }

      const apiRes = result.response;

      if (isStreaming) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        res.write(`event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { id: `msg_${requestId}`, type: "message", role: "assistant", model: requestedModel, content: [] } })}\n\n`);
        res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } })}\n\n`);

        const reader = apiRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                const jsonStr = trimmed.slice(6).trim();
                if (jsonStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const root = parsed?.response ?? parsed;
                  const parts = root?.candidates?.[0]?.content?.parts ?? [];
                  const text = parts.map((p: any) => (!p.thought ? (p?.text ?? "") : "")).join("");
                  if (text) {
                    res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text } })}\n\n`);
                  }
                } catch {}
              }
            }
          }
          res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: 0 })}\n\n`);
          res.write(`event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`);
        } catch (streamErr) {
          console.error(`[${requestId}] Anthropic stream reading error:`, streamErr);
        } finally {
          res.end();
        }
      } else {
        const data = await apiRes.json();
        const anthropicResp = antigravityToAnthropic(data, requestedModel, requestId);
        recordUsage({
          model: requestedModel,
          promptTokens: (anthropicResp.usage as any)?.input_tokens || 20,
          completionTokens: (anthropicResp.usage as any)?.output_tokens || 10,
        });
        res.json(anthropicResp);
      }
    } catch (err) {
      console.error(`[${requestId}] Anthropic handler error:`, err);
      res.status(500).json({
        type: "error",
        error: { type: "internal_error", message: err instanceof Error ? err.message : String(err) },
      });
    }
  },
);

// ── Catch-all 404 logger ──────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  console.warn(`[404 UNMATCHED] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log("");
  console.log("  ╔══════════════════════════════════════════╗");
  console.log("  ║   Antigravity Cursor & Zed Proxy         ║");
  console.log(`  ║   Listening: http://localhost:${PROXY_PORT}      ║`);
  console.log("  ╚══════════════════════════════════════════╝");
  console.log("");

  const accountsStatus = getAccountsStatus();
  console.log(`  ✅ Connected accounts (${accountsStatus.length}):`);
  accountsStatus.forEach((a) => {
    console.log(`     - ${a.email} (${a.status})`);
  });
  console.log("");
});
