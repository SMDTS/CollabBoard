// src/controllers/userController.js
import * as userService from "../services/userService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const listUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
});
