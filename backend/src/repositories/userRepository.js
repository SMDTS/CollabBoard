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
