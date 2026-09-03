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
  },
  { timestamps: true }
);