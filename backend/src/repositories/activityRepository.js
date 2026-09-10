// src/repositories/activityRepository.js
import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";

export async function create({ action, actor, board, task, taskTitle, details }) {
  return Activity.create({ action, actor, board, task, taskTitle, details });
}

// `boardId` is optional — omit it for the global dashboard feed, pass it
// to scope the feed to one board. Newest first, capped by `limit` so the
// feed can't grow unbounded on screen.
//
// `board` is a Mixed field, so Mongoose won't cast the query value the way
// it would for a real ObjectId-typed path — and `board` is always stored
// as a BSON ObjectId (it's populated from task.boardId, a real ref). A
// plain string here would never match, silently returning an empty feed
// for every board-scoped request. Cast explicitly so the query actually
// matches what's stored.
export async function findRecent({ boardId, limit = 20 } = {}) {
  const query = boardId ? { board: new mongoose.Types.ObjectId(boardId) } : {};
  return Activity.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actor", "name email");
}