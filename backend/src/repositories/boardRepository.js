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

export async function update(id, patch) {
  try {
    return await Board.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });
  } catch (err) {
    if (err.name === "CastError") return null;
    throw err;
  }
}

export async function remove(id) {
  try {
    const deleted = await Board.findByIdAndDelete(id);
    return Boolean(deleted);
  } catch (err) {
    if (err.name === "CastError") return false;
    throw err;
  }
}