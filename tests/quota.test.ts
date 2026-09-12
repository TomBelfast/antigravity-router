import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import vm from 'node:vm';

process.env.CONFIG_DIR = mkdtempSync('/tmp/aihub-quota-test-');
mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
const { fetchLiveQuotaForAccount } = await import('../src/token.js');
const { renderDashboardHtml } = await import('../src/ui.js');
let sequence = 0;
const account = () => ({ email: `test-${sequence++}@example.invalid`, refreshToken: 'test', accessToken: 'test', accessTokenExpires: Date.now() + 3600000 });
const resetTime = '2099-01-01T00:00:00Z';
const summary = (weekly = 0.08, fiveHour = 0.83) => ({ groups: [
  { displayName: 'Gemini Models', buckets: [
    { bucketId: 'gemini-weekly', window: 'weekly', remainingFraction: weekly, resetTime },
    { bucketId: 'gemini-5h', window: '5h', remainingFraction: fiveHour, resetTime },
  ] },
  { displayName: 'Claude and GPT models', buckets: [
    { bucketId: '3p-weekly', window: 'weekly', remainingFraction: 0, resetTime },
    { bucketId: '3p-5h', window: '5h', remainingFraction: 1, disabled: true, resetTime },
  ] },
] });

test('dashboard quotas use the daily account windows even when production reports 81%', async () => {
  globalThis.fetch = async (url) => Response.json(summary(String(url).includes('daily-') ? 0.08 : 0.811, 0.83));
  const result = await fetchLiveQuotaForAccount(account());
  assert.equal(result.geminiQuota.weeklyPercentage, 8);
  assert.equal(result.geminiQuota.remainingPercentage, 83);
  assert.equal(result.geminiQuota.weeklyResetTime, resetTime);
});

