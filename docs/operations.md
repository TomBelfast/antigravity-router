# Antigravity Gateway operations

## Deployment identity

- Dashboard: `https://api.aihub.ovh/dashboard`
- Repository and service working directory: `/opt/antigravity-proxy`
- System service: `antigravity-proxy.service`
- Start command: `/usr/bin/npx tsx src/server.ts`
- Listen port: `3321`
- Nginx configuration: `/etc/nginx/sites-available/antigravity-proxy`, forwarding to `http://127.0.0.1:3321`.

This is a separate application from OmniRoute (`/root/OmniRoute`, user service `omniroute.service`, port `20128`). Confirm the domain, working directory, and service before making changes.

## Current quota rules — read before changing quota code

1. Dashboard quota requests use **`https://daily-cloudcode-pa.googleapis.com`**, explicitly selected in `src/token.ts` through `ANTIGRAVITY_ENDPOINT_DAILY`. This applies to `retrieveUserQuotaSummary` and the existing `fetchAvailableModels` fallback.
2. **Do not use `ANTIGRAVITY_ENDPOINTS` for quota retrieval.** That list controls generation routing. Production (`cloudcode-pa.googleapis.com`) returned a different Gemini allowance for the same account. HTTP 200 alone does not prove that the selected quota source is correct.
3. Do not change generation routing to repair dashboard quotas. Keep quota source selection independent so future generation endpoint reordering cannot reintroduce this bug.
4. Keep the existing proxy CA trust configured. TLS connectivity and correct quota source selection are two separate requirements; fixing one does not validate the other.
5. Repair real Google data retrieval. Do not hard-code percentages, shift decimal places, substitute test data, or replace numeric readings with “not applicable” as a workaround. Test fixtures belong only in the isolated test process.
6. The September 7 percentages below came from the wrong source for the reported Gemini account limit. They are incident evidence, **not a correct baseline**. The September 8 source correction supersedes that earlier validation.

### Required verification after quota changes

Run from `/opt/antigravity-proxy`:

```bash
node --import tsx tests/quota.test.ts
node node_modules/typescript/bin/tsc --noEmit
```

The regression test reproduces production returning 81.1% while daily returns 8% weekly and 83% for five hours. It must return the daily values even if generation routing prefers production. Passing this test is necessary but does not replace live verification.

After deploying and restarting `antigravity-proxy.service`:

1. Fetch the real daily `retrieveUserQuotaSummary` for the reported account using its valid token and project. Inspect only quota fields; never print credentials or the full admin response.
2. Refresh quotas using authenticated `POST /api/admin/accounts/refresh-quota`, then read `GET /api/admin/data`.
3. Compare the **same account and same window**: Gemini weekly, Gemini five-hour, Claude weekly and Claude five-hour; include reset timestamps and upstream descriptions/disabled flags. Compare requests close together because usage can change percentages between reads.
4. Verify the dashboard displays those readings. A successful fetch, passing test, or active service alone is insufficient evidence that the user-visible issue is fixed.
5. Confirm every connected account has weekly and five-hour data. Record the observation time and measured values in the incident notes, never as constants in application code.

If a mismatch remains, trace daily response → parsed quota → admin API → rendered dashboard. Fix the first layer where the values diverge. The existing presentation and missing-data limitations documented below remain separate issues; the September 8 repair did not change them.

## Incident: weekly and 5-hour quotas showed false full capacity

Connectivity repaired on 2026-09-07; the operator initially confirmed improvement. The later September 8 incident established that the quota source was still incorrect for the reported Gemini limit. This section describes the TLS repair only.

### Cause and evidence

Local `/etc/hosts` entries intentionally route `cloudcode-pa.googleapis.com` and `daily-cloudcode-pa.googleapis.com` through the local MITM proxy. The Gateway Node.js process did not trust that proxy's CA. Requests to `retrieveUserQuotaSummary` and `fetchAvailableModels` failed with `SELF_SIGNED_CERT_IN_CHAIN`. The final fallback host returned HTTP 404, which obscured the earlier TLS failure in the application log.

The existing quota code substituted 100% capacity after unsuccessful initial fetches. The live admin API consequently reported default quotas for all seven accounts, with no weekly percentages or reset timestamps.

### Applied fix

The following systemd drop-in adds trust for the existing proxy CA to this Gateway service:

File: `/etc/systemd/system/antigravity-proxy.service.d/20-mitm-ca.conf`

```ini
[Service]
Environment=NODE_EXTRA_CA_CERTS=/root/.omniroute/mitm/ca.crt
```

After installing or updating this file, apply it with:

```bash
sudo systemctl daemon-reload
sudo systemctl restart antigravity-proxy.service
sudo systemctl is-active antigravity-proxy.service
```

The restart interrupts active Gateway connections; choose an appropriate moment. Node.js reads the additional CA at process startup. The CA file must exist and be readable by the service user. If the proxy CA is replaced, verify the new certificate and restart the Gateway to load it.

The proxy and host mappings remain enabled. TLS certificate verification remains enabled; do not use `NODE_TLS_REJECT_UNAUTHORIZED=0`. No application source code or OmniRoute configuration was changed for this repair.

### Validation and recurrence checks

1. Check the service and CA configuration:

   ```bash
   systemctl is-active antigravity-proxy.service
   cat /etc/systemd/system/antigravity-proxy.service.d/20-mitm-ca.conf
   openssl x509 -in /root/.omniroute/mitm/ca.crt -noout -subject -dates
   journalctl -u antigravity-proxy.service --since '5 minutes ago' --no-pager
   ```

2. Sign in to the Gateway dashboard, refresh quotas, and check both weekly and five-hour values and reset times. The dashboard uses authenticated `POST /api/admin/accounts/refresh-quota` and `GET /api/admin/data`. Do not publish raw admin responses: they also include client API keys and account identifiers.
3. If values still look wrong, inspect each upstream attempt rather than relying only on the last fallback error. Compare the same account on the same upstream endpoint: production and daily returned different Gemini quota values during diagnosis. Since the September 8 repair, quota requests explicitly use daily in `src/token.ts`; the endpoint order in `src/constants.ts` is for generation and must not determine dashboard quotas.

After the fix, requests through the proxy returned HTTP 200 from Google's quota summary endpoint. The Gateway admin API returned weekly percentages and reset timestamps for all seven accounts. At validation time, all seven Claude weekly quotas were exhausted; Gemini weekly remaining values were 81.1%, 92.4%, 100%, 96.1%, 83.2%, 83.3%, and 66.6%. These are historical observations, not expected future values. Google indicated that Claude's five-hour window did not apply while its weekly quota was exhausted.

### Remaining display limitations

This repair restores quota retrieval; it does not change the existing presentation logic. Missing quota data can still fall back to 100% if a future fetch fails. Token counts derived from hard-coded capacities are not authoritative account allowances. Use the upstream window percentages, descriptions, and reset timestamps when checking account limits.

### Rollback

Remove only the `20-mitm-ca.conf` drop-in, reload systemd, and restart `antigravity-proxy.service`. With the current host mappings, removing CA trust will reintroduce the TLS failure; use rollback only when the proxy trust setup has also changed. Do not restart or modify OmniRoute as part of this Gateway-only configuration rollback.


## Incident: production endpoint reported 81.1% instead of the daily account limit

Fixed on 2026-09-08 in `src/token.ts` for the Gateway dashboard.

The previous CA fix restored connectivity but did not correct the quota source.
`ANTIGRAVITY_ENDPOINTS` had been reordered to production first on September 6.
Both quota methods reused this generation endpoint list and accepted the first
successful response. For the reported account, production returned 81.1% Gemini
weekly and 100% five-hour capacity. Daily returned 4.8% weekly and 83.2%
five-hour capacity during diagnosis; subsequent live verification returned 3.9%
and 77.6%. Direct DNS and the existing MITM route returned the same source-specific
values. This was a different upstream allowance, not a rounding or TLS error.

Quota retrieval now uses `ANTIGRAVITY_ENDPOINT_DAILY` explicitly for both
`retrieveUserQuotaSummary` and its existing `fetchAvailableModels` fallback.
Do not reuse the generation endpoint ordering for quota retrieval or silently
fall back to production: its Gemini percentages and reset dates are different.
The generation endpoint order, UI presentation, and existing cache behavior
were not changed by this repair.

Validation: TypeScript check, regression test `tests/quota.test.ts`, and a real
Google request through the corrected fetch function. Run the regression with
`node --import tsx tests/quota.test.ts`. It uses an isolated CONFIG_DIR and simulated
network responses only in the test process; application requests use Google.
After deployment, compare authenticated `/api/admin/data` with the daily summary
for the same account, including weekly and five-hour reset timestamps. Values
change with use; the historical percentages above must never be hard-coded.

### Final deployed verification on 2026-09-08 (UTC)

After the Gateway restart, authenticated `GET /api/admin/data` returned HTTP 200.
For the reported account, Gemini weekly remaining was **3.2%**, five-hour remaining
was **74%**, weekly reset was `2026-09-10T22:12:22Z`, and five-hour reset was
`2026-09-08T05:28:32Z`. All seven connected accounts returned Gemini weekly data.
These were live post-deployment observations; earlier values changed during use.
The test and TypeScript check also passed against the deployed source.

## Incident: dashboard Google account connection could not finish (2026-09-08)

Logs showed `GET /api/admin/oauth-url` at 01:14 UTC without a subsequent
`POST /api/admin/accounts/oauth-exchange`. The dashboard instructed users to paste
only an authorization code and sent `{ code }`, while the server requires
`{ callbackUrl }` containing both `code` and `state`. This contract mismatch was
confirmed in source and reproduced by the regression test.

The modal now instructs the user to copy the entire localhost callback address,
sends `callbackUrl`, validates the required parameters, shows login-link errors,
and displays progress during submission. The success message uses the server's
`email` field. Authentication protocol and quota source selection are unchanged.

Google redirects to `http://localhost:51121/oauth-callback` on the user's computer,
not to the remote Gateway. IMPORTANT: the firstparty/nativeapp consent can stall
before releasing a code when the loopback listener is unreachable. Do not assume
Google will always navigate to an error page whose URL can be copied. The original
paste-after-connection-error instructions did not solve the reported consent hang.
A local callback receiver or an SSH tunnel to a running callback receiver is needed
to test and complete this flow. Starting a receiver only on the VPS is insufficient.
The user also reproduced the issue in a guest browser profile and reported a
Google Play warning on the consent page. That warning alone does not establish
the OAuth client's platform type or an account ban. Do not keep suggesting cookie
resets after the isolated-browser test also fails.

Reference implementation's diagnosis and supported remote-login approaches:
https://github.com/diegosouzapw/OmniRoute/blob/release/v3.8.50/docs/guides/REMOTE-MODE.md
This is reference material only; the affected application remains this Gateway.
End-to-end login is still unverified pending a receiver on the user's computer.
Do not paste authorization URLs/codes into logs or support messages.

Regression: `node --import tsx tests/oauth-ui.test.ts`; also run the quota regression
and TypeScript check. A real account connection requires the user's Google consent;
passing automated tests does not establish completion of that consent step.
