// src/services/taskService.js
import * as taskRepository from "../repositories/taskRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
import * as activityService from "./activityService.js";
import { NotFoundError } from "../utils/AppError.js";

export function getAllTasks() {
  return taskRepository.findAll();
}

export async function getTaskById(id) {
  const task = await taskRepository.findById(id);
  if (!task) throw new NotFoundError("Task");
  return task;
}

export async function createTask(data, actorId) {
  // A task must belong to a real board — fail loudly here rather than
  // silently creating an orphaned task nothing can ever find.
  const board = await boardRepository.findById(data.boardId);
  if (!board) {
    throw new NotFoundError("Board");
  }

  const task = await taskRepository.create(data);

  await activityService.logActivity({
    action: "created",
    actorId,
    boardId: task.boardId,
    taskId: task.id,
    taskTitle: task.title,
  });

  return task;
}

export async function updateTask(id, patch, actorId) {
  // Fetch the pre-update state so we can tell whether this update moved
  // the task to a different column (for the "moved" activity entry).
  // Doesn't affect the 409 concurrency check below — that's still done
  // atomically inside taskRepository.update() against the version field.
  const before = await taskRepository.findById(id);
  if (!before) throw new NotFoundError("Task");

  const updated = await taskRepository.update(id, patch);
  if (!updated) throw new NotFoundError("Task");

  if (patch.columnId && String(patch.columnId) !== String(before.columnId)) {
    await activityService.logActivity({
      action: "moved",
      actorId,
      boardId: updated.boardId,
      taskId: updated.id,
      taskTitle: updated.title,
      details: { from: before.columnId, to: patch.columnId },
    });
  }

  return updated;
}

export async function deleteTask(id, actorId) {
  // Grab the task before removing it — need its title/boardId for the
  // activity entry, and the row won't exist to look up afterward.
  const task = await taskRepository.findById(id);
  if (!task) throw new NotFoundError("Task");

  const deleted = await taskRepository.remove(id);
  if (!deleted) throw new NotFoundError("Task");

  await activityService.logActivity({
    action: "deleted",
    actorId,
    boardId: task.boardId,
    taskId: task.id,
    taskTitle: task.title,
  });
}