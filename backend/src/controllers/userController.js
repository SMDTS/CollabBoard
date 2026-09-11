import * as userService from "../services/userService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { uploadStream } from "../config/cloudinary.js";
import { BadRequestError } from "../utils/AppError.js";

export const listUsers = catchAsync(async (req, res) => {
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const results = await userService.searchUsers(req.query.q, req.user.id);
    return res.json(results);
  }
  const users = await userService.getAllUsers();
  res.json(users);
});

export const updateMyPreferences = catchAsync(async (req, res) => {
  const updated = await userService.updatePreferences(req.user.id, req.body);
  res.json(updated);
});

export const uploadAvatarFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError("No image file provided");
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    throw new BadRequestError("Cloudinary is not configured on the server. Please check environment variables.");
  }

  const result = await uploadStream(req.file.buffer);
  const updatedUser = await userService.updateAvatar(req.user.id, result.secure_url);
  res.json(updatedUser);
});

export const updateAvatarUrl = catchAsync(async (req, res) => {
  const { avatarUrl } = req.body;
  const updatedUser = await userService.updateAvatar(req.user.id, avatarUrl || null);
  res.json(updatedUser);
});
