import mongoose from "mongoose";

const { Schema } = mongoose;

const columnSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 60 },
    position: { type: Number, required: true },
  },
  { _id: true }
);