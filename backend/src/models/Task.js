import mongoose from "mongoose";
const { Schema } = mongoose;

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  assignee: { type: String },
  dueDate: { type: Date },
  description: { type: String },
  boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
  columnId: { type: Schema.Types.ObjectId, required: true, index: true },
  version: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export const Task = mongoose.model("Task", taskSchema);