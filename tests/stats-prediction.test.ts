import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const tempDir = mkdtempSync('/tmp/ag-stats-test-');
process.env.CONFIG_DIR = tempDir;
process.env.USAGE_FILE = join(tempDir, 'usage.json');
process.env.ACCOUNTS_FILE = join(tempDir, 'accounts.json');

const now = Date.now();
const oneHourAgo = now - 3600 * 1000;
const twoDaysAgo = now - 2 * 24 * 3600 * 1000;

writeFileSync(process.env.USAGE_FILE, JSON.stringify([
  {
    id: 'u1',
    timestamp: oneHourAgo,
    model: 'claude-3-7-sonnet',
    keyId: 'k1',
    keyName: 'Dev Key 1',
    accountEmail: 'acc1@example.com',
    promptTokens: 800,
    completionTokens: 200,
    totalTokens: 1000,
    latencyMs: 1500,
    status: 'success'
  },
  {
    id: 'u2',
    timestamp: twoDaysAgo,
    model: 'gemini-3.8-flash-high',
    keyId: 'k2',
    keyName: 'Dev Key 2',
    accountEmail: 'acc2@example.com',
    promptTokens: 4000,
    completionTokens: 1000,
    totalTokens: 5000,
    latencyMs: 2500,
    status: 'success'
  }
]));
const { getUsageStats } = await import('../src/stats.js');
const { getFleetQuotaSummary } = await import('../src/token.js');

test('getUsageStats computes burn rates and token breakdowns correctly', () => {
  const stats = getUsageStats({ range: '30d' });

  assert.equal(stats.totalTokens, 6000);
  assert.equal(stats.totalPromptTokens, 4800);
  assert.equal(stats.totalCompletionTokens, 1200);

  // Burn rate: last 24h has 1000 tokens from u1
  assert.equal(stats.burnRate.tokens24h, 1000);
  assert.equal(stats.burnRate.effectiveDailyBurn, 1000);
  assert.equal(stats.burnRate.source, '24h');

  // Key stats breakdown
  const k1 = stats.keys.find(k => k.keyId === 'k1');
  assert.ok(k1);
  assert.equal(k1.totalTokens, 1000);
  assert.equal(k1.promptTokens, 800);
  assert.equal(k1.completionTokens, 200);

  // Account stats breakdown
  const a1 = stats.accounts.find(a => a.email === 'acc1@example.com');
  assert.ok(a1);
  assert.equal(a1.totalTokens, 1000);
  assert.equal(a1.promptTokens, 800);
  assert.equal(a1.completionTokens, 200);
});

test('getFleetQuotaSummary aggregates tokens across mock accounts correctly', () => {
  const mockAccounts: any[] = [
    {
      email: 'acc1@example.com',
      status: 'active',
      claudeQuota: { remainingPercentage: 80, weeklyPercentage: 40, remainingTokens: 200000, maxTokens: 250000, usedTokens: 50000 },
      geminiQuota: { remainingPercentage: 80, weeklyPercentage: 60, remainingTokens: 800000, maxTokens: 1000000, usedTokens: 200000 }
    },
    {
      email: 'acc2@example.com',
      status: 'rate_limited',
      claudeQuota: { remainingPercentage: 0, weeklyPercentage: 5, remainingTokens: 0, maxTokens: 250000, usedTokens: 250000 },
      geminiQuota: { remainingPercentage: 50, weeklyPercentage: 10, remainingTokens: 500000, maxTokens: 1000000, usedTokens: 500000 }
    }
  ];

  const fleet = getFleetQuotaSummary(mockAccounts);
  assert.equal(fleet.totalAccounts, 2);
  assert.equal(fleet.activeAccounts, 1);
  assert.equal(fleet.rateLimitedAccounts, 1);

  // Weekly calculations
  assert.equal(fleet.claudeWeekly.equivalentFullAccounts, 0.45); // (40 + 5)/100 = 0.45
  assert.equal(fleet.claudeWeekly.criticalCount, 1); // 5% is critical <= 10%
  assert.equal(fleet.claudeWeekly.lowCount, 1); // 40% is low <= 40%

  assert.equal(fleet.geminiWeekly.equivalentFullAccounts, 0.7); // (60 + 10)/100 = 0.7
  assert.equal(fleet.geminiWeekly.criticalCount, 1); // 10% is critical <= 10%

  // 5h calculations
  assert.equal(fleet.claude5h.remainingTokens, 200000);
  assert.equal(fleet.gemini5h.remainingTokens, 1300000);

  assert.ok(fleet.daysToWeeklyReset > 0);
  assert.ok(fleet.hoursToWeeklyReset > 0);
});
