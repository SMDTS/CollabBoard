// src/models/Notification.js
import mongoose from "mongoose";

const { Schema } = mongoose;

// Board invitations deliberately stay OUT of this collection — they
// already have their own accept/decline flow via the Invitation model,
// and the bell renders those separately. This collection is for the
// simpler "FYI" notifications: something happened, here's a link to it.
const TYPES = ["task_assigned", "board_activity"];

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: TYPES, required: true },
    message: { type: String, required: true, trim: true },
    // Where clicking the notification should take you — a relative
    // frontend path, e.g. "/tasks/<id>" or "/boards/<id>".
    link: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.recipient; // implicit — always "me", no need to send it back
      },
    },
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
