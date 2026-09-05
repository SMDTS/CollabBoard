// src/schemas/taskSchema.js
import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  // The assignee is now picked from the board's members (a real user),
  // not typed in as free text — the server resolves this id to a
  // display name and stores both.
  assigneeId: objectId,
  dueDate: z.string().trim().min(1).default("No date"),
  description: z.string().trim().max(2000).default(""),
  boardId: objectId,
  columnId: objectId,
});

// All fields optional for PATCH, EXCEPT `version` — the client must
// always say which version it last saw, so we can detect if someone
// else edited the task first (optimistic concurrency).
export const updateTaskSchema = createTaskSchema.partial().extend({
  version: z.number().int().min(0, "version is required"),
});
