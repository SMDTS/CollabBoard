import { users, bumpUserId } from "../data/users.js";

export function findByEmail(email) {
  return users.find((u) => u.email === email);
}

export function findById(id) {
  return users.find((u) => u.id === id);
}

export function create({ name, email, passwordHash }) {
  const user = { id: bumpUserId(), name, email, passwordHash };
  users.push(user);
  return user;
}
