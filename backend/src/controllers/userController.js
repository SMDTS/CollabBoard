// src/controllers/userController.js
import * as userService from "../services/userService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const listUsers = catchAsync(async (req, res) => {
  // ?q=... switches this into a search-by-name-or-email lookup (used by
  // the Team page to find someone to invite); no q keeps the old
  // "everyone" behavior other pages still rely on.
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const results = await userService.searchUsers(req.query.q, req.user.id);
    return res.json(results);
  }
  const users = await userService.getAllUsers();
  res.json(users);
});
