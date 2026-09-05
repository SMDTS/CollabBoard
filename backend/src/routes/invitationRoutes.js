// src/routes/invitationRoutes.js
import { Router } from "express";
import * as invitationController from "../controllers/invitationController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/", invitationController.listMyInvitations);
router.post("/:id/respond", invitationController.respondToInvitation);

export default router;
