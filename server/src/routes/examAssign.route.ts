import { Router } from "express";
import { protect } from "../controllers/auth.controller.js";
import { ExamAssignController } from "../controllers/examAssign.controller.js";

const router = Router();


router.get("/", protect, ExamAssignController.getAll);
router.get("/:id", protect, ExamAssignController.getOne);

router.post("/", protect, ExamAssignController.create);
router.patch("/:id", protect, ExamAssignController.update);

router.delete("/:id", protect, ExamAssignController.delete);
router.patch("/:id/restore", protect, ExamAssignController.restore);

export default router;