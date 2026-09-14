import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { getConfigDir } from "./storage.js";
export interface UsageEntry {
  id: string;
  timestamp: number;
  model: string;
  keyId?: string;
  keyName?: string;
  accountEmail?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: "success" | "error";
  errorMessage?: string;
}

export interface ModelStat {
  model: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  avgLatencyMs: number;
}

export interface KeyStat {
  keyId: string;
  keyName: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AccountStat {
  email: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface BurnRateStats {
  tokens24h: number;
  requests24h: number;
  tokens7d: number;
  requests7d: number;
  dailyAvg7d: number;
  allTimeDailyAvg: number;
  effectiveDailyBurn: number;
  source: "24h" | "7d_avg" | "all_time_avg" | "idle";
  tokensPerHour: number;
  claudeTokens24h: number;
  geminiTokens24h: number;
  claudeDailyAvg7d: number;
  geminiDailyAvg7d: number;
}

export interface StatsFilterOptions {
  range: "24h" | "7d" | "30d" | "all";
  keyId?: string;
  model?: string;
  accountEmail?: string;
}

export interface StatsResponse {
  range: string;
  labels: string[];
  requestsData: number[];
  tokensData: number[];
  latencyData: (number | null)[];
  models: ModelStat[];
  keys: KeyStat[];
  accounts: AccountStat[];
  totalRequests: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  avgLatencyMs: number;
  estimatedCostSavedUsd: number;
  recentLogs: Array<{
    id: string;
    timestamp: number;
    model: string;
    keyName: string;
    accountEmail: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    status: string;
  }>;
  availableKeys: Array<{ id: string; name: string }>;
  availableModels: string[];
  availableAccounts: string[];
  burnRate: BurnRateStats;
}

const USAGE_FILE = process.env.USAGE_FILE || join(getConfigDir(), "usage.json");
const SQLITE_FILE = process.env.SQLITE_USAGE_FILE || "/root/.omniroute/storage.sqlite";
const RETENTION_MS = 32 * 24 * 60 * 60 * 1000; // 32 days

let inMemoryUsage: UsageEntry[] | null = null;
let lastSqliteSync = 0;
export function syncFromSqlite(): void {
  const now = Date.now();
  if (now - lastSqliteSync < 15000) return;
  lastSqliteSync = now;
  if (!existsSync(SQLITE_FILE)) return;

  try {
    const pyScript = `
import sqlite3, json, datetime
try:
    db = sqlite3.connect("file:${SQLITE_FILE}?mode=ro", uri=True)
    cur = db.cursor()
    cutoff = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=32)).isoformat()
    cur.execute("""
        SELECT 
            id, timestamp, model, account_label, api_key_id, api_key_name,
            tokens_input, tokens_output, latency_ms, status, error_code
        FROM usage_history
        WHERE timestamp >= ?
        ORDER BY id ASC
    """, (cutoff,))
    entries = []
    for r in cur.fetchall():
        p_tok = max(0, r[6] or 0)
        c_tok = max(0, r[7] or 0)
        ts_val = r[1]
        if isinstance(ts_val, str):
            try:
                dt = datetime.datetime.fromisoformat(ts_val.replace("Z", "+00:00"))
                ts_ms = int(dt.timestamp() * 1000)
            except Exception:
                ts_ms = int(datetime.datetime.now().timestamp() * 1000)
        else:
            ts_ms = int(datetime.datetime.now().timestamp() * 1000)
        entries.append({
            "id": str(r[0]),
            "timestamp": ts_ms,
            "model": r[2] or "unknown",
            "accountEmail": r[3] or "Google Account",
            "keyId": r[4] or "",
            "keyName": r[5] or "OMP",
            "promptTokens": p_tok,
            "completionTokens": c_tok,
            "totalTokens": p_tok + c_tok,
            "latencyMs": max(0, r[8] or 0),
            "status": "success" if (r[9] == "200" or r[9] == "success") else "error",
            "errorMessage": r[10]
        })
    db.close()
    with open("${USAGE_FILE}", "w") as f:
        json.dump(entries, f)
except Exception as e:
    pass
`;
    execFileSync("/usr/bin/python3", ["-c", pyScript], { timeout: 10000 });
    inMemoryUsage = null;
  } catch (err) {
    console.warn("[stats] Sync from sqlite error:", err);
  }
}

export function loadUsage(): UsageEntry[] {
  syncFromSqlite();
  if (inMemoryUsage !== null) return inMemoryUsage;
  try {
    if (!existsSync(USAGE_FILE)) {
      inMemoryUsage = [];
      return inMemoryUsage;
    }
    const raw = readFileSync(USAGE_FILE, "utf8");
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : (data.entries || []);
    inMemoryUsage = list.map((item: any) => ({
      id: item.id || randomUUID().replace(/-/g, "").slice(0, 12),
      timestamp: item.timestamp || Date.now(),
      model: item.model || "unknown",
      keyId: item.keyId || "",
      keyName: item.keyName || (item.keyId ? "API Key" : "Default"),
      accountEmail: item.accountEmail || "Google Account",
      promptTokens: item.promptTokens || 0,
      completionTokens: item.completionTokens || 0,
      totalTokens: item.totalTokens || ((item.promptTokens || 0) + (item.completionTokens || 0)),
      latencyMs: item.latencyMs || 0,
      status: item.status || "success",
      errorMessage: item.errorMessage,
    }));
    return inMemoryUsage!;
  } catch {
    inMemoryUsage = [];
    return inMemoryUsage;
  }
}

export function saveUsage(entries: UsageEntry[]): void {
  inMemoryUsage = entries;
  try {
    writeFileSync(USAGE_FILE, JSON.stringify(entries), "utf8");
  } catch (err) {
    console.error("Failed to save usage.json:", err);
  }
}

export function recordUsage(params: {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  keyId?: string;
  keyName?: string;
  accountEmail?: string;
  latencyMs?: number;
  status?: "success" | "error";
  errorMessage?: string;
}): void {
  const entries = loadUsage();
  const promptTokens = Math.max(0, params.promptTokens || 0);
  const completionTokens = Math.max(0, params.completionTokens || 0);
  const totalTokens = promptTokens + completionTokens;

  entries.push({
    id: randomUUID().replace(/-/g, "").slice(0, 12),
    timestamp: Date.now(),
    model: params.model || "unknown",
    keyId: params.keyId,
    keyName: params.keyName || "API Key",
    accountEmail: params.accountEmail || "Google Account",
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs: params.latencyMs || 0,
    status: params.status || "success",
    errorMessage: params.errorMessage,
  });

  // Prune entries older than retention period
  const cutoff = Date.now() - RETENTION_MS;
  const pruned = entries.filter((e) => e.timestamp >= cutoff);
  saveUsage(pruned);
}

function calculateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const m = model.toLowerCase();
  let inRate = 0.000003; // $3 / M
  let outRate = 0.000015; // $15 / M

  if (m.includes("opus")) {
    inRate = 0.000015; // $15 / M
    outRate = 0.000075; // $75 / M
  } else if (m.includes("flash")) {
    inRate = 0.0000001; // $0.10 / M
    outRate = 0.0000004; // $0.40 / M
  } else if (m.includes("sonnet")) {
    inRate = 0.000003; // $3 / M
    outRate = 0.000015; // $15 / M
  } else if (m.includes("pro")) {
    inRate = 0.00000125;
    outRate = 0.000005;
  }

  return (promptTokens * inRate) + (completionTokens * outRate);
}

// The most recent bucket in the timeline (current hour / current day) is still in
// progress, so its raw count is naturally lower than a finished bucket — not because
// usage dropped. Project it to a full-bucket run-rate so the chart's last point holds
// near the current level instead of appearing to crash toward 0.
function projectPartialBucket(value: number, elapsedMs: number, bucketDurationMs: number): number {
  const minFraction = 1 / 24; // never extrapolate from less than 1/24th of the bucket (avoids wild early spikes)
  const fraction = Math.min(1, Math.max(elapsedMs / bucketDurationMs, minFraction));
  if (fraction >= 1) return value;
  return Math.round(value / fraction);
}

export function getUsageStats(filter: StatsFilterOptions): StatsResponse {
  const allEntries = loadUsage();
  const now = Date.now();

  // Extract filter dimensions from allEntries
  const keysMap = new Map<string, string>();
  const modelsSet = new Set<string>();
  const accountsSet = new Set<string>();

  for (const item of allEntries) {
    if (item.keyId) keysMap.set(item.keyId, item.keyName || "API Key");
    if (item.model) modelsSet.add(item.model);
    if (item.accountEmail && item.accountEmail !== "Google Account") accountsSet.add(item.accountEmail);
  }

  const availableKeys = Array.from(keysMap.entries()).map(([id, name]) => ({ id, name }));
  const availableModels = Array.from(modelsSet);
  const availableAccounts = Array.from(accountsSet);

  // Time filter
  let durationMs = 24 * 60 * 60 * 1000;
  if (filter.range === "7d") durationMs = 7 * 24 * 60 * 60 * 1000;
  else if (filter.range === "30d") durationMs = 30 * 24 * 60 * 60 * 1000;
  else if (filter.range === "all") durationMs = 365 * 24 * 60 * 60 * 1000;

  const startTime = now - durationMs;

  // Apply filters
  const filtered = allEntries.filter((e) => {
    if (e.timestamp < startTime) return false;
    if (filter.keyId && e.keyId !== filter.keyId) return false;
    if (filter.model && e.model !== filter.model) return false;
    if (filter.accountEmail && e.accountEmail !== filter.accountEmail) return false;
    return true;
  });

  // Aggregations
  let totalRequests = 0;
  let totalTokens = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalLatencyMs = 0;
  let estimatedCostSavedUsd = 0;

  const modelMap: Record<string, { requests: number; promptTokens: number; completionTokens: number; totalTokens: number; totalLatencyMs: number }> = {};
  const keyMap: Record<string, KeyStat> = {};
  const accountMap: Record<string, AccountStat> = {};

  for (const item of filtered) {
    totalRequests += 1;
    totalTokens += item.totalTokens;
    totalPromptTokens += item.promptTokens;
    totalCompletionTokens += item.completionTokens;
    totalLatencyMs += item.latencyMs;

    estimatedCostSavedUsd += calculateCostUsd(item.model, item.promptTokens, item.completionTokens);

    // Model breakdown
    if (!modelMap[item.model]) {
      modelMap[item.model] = { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, totalLatencyMs: 0 };
    }
    const m = modelMap[item.model];
    m.requests += 1;
    m.promptTokens += item.promptTokens;
    m.completionTokens += item.completionTokens;
    m.totalTokens += item.totalTokens;
    m.totalLatencyMs += item.latencyMs;

    // Key breakdown
    const kId = item.keyId || "direct";
    const kName = item.keyName || "Default / Direct";
    if (!keyMap[kId]) {
      keyMap[kId] = { keyId: kId, keyName: kName, requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }
    keyMap[kId].requests += 1;
    keyMap[kId].promptTokens += item.promptTokens;
    keyMap[kId].completionTokens += item.completionTokens;
    keyMap[kId].totalTokens += item.totalTokens;

    // Account breakdown
    const accEmail = item.accountEmail || "Nieznane";
    if (!accountMap[accEmail]) {
      accountMap[accEmail] = { email: accEmail, requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }
    accountMap[accEmail].requests += 1;
    accountMap[accEmail].promptTokens += item.promptTokens;
    accountMap[accEmail].completionTokens += item.completionTokens;
    accountMap[accEmail].totalTokens += item.totalTokens;
  }

  const avgLatencyMs = totalRequests > 0 ? Math.round(totalLatencyMs / totalRequests) : 0;

  const models: ModelStat[] = Object.entries(modelMap).map(([model, data]) => ({
    model,
    requests: data.requests,
    promptTokens: data.promptTokens,
    completionTokens: data.completionTokens,
    totalTokens: data.totalTokens,
    avgLatencyMs: data.requests > 0 ? Math.round(data.totalLatencyMs / data.requests) : 0,
  })).sort((a, b) => b.requests - a.requests);

  const keys: KeyStat[] = Object.values(keyMap).sort((a, b) => b.requests - a.requests);
  const accounts: AccountStat[] = Object.values(accountMap).sort((a, b) => b.requests - a.requests);

  // Timeline buckets
  const labels: string[] = [];
  const requestsData: number[] = [];
  const tokensData: number[] = [];
  const latencyData: (number | null)[] = [];

  if (filter.range === "24h") {
    const startOfCurrentHour = Math.floor(now / 3600000) * 3600000;
    for (let i = 23; i >= 0; i--) {
      const bucketStart = startOfCurrentHour - i * 3600000;
      const bucketEnd = bucketStart + 3600000;
      const d = new Date(bucketStart);
      labels.push(`${String(d.getHours()).padStart(2, "0")}:00`);

      let reqs = 0;
      let toks = 0;
      let latSum = 0;
      for (const item of filtered) {
        if (item.timestamp >= bucketStart && item.timestamp < bucketEnd) {
          reqs += 1;
          toks += item.totalTokens;
          latSum += item.latencyMs;
        }
      }
      requestsData.push(reqs);
      tokensData.push(toks);
      latencyData.push(reqs > 0 ? Math.round(latSum / reqs) : null);
    }
    // Last pushed bucket is the current (in-progress) hour.
    const elapsedInHour = now - startOfCurrentHour;
    const lastHourIdx = requestsData.length - 1;
    requestsData[lastHourIdx] = projectPartialBucket(requestsData[lastHourIdx], elapsedInHour, 3600000);
    tokensData[lastHourIdx] = projectPartialBucket(tokensData[lastHourIdx], elapsedInHour, 3600000);
  } else {
    let days = 30;
    if (filter.range === "7d") {
      days = 7;
    } else if (filter.range === "all") {
      const earliestEntry = filtered.length > 0 ? Math.min(...filtered.map((e) => e.timestamp)) : now;
      const daysSpan = Math.ceil((now - earliestEntry) / 86400000);
      days = Math.min(365, Math.max(7, daysSpan));
    }
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const bucketStart = startOfToday - i * 86400000;
      const bucketEnd = bucketStart + 86400000;
      const d = new Date(bucketStart);
      labels.push(`${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`);

      let reqs = 0;
      let toks = 0;
      let latSum = 0;
      for (const item of filtered) {
        if (item.timestamp >= bucketStart && item.timestamp < bucketEnd) {
          reqs += 1;
          toks += item.totalTokens;
          latSum += item.latencyMs;
        }
      }
      requestsData.push(reqs);
      tokensData.push(toks);
      latencyData.push(reqs > 0 ? Math.round(latSum / reqs) : null);
    }
    // Last pushed bucket is today, still in progress.
    const elapsedToday = now - startOfToday;
    const lastDayIdx = requestsData.length - 1;
    requestsData[lastDayIdx] = projectPartialBucket(requestsData[lastDayIdx], elapsedToday, 86400000);
    tokensData[lastDayIdx] = projectPartialBucket(tokensData[lastDayIdx], elapsedToday, 86400000);
  }
  // Calculate burn rates across all entries (fleet total)
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  let tokens24h = 0;
  let requests24h = 0;
  let claudeTokens24h = 0;
  let geminiTokens24h = 0;

  let tokens7d = 0;
  let requests7d = 0;
  let claudeTokens7d = 0;
  let geminiTokens7d = 0;

  let tokensAllTime = 0;

  for (const item of allEntries) {
    tokensAllTime += item.totalTokens;
    const m = (item.model || "").toLowerCase();
    const isClaude = m.includes("claude") || m.includes("sonnet") || m.includes("opus");
    const isGemini = m.includes("gemini") || m.includes("flash") || m.includes("pro");

    if (item.timestamp >= oneDayAgo) {
      tokens24h += item.totalTokens;
      requests24h += 1;
      if (isClaude) claudeTokens24h += item.totalTokens;
      if (isGemini) geminiTokens24h += item.totalTokens;
    }
    if (item.timestamp >= sevenDaysAgo) {
      tokens7d += item.totalTokens;
      requests7d += 1;
      if (isClaude) claudeTokens7d += item.totalTokens;
      if (isGemini) geminiTokens7d += item.totalTokens;
    }
  }

  const earliestTimestamp = allEntries.length > 0 ? Math.min(...allEntries.map((e) => e.timestamp)) : now;
  const totalDaysSpan = Math.max(1, (now - earliestTimestamp) / (24 * 60 * 60 * 1000));
  const dailyAvg7d = Math.round(tokens7d / Math.min(7, totalDaysSpan));
  const claudeDailyAvg7d = Math.round(claudeTokens7d / Math.min(7, totalDaysSpan));
  const geminiDailyAvg7d = Math.round(geminiTokens7d / Math.min(7, totalDaysSpan));
  const allTimeDailyAvg = Math.round(tokensAllTime / totalDaysSpan);

  let effectiveDailyBurn = 0;
  let burnRateSource: "24h" | "7d_avg" | "all_time_avg" | "idle" = "idle";

  if (tokens24h > 0) {
    effectiveDailyBurn = tokens24h;
    burnRateSource = "24h";
  } else if (dailyAvg7d > 0) {
    effectiveDailyBurn = dailyAvg7d;
    burnRateSource = "7d_avg";
  } else if (allTimeDailyAvg > 0) {
    effectiveDailyBurn = allTimeDailyAvg;
    burnRateSource = "all_time_avg";
  }

  const burnRate: BurnRateStats = {
    tokens24h,
    requests24h,
    tokens7d,
    requests7d,
    dailyAvg7d,
    allTimeDailyAvg,
    effectiveDailyBurn,
    source: burnRateSource,
    tokensPerHour: Math.round(effectiveDailyBurn / 24),
    claudeTokens24h,
    geminiTokens24h,
    claudeDailyAvg7d,
    geminiDailyAvg7d,
  };

  // Last 25 logs sorted descending
  const recentLogs = [...filtered]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 25)
    .map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      model: e.model,
      keyName: e.keyName || "API Key",
      accountEmail: e.accountEmail || "Google Account",
      promptTokens: e.promptTokens,
      completionTokens: e.completionTokens,
      totalTokens: e.totalTokens,
      latencyMs: e.latencyMs,
      status: e.status,
    }));

  return {
    range: filter.range,
    labels,
    requestsData,
    tokensData,
    latencyData,
    models,
    keys,
    accounts,
    totalRequests,
    totalTokens,
    totalPromptTokens,
    totalCompletionTokens,
    avgLatencyMs,
    estimatedCostSavedUsd: Number(estimatedCostSavedUsd.toFixed(4)),
    recentLogs,
    availableKeys,
    availableModels,
    availableAccounts,
    burnRate,
  };
}
