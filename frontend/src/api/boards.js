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