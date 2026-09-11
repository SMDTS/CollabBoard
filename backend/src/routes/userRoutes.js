import { Router } from "express";
import multer from "multer";
import * as userController from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { updatePreferencesSchema } from "../schemas/userSchema.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const router = Router();

router.use(authenticate);

router.get("/", userController.listUsers);
router.patch("/me/preferences", validate(updatePreferencesSchema), userController.updateMyPreferences);
router.post("/me/avatar", upload.single("avatar"), userController.uploadAvatarFile);
router.patch("/me/avatar", userController.updateAvatarUrl);

export default router;
