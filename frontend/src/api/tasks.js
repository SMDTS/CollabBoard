// src/api/tasks.js
import { apiFetch } from "./client.js";

export function fetchTasks() {
  return apiFetch("/api/tasks");
}

export function createTask({ title, assigneeId, columnId, dueDate, boardId }) {
  return apiFetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title, assigneeId, columnId, dueDate, boardId }),
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

export function fetchTask(id) {
  return apiFetch(`/api/tasks/${id}`);
}