import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { renderDashboardHtml } from '../src/ui.js';

function setup(response: any = { success: true, email: 'test@example.invalid' }) {
  const nodes: Record<string, any> = {};
  const alerts: string[] = [];
  const requests: any[] = [];
  const html = renderDashboardHtml();
  const script = html.slice(html.indexOf('    window.openAccountModal ='), html.indexOf('    window.deleteAccount ='));
  const context: any = { window: {}, adminToken: 'test', URL, AbortSignal,
    document: { getElementById: (id: string) => nodes[id] ||= { value: '', style: {}, textContent: '', href: '' } },
    alert: (s: string) => alerts.push(s), console,
    fetch: async (url: string, options: any) => { requests.push({ url, ...options }); return { ok: true, json: async () => response }; },
    refreshAll() {},
  };
  vm.runInNewContext(script, context);
  context.closeAccountModal = context.window.closeAccountModal;
  return { context, nodes, alerts, requests };
}

test('connect submits the complete callback URL required by the server and displays returned email', async () => {
  const s = setup();
  const callback = 'http://localhost:51121/oauth-callback?code=test-code&state=test-state';
  s.context.document.getElementById('authCodeInput').value = callback;
  await s.context.window.submitAuthCode();
  assert.deepEqual(JSON.parse(s.requests[0].body), { callbackUrl: callback });
  assert.match(s.alerts[0], /test@example.invalid/);
});

test('bare code is rejected before making a request that cannot succeed', async () => {
  const s = setup();
  s.context.document.getElementById('authCodeInput').value = '4/test-code';
  await s.context.window.submitAuthCode();
  assert.equal(s.requests.length, 0);
  assert.match(s.alerts[0], /full|complete/i);
});

test('authorization URL failures are visible to the user', async () => {
  const s = setup({ error: 'Unauthorized' });
  await s.context.window.openAccountModal();
  assert.equal(s.alerts.length, 1);
  assert.match(s.alerts[0], /Unauthorized/);
});
