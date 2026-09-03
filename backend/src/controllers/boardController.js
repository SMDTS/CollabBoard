import * as boardService from "../services/boardService.js";
import { catchAsync } from "../utils/catchAsync.js";

export const listBoards = catchAsync(async (req, res) => {
  const boards = await boardService.getAllBoards();
  res.json(boards);
});

export const getBoard = catchAsync(async (req, res) => {
  const board = await boardService.getBoardById(req.params.id);
  res.json(board);
});

export const createBoard = catchAsync(async (req, res) => {
  const board = await boardService.createBoard(req.body);
  res.status(201).json(board);
});