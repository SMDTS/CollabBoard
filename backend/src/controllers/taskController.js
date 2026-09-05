// src/controllers/taskController.js
import * as taskService from "../services/taskService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const listTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getAllTasks(req.user.id);
  res.json(tasks);
});

export const getTask = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  res.json(task);
});

export const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user.id);
  res.status(201).json(task);
});

// req.body.version is validated as required by updateTaskSchema, so
// it's always present here by the time this runs.
export const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
  res.json(task);
});

export const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user.id);
  res.status(204).end();
});