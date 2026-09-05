// src/models/Invitation.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const STATUSES = ["pending", "accepted", "declined"];

const invitationSchema = new Schema(
  {
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invitedUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: STATUSES, default: "pending", index: true },
  },
  { timestamps: true }
);

// A person can only have one *pending* invite to a given board at a time —
// re-inviting after a decline (or once they leave) is fine, but stacking
// duplicate pending invites isn't.
invitationSchema.index(
  { board: 1, invitedUser: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

function transform(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  ret.boardId = ret.board?._id ? ret.board._id.toString() : ret.board?.toString?.();
  if (ret.board && typeof ret.board === "object" && ret.board.name) {
    ret.boardName = ret.board.name;
  }
  delete ret.board;
  ret.invitedById = ret.invitedBy?._id ? ret.invitedBy._id.toString() : ret.invitedBy?.toString?.();
  if (ret.invitedBy && typeof ret.invitedBy === "object" && ret.invitedBy.name) {
    ret.invitedByName = ret.invitedBy.name;
  }
  delete ret.invitedBy;
  ret.invitedUserId = ret.invitedUser?._id ? ret.invitedUser._id.toString() : ret.invitedUser?.toString?.();
  if (ret.invitedUser && typeof ret.invitedUser === "object" && ret.invitedUser.name) {
    ret.invitedUserName = ret.invitedUser.name;
    ret.invitedUserEmail = ret.invitedUser.email;
  }
  delete ret.invitedUser;
  return ret;
}

invitationSchema.set("toJSON", { transform });
invitationSchema.set("toObject", { transform });

export const Invitation = mongoose.model("Invitation", invitationSchema);
