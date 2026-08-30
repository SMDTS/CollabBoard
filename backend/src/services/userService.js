// src/services/userService.js
import * as userRepository from "../repositories/userRepository.js";

export function getAllUsers() {
  return userRepository.findAll().map((u) => ({ id: u.id, name: u.name, email: u.email }));
}
