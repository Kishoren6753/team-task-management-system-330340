/**
 * Central API client with:
 * - Base URL via REACT_APP_API_BASE_URL
 * - Token injection via AuthContext token getter
 * - Consistent error shape for UI
 */

const DEFAULT_BASE_URL = "http://localhost:3001";

/**
 * @typedef {Object} ApiError
 * @property {string} message
 * @property {number} [status]
 * @property {any} [data]
 */

function getBaseUrl() {
  const fromEnv = process.env.REACT_APP_API_BASE_URL;
  return (fromEnv && fromEnv.trim()) || DEFAULT_BASE_URL;
}

function isDebugEnabled() {
  return String(process.env.REACT_APP_DEBUG_API || "").toLowerCase() === "true";
}

async function readJsonSafe(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function createApiClient(getToken) {
  /**
   * Create a token-aware API client.
   *
   * Contract:
   * - Inputs: getToken(): string | null
   * - Outputs: { request, get, post, put, patch, del }
   * - Errors: throws ApiError-like object {message,status,data}
   * - Side effects: network calls
   */
  const baseUrl = getBaseUrl();
  const debug = isDebugEnabled();

  async function request(path, options = {}) {
    const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const token = typeof getToken === "function" ? getToken() : null;

    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const reqInit = {
      ...options,
      headers
    };

    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[apiClient] request", { url, method: reqInit.method || "GET" });
    }

    const res = await fetch(url, reqInit);
    const data = await readJsonSafe(res);

    if (!res.ok) {
      /** @type {ApiError} */
      const err = {
        message:
          (data && data.message) ||
          (typeof data === "string" && data) ||
          `Request failed (${res.status})`,
        status: res.status,
        data
      };

      if (debug) {
        // eslint-disable-next-line no-console
        console.warn("[apiClient] error", err);
      }

      throw err;
    }

    return data;
  }

  return {
    request,
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) =>
      request(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
    put: (path, body) =>
      request(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
    patch: (path, body) =>
      request(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
    del: (path) => request(path, { method: "DELETE" })
  };
}
