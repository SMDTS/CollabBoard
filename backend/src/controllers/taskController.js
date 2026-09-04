import * as taskService from "../services/taskService.js";
import { catchAsync } from "../utils/catchAsync.js";

// createTask/updateTask/deleteTask now do a DB write (the activity log
// entry) inside taskService, so they're async and need catchAsync —
// same rule the "Already Done" section calls out for any controller
// that calls a now-async function underneath it.

export function listTasks(req, res) {
  res.json(taskService.getAllTasks());
}

export function getTask(req, res) {
  const task = taskService.getTaskById(Number(req.params.id));
  res.json(task);
}

export const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user.id);
  res.status(201).json(task);
});

export const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(Number(req.params.id), req.body, req.user.id);
  res.json(task);
});

export const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(Number(req.params.id), req.user.id);
  res.status(204).end();
});