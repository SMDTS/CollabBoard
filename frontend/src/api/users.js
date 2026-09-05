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
