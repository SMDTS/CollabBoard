// src/routes/userRoutes.js
import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

// Read-only on purpose — users are created via POST /api/auth/register,
// not through this resource. This is just "who's on the team."
router.get("/", userController.listUsers);

export default router;
