import { loadUsage } from "./stats.js";
import { loadAccounts, saveAccounts, type Account } from "./storage.js";
import { refreshAccessToken } from "./oauth.js";

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
 */
export async function fetchLiveQuotaForAccount(account: Account): Promise<CachedAccountQuota> {
  const now = Date.now();
  try {
    const { accessToken, projectId } = await getValidAccessTokenForAccount(account);
    const res = await fetch("https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "antigravity/1.0.0 linux/x64",
      },
      body: JSON.stringify(projectId ? { project: projectId } : {}),
    });

    if (!res.ok) {
      throw new Error(`Google CloudCode returned HTTP ${res.status}`);
    }

    const data: any = await res.json();
    const models = data?.models || {};

    const extract = (candidates: string[], defaultLabel: string): ModelQuota => {
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

          let pct = 100;
          if (typeof qi.remainingFraction === "number" && !isNaN(qi.remainingFraction)) {
            pct = Math.round(qi.remainingFraction * 1000) / 10;
          } else if (resetSeconds > 0) {
            // When remainingFraction is not defined/NaN but resetTime is set in the future, quota is depleted
            pct = 0;
          }

          return {
            remainingPercentage: pct,
            resetTime: resetIso,
            resetSeconds,
            label: m.displayName || defaultLabel,
          };
        }
      }
      return { remainingPercentage: 100, resetSeconds: 0, label: defaultLabel };
    };

    const claudeQuota = extract(
      ["claude-sonnet-4-6", "claude-opus-4-6-thinking", "claude-3-7-sonnet"],
      "Claude 3.7 Sonnet / Opus",
    );

    const geminiQuota = extract(
      ["gemini-3-flash", "gemini-2.5-pro", "gemini-3.8-flash-high", "gemini-3.6-flash-high"],
      "Gemini 3.8 Flash / Pro",
    );

    const result = { claudeQuota, geminiQuota, fetchedAt: now };
    quotaCache.set(account.email, result);
    return result;
  } catch (err: any) {
    console.warn(`[quota] Live quota fetch failed for ${account.email}:`, err.message);
    const fallback: CachedAccountQuota = {
      claudeQuota: { remainingPercentage: 100, resetSeconds: 0, label: "Claude" },
      geminiQuota: { remainingPercentage: 100, resetSeconds: 0, label: "Gemini" },
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
    const claudeQ = cached?.claudeQuota || { remainingPercentage: 100, resetSeconds: 0, label: "Claude" };
    const geminiQ = cached?.geminiQuota || { remainingPercentage: 100, resetSeconds: 0, label: "Gemini" };

    const calcReset = (q: ModelQuota): ModelQuota => {
      let rSec = 0;
      if (q.resetTime) {
        const rt = new Date(q.resetTime).getTime();
        if (!isNaN(rt)) rSec = Math.max(0, Math.floor((rt - now) / 1000));
      }
      return {
        ...q,
        resetSeconds: rSec,
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
