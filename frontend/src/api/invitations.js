// src/api/invitations.js
import { apiFetch } from "./client.js";

// Pending invites addressed to the current user — what the notification
// bell in the TopBar polls.
export function fetchMyInvitations() {
  return apiFetch("/api/invitations");
}

export function respondToInvitation(id, action) {
  return apiFetch(`/api/invitations/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}
