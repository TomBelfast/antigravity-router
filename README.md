# ⚡ Antigravity Router

<div align="center">

![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)
![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)
![Antigravity](https://img.shields.io/badge/Antigravity-2.0-2AF527.svg)

**High-Performance AI Gateway, Multi-Account Quota Router & Failover Proxy for Google Antigravity**  
*Route unlimited Gemini 3.8 / 3.6 Flash & Pro and Claude 3.7 Sonnet / Opus Thinking requests with zero rate-limit downtime.*

</div>

---

## 🌟 Overview

**Antigravity Router** is a self-hosted AI reverse proxy and load balancer designed specifically for the **Google Antigravity** ecosystem. It bridges the gap between your favorite developer tools (Cursor, Windsurf, Claude Code, Cline, JetBrains, or OpenAI/Anthropic SDKs) and multiple Google CloudCode Antigravity accounts.

When one account reaches its 5-hour rolling threshold or weekly allowance, Antigravity Router **automatically and transparently fails over** to the next available account in the pool with zero dropped connections and full Server-Sent Events (SSE) streaming support.

---

## ✨ Key Features

- 🔄 **Multi-Account Quota Routing:** Connect 1 to 50+ Google accounts; the router balances traffic and monitors active quotas across all instances.
- 🛡️ **Zero-Downtime Failover:** Automatically catches HTTP `429 Too Many Requests` or quota exhaustion and retries in-flight prompts with the next healthy account.
- 📊 **Official Cockpit-Accurate Dashboard:**
  - Real-time **4-meter limit cards** for every paired account matching the official Antigravity Cockpit view.
  - **Gemini Models** (Weekly Limit Remaining + Five Hour Limit Remaining).
  - **Claude and GPT models** (Weekly Limit Remaining + Five Hour Limit Remaining).
  - Dynamic SVG circular progress rings and right-to-left countdown progress bars for exhausted accounts.
  - Live background Matrix digital rain animation (`#2AF527` electric green over dark graphite).
- 🔌 **Universal Drop-in Compatibility:** Exposes standard OpenAI `/v1/chat/completions` and Anthropic `/v1/messages` endpoints.
- 🔑 **Built-in API Key Management:** Issue, revoke, and track usage for client API keys (`sk-ag-...`).
- ⚡ **Native Streaming:** Optimized chunk forwarding with zero latency buffering for instant token generation.
- 🐳 **Docker-Ready:** Lightweight multi-stage Alpine Docker container running on unprivileged user with health checks.

---

## 🚀 Quick Start (Docker Compose)

The fastest way to deploy Antigravity Router is using Docker Compose:

### 1. Clone & Configure

```bash
git clone https://github.com/TomBelfast/antigravity-router.git
cd antigravity-router
cp .env.example .env
```

Edit `.env` to set your custom admin password:
```env
PORT=3321
ADMIN_PASSWORD=your_super_secret_password
DATA_DIR=/app/data
```

### 2. Launch Container

```bash
docker compose up -d
```

Open your browser and navigate to:
👉 `http://localhost:3321/dashboard`

---

## 💻 Manual Installation (Node.js)

### Prerequisites
- Node.js 20+
- npm or pnpm

```bash
git clone https://github.com/TomBelfast/antigravity-router.git
cd antigravity-router
npm install
npm run build
npm start
```

---

## 🛠️ IDE Configuration (Cursor / Windsurf)

Once Antigravity Router is running and you have generated an API key from the Web Dashboard (`/dashboard`), configure your IDE:

### Cursor Setup
1. Open **Cursor Settings** ➔ **Models** ➔ **OpenAI API Key**.
2. Set **Base URL** (Override):
   ```text
   http://localhost:3321/v1
   ```
   *(or your public domain, e.g., `https://api.yourdomain.com/v1`)*
3. Enter your generated **API Key**: `sk-ag-...`
4. Add your preferred Antigravity models:
   - `gemini-3.8-flash-high`
   - `gemini-3.6-flash-high`
   - `gemini-2.5-pro`
   - `claude-3-7-sonnet`
   - `claude-opus-4-6-thinking`

---

## 📡 API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/v1/chat/completions` | `POST` | OpenAI-compatible chat completion route |
| `/v1/models` | `GET` | Lists all available Google & Anthropic models |
| `/v1/messages` | `POST` | Anthropic-compatible message endpoint |
| `/dashboard` | `GET` | Live Cockpit telemetry and administration UI |
| `/health` | `GET` | Healthcheck and active account counter |
| `/api/admin/data` | `GET` | Real-time quota metrics, usage stats, and client keys |
| `/api/admin/keys` | `POST` / `DELETE` | Create and revoke client API access keys |
| `/api/admin/accounts/refresh-quota` | `POST` | Trigger instant background quota telemetry sync |

---

## 🔒 Security

- All OAuth tokens and client keys are stored locally in the persistent `data/` directory.
- Sensitive environment variables and credentials should never be committed to public repositories.
- Web admin access is strictly protected by the `x-admin-password` header or dashboard session token.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
