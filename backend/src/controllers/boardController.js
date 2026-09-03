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