import mongoose from "mongoose";
const { Schema } = mongoose;

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  assignee: { type: String },
  // Stored as free text (e.g. "Aug 12", "No date"), not a real Date —
  // this matches how the frontend reads/writes it (plain text input).
  dueDate: { type: String },
  description: { type: String },
  boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
  columnId: { type: Schema.Types.ObjectId, required: true, index: true },
  version: { type: Number, required: true, default: 0 },
}, { timestamps: true });

// Same transform as User.js / Board.js: _id -> id, drop __v, so the
// frontend (which reads task.id everywhere) gets the shape it expects.
function transform(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}
taskSchema.set("toJSON", { transform });
taskSchema.set("toObject", { transform });

export const Task = mongoose.model("Task", taskSchema);