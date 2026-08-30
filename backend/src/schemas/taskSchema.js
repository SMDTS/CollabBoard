// src/schemas/taskSchema.js
import { z } from "zod";

const STATUSES = ["To Do", "Doing", "Done"];

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  assignee: z.string().trim().min(1, "Assignee is required"),
  status: z.enum(STATUSES).default("To Do"),
  dueDate: z.string().trim().min(1).default("No date"),
  description: z.string().trim().max(2000).default(""),
  boardId: z.number().int().positive("boardId is required"),
});

// All fields optional for PATCH — but if present, still validated.
export const updateTaskSchema = createTaskSchema.partial();
