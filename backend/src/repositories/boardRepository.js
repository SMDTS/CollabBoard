// src/repositories/boardRepository.js
import { boards, bumpBoardId } from "../data/boards.js";

export function findAll() {
  return boards;
}

export function findById(id) {
  return boards.find((b) => b.id === id);
}

export function create({ name, description }) {
  const board = { id: bumpBoardId(), name, description };
  boards.push(board);
  return board;
}

export function update(id, patch) {
  const board = findById(id);
  if (!board) return null;
  Object.assign(board, patch);
  return board;
}

export function remove(id) {
  const index = boards.findIndex((b) => b.id === id);
  if (index === -1) return false;
  boards.splice(index, 1);
  return true;
}
