// src/repositories/taskRepository.js
import { Task } from "../models/Task.js";
import { ConflictError } from "../utils/AppError.js";

export async function findAll() {
  return Task.find().sort({ createdAt: 1 });
}

export async function getStatsByBoardId(boardId) {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return Task.aggregate([
    { $match: { boardId } },
    {
      // dueDate is free text — nothing in the app enforces a format, so
      // this is unavoidably a best-effort parse. We try a couple of
      // common shapes in order and fall back to null ("no due date", not
      // overdue) for anything else, so a task never crashes the endpoint,
      // it just won't count toward overdueCount if we can't recognize it.
      //
      // Known limitation: a due date typed as "next Friday", "TBD",
      // "12/25" etc. still won't be recognized and will silently not
      // count as overdue. The only fully correct fix is turning dueDate
      // into a real Date field with an actual date picker on the
      // frontend — flagging that as a follow-up rather than solving it
      // here, since it touches the schema and the UI, not just this query.
      $set: {
        parsedDueDate: {
          $let: {
            vars: {
              // Catches ISO-style input, e.g. "2026-08-12".
              isoAttempt: {
                $dateFromString: { dateString: "$dueDate", onError: null, onNull: null },
              },
              // Catches "Aug 12" style (no year) by assuming this year.
              monthDayAttempt: {
                $dateFromString: {
                  dateString: { $concat: ["$dueDate", ` ${currentYear}`] },
                  format: "%b %d %Y",
                  onError: null,
                  onNull: null,
                  timezone: "UTC",
                },
              },
            },
            in: { $ifNull: ["$$isoAttempt", "$$monthDayAttempt"] },
          },
        },
      },
    },
    {
      $group: {
        _id: "$assignee",
        taskCount: { $sum: 1 },
        overdueCount: {
          $sum: {
            $cond: [
              { $and: [{ $ne: ["$parsedDueDate", null] }, { $lt: ["$parsedDueDate", today] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        assignee: "$_id",
        taskCount: 1,
        overdueCount: 1,
      },
    },
    { $sort: { assignee: 1 } },
  ]);
}

export async function findById(id) {
  try {
    return await Task.findById(id);
  } catch (err) {
    if (err.name === "CastError") return null; // malformed id -> service throws 404
    throw err;
  }
}

export async function create({ title, assignee, dueDate, description, boardId, columnId }) {
  return Task.create({ title, assignee, dueDate, description, boardId, columnId });
}

// patch must include `version` — the version the client last saw.
// - version matches  -> task updates, version increments, returns the doc
// - id doesn't exist  -> returns null (service throws NotFoundError, 404)
// - id exists but version is stale -> throws ConflictError (409)
export async function update(id, patch) {
  const { version, ...fields } = patch;

  let updated;
  try {
    // The {_id, version} filter + $inc is the whole trick: this update
    // can only succeed against the exact version the client last saw.
    // If someone else edited the task in between, version has already
    // moved on and this match fails.
    updated = await Task.findOneAndUpdate(
      { _id: id, version },
      { $set: fields, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
  } catch (err) {
    if (err.name === "CastError") return null; // malformed id -> 404
    throw err;
  }

  if (updated) return updated;

  // No document matched {_id, version} — figure out why, so we return
  // the right status code instead of guessing.
  const exists = await Task.exists({ _id: id });
  if (exists) {
    throw new ConflictError("Task was modified by someone else — reload and try again");
  }
  return null;
}

export async function remove(id) {
  try {
    const deleted = await Task.findByIdAndDelete(id);
    return Boolean(deleted);
  } catch (err) {
    if (err.name === "CastError") return false;
    throw err;
  }
}