// src/controllers/activityController.js
import * as activityService from "../services/activityService.js";
import { catchAsync } from "../utils/catchAsync.js";

// GET /api/activity            -> global feed (Dashboard)
// GET /api/activity?boardId=.. -> feed for one board
export const listActivity = catchAsync(async (req, res) => {
  const { boardId, limit } = req.query;
  const activity = await activityService.getRecentActivity({
    boardId,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(activity);
});