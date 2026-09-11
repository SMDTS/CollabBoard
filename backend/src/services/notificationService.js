// src/services/notificationService.js
import * as notificationRepository from "../repositories/notificationRepository.js";
import { NotFoundError } from "../utils/AppError.js";

// Called from taskService/activityService — creates the bell entry.
// Deliberately NOT gated by the email preference toggles (those only
// control whether an email also goes out); the bell itself always shows
// what's relevant to you.
export function notify({ recipientId, type, message, link }) {
  return notificationRepository.create({ recipientId, type, message, link });
}

export async function listMine(userId) {
  const [notifications, unreadCount] = await Promise.all([
    notificationRepository.findRecentForUser(userId),
    notificationRepository.countUnreadForUser(userId),
  ]);
  return { notifications, unreadCount };
}

export async function markRead(id, userId) {
  const updated = await notificationRepository.markRead(id, userId);
  if (!updated) throw new NotFoundError("Notification");
  return updated;
}

export function markAllRead(userId) {
  return notificationRepository.markAllRead(userId);
}
