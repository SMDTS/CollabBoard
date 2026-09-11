// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Forgot-password flow: a hashed, single-use, time-limited token.
    // We store a hash (not the raw token) for the same reason passwords
    // are hashed — if the database ever leaked, the raw tokens (which are
    // valid to reset a password with zero other proof of identity)
    // shouldn't leak with it.
    avatarUrl: { type: String, default: null },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    preferences: {
      notifyAssigned: { type: Boolean, default: true }, // "Email me when I'm assigned a task"
      notifyActivity: { type: Boolean, default: true }, // "Notify me on board activity"
      notifyWeekly: { type: Boolean, default: false }, // "Send a weekly summary email"
    },
  },
  {
    timestamps: true, // adds createdAt/updatedAt automatically
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString(); // _id -> id, matching the shape the front end already expects
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // never send this to a client, under any circumstances
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
      },
    },
  }
);

export const User = mongoose.model("User", userSchema);
