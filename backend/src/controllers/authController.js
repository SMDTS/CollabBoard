import * as authService from "../services/authService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const me = catchAsync(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  res.json(user);
});

// Always returns 200 with a generic message, whether or not the email is
// registered — see authService's comment on why. The frontend shows the
// same "check your email" message either way.
export const forgotPassword = catchAsync(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  res.json({ message: "If that email is registered, a reset link has been sent." });
});

export const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.json({ message: "Password updated. You can now log in." });
});
