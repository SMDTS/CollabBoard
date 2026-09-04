// src/services/taskService.js
import * as taskRepository from "../repositories/taskRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
import * as activityService from "./activityService.js";
import { NotFoundError } from "../utils/AppError.js";

export function getAllTasks() {
  return taskRepository.findAll();
}

export function getTaskById(id) {
  const task = taskRepository.findById(id);
  if (!task) throw new NotFoundError("Task");
  return task;
}

// Now async: boardRepository.findById is a real DB call (Board is
// already migrated) and returns a Promise, so this needed an `await` —
// without it the check below was always truthy and never actually
// caught a bad boardId. Also now takes `actorId` so we can attribute the
// activity entry to whoever made the request (comes from req.user.id).
export async function createTask(data, actorId) {
  // A task must belong to a real board — fail loudly here rather than
  // silently creating an orphaned task nothing can ever find.
  const board = await boardRepository.findById(data.boardId);
  if (!board) {
    throw new NotFoundError("Board");
  }

  const task = taskRepository.create(data);

  await activityService.logActivity({
    action: "created",
    actorId,
    boardId: task.boardId,
    taskId: task.id,
    taskTitle: task.title,
  });

  return task;
}

// Also async now, so it can await the activity write. Detects a "move"
// specifically as a change to `status` (the column) — other field edits
// (title, assignee, etc.) don't produce a feed entry, matching the
// milestone's "created, moved, or deleted" scope.
export async function updateTask(id, patch, actorId) {
  const before = taskRepository.findById(id);
  const updated = taskRepository.update(id, patch);
  if (!updated) throw new NotFoundError("Task");

  if (patch.status && before && patch.status !== before.status) {
    await activityService.logActivity({
      action: "moved",
      actorId,
      boardId: updated.boardId,
      taskId: updated.id,
      taskTitle: updated.title,
      details: { from: before.status, to: patch.status },
    });
  }

  return updated;
}

export async function deleteTask(id, actorId) {
  const task = taskRepository.findById(id);
  const deleted = taskRepository.remove(id);
  if (!deleted) throw new NotFoundError("Task");

  await activityService.logActivity({
    action: "deleted",
    actorId,
    boardId: task.boardId,
    taskId: task.id,
    taskTitle: task.title,
  });
}