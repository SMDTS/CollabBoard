import * as invitationRepository from "../repositories/invitationRepository.js";
import * as boardRepository from "../repositories/boardRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import * as boardService from "./boardService.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/AppError.js";

function isOwner(board, userId) {
  return board.owner.toString() === String(userId);
}

function isMember(board, userId) {
  return isOwner(board, userId) || board.members.some((m) => m.toString() === String(userId));
}

// Owner sends an invite by email — this does NOT add the person to the
// board. It creates a pending invitation that shows up as a notification
// for them; they only actually join once they accept it.
export async function sendInvite(boardId, ownerId, email) {
  const board = await boardService.getBoardForAccess(boardId);
  boardService.assertOwner(board, ownerId);

  const user = await userRepository.findByEmail(email);
  if (!user) throw new NotFoundError("User with that email");

  if (isMember(board, user.id)) {
    throw new ConflictError("That person is already on this board");
  }

  const existing = await invitationRepository.findPendingForBoardAndUser(boardId, user.id);
  if (existing) {
    throw new ConflictError("That person already has a pending invite to this board");
  }

  return invitationRepository.create({ boardId, invitedById: ownerId, invitedUserId: user.id });
}

// Every pending invite addressed to this user — feeds the notification bell.
export async function listMine(userId) {
  return invitationRepository.findPendingForUser(userId);
}

// Pending invites a board owner has sent out for one board — lets the
// Team page show "invited" instead of offering to invite the same person twice.
export async function listForBoard(boardId, ownerId) {
  const board = await boardService.getBoardForAccess(boardId);
  boardService.assertOwner(board, ownerId);
  return invitationRepository.findPendingForBoard(boardId);
}

export async function respond(invitationId, userId, action) {
  const invitation = await invitationRepository.findById(invitationId);
  if (!invitation) throw new NotFoundError("Invitation");

  if (invitation.invitedUser.toString() !== String(userId)) {
    throw new ForbiddenError();
  }
  if (invitation.status !== "pending") {
    throw new ConflictError("This invitation has already been responded to");
  }

  if (action === "accept") {
    const boardId = invitation.board._id ?? invitation.board;
    await boardRepository.addMember(boardId, userId);
    return invitationRepository.setStatus(invitationId, "accepted");
  }
  return invitationRepository.setStatus(invitationId, "declined");
}
