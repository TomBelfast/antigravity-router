import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { getConfigDir } from "./storage.js";

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: number;
  lastUsedAt?: number;
  requestCount: number;
  isActive: boolean;
}

interface ApiKeysFile {
  keys: ApiKey[];
  adminPassword?: string;
}

const KEYS_FILE = process.env.API_KEYS_FILE || join(getConfigDir(), "api_keys.json");
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";

let inMemoryKeys: ApiKey[] | null = null;

export function loadApiKeys(): ApiKey[] {
  if (inMemoryKeys !== null) {
    return inMemoryKeys;
  }
  try {
    if (!existsSync(KEYS_FILE)) {
      inMemoryKeys = [];
      return inMemoryKeys;
    }
    const raw = readFileSync(KEYS_FILE, "utf8");
    const data = JSON.parse(raw) as ApiKeysFile;
    inMemoryKeys = data.keys ?? [];
    return inMemoryKeys;
  } catch {
    inMemoryKeys = [];
    return inMemoryKeys;
  }
}

export function saveApiKeys(keys: ApiKey[]): void {
  inMemoryKeys = keys;
  try {
    const payload: ApiKeysFile = {
      keys,
      adminPassword: DEFAULT_ADMIN_PASS,
    };
    writeFileSync(KEYS_FILE, JSON.stringify(payload, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save api_keys.json:", err);
  }
}

export function createApiKey(name: string): ApiKey {
  const keys = loadApiKeys();
  const rawKey = `sk-ag-${randomBytes(24).toString("hex")}`;
  const newKey: ApiKey = {
    id: randomUUID(),
    name: name.trim() || "Default Key",
    key: rawKey,
    createdAt: Date.now(),
    requestCount: 0,
    isActive: true,
  };
  keys.unshift(newKey);
  saveApiKeys(keys);
  return newKey;
}

export function deleteApiKey(id: string): boolean {
  const keys = loadApiKeys();
  const idx = keys.findIndex((k) => k.id === id);
  if (idx >= 0) {
    keys.splice(idx, 1);
    saveApiKeys(keys);
    return true;
  }
  return false;
}

export function validateApiKey(providedKey: string): { valid: boolean; keyObj?: ApiKey } {
  const keys = loadApiKeys();
  if (keys.length === 0) {
    return { valid: true };
  }
  const cleanKey = providedKey.trim();
  const match = keys.find((k) => k.key === cleanKey && k.isActive);
  if (match) {
    match.lastUsedAt = Date.now();
    match.requestCount = (match.requestCount || 0) + 1;
    saveApiKeys(keys);
    return { valid: true, keyObj: match };
  }
  return { valid: false };
}

export function getAdminPassword(): string {
  return DEFAULT_ADMIN_PASS;
}
