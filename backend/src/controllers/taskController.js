// src/controllers/taskController.js
import * as taskService from "../services/taskService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { emitToBoard } from "../sockets/index.js";

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
  // actorId rides along on every event so the client that made the change
  // can tell its own writes apart from someone else's — it already has
  // this task locally from the optimistic PouchDB write, so it should
  // skip re-applying it rather than flicker on its own action.
  emitToBoard(req.app.get("io"), task.boardId, "task:created", { task, actorId: req.user.id });
  res.status(201).json(task);
});

// req.body.version is validated as required by updateTaskSchema, so
// it's always present here by the time this runs.
export const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
  emitToBoard(req.app.get("io"), task.boardId, "task:updated", { task, actorId: req.user.id });
  res.json(task);
});

export const deleteTask = catchAsync(async (req, res) => {
  const { id, boardId } = await taskService.deleteTask(req.params.id, req.user.id);
  emitToBoard(req.app.get("io"), boardId, "task:deleted", { id, boardId, actorId: req.user.id });
  res.status(204).end();
});