// src/schemas/userSchema.js
import { z } from "zod";

export const updatePreferencesSchema = z.object({
  notifyAssigned: z.boolean().optional(),
  notifyActivity: z.boolean().optional(),
  notifyWeekly: z.boolean().optional(),
});
