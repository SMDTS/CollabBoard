// src/api/tasks.js
import { apiFetch } from "./client.js";

export function fetchTasks() {
  return apiFetch("/api/tasks");
}

export function createTask({ title, assignee, status, dueDate, boardId }) {
  return apiFetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title, assignee, status, dueDate, boardId }),
  });
}

export function updateTask(id, patch) {
  return apiFetch(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteTask(id) {
  return apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
}
