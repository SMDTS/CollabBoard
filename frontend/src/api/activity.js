// src/api/activity.js
import { apiFetch } from "./client.js";

// boardId is optional — omit it for the Dashboard's global feed.
export function fetchActivity(boardId) {
  const query = boardId ? `?boardId=${encodeURIComponent(boardId)}` : "";
  return apiFetch(`/api/activity${query}`);
}