// src/routes/notificationRoutes.js
import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.listMyNotifications);
router.post("/read-all", notificationController.markAllNotificationsRead);
router.post("/:id/read", notificationController.markNotificationRead);

export default router;
