// src/routes/activityRoutes.js
import { Router } from "express";
import * as activityController from "../controllers/activityController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

// Read-only, same as /api/users — activity entries are only ever created
// internally (from taskService), never posted directly by a client.
router.get("/", activityController.listActivity);

export default router;