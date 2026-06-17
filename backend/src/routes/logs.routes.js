import { Router } from "express";
import { logController } from "../controllers/logController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
// Any authenticated user may record an audit event; listing is scoped by permission inside the controller.
router.post("/", logController.create);
router.get("/", logController.list);
export default router;
