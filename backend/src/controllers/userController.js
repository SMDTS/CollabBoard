// src/controllers/userController.js
import * as userService from "../services/userService.js";

export function listUsers(req, res) {
  res.json(userService.getAllUsers());
}
