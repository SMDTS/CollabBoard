// src/routes/userRoutes.js
import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { updatePreferencesSchema } from "../schemas/userSchema.js";

const router = Router();

router.use(authenticate);

// Read-only on purpose — users are created via POST /api/auth/register,
// not through this resource. This is just "who's on the team."
router.get("/", userController.listUsers);

router.patch("/me/preferences", validate(updatePreferencesSchema), userController.updateMyPreferences);

export default router;
