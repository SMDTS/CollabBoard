// src/services/activityService.js
import * as activityRepository from "../repositories/activityRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { sendEmail } from "../utils/emailService.js";
import * as notificationService from "./notificationService.js";

function resolveColumnName(board, colValue) {
  if (!colValue) return "Doing";
  const colStr = String(colValue);
  if (board && Array.isArray(board.columns)) {
    const found = board.columns.find(
      (c) =>
        (c._id?.toString?.() ?? c.id ?? "").toString() === colStr ||
        (c.id ?? "").toString() === colStr ||
        c.title === colValue
    );
    if (found) return found.title;
  }
  if (/^[0-9a-fA-F]{24}$/.test(colStr)) {
    return "Doing";
  }
  return colValue;
}

// Turns a stored activity doc into the sentence the Dashboard shows
// (e.g. "Sarah moved 'Build TaskCard component' to Doing"). Kept in the
// service layer, not the model, so the controller/frontend never needs
// to know the shape of `details` for each action type.
function toFeedItem(activity, boardDoc) {
  const actorName = activity.actor?.name ?? "Someone";
  const title = activity.taskTitle;
  const board = boardDoc || activity.board;

  let message;
  if (activity.action === "created") {
    message = `${actorName} created "${title}"`;
  } else if (activity.action === "moved") {
    const colTitle = resolveColumnName(board, activity.details?.to);
    message = `${actorName} moved "${title}" to ${colTitle}`;
  } else if (activity.action === "deleted") {
    message = `${actorName} deleted "${title}"`;
  } else {
    message = `${actorName} updated "${title}"`;
  }

  const boardId = board?._id ? board._id.toString() : (board?.id ?? board ?? activity.board);

  return {
    id: activity.id,
    action: activity.action,
    message,
    board: boardId,
    task: activity.task,
    actor: activity.actor ? { id: activity.actor.id, name: activity.actor.name } : null,
    createdAt: activity.createdAt,
  };
}

export async function getRecentActivity({ boardId, limit } = {}) {
  const activities = await activityRepository.findRecent({ boardId, limit });

  const unpopulatedBoardIds = [
    ...new Set(
      activities
        .filter((a) => a.board && typeof a.board !== "object")
        .map((a) => String(a.board))
    ),
  ];

  let boardMap = new Map();
  if (unpopulatedBoardIds.length > 0) {
    const fetchedBoards = await boardRepository.findByIds(unpopulatedBoardIds);
    boardMap = new Map(fetchedBoards.map((b) => [b.id, b]));
  }

  return activities.map((activity) => {
    const boardDoc =
      typeof activity.board === "object" && activity.board
        ? activity.board
        : boardMap.get(String(activity.board));
    return toFeedItem(activity, boardDoc);
  });
}

// Called from taskService (create/update/delete) — this is the "also
// create an activity entry" hook the milestone asks for. Not wrapped in
// try/catch here on purpose: if logging fails we want it to surface via
// the normal catchAsync -> errorHandler path, same as any other bug,
// rather than silently disappearing.
export async function logActivity({ action, actorId, boardId, taskId, taskTitle, details }) {
  const activity = await activityRepository.create({
    action,
    actor: actorId,
    board: boardId,
    task: taskId,
    taskTitle,
    details,
  });

  await notifyBoardMembers({ action, actorId, boardId, taskId, taskTitle, details });

  return activity;
}

// Every other member of the board (never the person who caused it) gets
// a bell notification unconditionally, and — separately — an email if
// they have "Notify me on board activity" turned on. Fire-and-forget:
// sendEmail never throws, so a notification failure can never be the
// reason a task create/move/delete fails.
async function notifyBoardMembers({ action, actorId, boardId, taskId, taskTitle, details }) {
  const board = await boardRepository.findById(boardId);
  if (!board) return; // board may have been deleted concurrently — nothing to notify

  const recipientIds = [board.owner, ...board.members]
    .map((id) => id.toString())
    .filter((id) => id !== String(actorId));
  if (recipientIds.length === 0) return;

  const [actor, recipients] = await Promise.all([
    userRepository.findById(actorId),
    userRepository.findByIds(recipientIds),
  ]);
  const actorName = actor?.name ?? "Someone";

  let message;
  if (action === "created") message = `${actorName} created "${taskTitle}"`;
  else if (action === "moved") {
    const colTitle = resolveColumnName(board, details?.to);
    message = `${actorName} moved "${taskTitle}" to ${colTitle}`;
  }
  else if (action === "deleted") message = `${actorName} deleted "${taskTitle}"`;
  else message = `${actorName} updated "${taskTitle}"`;

  // A deleted task no longer exists to link to — send people to the
  // board itself instead.
  const link = taskId && action !== "deleted" ? `/tasks/${taskId}` : `/boards/${boardId}`;

  await Promise.all(
    recipients.map((u) =>
      notificationService.notify({
        recipientId: u.id,
        type: "board_activity",
        message: `${message} on "${board.name}"`,
        link,
      })
    )
  );

  // Same reasoning as taskService's notifyAssignment: `!== false` so an
  // account predating the preferences field (undefined, not `false`)
  // still gets notified, matching the schema's own default of `true`.
  const toEmail = recipients.filter((u) => u.preferences?.notifyActivity !== false);
  await Promise.all(
    toEmail.map((u) =>
      sendEmail({
        to: u.email,
        subject: `Activity on "${board.name}"`,
        text: `Hi ${u.name},\n\n${message} on "${board.name}".\n\nOpen Flowty to see the board.`,
      })
    )
  );
}