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

export function create({ name, email, passwordHash }) {
  return User.create({ name, email, passwordHash });
}
