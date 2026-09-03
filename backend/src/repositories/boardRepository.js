import { Board } from "../models/Board.js";

export async function findAll() {
  return Board.find().sort({ createdAt: 1 });
}
