// src/services/activityService.js
import * as activityRepository from "../repositories/activityRepository.js";

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
  return activityRepository.create({
    action,
    actor: actorId,
    board: boardId,
    task: taskId,
    taskTitle,
    details,
  });
}