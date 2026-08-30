import * as taskService from "../services/taskService.js";

export function listTasks(req, res) {
  res.json(taskService.getAllTasks());
}

export function getTask(req, res) {
  const task = taskService.getTaskById(Number(req.params.id));
  res.json(task);
}

export function createTask(req, res) {
  const task = taskService.createTask(req.body);
  res.status(201).json(task);
}

export function updateTask(req, res) {
  const task = taskService.updateTask(Number(req.params.id), req.body);
  res.json(task);
}

export function deleteTask(req, res) {
  taskService.deleteTask(Number(req.params.id));
  res.status(204).end();
}