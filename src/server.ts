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
  getFleetQuotaSummary,
} from "./token.js";
import {
  openAIToAntigravity,
  antigravityToOpenAI,
  antigravityChunkToSSE,
  anthropicToAntigravity,
  antigravityToAnthropic,
  storeToolCallInfo,
  type OpenAIChatRequest,
  type AnthropicRequest,
  type StreamState,
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
  const fleet = getFleetQuotaSummary(accountsStatus);
  res.json({
    totalAccounts: accountsStatus.length,
    activeAccounts: accountsStatus.filter((a) => a.status === "active").length,
    accounts: accountsStatus,
    keys,
    fleet,
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
  const fleet = getFleetQuotaSummary();

  const dailyBurn = stats.burnRate.effectiveDailyBurn;
  const daysRemaining = dailyBurn > 0 ? Math.round((fleet.totalRemainingTokens / dailyBurn) * 10) / 10 : null;

  const claudeDailyBurn = stats.burnRate.claudeTokens24h > 0
    ? stats.burnRate.claudeTokens24h
    : (stats.burnRate.claudeDailyAvg7d > 0 ? stats.burnRate.claudeDailyAvg7d : (stats.burnRate.allTimeDailyAvg > 0 ? Math.round(stats.burnRate.allTimeDailyAvg * 0.4) : 0));
  const geminiDailyBurn = stats.burnRate.geminiTokens24h > 0
    ? stats.burnRate.geminiTokens24h
    : (stats.burnRate.geminiDailyAvg7d > 0 ? stats.burnRate.geminiDailyAvg7d : (stats.burnRate.allTimeDailyAvg > 0 ? Math.round(stats.burnRate.allTimeDailyAvg * 0.6) : 0));

  const claudeDaysRemaining = claudeDailyBurn > 0
    ? Math.round((fleet.claudeWeekly.remainingTokensWeekly / claudeDailyBurn) * 10) / 10
    : null;
  const geminiDaysRemaining = geminiDailyBurn > 0
    ? Math.round((fleet.geminiWeekly.remainingTokensWeekly / geminiDailyBurn) * 10) / 10
    : null;

  const daysToReset = fleet.daysToWeeklyReset; // e.g. 4.8 days
  const totalAccounts = fleet.totalAccounts || 14;

  const claudeEq = fleet.claudeWeekly.equivalentFullAccounts; // e.g. 5.88
  const geminiEq = fleet.geminiWeekly.equivalentFullAccounts; // e.g. 7.77

  const claudeTokensNeeded = claudeDailyBurn * daysToReset;
  const geminiTokensNeeded = geminiDailyBurn * daysToReset;
  const claudeAccountsNeeded = claudeTokensNeeded > 0 ? Math.max(1, Math.ceil(claudeTokensNeeded / 1000000)) : 1;
  const geminiAccountsNeeded = geminiTokensNeeded > 0 ? Math.max(1, Math.ceil(geminiTokensNeeded / 4000000)) : 1;
  const requiredAccounts = Math.max(1, claudeAccountsNeeded, geminiAccountsNeeded);

  const spareClaudeAccounts = Math.max(0, Math.round((claudeEq - claudeAccountsNeeded) * 10) / 10);
  const spareGeminiAccounts = Math.max(0, Math.round((geminiEq - geminiAccountsNeeded) * 10) / 10);
  const spareAccounts = Math.min(spareClaudeAccounts, spareGeminiAccounts);

  const fleetDailyCapacity = totalAccounts * 1500000;
  const fleetSaturationPct = dailyBurn > 0 ? Math.min(100, Math.round((dailyBurn / Math.max(1, fleet.totalRemainingTokens)) * 1000) / 10) : 0;

  let verdictStatus: "sufficient" | "warning" | "deficit" = "sufficient";
  let verdictTitle = "";
  let verdictMessage = "";
  let accountsToAdd = 0;

  const w = fleet.resetWaves;
  const nextDays = fleet.nextResetDays;
  const nextEmail = fleet.nextResetEmail ? fleet.nextResetEmail.replace(/@gmail\.com$/, "") : "konto";

  // Effective burn rate per day on active days (defaulting to 50k if currently idle)
  const activeDailyBurn = dailyBurn > 0 ? dailyBurn : 50000;
  const activeClaudeBurn = claudeDailyBurn > 0 ? claudeDailyBurn : 25000;

  // Tokens needed until the next account reset wave arrives (in nextDays)
  const claudeTokensNeededUntilReset = activeClaudeBurn * nextDays;
  const totalTokensNeededUntilReset = activeDailyBurn * nextDays;

  const claudePool = fleet.claudeWeekly.remainingTokensWeekly || 1;
  const totalPool = fleet.totalRemainingTokens || 1;

  if (claudeTokensNeededUntilReset > claudePool || totalTokensNeededUntilReset > totalPool) {
    verdictStatus = "deficit";
    const tokenDeficit = Math.max(claudeTokensNeededUntilReset - claudePool, totalTokensNeededUntilReset - totalPool);
    accountsToAdd = Math.max(1, Math.ceil(tokenDeficit / 1500000));
    verdictTitle = `🔴 ZA MAŁO KONT: BRAKNIE TOKENÓW PRZED RESETEM!`;
    verdictMessage = `Przy Twoim tempie kodowania zapas wyczerpie się przed najbliższym resetem (${nextEmail} za ${nextDays} dni). Musisz dodać +${accountsToAdd} kont Google.`;
  } else if (claudeTokensNeededUntilReset > 0.6 * claudePool || totalTokensNeededUntilReset > 0.6 * totalPool) {
    verdictStatus = "warning";
    accountsToAdd = 2;
    verdictTitle = `🟡 NA STYKU: WYSTARCZY, ALE PRZY MARATONIE WARTO DODAĆ +2 KONTA`;
    verdictMessage = `Obecny zapas wystarczy do najbliższego resetu (${nextEmail} za ${nextDays} dni), ale przy bardzo intensywnej pracy możesz zejść blisko zera.`;
  } else {
    verdictStatus = "sufficient";
    accountsToAdd = 0;
    verdictTitle = `🟢 WYSTARCZY W 100% — NIE TRZEBA DODAWAĆ KONT`;
    verdictMessage = `Twoje obecne tempo kodowania zużywa tylko ułamek floty. Masz ${fleet.claudeWeekly.equivalentFullAccounts} pełnych kont Claude i ${fleet.geminiWeekly.equivalentFullAccounts} Gemini. Za ${nextDays} dni zresetują się kolejne 2 konta (${nextEmail}). Wszystko działa bez przerw.`;
  }

  const prediction = {
    totalRemainingTokens: fleet.totalRemainingTokens,
    totalMaxTokens: fleet.totalMaxTokens,
    totalUsedTokens: fleet.totalUsedTokens,
    remainingPercentage: fleet.remainingPercentage,
    dailyBurnRate: dailyBurn,
    burnRateSource: stats.burnRate.source,
    daysRemaining,
    hoursRemaining: daysRemaining !== null ? Math.round(daysRemaining * 24) : null,
    activeAccounts: fleet.activeAccounts,
    totalAccounts: fleet.totalAccounts,

    // Capacity Sizing & Decision Verdict based on weekly reality
    verdictStatus,
    verdictTitle,
    verdictMessage,
    requiredAccounts,
    spareAccounts,
    accountsToAdd,
    fleetSaturationPct,
    maxDailyCapacityTokens: fleetDailyCapacity,
    daysToWeeklyReset: fleet.daysToWeeklyReset,
    hoursToWeeklyReset: fleet.hoursToWeeklyReset,

    claude: {
      ...fleet.claudeWeekly,
      dailyBurn: claudeDailyBurn,
      daysRemaining: claudeDaysRemaining,
      requiredAccounts: claudeAccountsNeeded,
      spareAccounts: spareClaudeAccounts,
    },
    gemini: {
      ...fleet.geminiWeekly,
      dailyBurn: geminiDailyBurn,
      daysRemaining: geminiDaysRemaining,
      requiredAccounts: geminiAccountsNeeded,
      spareAccounts: spareGeminiAccounts,
    },
  };

  res.json({
    ...stats,
    fleet,
    prediction,
  });
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

      let allEndpointsQuota = true;
      let anyEndpointTried = false;

      for (const baseEndpoint of ANTIGRAVITY_ENDPOINTS) {
        anyEndpointTried = true;
        const url = `${baseEndpoint}/v1internal:${apiMethod}${streamParam}`;
        try {
          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(120000),
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
              `[${requestId}] Endpoint ${baseEndpoint} returned ${res.status} for ${email}. Trying next endpoint...`,
            );
            continue;
          }

          allEndpointsQuota = false;

          if (res.status < 500 && res.status !== 429) {
            console.warn(
              `[${requestId}] Endpoint ${baseEndpoint} returned ${res.status} for ${email}: ${errText.slice(0, 200)}`,
            );
            break;
          }
        } catch (fetchErr) {
          allEndpointsQuota = false;
          lastError = `Network error on ${baseEndpoint}: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`;
        }
      }

      if (anyEndpointTried && allEndpointsQuota) {
        markAccountRateLimited(email, 60_000, "All endpoints rate limited");
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

      const lastMsg = body.messages && body.messages.length > 0 ? body.messages[body.messages.length - 1] : null;
      const lastContent = typeof lastMsg?.content === "string" ? lastMsg.content.slice(0, 100) : JSON.stringify(lastMsg?.content)?.slice(0, 100);
      console.log(
        `[${requestId}] POST ${req.path} -> model: ${requestedModel} (stream: ${isStreaming}, max_tokens: ${body.max_tokens ?? body.max_completion_tokens ?? "default"}, msgs: ${body.messages?.length ?? 0}, tools: ${body.tools?.length ?? 0}, last: "${lastContent}")`,
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
        const streamState: StreamState = { hadToolCalls: false, isFirstChunk: true };

        let totalStreamedText = "";
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
                  continue;
                }
                const { sseText } = antigravityChunkToSSE(jsonStr, requestedModel, requestId, streamState);
                if (sseText) {
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const cand = parsed?.response?.candidates?.[0] || parsed?.candidates?.[0];
                    const parts = cand?.content?.parts || [];
                    const t = parts.map((p: any) => (!p.thought ? (p?.text ?? "") : "")).join("");
                    totalStreamedText += t;
                    if (cand?.finishReason) {
                      console.log(`[${requestId}] Stream finishReason from Google: ${cand.finishReason}`);
                    }
                  } catch {}
                  res.write(sseText);
                }
              }
            }
          }
          res.write("data: [DONE]\n\n");
        } catch (streamErr) {
          console.error(`[${requestId}] Stream reading error:`, streamErr);
        } finally {
          const latencyMs = Date.now() - startTime;
          console.log(`[${requestId}] Stream finished. Total streamed characters: ${totalStreamedText.length}, preview: "${totalStreamedText.slice(0, 120)}"`);
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

        const reader = apiRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let currentBlockIndex = 0;
        let textBlockStarted = false;
        let hasToolUse = false;

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
                  const candidate = root?.candidates?.[0];
                  const parts = candidate?.content?.parts ?? [];

                  for (const p of parts) {
                    if (p.text && !p.thought) {
                      if (!textBlockStarted) {
                        res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: "content_block_start", index: currentBlockIndex, content_block: { type: "text", text: "" } })}\n\n`);
                        textBlockStarted = true;
                      }
                      res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: currentBlockIndex, delta: { type: "text_delta", text: p.text } })}\n\n`);
                    }
                    if (p.functionCall) {
                      hasToolUse = true;
                      if (textBlockStarted) {
                        res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: currentBlockIndex })}\n\n`);
                        textBlockStarted = false;
                        currentBlockIndex++;
                      }
                      const toolId = p.functionCall.id || `toolu_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
                      storeToolCallInfo(toolId, p.functionCall.name, p.thoughtSignature);
                      res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: "content_block_start", index: currentBlockIndex, content_block: { type: "tool_use", id: toolId, name: p.functionCall.name, input: {} } })}\n\n`);
                      res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: currentBlockIndex, delta: { type: "input_json_delta", partial_json: JSON.stringify(p.functionCall.args || {}) } })}\n\n`);
                      res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: currentBlockIndex })}\n\n`);
                      currentBlockIndex++;
                    }
                  }
                } catch {}
              }
            }
          }
          if (textBlockStarted) {
            res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: "content_block_stop", index: currentBlockIndex })}\n\n`);
          }
          res.write(`event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: hasToolUse ? "tool_use" : "end_turn", stop_sequence: null }, usage: { output_tokens: 50 } })}\n\n`);
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
