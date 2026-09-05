// src/services/userService.js
import * as userRepository from "../repositories/userRepository.js";

// Never send passwordHash to the client — same rule as authService's
// toPublicUser, duplicated here rather than shared since these two
// services may diverge (e.g. if user profiles grow admin-only fields).
function toPublic(u) {
  return { id: u.id, name: u.name, email: u.email };
}

export async function getAllUsers() {
  const users = await userRepository.findAll();
  return users.map(toPublic);
}

// Used by the Team page's "search someone to invite" box. Excludes the
// searcher themselves — you can't invite yourself.
export async function searchUsers(query, excludeUserId) {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const users = await userRepository.search(trimmed);
  return users.filter((u) => u.id !== String(excludeUserId)).map(toPublic);
}
