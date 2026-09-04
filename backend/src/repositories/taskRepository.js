// src/repositories/taskRepository.js
import { Task } from "../models/Task.js";
import { ConflictError } from "../utils/AppError.js";

export async function findAll() {
  return Task.find().sort({ createdAt: 1 });
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