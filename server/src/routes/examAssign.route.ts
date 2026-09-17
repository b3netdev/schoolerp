import { Router } from "express";
import { ExamAssignController } from "../controllers/examAssign.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
const router = Router();


router.get("/", isAuthenticated, ExamAssignController.getAll);
router.get("/:id", isAuthenticated, ExamAssignController.getOne);

router.post("/", isAuthenticated, ExamAssignController.create);
router.patch("/:id", isAuthenticated, ExamAssignController.update);

router.delete("/:id", isAuthenticated, ExamAssignController.delete);
router.patch("/:id/restore", isAuthenticated, ExamAssignController.restore);

export default router;