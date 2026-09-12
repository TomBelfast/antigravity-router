import { loadUsage } from "./stats.js";
import { loadAccounts, saveAccounts, type Account } from "./storage.js";
import { refreshAccessToken } from "./oauth.js";
import { ANTIGRAVITY_ENDPOINT_DAILY, ANTIGRAVITY_HEADERS } from "./constants.js";

// In-memory cooldown tracker: email -> timestamp when rate limit expires
const cooldowns = new Map<string, number>();
const cooldownDetails = new Map<string, string>();

// Current round-robin index
let currentIndex = 0;

export interface AccountCandidate {
  account: Account;
  index: number;
}

/**
 * Returns candidate accounts ordered by availability (non-cooled-down first).
 */
export function getCandidateAccounts(): AccountCandidate[] {
  const accounts = loadAccounts();
  if (accounts.length === 0) {
    return [];
  }

  const now = Date.now();

  // Filter out or sort by cooldown
  const available: AccountCandidate[] = [];
  const coolingDown: AccountCandidate[] = [];

  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    const until = cooldowns.get(acc.email) ?? 0;
    if (until <= now) {
      cooldowns.delete(acc.email);
      available.push({ account: acc, index: i });
    } else {
      coolingDown.push({ account: acc, index: i });
    }
  }

  // Rotate starting from currentIndex among available
  if (available.length > 0) {
    const offset = currentIndex % available.length;
    const rotated = [...available.slice(offset), ...available.slice(0, offset)];
    return [...rotated, ...coolingDown];
  }

  // If all are cooling down, return those with earliest expiry
  coolingDown.sort((a, b) => (cooldowns.get(a.account.email) ?? 0) - (cooldowns.get(b.account.email) ?? 0));
  return coolingDown;
}

/**
 * Advance index so next request uses the next account (load balancing)
 */
export function advanceAccountIndex(): void {
  currentIndex++;
}

/**
 * Marks an account as rate-limited with cooldown.
 */
export function markAccountRateLimited(email: string, durationMs: number = 60_000, reason: string = ""): void {
  const now = Date.now();
  let cooldownMs = durationMs;

  if (reason) {
    const match = reason.match(/Resets in\s+(\d+)h\s*(\d+)m\s*(\d+)s/i);
    if (match) {
      const hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const secs = parseInt(match[3], 10);
      cooldownMs = (hours * 3600 + mins * 60 + secs) * 1000;
    }
  }

  const until = now + cooldownMs;
  cooldowns.set(email, until);
  if (reason) {
    cooldownDetails.set(email, reason);
  }

  console.warn(
    `[rotation] ⚠️ Account ${email} marked as cooling down until ${new Date(until).toLocaleTimeString()} (${reason || "rate limit/quota"})`,
  );
}

/**
 * Clears rate limit cooldown on successful request
 */
export function markAccountSuccess(email: string): void {
  if (cooldowns.has(email)) {
    cooldowns.delete(email);
  }
}

/**
 * Refreshes and returns a valid access token for a specific account.
 */
export async function getValidAccessTokenForAccount(account: Account): Promise<{
  accessToken: string;
  projectId: string;
  email: string;
}> {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.email === account.email);
  const target = idx >= 0 ? accounts[idx] : account;
  const now = Date.now();

  if (!target.accessToken || !target.accessTokenExpires || target.accessTokenExpires <= now) {
    console.log(`[token] Refreshing access token for ${target.email}...`);
    const refreshed = await refreshAccessToken(target.refreshToken);
    target.accessToken = refreshed.accessToken;
    target.accessTokenExpires = refreshed.expiresAt;
    if (idx >= 0) {
      saveAccounts(accounts);
    }
  }

  return {
    accessToken: target.accessToken!,
    projectId: target.projectId ?? "",
    email: target.email,
  };
}

// ── REAL GOOGLE CLOUD QUOTA INTEGRATION ────────────────────────────────────

export interface ModelQuota {
  remainingPercentage: number;
  resetTime?: string;
  resetSeconds: number;
  label: string;
  maxTokens: number;
  remainingTokens: number;
  usedTokens: number;
  weeklyPercentage?: number;
  weeklyResetTime?: string;
  weeklyResetSeconds?: number;
  weeklyDescription?: string;
  description?: string;
}

export interface AccountQuotaStatus {
  email: string;
  projectId?: string;
  status: "active" | "rate_limited";
  cooldownRemainingSeconds?: number;
  rateLimitReason?: string;
  requests5h: number;
  tokens5h: number;
  requests7d: number;
  tokens7d: number;
  claudeQuota: ModelQuota;
  geminiQuota: ModelQuota;
}

interface CachedAccountQuota {
  claudeQuota: ModelQuota;
  geminiQuota: ModelQuota;
  fetchedAt: number;
}

const quotaCache = new Map<string, CachedAccountQuota>();

/**
 * Queries Google CloudCode API for real live model quotas.
 * Uses daily quota windows, matching the Antigravity account limits.
 * Production reports a separate Gemini allowance and must not be used as a quota fallback.
 * Falls back to fetchAvailableModels if summary is not available.
 */
export async function fetchLiveQuotaForAccount(account: Account): Promise<CachedAccountQuota> {
  const now = Date.now();
  try {
    const { accessToken, projectId } = await getValidAccessTokenForAccount(account);
    let summaryData: any = null;
    let lastError: any = null;

    // 1. Read the account windows from daily; generation endpoint order is independent.
    for (const endpoint of [ANTIGRAVITY_ENDPOINT_DAILY]) {
      try {
        const res = await fetch(`${endpoint}/v1internal:retrieveUserQuotaSummary`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...ANTIGRAVITY_HEADERS,
          },
          body: JSON.stringify(projectId ? { project: projectId } : {}),
        });

        if (res.ok) {
          summaryData = await res.json();
          if (summaryData && Array.isArray(summaryData.groups) && summaryData.groups.length > 0) {
            break;
          }
        } else {
          lastError = new Error(`retrieveUserQuotaSummary HTTP ${res.status} from ${endpoint}`);
        }
      } catch (e: any) {
        lastError = e;
      }
    }

    if (summaryData && Array.isArray(summaryData.groups) && summaryData.groups.length > 0) {
      let geminiGroup: any = summaryData.groups.find((g: any) =>
        g.displayName?.toLowerCase().includes("gemini") ||
        g.buckets?.some((b: any) => b.bucketId?.startsWith("gemini"))
      );
      let claudeGroup: any = summaryData.groups.find((g: any) =>
        g.displayName?.toLowerCase().includes("claude") ||
        g.displayName?.toLowerCase().includes("gpt") ||
        g.buckets?.some((b: any) => b.bucketId?.startsWith("3p"))
      );

      const parseBucket = (bucket: any): {
        pct: number;
        resetTime?: string;
        resetSeconds: number;
        desc?: string;
      } => {
        if (!bucket) return { pct: 100, resetSeconds: 0 };
        const resetIso = bucket.resetTime as string | undefined;
        let resetSeconds = 0;
        if (resetIso) {
          const rt = new Date(resetIso).getTime();
          if (!isNaN(rt)) {
            resetSeconds = Math.max(0, Math.floor((rt - now) / 1000));
          }
        }
        let pct = 100;
        if (typeof bucket.remainingFraction === "number" && !isNaN(bucket.remainingFraction)) {
          pct = Math.round(bucket.remainingFraction * 1000) / 10;
        } else if (resetSeconds > 0) {
          pct = 0;
        }
        return {
          pct,
          resetTime: resetIso,
          resetSeconds,
          desc: bucket.description,
        };
      };

      // Gemini Buckets
      const geminiBuckets = geminiGroup?.buckets || [];
      const g5h = geminiBuckets.find((b: any) => b.window === "5h" || b.bucketId?.endsWith("-5h"));
      const gWk = geminiBuckets.find((b: any) => b.window === "weekly" || b.bucketId?.endsWith("-weekly"));

      const g5hParsed = parseBucket(g5h);
      const gWkParsed = parseBucket(gWk);

      const geminiMaxTokens = 1048576;
      const geminiRemainingTokens = Math.round(geminiMaxTokens * (g5hParsed.pct / 100));
      const geminiUsedTokens = Math.max(0, geminiMaxTokens - geminiRemainingTokens);

      const geminiQuota: ModelQuota = {
        remainingPercentage: g5hParsed.pct,
        resetTime: g5hParsed.resetTime,
        resetSeconds: g5hParsed.resetSeconds,
        label: "Gemini 3.8 Flash / Pro",
        maxTokens: geminiMaxTokens,
        remainingTokens: geminiRemainingTokens,
        usedTokens: geminiUsedTokens,
        weeklyPercentage: gWkParsed.pct,
        weeklyResetTime: gWkParsed.resetTime,
        weeklyResetSeconds: gWkParsed.resetSeconds,
        weeklyDescription: gWkParsed.desc,
        description: g5hParsed.desc,
      };

      // Claude Buckets
      const claudeBuckets = claudeGroup?.buckets || [];
      const c5h = claudeBuckets.find((b: any) => b.window === "5h" || b.bucketId?.endsWith("-5h"));
      const cWk = claudeBuckets.find((b: any) => b.window === "weekly" || b.bucketId?.endsWith("-weekly"));

      const c5hParsed = parseBucket(c5h);
      const cWkParsed = parseBucket(cWk);

      const claudeMaxTokens = 250000;
      const claudeRemainingTokens = Math.round(claudeMaxTokens * (c5hParsed.pct / 100));
      const claudeUsedTokens = Math.max(0, claudeMaxTokens - claudeRemainingTokens);

      const claudeQuota: ModelQuota = {
        remainingPercentage: c5hParsed.pct,
        resetTime: c5hParsed.resetTime,
        resetSeconds: c5hParsed.resetSeconds,
        label: "Claude Sonnet 4.6 / GPT",
        maxTokens: claudeMaxTokens,
        remainingTokens: claudeRemainingTokens,
        usedTokens: claudeUsedTokens,
        weeklyPercentage: cWkParsed.pct,
        weeklyResetTime: cWkParsed.resetTime,
        weeklyResetSeconds: cWkParsed.resetSeconds,
        weeklyDescription: cWkParsed.desc,
        description: c5hParsed.desc,
      };

      const result = { claudeQuota, geminiQuota, fetchedAt: now };
      quotaCache.set(account.email, result);
      return result;
    }

    // 2. Fallback to fetchAvailableModels if retrieveUserQuotaSummary is not available
    let data: any = null;
    for (const endpoint of [ANTIGRAVITY_ENDPOINT_DAILY]) {
      try {
        const res = await fetch(`${endpoint}/v1internal:fetchAvailableModels`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...ANTIGRAVITY_HEADERS,
          },
          body: JSON.stringify(projectId ? { project: projectId } : {}),
        });

        if (res.ok) {
          data = await res.json();
          break;
        } else {
          lastError = new Error(`HTTP ${res.status} from ${endpoint}`);
        }
      } catch (e: any) {
        lastError = e;
      }
    }

    if (!data) {
      throw lastError || new Error("Failed to fetch available models from all endpoints");
    }

    const models = data?.models || {};

    const extract = (candidates: string[], defaultLabel: string, defaultMaxTokens: number): ModelQuota => {
      for (const name of candidates) {
        const m = models[name];
        if (m && m.quotaInfo) {
          const qi = m.quotaInfo;
          const resetIso = qi.resetTime as string | undefined;
          let resetSeconds = 0;
          if (resetIso) {
            const rt = new Date(resetIso).getTime();
            if (!isNaN(rt)) {
              resetSeconds = Math.max(0, Math.floor((rt - now) / 1000));
            }
          }

          let fraction = typeof qi.remainingFraction === "number" && !isNaN(qi.remainingFraction) ? qi.remainingFraction : undefined;
          let pct = 100;
          if (fraction !== undefined) {
            pct = Math.round(fraction * 1000) / 10;
          } else if (resetSeconds > 0) {
            pct = 0;
            fraction = 0;
          } else {
            fraction = 1;
          }

          const maxTokens = (typeof m.maxTokens === "number" && m.maxTokens > 0) ? m.maxTokens : defaultMaxTokens;
          const remainingTokens = Math.round(maxTokens * fraction);
          const usedTokens = Math.max(0, maxTokens - remainingTokens);

          return {
            remainingPercentage: pct,
            resetTime: resetIso,
            resetSeconds,
            label: m.displayName || defaultLabel,
            maxTokens,
            remainingTokens,
            usedTokens,
          };
        }
      }
      return {
        remainingPercentage: 100,
        resetSeconds: 0,
        label: defaultLabel,
        maxTokens: defaultMaxTokens,
        remainingTokens: defaultMaxTokens,
        usedTokens: 0,
      };
    };

    const claudeQuota = extract(
      ["claude-sonnet-4-6", "claude-opus-4-6-thinking", "claude-3-7-sonnet"],
      "Claude 3.7 Sonnet / Opus",
      250000,
    );

    const geminiQuota = extract(
      ["gemini-3-flash", "gemini-2.5-pro", "gemini-3.8-flash-high", "gemini-3.6-flash-high"],
      "Gemini 3.8 Flash / Pro",
      1048576,
    );

    const result = { claudeQuota, geminiQuota, fetchedAt: now };
    quotaCache.set(account.email, result);
    return result;
  } catch (err: any) {
    console.warn(`[quota] Live quota fetch failed for ${account.email}:`, err.message);
    const fallback: CachedAccountQuota = {
      claudeQuota: { remainingPercentage: 100, resetSeconds: 0, label: "Claude", maxTokens: 250000, remainingTokens: 250000, usedTokens: 0 },
      geminiQuota: { remainingPercentage: 100, resetSeconds: 0, label: "Gemini", maxTokens: 1048576, remainingTokens: 1048576, usedTokens: 0 },
      fetchedAt: now,
    };
    if (!quotaCache.has(account.email)) {
      quotaCache.set(account.email, fallback);
    }
    return quotaCache.get(account.email)!;
  }
}

export async function refreshAllAccountsQuota(): Promise<void> {
  const accounts = loadAccounts();
  await Promise.all(accounts.map((a) => fetchLiveQuotaForAccount(a)));
}

// Polling: refresh quotas every 60s
setInterval(() => {
  refreshAllAccountsQuota().catch((e) => console.error("[quota] Polling error:", e.message));
}, 60000);

// Immediate background fetch
setTimeout(() => {
  refreshAllAccountsQuota().catch((e) => console.error("[quota] Initial fetch error:", e.message));
}, 1000);

/**
 * Returns summary info for all accounts and their cooldown status and real quotas.
 */
export function getAccountsStatus(): AccountQuotaStatus[] {
  const accounts = loadAccounts();
  const now = Date.now();
  const fiveHoursMs = 5 * 3600 * 1000;
  const fiveHAgo = now - fiveHoursMs;
  const sevenDAgo = now - 7 * 86400 * 1000;

  // Aggregate gateway usage entries per account
  const usage = loadUsage();
  const accStats5h = new Map<string, { requests: number; tokens: number }>();
  const accStats7d = new Map<string, { requests: number; tokens: number }>();

  for (const entry of usage) {
    if (!entry.accountEmail) continue;
    if (entry.timestamp >= sevenDAgo) {
      if (!accStats7d.has(entry.accountEmail)) accStats7d.set(entry.accountEmail, { requests: 0, tokens: 0 });
      const s7 = accStats7d.get(entry.accountEmail)!;
      s7.requests += 1;
      s7.tokens += entry.totalTokens;
    }
    if (entry.timestamp >= fiveHAgo) {
      if (!accStats5h.has(entry.accountEmail)) accStats5h.set(entry.accountEmail, { requests: 0, tokens: 0 });
      const s5 = accStats5h.get(entry.accountEmail)!;
      s5.requests += 1;
      s5.tokens += entry.totalTokens;
    }
  }

  return accounts.map((acc) => {
    const until = cooldowns.get(acc.email) ?? 0;
    const reason = cooldownDetails.get(acc.email);
    const s5 = accStats5h.get(acc.email) || { requests: 0, tokens: 0 };
    const s7 = accStats7d.get(acc.email) || { requests: 0, tokens: 0 };
    const isRateLimited = until > now;

    const cached = quotaCache.get(acc.email);
    const claudeQ = cached?.claudeQuota || { remainingPercentage: 100, resetSeconds: 0, label: "Claude", maxTokens: 250000, remainingTokens: 250000, usedTokens: 0 };
    const geminiQ = cached?.geminiQuota || { remainingPercentage: 100, resetSeconds: 0, label: "Gemini", maxTokens: 1048576, remainingTokens: 1048576, usedTokens: 0 };

    const calcReset = (q: ModelQuota): ModelQuota => {
      let rSec = 0;
      if (q.resetTime) {
        const rt = new Date(q.resetTime).getTime();
        if (!isNaN(rt)) rSec = Math.max(0, Math.floor((rt - now) / 1000));
      }
      let wrSec = q.weeklyResetSeconds ?? 0;
      if (q.weeklyResetTime) {
        const wrt = new Date(q.weeklyResetTime).getTime();
        if (!isNaN(wrt)) wrSec = Math.max(0, Math.floor((wrt - now) / 1000));
      }
      return {
        ...q,
        resetSeconds: rSec,
        weeklyResetSeconds: wrSec,
      };
    };

    const claudeQuota = calcReset(claudeQ);
    const geminiQuota = calcReset(geminiQ);

    return {
      email: acc.email,
      projectId: acc.projectId,
      status: isRateLimited ? "rate_limited" : "active",
      cooldownRemainingSeconds: isRateLimited ? Math.ceil((until - now) / 1000) : undefined,
      rateLimitReason: reason,
      requests5h: s5.requests,
      tokens5h: s5.tokens,
      requests7d: s7.requests,
      tokens7d: s7.tokens,
      claudeQuota,
      geminiQuota,
    };
  });
}

/**
 * Removes an account by email and persists changes.
 */
export function removeAccount(email: string): boolean {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.email === email);
  if (idx >= 0) {
    accounts.splice(idx, 1);
    saveAccounts(accounts);
    cooldowns.delete(email);
    quotaCache.delete(email);
    return true;
  }
  return false;
}

/**
 * Adds or updates an account and persists changes.
 */
export function addOrUpdateAccount(account: Account): void {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.email === account.email);
  if (idx >= 0) {
    accounts[idx] = account;
  } else {
    accounts.push(account);
  }
  saveAccounts(accounts);
  cooldowns.delete(account.email);
  fetchLiveQuotaForAccount(account).catch(() => {});
}

export interface WeeklyFleetHealth {
  equivalentFullAccounts: number;
  avgWeeklyPercentage: number;
  criticalCount: number;
  lowCount: number;
  healthyCount: number;
  remainingTokensWeekly: number;
  maxTokensWeekly: number;
}

export interface FleetQuotaSummary {
  totalAccounts: number;
  activeAccounts: number;
  rateLimitedAccounts: number;

  // Weekly Limits (The True Constraint Until Reset)
  claudeWeekly: WeeklyFleetHealth;
  geminiWeekly: WeeklyFleetHealth;

  // 5-hour Snapshot
  claude5h: {
    remainingTokens: number;
    maxTokens: number;
    usedTokens: number;
    remainingPercentage: number;
  };
  gemini5h: {
    remainingTokens: number;
    maxTokens: number;
    usedTokens: number;
    remainingPercentage: number;
  };

  // Combined Available Pool
  totalRemainingTokens: number;
  totalMaxTokens: number;
  totalUsedTokens: number;
  remainingPercentage: number;

  daysToWeeklyReset: number;
  hoursToWeeklyReset: number;
  weeklyResetSeconds: number;

  // Staggered Individual Account Resets
  nextResetSeconds: number;
  nextResetDays: number;
  nextResetHours: number;
  nextResetTime?: string;
  nextResetEmail?: string;
  resetWaves: {
    wave1_under3d: number;
    wave2_3to4d: number;
    wave3_4to5d: number;
    wave4_over5d: number;
  };
}
export function getWeeklyResetSeconds(): number {
  const now = new Date();
  const day = now.getUTCDay();
  // Weekly reset cycle anchor: Thursday 09:00:00 UTC (day 4)
  const daysToAdd = (4 - day + 7) % 7;
  const target = new Date(now.getTime());
  target.setUTCDate(target.getUTCDate() + daysToAdd);
  target.setUTCHours(9, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 7);
  }
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

export function getFleetQuotaSummary(accountsStatus?: AccountQuotaStatus[]): FleetQuotaSummary {
  const accounts = accountsStatus || getAccountsStatus();
  const total = accounts.length || 1;

  let c5hRemaining = 0, c5hMax = 0, c5hUsed = 0;
  let g5hRemaining = 0, g5hMax = 0, g5hUsed = 0;

  let cWeeklySum = 0, gWeeklySum = 0;
  let cCritical = 0, cLow = 0, cHealthy = 0;
  let gCritical = 0, gLow = 0, gHealthy = 0;

  let active = 0, rateLimited = 0;

  const CLAUDE_WEEKLY_ACCOUNT_TOKENS = 1500000;
  const GEMINI_WEEKLY_ACCOUNT_TOKENS = 8000000;
  let minResetSec = Infinity;
  let minResetTime = "";
  let minResetEmail = "";
  let w1 = 0, w2 = 0, w3 = 0, w4 = 0;

  for (const acc of accounts) {
    if (acc.status === "active") active++;
    else rateLimited++;

    const cQ = acc.claudeQuota;
    const gQ = acc.geminiQuota;

    let accMinReset = Infinity;
    let accMinTime = "";

    if (cQ) {
      c5hRemaining += cQ.remainingTokens ?? 0;
      c5hMax += cQ.maxTokens || 250000;
      c5hUsed += cQ.usedTokens ?? 0;

      const cWkPct = typeof cQ.weeklyPercentage === "number" ? cQ.weeklyPercentage : (cQ.remainingPercentage ?? 100);
      cWeeklySum += cWkPct;
      if (cWkPct <= 10) cCritical++;
      else if (cWkPct <= 40) cLow++;
      else cHealthy++;

      const cSec = cQ.weeklyResetSeconds || cQ.resetSeconds || 0;
      if (cSec > 0 && cSec < accMinReset) {
        accMinReset = cSec;
        accMinTime = cQ.weeklyResetTime || cQ.resetTime || "";
      }
    }

    if (gQ) {
      g5hRemaining += gQ.remainingTokens ?? 0;
      g5hMax += gQ.maxTokens || 1048576;
      g5hUsed += gQ.usedTokens ?? 0;

      const gWkPct = typeof gQ.weeklyPercentage === "number" ? gQ.weeklyPercentage : (gQ.remainingPercentage ?? 100);
      gWeeklySum += gWkPct;
      if (gWkPct <= 10) gCritical++;
      else if (gWkPct <= 40) gLow++;
      else gHealthy++;

      const gSec = gQ.weeklyResetSeconds || gQ.resetSeconds || 0;
      if (gSec > 0 && gSec < accMinReset) {
        accMinReset = gSec;
        accMinTime = gQ.weeklyResetTime || gQ.resetTime || "";
      }
    }

    if (accMinReset < minResetSec) {
      minResetSec = accMinReset;
      minResetTime = accMinTime;
      minResetEmail = acc.email;
    }

    if (accMinReset <= 3 * 86400) w1++;
    else if (accMinReset <= 4 * 86400) w2++;
    else if (accMinReset <= 5 * 86400) w3++;
    else w4++;
  }

  const cEqAccounts = Math.round((cWeeklySum / 100) * 100) / 100;
  const gEqAccounts = Math.round((gWeeklySum / 100) * 100) / 100;
  const cAvgWkPct = Math.round((cWeeklySum / total) * 10) / 10;
  const gAvgWkPct = Math.round((gWeeklySum / total) * 10) / 10;

  const cRemainingWeeklyTokens = Math.round(cEqAccounts * CLAUDE_WEEKLY_ACCOUNT_TOKENS);
  const gRemainingWeeklyTokens = Math.round(gEqAccounts * GEMINI_WEEKLY_ACCOUNT_TOKENS);
  const cMaxWeeklyTokens = total * CLAUDE_WEEKLY_ACCOUNT_TOKENS;
  const gMaxWeeklyTokens = total * GEMINI_WEEKLY_ACCOUNT_TOKENS;

  const totalRemainingTokens = cRemainingWeeklyTokens + gRemainingWeeklyTokens;
  const totalMaxTokens = cMaxWeeklyTokens + gMaxWeeklyTokens;
  const totalUsedTokens = totalMaxTokens - totalRemainingTokens;
  const remainingPercentage = totalMaxTokens > 0 ? Math.round((totalRemainingTokens / totalMaxTokens) * 1000) / 10 : 100;

  const weeklyResetSeconds = minResetSec < Infinity ? minResetSec : getWeeklyResetSeconds();
  const daysToWeeklyReset = Math.round((weeklyResetSeconds / 86400) * 10) / 10;
  const hoursToWeeklyReset = Math.round(weeklyResetSeconds / 3600);

  const nextResetSeconds = minResetSec < Infinity ? minResetSec : weeklyResetSeconds;
  const nextResetDays = Math.round((nextResetSeconds / 86400) * 10) / 10;
  const nextResetHours = Math.round(nextResetSeconds / 3600);
  return {
    totalAccounts: accounts.length,
    activeAccounts: active,
    rateLimitedAccounts: rateLimited,

    claudeWeekly: {
      equivalentFullAccounts: cEqAccounts,
      avgWeeklyPercentage: cAvgWkPct,
      criticalCount: cCritical,
      lowCount: cLow,
      healthyCount: cHealthy,
      remainingTokensWeekly: cRemainingWeeklyTokens,
      maxTokensWeekly: cMaxWeeklyTokens,
    },
    geminiWeekly: {
      equivalentFullAccounts: gEqAccounts,
      avgWeeklyPercentage: gAvgWkPct,
      criticalCount: gCritical,
      lowCount: gLow,
      healthyCount: gHealthy,
      remainingTokensWeekly: gRemainingWeeklyTokens,
      maxTokensWeekly: gMaxWeeklyTokens,
    },

    claude5h: {
      remainingTokens: c5hRemaining,
      maxTokens: c5hMax,
      usedTokens: c5hUsed,
      remainingPercentage: c5hMax > 0 ? Math.round((c5hRemaining / c5hMax) * 1000) / 10 : 100,
    },
    gemini5h: {
      remainingTokens: g5hRemaining,
      maxTokens: g5hMax,
      usedTokens: g5hUsed,
      remainingPercentage: g5hMax > 0 ? Math.round((g5hRemaining / g5hMax) * 1000) / 10 : 100,
    },

    totalRemainingTokens,
    totalMaxTokens,
    totalUsedTokens,
    remainingPercentage,

    daysToWeeklyReset,
    hoursToWeeklyReset,
    weeklyResetSeconds,
    nextResetSeconds,
    nextResetDays,
    nextResetHours,
    nextResetTime: minResetTime || undefined,
    nextResetEmail: minResetEmail || undefined,
    resetWaves: {
      wave1_under3d: w1,
      wave2_3to4d: w2,
      wave3_4to5d: w3,
      wave4_over5d: w4,
    },
  };
}
