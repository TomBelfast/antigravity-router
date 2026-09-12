# Antigravity Gateway maintenance

- This repository serves `https://api.aihub.ovh/dashboard`, system service `antigravity-proxy.service`, port `3321`. It is separate from OmniRoute. Do not modify or restart OmniRoute for a Gateway quota issue.
- Before changing or diagnosing weekly/five-hour quotas, read [docs/operations.md](docs/operations.md), especially “Current quota rules” and the September 8 incident. The September 7 TLS fix alone did not correct the quota source.
- Quota reads in `src/token.ts` must explicitly use `ANTIGRAVITY_ENDPOINT_DAILY` (`daily-cloudcode-pa.googleapis.com`) for both quota methods. Do not reuse generation's `ANTIGRAVITY_ENDPOINTS` or fall back to production: it returned a different Gemini allowance for the same account.
- Fix actual data retrieval; never hard-code observed percentages or substitute test fixtures in the application. Do not replace numeric readings with “not applicable” as a workaround.
- After quota changes run `node --import tsx tests/quota.test.ts` and `node node_modules/typescript/bin/tsc --noEmit`. Then verify real daily data against the same account/windows in the deployed admin API and dashboard, including reset timestamps. Tests alone do not establish live correctness.
- Preserve proxy CA trust. Never print access tokens, admin passwords, or complete admin responses. Summarize only the fields needed for verification.
- Update the incident history when a new cause or repair is confirmed; distinguish historical observations from current expected behavior.
