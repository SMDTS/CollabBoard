// src/services/taskService.js
import * as taskRepository from "../repositories/taskRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import * as activityService from "./activityService.js";
import * as boardService from "./boardService.js";
import { NotFoundError, ForbiddenError } from "../utils/AppError.js";

// Only fields a non-owner assignee is allowed to change when moving their
// own card between columns. Anything else in the patch is an editing
// action, which only the board owner may do.
//
// Note: the client is offline-first (PouchDB) and always PATCHes the
// *whole* task doc, not just the changed field — so we can't reject a
// patch just because a restricted key is present. Instead, for each
// restricted key we only object if its value actually changed from what
// the task had before.
const ASSIGNEE_ALLOWED_FIELDS = new Set(["columnId", "version"]);

function valuesDiffer(a, b) {
  return String(a ?? "") !== String(b ?? "");
}

export function getAllTasks(userId) {
  return taskRepository.findAllForUser(userId);
}

export async function getTaskById(id) {
  const task = await taskRepository.findById(id);
  if (!task) throw new NotFoundError("Task");
  return task;
}

// Resolves an assigneeId into the {assigneeId, assignee} pair stored on
// the task, after checking the chosen person actually has access to the
// board (you can't assign a task to someone who isn't on the board).
async function resolveAssignee(board, assigneeId) {
  const user = await userRepository.findById(assigneeId);
  if (!user) throw new NotFoundError("User");

  const isOwner = board.owner.toString() === String(assigneeId);
  const isMember = board.members.some((m) => m.toString() === String(assigneeId));
  if (!isOwner && !isMember) {
    throw new ForbiddenError();
  }

  return { assigneeId: user.id, assignee: user.name };
}

export async function createTask(data, actorId) {
  // A task must belong to a real board — fail loudly here rather than
  // silently creating an orphaned task nothing can ever find.
  const board = await boardRepository.findById(data.boardId);
  if (!board) {
    throw new NotFoundError("Board");
  }

  // Only the board owner creates (and therefore assigns) tasks.
  boardService.assertOwner(board, actorId);

  const { assigneeId, assignee } = await resolveAssignee(board, data.assigneeId);

  const task = await taskRepository.create({ ...data, assigneeId, assignee });

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
  // the task to a different column (for the "moved" activity entry), and
  // so we can check who's allowed to make this particular change.
  const before = await taskRepository.findById(id);
  if (!before) throw new NotFoundError("Task");

  const board = await boardRepository.findById(before.boardId);
  if (!board) throw new NotFoundError("Board");

  const isOwner = board.owner.toString() === String(actorId);
  const isAssignee = before.assigneeId && before.assigneeId.toString() === String(actorId);

  if (!isOwner) {
    // Not the owner: only the assigned member may touch this task, and
    // only to move it between columns — everything else (title, due
    // date, description, re-assigning) is owner-only.
    if (!isAssignee) throw new ForbiddenError();
    const changedRestrictedField = Object.keys(patch).some(
      (field) => !ASSIGNEE_ALLOWED_FIELDS.has(field) && valuesDiffer(patch[field], before[field])
    );
    if (changedRestrictedField) throw new ForbiddenError();
  }

  let resolvedPatch = patch;
  if (patch.assigneeId) {
    const { assigneeId, assignee } = await resolveAssignee(board, patch.assigneeId);
    resolvedPatch = { ...patch, assigneeId, assignee };
  }

  const updated = await taskRepository.update(id, resolvedPatch);
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

  const board = await boardRepository.findById(task.boardId);
  if (board) boardService.assertOwner(board, actorId);

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
