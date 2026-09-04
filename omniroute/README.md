# OmniRoute — parallel AI gateway

[OmniRoute](https://github.com/diegosouzapw/OmniRoute) runs **alongside**
`antigravity-router` on this box as a second, independent OpenAI-compatible
gateway (352 providers, auto-fallback, RTK+Caveman compression).

It is **not** vendored into this repo — it is the published `omniroute` npm
package. This branch only carries the install + service glue.

| | |
|---|---|
| Dashboard | http://localhost:20128 |
| API base  | http://localhost:20128/v1 (OpenAI-compatible) |
| Package   | `omniroute` (global npm install) |
| Runtime   | Node 24 via nvm (`~/.nvm`) — system Node 20 untouched |
| Data dir  | `~/.omniroute` — `storage.sqlite`, auto-generated encryption keys |
| Source ref| clone kept at `/root/OmniRoute` for reading only |

## Install

```bash
./omniroute/install.sh
```

Installs nvm + Node 24 (if missing) and `npm i -g omniroute` with native build
scripts allow-listed (npm 11 blocks lifecycle scripts by default).

## Run

Foreground:

```bash
omniroute
```

As a service (loopback-bound, 8 GiB heap, auto-restart):

```bash
sudo ./omniroute/service.sh install
./omniroute/service.sh logs
```

## Verify

```bash
# zero-config: `auto` works with no API key / no signup
curl -s http://localhost:20128/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"auto","messages":[{"role":"user","content":"hi"}]}'
```

## Notes

- **Security:** the unit binds `127.0.0.1`. To expose on the LAN, drop
  `OMNIROUTE_SERVER_HOST` (or set `0.0.0.0`) **and** set `REQUIRE_API_KEY=true`.
- **Providers:** Dashboard → Providers → connect Kiro AI (free Claude) or
  OpenCode Free (no auth). `auto` already routes through a keyless backend.
- **Memory:** `OMNIROUTE_MEMORY_MB=8192` fits one coding agent; raise to
  `10240`–`12288` for two concurrent long `/v1/responses` streams.
