import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { PERMISSIONS } from "../config/permissions.js";

const router = Router();
router.use(authenticate, requirePermission(PERMISSIONS.DASHBOARD_VIEW));
router.get("/summary", dashboardController.summary);
router.get("/timeseries", dashboardController.timeseries);
router.get("/breakdown", dashboardController.breakdown);
export default router;
