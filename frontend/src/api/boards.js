// src/api/boards.js
import { apiFetch } from "./client.js";

export function fetchBoards() {
  return apiFetch("/api/boards");
}

export function fetchBoard(id) {
  return apiFetch(`/api/boards/${id}`);
}

export function fetchBoardStats(id) {
  return apiFetch(`/api/boards/${id}/stats`);
}

export function createBoard({ name, description }) {
  return apiFetch("/api/boards", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export function updateBoard(id, patch) {
  return apiFetch(`/api/boards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteBoard(id) {
  return apiFetch(`/api/boards/${id}`, { method: "DELETE" });
}

// Members: owner listed first, then everyone invited to this board.
export function fetchBoardMembers(id) {
  return apiFetch(`/api/boards/${id}/members`);
}

// Sends a pending invite — the person must accept it before they join.
export function inviteBoardMember(id, email) {
  return apiFetch(`/api/boards/${id}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Invites this board's owner has already sent that are still pending.
export function fetchBoardInvitations(id) {
  return apiFetch(`/api/boards/${id}/invitations`);
}

// Owner-only. Removes a member (not the owner) from the board.
export function kickBoardMember(id, userId) {
  return apiFetch(`/api/boards/${id}/members/${userId}`, { method: "DELETE" });
}
