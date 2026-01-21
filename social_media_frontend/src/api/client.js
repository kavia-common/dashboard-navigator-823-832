/**
 * Lightweight API client for the React app.
 * - Reads configuration from environment variables (CRA: process.env.REACT_APP_*)
 * - Supports bearer token authorization if a token is available
 * - Provides basic GET/POST helpers and a generic request function
 * - Exposes a simple way to set/get tokens if the app needs to override defaults
 */

// PUBLIC_INTERFACE
export const getEnv = () => {
  /** Returns normalized environment configuration read from process.env. */
  const {
    REACT_APP_API_BASE,
    REACT_APP_BACKEND_URL,
    REACT_APP_FRONTEND_URL,
    REACT_APP_WS_URL,
    REACT_APP_NODE_ENV,
    REACT_APP_NEXT_TELEMETRY_DISABLED,
    REACT_APP_ENABLE_SOURCE_MAPS,
    REACT_APP_PORT,
    REACT_APP_TRUST_PROXY,
    REACT_APP_LOG_LEVEL,
    REACT_APP_HEALTHCHECK_PATH,
    REACT_APP_FEATURE_FLAGS,
    REACT_APP_EXPERIMENTS_ENABLED
  } = process.env;

  return {
    API_BASE: REACT_APP_API_BASE,
    BACKEND_URL: REACT_APP_BACKEND_URL,
    FRONTEND_URL: REACT_APP_FRONTEND_URL,
    WS_URL: REACT_APP_WS_URL,
    NODE_ENV: REACT_APP_NODE_ENV,
    NEXT_TELEMETRY_DISABLED: REACT_APP_NEXT_TELEMETRY_DISABLED,
    ENABLE_SOURCE_MAPS: REACT_APP_ENABLE_SOURCE_MAPS,
    PORT: REACT_APP_PORT,
    TRUST_PROXY: REACT_APP_TRUST_PROXY,
    LOG_LEVEL: REACT_APP_LOG_LEVEL || "info",
    HEALTHCHECK_PATH: REACT_APP_HEALTHCHECK_PATH || "/health",
    FEATURE_FLAGS: REACT_APP_FEATURE_FLAGS,
    EXPERIMENTS_ENABLED: REACT_APP_EXPERIMENTS_ENABLED
  };
};

// Resolve base URL using envs with sensible fallbacks
function resolveBaseUrl() {
  const env = getEnv();

  if (env.API_BASE && env.API_BASE.trim()) return env.API_BASE.trim();

  // Fallback to BACKEND_URL + "/api" if provided
  if (env.BACKEND_URL && env.BACKEND_URL.trim()) {
    const base = env.BACKEND_URL.replace(/\/+$/, "");
    return `${base}/api`;
  }

  // Final fallback to current origin + "/api"
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    return `${window.location.origin.replace(/\/+$/, "")}/api`;
  }

  // If everything else fails, return a relative path which CRA dev proxy can handle
  return "/api";
}

// Token management
let inMemoryToken = null;

/**
 * Attempts to retrieve token from several locations:
 * 1) Explicitly set in-memory token (setToken)
 * 2) window.__APP_TOKEN__ (if set by server-side templating)
 * 3) localStorage 'auth_token'
 */
function getToken() {
  if (inMemoryToken) return inMemoryToken;

  try {
    if (typeof window !== "undefined") {
      if (window.__APP_TOKEN__) return window.__APP_TOKEN__;
      const lsToken = window.localStorage ? window.localStorage.getItem("auth_token") : null;
      if (lsToken) return lsToken;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

// PUBLIC_INTERFACE
export function setToken(token) {
  /** Set or clear the in-memory Authorization token used by the API client. */
  inMemoryToken = token || null;
}

// Build request options with JSON headers and optional Authorization
function buildOptions(method = "GET", body, extraHeaders = {}) {
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...extraHeaders
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const opts = {
    method,
    headers,
    // credentials: 'include' // Uncomment if you need cookies with CORS
  };

  if (body !== undefined && body !== null) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  return opts;
}

// Helper to join base and path cleanly
function joinUrl(base, path) {
  const left = (base || "").replace(/\/+$/, "");
  const right = (path || "").replace(/^\/+/, "");
  return `${left}/${right}`;
}

// Basic error normalization
async function normalizeResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  let payload = null;

  try {
    if (contentType.includes("application/json")) {
      payload = await res.json();
    } else {
      payload = await res.text();
    }
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const err = new Error(`Request failed with status ${res.status}`);
    err.status = res.status;
    err.data = payload;
    throw err;
  }
  return payload;
}

// PUBLIC_INTERFACE
export async function request(path, { method = "GET", body, headers } = {}) {
  /**
   * Generic request method.
   * - path: string path relative to API base
   * - method: HTTP method (GET, POST, etc.)
   * - body: JS object or string; JS object will be JSON.stringified
   * - headers: additional headers to merge
   * Returns parsed response (JSON or text).
   */
  const base = resolveBaseUrl();
  const url = path.startsWith("http") ? path : joinUrl(base, path);

  const options = buildOptions(method, body, headers);
  const response = await fetch(url, options);
  return normalizeResponse(response);
}

// PUBLIC_INTERFACE
export async function get(path, params = {}, headers = {}) {
  /**
   * GET helper with optional query params.
   * - params: object of query params
   */
  let urlPath = path;
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length > 0) {
    const usp = new URLSearchParams();
    for (const [k, v] of entries) {
      usp.append(k, String(v));
    }
    const qs = usp.toString();
    urlPath = `${path}${path.includes("?") ? "&" : "?"}${qs}`;
  }
  return request(urlPath, { method: "GET", headers });
}

// PUBLIC_INTERFACE
export async function post(path, body = {}, headers = {}) {
  /**
   * POST helper.
   * - body: JS object or string; JS object will be JSON.stringified
   */
  return request(path, { method: "POST", body, headers });
}

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Returns the resolved API base URL currently in use. */
  return resolveBaseUrl();
}

// PUBLIC_INTERFACE
export function getWebSocketUrl() {
  /** Returns the WS URL from env, falling back to same host with ws/wss scheme. */
  const env = getEnv();
  if (env.WS_URL && env.WS_URL.trim()) return env.WS_URL.trim();

  if (typeof window !== "undefined" && window.location) {
    const { protocol, host } = window.location;
    const wsProto = protocol === "https:" ? "wss:" : "ws:";
    return `${wsProto}//${host}`;
  }
  return "ws://localhost:4000";
}
