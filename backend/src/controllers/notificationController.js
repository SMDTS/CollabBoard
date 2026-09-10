// src/controllers/notificationController.js
import * as notificationService from "../services/notificationService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const listMyNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.listMine(req.user.id);
  res.json(result);
});

export const markNotificationRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.id);
  res.json(notification);
});

export const markAllNotificationsRead = catchAsync(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  res.json({ message: "All notifications marked read" });
});
