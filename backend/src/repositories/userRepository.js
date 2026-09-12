// src/repositories/userRepository.js
import { User } from "../models/User.js";

// Same 4 function names/signatures as the in-memory version — nothing
// above this layer (authService, userService) needed to change at all.

export function findByEmail(email) {
  return User.findOne({ email });
}

export function findAll() {
  return User.find();
}

export function findById(id) {
  return User.findById(id);
}

export function findByIds(ids) {
  return User.find({ _id: { $in: ids } });
}

// Case-insensitive match on name OR email, for the Team page's
// "search someone to invite" box. Capped so a broad query (e.g. "a")
// can't return the entire user table.
export function search(query, { limit = 8 } = {}) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  return User.find({ $or: [{ name: regex }, { email: regex }] }).limit(limit);
}

export function create({ name, email, passwordHash }) {
  return User.create({ name, email, passwordHash });
}

// --- password reset -----------------------------------------------------

export function setPasswordResetToken(userId, tokenHash, expires) {
  return User.findByIdAndUpdate(userId, {
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: expires,
  });
}

// passwordResetTokenHash/Expires are `select: false` on the model, so a
// normal query wouldn't return them — explicitly select them back in,
// since this is the one place that actually needs to check them.
export function findByValidResetToken(tokenHash) {
  return User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");
}

export function resetPassword(userId, passwordHash) {
  return User.findByIdAndUpdate(userId, {
    passwordHash,
    $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1 },
  });
}

// --- notification preferences --------------------------------------------

export function updatePreferences(userId, patch) {
  const set = {};
  for (const key of ["notifyAssigned", "notifyActivity", "notifyWeekly"]) {
    if (typeof patch[key] === "boolean") set[`preferences.${key}`] = patch[key];
  }
  return User.findByIdAndUpdate(userId, { $set: set }, { new: true });
}

export function updateAvatar(userId, avatarUrl) {
  return User.findByIdAndUpdate(userId, { avatarUrl }, { new: true });
}
