import { Invitation } from "../models/Invitation.js";

export function findPendingForBoardAndUser(boardId, userId) {
  return Invitation.findOne({ board: boardId, invitedUser: userId, status: "pending" });
}

// Every pending invite this user currently has, across all boards —
// what the notification bell shows.
export function findPendingForUser(userId) {
  return Invitation.find({ invitedUser: userId, status: "pending" })
    .populate("board", "name")
    .populate("invitedBy", "name")
    .sort({ createdAt: -1 });
}

// Pending invites a board owner has already sent out — used so the
// Team page can show "invited" instead of offering to invite again.
export function findPendingForBoard(boardId) {
  return Invitation.find({ board: boardId, status: "pending" }).populate("invitedUser", "name email");
}

export function findById(id) {
  try {
    return Invitation.findById(id).populate("board", "name").populate("invitedBy", "name");
  } catch (err) {
    if (err.name === "CastError") return null;
    throw err;
  }
}

export function create({ boardId, invitedById, invitedUserId }) {
  return Invitation.create({ board: boardId, invitedBy: invitedById, invitedUser: invitedUserId });
}

export async function setStatus(id, status) {
  try {
    return await Invitation.findByIdAndUpdate(id, { status }, { new: true })
      .populate("board", "name")
      .populate("invitedBy", "name");
  } catch (err) {
    if (err.name === "CastError") return null;
    throw err;
  }
}
