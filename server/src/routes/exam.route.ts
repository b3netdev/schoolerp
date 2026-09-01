import express from "express";

import { ExamController } from "../controllers/exam.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isAuthenticated);

router.get("/get-exams", ExamController.getAll);
router.get("/get-exam/:id", ExamController.getOne);

router.post("/add-exam", ExamController.create);
router.post("/update-exam/:id", ExamController.update);

router.delete("/delete-exam/:id", ExamController.delete);
router.patch("/restore-exam/:id", ExamController.restore);
router.delete("/hard-delete-exam/:id", ExamController.hardDelete);

export default router;