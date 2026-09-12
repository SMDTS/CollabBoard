// "" is a deliberate, valid value here — it means "same origin, relative
// /api/... paths" (see frontend/Dockerfile), not "not configured". Only an
// actually-unset var (undefined) falls back to the local-dev default. A
// plain `||` would treat "" the same as unset and always fall back,
// defeating the point of setting it to "" in the first place.
export const BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : "http://localhost:4000";

const TOKEN_KEY = "flowty-token";
const LAST_ACTIVITY_KEY = "flowty-last-activity";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }
}

export function getLastActivity() {
  const val = localStorage.getItem(LAST_ACTIVITY_KEY);
  return val ? parseInt(val, 10) : Date.now();
}

export function updateLastActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 204 No Content has no body to parse.
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const detailMessage = data?.error?.details?.[0]?.message;
    const message = detailMessage || data?.error?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}
