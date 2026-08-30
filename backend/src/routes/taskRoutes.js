// src/routes/taskRoutes.js
import { Router } from "express";
import * as taskController from "../controllers/taskController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../schemas/taskSchema.js";

const router = Router();

router.use(authenticate); // every route below requires a valid token

router.get("/", taskController.listTasks);
router.get("/:id", taskController.getTask);
router.post("/", validate(createTaskSchema), taskController.createTask);
router.patch("/:id", validate(updateTaskSchema), taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
