// src/schemas/boardSchema.js
import { z } from "zod";

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(300).default(""),
});

export const updateBoardSchema = createBoardSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
});
