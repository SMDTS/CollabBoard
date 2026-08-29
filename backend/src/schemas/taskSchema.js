import { z } from "zod";

const STATUSES = ["To Do", "Doing", "Done"];

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  assignee: z.string().trim().min(1, "Assignee is required"),
  status: z.enum(STATUSES).default("To Do"),
  dueDate: z.string().trim().min(1).default("No date"),
});

export const updateTaskSchema = createTaskSchema.partial();