// src/services/taskService.js
import * as taskRepository from "../repositories/taskRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
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
  return taskRepository.create(data);
}

export async function updateTask(id, patch) {
  const updated = await taskRepository.update(id, patch);
  if (!updated) throw new NotFoundError("Task");
  return updated;
}

export async function deleteTask(id) {
  const deleted = await taskRepository.remove(id);
  if (!deleted) throw new NotFoundError("Task");
}