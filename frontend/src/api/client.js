export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "flowty-token";
const LAST_ACTIVITY_KEY = "flowty-last-activity";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    updateLastActivity();
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  }
}

export function getLastActivity() {
  const val = localStorage.getItem(LAST_ACTIVITY_KEY);
  return val ? Number(val) : Date.now();
}

export function updateLastActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
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

    if (res.status === 401 && path !== "/api/auth/login") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    throw error;
  }

  return data;
}
