// src/api/notifications.js
import { apiFetch } from "./client.js";

// { notifications: [...], unreadCount }
export function fetchMyNotifications() {
  return apiFetch("/api/notifications");
}

export function markNotificationRead(id) {
  return apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return apiFetch("/api/notifications/read-all", { method: "POST" });
}
