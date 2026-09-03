import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_DIR = process.env.CONFIG_DIR || join(homedir(), ".config", "antigravity-cursor-proxy");
const ACCOUNTS_FILE = process.env.ACCOUNTS_FILE || join(CONFIG_DIR, "accounts.json");

export interface Account {
  email: string;
  refreshToken: string;
  accessToken?: string;
  accessTokenExpires?: number;
  projectId?: string;
}

export interface AccountsFile {
  accounts: Account[];
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadAccounts(): Account[] {
  try {
    if (!existsSync(ACCOUNTS_FILE)) return [];
    const raw = readFileSync(ACCOUNTS_FILE, "utf8");
    const data = JSON.parse(raw) as AccountsFile;
    return data.accounts ?? [];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: Account[]): void {
  ensureConfigDir();
  writeFileSync(ACCOUNTS_FILE, JSON.stringify({ accounts }, null, 2), "utf8");
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getAccountsFilePath(): string {
  return ACCOUNTS_FILE;
}
