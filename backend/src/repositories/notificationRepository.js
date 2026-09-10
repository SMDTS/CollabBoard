// src/repositories/notificationRepository.js
import { Notification } from "../models/Notification.js";

export function create({ recipientId, type, message, link }) {
  return Notification.create({ recipient: recipientId, type, message, link });
}

// Most recent first, capped — the bell shows a short list, not a full
// history browser.
export function findRecentForUser(userId, limit = 20) {
  return Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(limit);
}

export function countUnreadForUser(userId) {
  return Notification.countDocuments({ recipient: userId, read: false });
}

export function markRead(id, userId) {
  // Scoped to the requesting user too, not just the id — so you can only
  // ever mark your own notifications read, never someone else's by
  // guessing an id.
  return Notification.findOneAndUpdate({ _id: id, recipient: userId }, { read: true }, { new: true });
}

export function markAllRead(userId) {
  return Notification.updateMany({ recipient: userId, read: false }, { read: true });
}
