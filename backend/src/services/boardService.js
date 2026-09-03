import * as boardRepository from "../repositories/boardRepository.js";
import { NotFoundError } from "../utils/AppError.js";

export async function getAllBoards() {
  return boardRepository.findAll();
}