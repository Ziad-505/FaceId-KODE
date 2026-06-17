import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import logsRoutes from "./logs.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();
router.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/logs", logsRoutes);
router.use("/dashboard", dashboardRoutes);
export default router;
