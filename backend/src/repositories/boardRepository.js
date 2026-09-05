import { Board } from "../models/Board.js";

// Only boards where the user is the owner or an invited member — this is
// the access-control boundary for "which boards can this user even see".
export async function findAllForUser(userId) {
  return Board.find({ $or: [{ owner: userId }, { members: userId }] }).sort({ createdAt: 1 });
}

export async function findById(id) {
  try {
    return await Board.findById(id);
  } catch (err) {
    if (err.name === "CastError") return null;
    throw err;
  }
}

export async function create({ name, description, ownerId }) {
  return Board.create({ name, description, owner: ownerId, members: [] });
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

// $addToSet: adding an existing member again is a no-op at the DB level;
// the service layer checks first so it can tell the caller "already a member".
export async function addMember(boardId, userId) {
  return Board.findByIdAndUpdate(boardId, { $addToSet: { members: userId } }, { new: true });
}

export async function removeMember(boardId, userId) {
  return Board.findByIdAndUpdate(boardId, { $pull: { members: userId } }, { new: true });
}
