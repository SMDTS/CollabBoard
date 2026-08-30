// src/routes/boardRoutes.js
import { Router } from "express";
import * as boardController from "../controllers/boardController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createBoardSchema, updateBoardSchema } from "../schemas/boardSchema.js";

const router = Router();

router.use(authenticate); // every route below requires a valid token

router.get("/", boardController.listBoards);
router.get("/:id", boardController.getBoard);
router.post("/", validate(createBoardSchema), boardController.createBoard);
router.patch("/:id", validate(updateBoardSchema), boardController.updateBoard);
router.delete("/:id", boardController.deleteBoard);

export default router;
