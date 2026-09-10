// src/api/users.js
import { apiFetch } from "./client.js";

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
