// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true, // adds createdAt/updatedAt automatically
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString(); // _id -> id, matching the shape the front end already expects
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // never send this to a client, under any circumstances
      },
    },
  }
);

export const User = mongoose.model("User", userSchema);
