import { apiFetch, BASE_URL, getToken } from "./client.js";

export function fetchUsers() {
  return apiFetch("/api/users");
}

// Search registered users by name or email — used by the Team page's
// "search someone to invite" box.
export function searchUsers(query) {
  return apiFetch(`/api/users?q=${encodeURIComponent(query)}`);
}

// Notification preferences ("Email me when assigned", etc. on Settings).
// Returns the updated user (including the new preferences), same shape
// as /api/auth/me, so the caller can just replace its local copy.
export function updateMyPreferences(patch) {
  return apiFetch("/api/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function uploadAvatarFile(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to upload image");
  }
  return data;
}

export function updateAvatarUrl(avatarUrl) {
  return apiFetch("/api/users/me/avatar", {
    method: "PATCH",
    body: JSON.stringify({ avatarUrl }),
  });
}
