// src/services/userService.js
import * as userRepository from "../repositories/userRepository.js";

// Never send passwordHash to the client — same rule as authService's
// toPublicUser, duplicated here rather than shared since these two
// services may diverge (e.g. if user profiles grow admin-only fields).
export function getAllUsers() {
  return userRepository.findAll().map((u) => ({ id: u.id, name: u.name, email: u.email }));
}
