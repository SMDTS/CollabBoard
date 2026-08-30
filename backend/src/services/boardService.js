// src/services/boardService.js
import * as boardRepository from "../repositories/boardRepository.js";
import { NotFoundError } from "../utils/AppError.js";

export function getAllBoards() {
  return boardRepository.findAll();
}

export function getBoardById(id) {
  const board = boardRepository.findById(id);
  if (!board) throw new NotFoundError("Board");
  return board;
}

export function createBoard(data) {
  return boardRepository.create(data);
}

export function updateBoard(id, patch) {
  const updated = boardRepository.update(id, patch);
  if (!updated) throw new NotFoundError("Board");
  return updated;
}

export function deleteBoard(id) {
  const deleted = boardRepository.remove(id);
  if (!deleted) throw new NotFoundError("Board");
}
