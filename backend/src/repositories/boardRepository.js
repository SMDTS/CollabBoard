import { Board } from "../models/Board.js";

export async function findAll() {
  return Board.find().sort({ createdAt: 1 });
}

export async function findById(id) {
  try {
    return await Board.findById(id);
  } catch (err) {
    if (err.name === "CastError") return null;
    throw err;
  }
}

export async function create({ name, description }) {
  return Board.create({ name, description });
}