// src/repositories/activityRepository.js
import { Activity } from "../models/Activity.js";

export async function create({ action, actor, board, task, taskTitle, details }) {
  return Activity.create({ action, actor, board, task, taskTitle, details });
}

// `boardId` is optional — omit it for the global dashboard feed, pass it
// to scope the feed to one board. Newest first, capped by `limit` so the
// feed can't grow unbounded on screen.
export async function findRecent({ boardId, limit = 20 } = {}) {
  const query = boardId ? { board: boardId } : {};
  return Activity.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actor", "name email");
}