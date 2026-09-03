import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
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
  totalTokens: number;
}

export interface AccountStat {
  email: string;
  requests: number;
  totalTokens: number;
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
  latencyData: number[];
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
}

const USAGE_FILE = process.env.USAGE_FILE || join(getConfigDir(), "usage.json");
const RETENTION_MS = 32 * 24 * 60 * 60 * 1000; // 32 days

let inMemoryUsage: UsageEntry[] | null = null;

export function loadUsage(): UsageEntry[] {
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
  const keyMap: Record<string, { keyId: string; keyName: string; requests: number; totalTokens: number }> = {};
  const accountMap: Record<string, { email: string; requests: number; totalTokens: number }> = {};

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
      keyMap[kId] = { keyId: kId, keyName: kName, requests: 0, totalTokens: 0 };
    }
    keyMap[kId].requests += 1;
    keyMap[kId].totalTokens += item.totalTokens;

    // Account breakdown
    const accEmail = item.accountEmail || "Nieznane";
    if (!accountMap[accEmail]) {
      accountMap[accEmail] = { email: accEmail, requests: 0, totalTokens: 0 };
    }
    accountMap[accEmail].requests += 1;
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
  const latencyData: number[] = [];

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
      latencyData.push(reqs > 0 ? Math.round(latSum / reqs) : 0);
    }
  } else {
    const days = filter.range === "7d" ? 7 : 30;
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
      latencyData.push(reqs > 0 ? Math.round(latSum / reqs) : 0);
    }
  }

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
  };
}
