import * as invitationService from "../services/invitationService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ValidationError } from "../utils/AppError.js";

// Pending invites addressed to me — what the notification bell polls.
export const listMyInvitations = catchAsync(async (req, res) => {
  const invitations = await invitationService.listMine(req.user.id);
  res.json(invitations);
});

export const respondToInvitation = catchAsync(async (req, res) => {
  const { action } = req.body;
  if (action !== "accept" && action !== "decline") {
    throw new ValidationError([{ path: "action", message: "action must be 'accept' or 'decline'" }]);
  }
  const invitation = await invitationService.respond(req.params.id, req.user.id, action);
  res.json(invitation);
});
