import mongoose from "mongoose";

const { Schema } = mongoose;

const columnSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 60 },
    position: { type: Number, required: true },
  },
  { _id: true }
);

const boardSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    columns: {
      type: [columnSchema],
      default: () => [
        { title: "To Do", position: 0 },
        { title: "Doing", position: 1 },
        { title: "Done", position: 2 },
      ],
    },
    // The board owner: the only user who can invite/kick members, create
    // and assign tasks, and edit/delete the board itself.
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Everyone else with access to this board. Deliberately does NOT
    // include the owner — "does this user have access" is always
    // `isOwner || members.includes(userId)`.
    members: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
  },
  { timestamps: true }
);

function transform(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  if (Array.isArray(ret.columns)) {
    ret.columns = ret.columns.map((col) => {
      const { _id, ...rest } = col;
      return { id: _id?.toString?.() ?? _id, ...rest };
    });
  }
  ret.ownerId = ret.owner?.toString?.() ?? ret.owner;
  delete ret.owner;
  ret.memberIds = Array.isArray(ret.members) ? ret.members.map((m) => m.toString?.() ?? m) : [];
  delete ret.members;
  return ret;
}

boardSchema.set("toJSON", { transform });
boardSchema.set("toObject", { transform });

export const Board = mongoose.model("Board", boardSchema);