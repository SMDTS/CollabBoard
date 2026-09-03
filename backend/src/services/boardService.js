import * as boardRepository from "../repositories/boardRepository.js";
import { NotFoundError } from "../utils/AppError.js";

export async function getAllBoards() {
  return boardRepository.findAll();
}

export async function getBoardById(id) {
  const board = await boardRepository.findById(id);
  if (!board) throw new NotFoundError("Board");
  return board;
}