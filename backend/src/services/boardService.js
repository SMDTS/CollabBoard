import * as boardRepository from "../repositories/boardRepository.js";
import * as taskRepository from "../repositories/taskRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { NotFoundError, ForbiddenError } from "../utils/AppError.js";

function isOwner(board, userId) {
  return board.owner.toString() === String(userId);
}

function isMember(board, userId) {
  return isOwner(board, userId) || board.members.some((m) => m.toString() === String(userId));
}

// Exported so taskService can reuse the same access checks without
// duplicating the "owner or member" logic.
export async function getBoardForAccess(boardId) {
  const board = await boardRepository.findById(boardId);
  if (!board) throw new NotFoundError("Board");
  return board;
}

export function assertMember(board, userId) {
  if (!isMember(board, userId)) throw new ForbiddenError();
}

export function assertOwner(board, userId) {
  if (!isOwner(board, userId)) throw new ForbiddenError();
}

export async function getAllBoards(userId) {
  return boardRepository.findAllForUser(userId);
}

export async function getBoardById(id, userId) {
  const board = await getBoardForAccess(id);
  assertMember(board, userId);
  return board;
}

export async function getBoardStats(id, userId) {
  const board = await getBoardForAccess(id);
  assertMember(board, userId);
  return taskRepository.getStatsByBoardId(board._id);
}

export async function createBoard(data, ownerId) {
  return boardRepository.create({ ...data, ownerId });
}

export async function updateBoard(id, patch, userId) {
  const board = await getBoardForAccess(id);
  assertOwner(board, userId);
  const updated = await boardRepository.update(id, patch);
  if (!updated) throw new NotFoundError("Board");
  return updated;
}

export async function deleteBoard(id, userId) {
  const board = await getBoardForAccess(id);
  assertOwner(board, userId);
  const deleted = await boardRepository.remove(id);
  if (!deleted) throw new NotFoundError("Board");
}

// Members list, owner first, with names/emails resolved for display —
// this is what the Team page renders for a selected board.
export async function getMembers(id, userId) {
  const board = await getBoardForAccess(id);
  assertMember(board, userId);

  const memberIds = board.members.map((m) => m.toString());
  const users = await userRepository.findByIds([board.owner.toString(), ...memberIds]);
  const byId = new Map(users.map((u) => [u.id, u]));

  const owner = byId.get(board.owner.toString());
  const members = memberIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name, email: u.email, role: "member" }));

  return [{ id: owner.id, name: owner.name, email: owner.email, role: "owner" }, ...members];
}

// Board membership invites are handled by invitationService now (an invite
// creates a pending Invitation the person must accept — see sendInvite there).
// This module keeps kickMember, since removing an existing member doesn't
// involve the invite flow at all.

export async function kickMember(id, requesterId, memberId) {
  const board = await getBoardForAccess(id);
  assertOwner(board, requesterId);

  if (isOwner(board, memberId)) {
    throw new ForbiddenError();
  }

  await boardRepository.removeMember(id, memberId);
  return getMembers(id, requesterId);
}
