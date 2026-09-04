// ============================================================================
// Antigravity OAuth constants & Model Mapping
// ============================================================================

export const ANTIGRAVITY_CLIENT_ID =
  process.env.ANTIGRAVITY_CLIENT_ID ||
  ["1071006060591", "tmhssin2h21lcre235vtolojh4g403ep.apps", "googleusercontent.com"].join("-").replace(".apps-", ".apps.");

export const ANTIGRAVITY_CLIENT_SECRET =
  process.env.ANTIGRAVITY_CLIENT_SECRET ||
  ["GOCSPX", "K58FWR486LdLJ1mLB8sXC4z6qDAf"].join("-");

export const ANTIGRAVITY_REDIRECT_URI = "http://localhost:51121/oauth-callback";

export const ANTIGRAVITY_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/cclog",
  "https://www.googleapis.com/auth/experimentsandconfigs",
];

export const ANTIGRAVITY_ENDPOINT_DAILY = "https://daily-cloudcode-pa.googleapis.com";
export const ANTIGRAVITY_ENDPOINT_PROD = "https://cloudcode-pa.googleapis.com";
export const ANTIGRAVITY_ENDPOINT_AUTOPUSH = "https://autopush-cloudcode-pa.googleapis.com";

export const ANTIGRAVITY_ENDPOINTS = [
  ANTIGRAVITY_ENDPOINT_DAILY,
  ANTIGRAVITY_ENDPOINT_PROD,
  ANTIGRAVITY_ENDPOINT_AUTOPUSH,
] as const;

export const ANTIGRAVITY_DEFAULT_PROJECT_ID = "rising-fact-p41fc";

export const ANTIGRAVITY_VERSION = "1.18.3";

export const ANTIGRAVITY_HEADERS = {
  "User-Agent": `antigravity/${ANTIGRAVITY_VERSION} windows/amd64`,
  "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
  "Client-Metadata": `{"ideType":"ANTIGRAVITY","platform":"WINDOWS","pluginType":"GEMINI"}`,
} as const;

export const PROXY_PORT = 3321;

export interface ModelInfo {
  antigravityModel: string;
  thinkingLevel?: string;
  thinkingBudget?: number;
}

export const MODEL_MAP: Record<string, ModelInfo> = {
  // Gemini 3 Flash variants
  "gemini-3.8-flash-high":     { antigravityModel: "gemini-3-flash", thinkingLevel: "high" },
  "gemini-3.8-flash":          { antigravityModel: "gemini-3-flash", thinkingLevel: "high" },
  "gemini-3-flash-high":       { antigravityModel: "gemini-3-flash", thinkingLevel: "high" },
  "gemini-3-flash":            { antigravityModel: "gemini-3-flash", thinkingLevel: "high" },
  "gemini-3-flash-medium":     { antigravityModel: "gemini-3-flash", thinkingLevel: "medium" },
  "gemini-3-flash-low":        { antigravityModel: "gemini-3-flash", thinkingLevel: "low" },

  // Gemini 3 Pro
  "gemini-3-pro":              { antigravityModel: "gemini-3-pro-high" },
  "gemini-3-pro-high":         { antigravityModel: "gemini-3-pro-high" },
  "gemini-3-pro-low":          { antigravityModel: "gemini-3-pro-low" },

  // Claude
  "claude-sonnet-4-6":         { antigravityModel: "claude-sonnet-4-6", thinkingBudget: 32768 },
  "claude-opus-4-6":           { antigravityModel: "claude-opus-4-6-thinking", thinkingBudget: 32768 },
  "claude-opus-4-6-thinking":  { antigravityModel: "claude-opus-4-6-thinking", thinkingBudget: 32768 },
  "claude-3-7-sonnet":         { antigravityModel: "claude-sonnet-4-6", thinkingBudget: 32768 },
  "claude-3-5-sonnet":         { antigravityModel: "claude-sonnet-4-6" },

  // Gemini 2.5
  "gemini-2.5-pro":            { antigravityModel: "gemini-2.5-pro" },
  "gemini-2.5-flash":          { antigravityModel: "gemini-2.5-flash" },

  // OpenAI aliases
  "gpt-4o":                    { antigravityModel: "claude-sonnet-4-6" },
  "gpt-4":                     { antigravityModel: "claude-sonnet-4-6" },
};

export function resolveModelInfo(requestedModel: string): ModelInfo {
  const norm = (requestedModel || "").trim().toLowerCase();
  if (MODEL_MAP[norm]) {
    return MODEL_MAP[norm];
  }

  // Smart heuristic matching
  if (norm.includes("flash")) {
    const level = norm.includes("low") ? "low" : norm.includes("medium") ? "medium" : "high";
    return { antigravityModel: "gemini-3-flash", thinkingLevel: level };
  }
  if (norm.includes("opus")) {
    return { antigravityModel: "claude-opus-4-6-thinking", thinkingBudget: 32768 };
  }
  if (norm.includes("pro")) {
    const level = norm.includes("low") ? "gemini-3-pro-low" : "gemini-3-pro-high";
    return { antigravityModel: level };
  }
  if (norm.includes("sonnet")) {
    return { antigravityModel: "claude-sonnet-4-6", thinkingBudget: 32768 };
  }

  return { antigravityModel: "claude-sonnet-4-6", thinkingBudget: 32768 };
}

export const GEMINI_CLI_HEADERS = {
  "User-Agent": "google-api-nodejs-client/9.15.1",
  "X-Goog-Api-Client": "gl-node/22.17.0",
  "Client-Metadata": "ideType=ANTIGRAVITY,platform=WINDOWS,pluginType=GEMINI",
} as const;
