// src/controllers/boardController.js
import * as boardService from "../services/boardService.js";

export function listBoards(req, res) {
  res.json(boardService.getAllBoards());
}

export function getBoard(req, res) {
  const board = boardService.getBoardById(Number(req.params.id));
  res.json(board);
}

export function createBoard(req, res) {
  const board = boardService.createBoard(req.body);
  res.status(201).json(board);
}

export function updateBoard(req, res) {
  const board = boardService.updateBoard(Number(req.params.id), req.body);
  res.json(board);
}

export function deleteBoard(req, res) {
  boardService.deleteBoard(Number(req.params.id));
  res.status(204).end();
}
