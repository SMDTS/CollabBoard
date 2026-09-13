// src/models/Activity.js
import mongoose from "mongoose";

const { Schema } = mongoose;

// "created" / "moved" / "deleted" today — add more here if the team wants
// richer feed events later (e.g. "commented", "assigned").
const ACTIONS = ["created", "moved", "deleted"];

const activitySchema = new Schema(
  {
    action: { type: String, enum: ACTIONS, required: true },

    // Who did it. Users is already a real Mongo collection, so this is a
    // proper ref and can be populated for a display name.
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Which board it happened on.
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    task: { type: Schema.Types.Mixed, required: false },

    // Denormalized snapshot of the task's title at the time of the event.
    // Needed because a "deleted" activity must still be readable after
    // the task itself is gone, and because `task` isn't a reliable ref yet.
    taskTitle: { type: String, required: true, trim: true },

    // Freeform extra context for the event — e.g. { from: "To Do", to: "Doing" }
    // for a "moved" action. Optional, shape depends on `action`.
    details: { type: Schema.Types.Mixed, default: undefined },
  },
  {
    timestamps: true, // createdAt is what the feed sorts/displays by
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Feed queries are always "most recent first, optionally for one board" —
// index supports both `find({ board }).sort({ createdAt: -1 })` and the
// unfiltered global feed.
activitySchema.index({ board: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model("Activity", activitySchema);