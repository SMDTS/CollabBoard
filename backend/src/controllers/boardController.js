import * as boardService from "../services/boardService.js";
import * as invitationService from "../services/invitationService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const listBoards = catchAsync(async (req, res) => {
  const boards = await boardService.getAllBoards(req.user.id);
  res.json(boards);
});

export const getBoard = catchAsync(async (req, res) => {
  const board = await boardService.getBoardById(req.params.id, req.user.id);
  res.json(board);
});

export const getBoardStats = catchAsync(async (req, res) => {
  const stats = await boardService.getBoardStats(req.params.id, req.user.id);
  res.json(stats);
});

export const createBoard = catchAsync(async (req, res) => {
  const board = await boardService.createBoard(req.body, req.user.id);
  res.status(201).json(board);
});

export const updateBoard = catchAsync(async (req, res) => {
  const board = await boardService.updateBoard(req.params.id, req.body, req.user.id);
  res.json(board);
});

export const deleteBoard = catchAsync(async (req, res) => {
  await boardService.deleteBoard(req.params.id, req.user.id);
  res.status(204).end();
});

export const listMembers = catchAsync(async (req, res) => {
  const members = await boardService.getMembers(req.params.id, req.user.id);
  res.json(members);
});

// Sends a pending invite (does not add the person directly — they must
// accept it from their notifications).
export const inviteMember = catchAsync(async (req, res) => {
  const invitation = await invitationService.sendInvite(req.params.id, req.user.id, req.body.email);
  res.status(201).json(invitation);
});

// Pending invites this board's owner has already sent, so the UI can
// show "invited" instead of offering to invite the same person again.
export const listPendingInvitations = catchAsync(async (req, res) => {
  const invitations = await invitationService.listForBoard(req.params.id, req.user.id);
  res.json(invitations);
});

export const kickMember = catchAsync(async (req, res) => {
  const members = await boardService.kickMember(req.params.id, req.user.id, req.params.userId);
  res.json(members);
});
