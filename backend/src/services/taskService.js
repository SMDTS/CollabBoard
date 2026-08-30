// src/services/taskService.js
import * as taskRepository from "../repositories/taskRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
import { NotFoundError } from "../utils/AppError.js";

export function getAllTasks() {
  return taskRepository.findAll();
}

export function getTaskById(id) {
  const task = taskRepository.findById(id);
  if (!task) throw new NotFoundError("Task");
  return task;
}

export function createTask(data) {
  // A task must belong to a real board — fail loudly here rather than
  // silently creating an orphaned task nothing can ever find.
  if (!boardRepository.findById(data.boardId)) {
    throw new NotFoundError("Board");
  }
  return taskRepository.create(data);
}

export function updateTask(id, patch) {
  const updated = taskRepository.update(id, patch);
  if (!updated) throw new NotFoundError("Task");
  return updated;
}

export function deleteTask(id) {
  const deleted = taskRepository.remove(id);
  if (!deleted) throw new NotFoundError("Task");
}
