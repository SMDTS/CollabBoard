// src/services/activityService.js
import * as activityRepository from "../repositories/activityRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { sendEmail } from "../utils/emailService.js";
import * as notificationService from "./notificationService.js";

// Turns a stored activity doc into the sentence the Dashboard shows
// (e.g. "Sarah moved 'Build TaskCard component' to Doing"). Kept in the
// service layer, not the model, so the controller/frontend never needs
// to know the shape of `details` for each action type.
function toFeedItem(activity) {
  const actorName = activity.actor?.name ?? "Someone";
  const title = activity.taskTitle;

  let message;
  if (activity.action === "created") {
    message = `${actorName} created "${title}"`;
  } else if (activity.action === "moved") {
    message = `${actorName} moved "${title}" to ${activity.details?.to ?? "a new column"}`;
  } else if (activity.action === "deleted") {
    message = `${actorName} deleted "${title}"`;
  } else {
    message = `${actorName} updated "${title}"`;
  }

  return {
    id: activity.id,
    action: activity.action,
    message,
    board: activity.board,
    task: activity.task,
    actor: activity.actor ? { id: activity.actor.id, name: activity.actor.name } : null,
    createdAt: activity.createdAt,
  };
}

export async function getRecentActivity({ boardId, limit } = {}) {
  const activities = await activityRepository.findRecent({ boardId, limit });
  return activities.map(toFeedItem);
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
  else if (action === "moved") message = `${actorName} moved "${taskTitle}" to ${details?.to ?? "a new column"}`;
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