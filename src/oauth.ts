import { generatePKCE } from "@openauthjs/openauth/pkce";
import {
  ANTIGRAVITY_CLIENT_ID,
  ANTIGRAVITY_CLIENT_SECRET,
  ANTIGRAVITY_REDIRECT_URI,
  ANTIGRAVITY_SCOPES,
  ANTIGRAVITY_ENDPOINT_PROD,
  ANTIGRAVITY_ENDPOINT_DAILY,
  ANTIGRAVITY_ENDPOINT_AUTOPUSH,
  ANTIGRAVITY_HEADERS,
  GEMINI_CLI_HEADERS,
} from "./constants.js";

interface PkcePair {
  challenge: string;
  verifier: string;
}

export interface OAuthAuthorization {
  url: string;
  verifier: string;
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
  projectId: string;
}

function encodeState(verifier: string): string {
  return Buffer.from(JSON.stringify({ verifier }), "utf8").toString("base64url");
}

function decodeState(state: string): { verifier: string } {
  const normalized = state.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { verifier: string };
}

export async function buildAuthUrl(): Promise<OAuthAuthorization> {
  const pkce = (await generatePKCE()) as PkcePair;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", ANTIGRAVITY_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", ANTIGRAVITY_REDIRECT_URI);
  url.searchParams.set("scope", ANTIGRAVITY_SCOPES.join(" "));
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", encodeState(pkce.verifier));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return { url: url.toString(), verifier: pkce.verifier };
}

async function fetchProjectId(accessToken: string): Promise<string> {
  const endpoints = [ANTIGRAVITY_ENDPOINT_PROD, ANTIGRAVITY_ENDPOINT_DAILY, ANTIGRAVITY_ENDPOINT_AUTOPUSH];
  for (const base of endpoints) {
    try {
      const res = await fetch(`${base}/v1internal:loadCodeAssist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "User-Agent": GEMINI_CLI_HEADERS["User-Agent"],
          "Client-Metadata": ANTIGRAVITY_HEADERS["Client-Metadata"],
        },
        body: JSON.stringify({
          metadata: { ideType: "ANTIGRAVITY", platform: "WINDOWS", pluginType: "GEMINI" },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json() as Record<string, unknown>;
      if (typeof data["cloudaicompanionProject"] === "string") return data["cloudaicompanionProject"] as string;
      const proj = data["cloudaicompanionProject"] as Record<string, unknown> | undefined;
      if (proj && typeof proj["id"] === "string") return proj["id"] as string;
    } catch {
      // try next
    }
  }
  return "";
}

export async function exchangeCode(code: string, state: string): Promise<TokenResult> {
  const { verifier } = decodeState(state);
  const startTime = Date.now();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ANTIGRAVITY_CLIENT_ID,
      client_secret: ANTIGRAVITY_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: ANTIGRAVITY_REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const tokenPayload = await tokenRes.json() as {
    access_token: string;
    expires_in: number;
    refresh_token: string;
  };

  if (!tokenPayload.refresh_token) throw new Error("No refresh_token in response");

  const userRes = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  const userInfo = userRes.ok ? (await userRes.json() as { email?: string }) : {};
  const projectId = await fetchProjectId(tokenPayload.access_token);

  return {
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token,
    expiresAt: startTime + tokenPayload.expires_in * 1000 - 60_000,
    email: userInfo.email ?? "unknown",
    projectId,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  const startTime = Date.now();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: ANTIGRAVITY_CLIENT_ID,
      client_secret: ANTIGRAVITY_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${err}`);
  }

  const payload = await res.json() as { access_token: string; expires_in: number };
  return {
    accessToken: payload.access_token,
    expiresAt: startTime + payload.expires_in * 1000 - 60_000,
  };
}
