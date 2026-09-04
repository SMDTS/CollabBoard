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

export async function createTask(data) {
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

export async function updateTask(id, patch) {
  const updated = await taskRepository.update(id, patch);
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

export async function deleteTask(id) {
  const deleted = await taskRepository.remove(id);
  if (!deleted) throw new NotFoundError("Task");
}