import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router();
router.use(authenticate, requirePermission(PERMISSIONS.USERS_MANAGE));
router.get("/", userController.list);
router.post("/", userController.create);
router.patch("/:id", userController.update);
router.delete("/:id", userController.remove);
export default router;
