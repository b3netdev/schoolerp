import { Router } from "express";
import {
  addGrade,
  deleteGrade,
  getGradeById,
  getGrades,
  updateGrade,
} from "../controllers/grade.controller.js";

const router = Router();

router.get("/get-grades", getGrades);
router.get("/get-grade/:id", getGradeById);
router.post("/add-grade", addGrade);
router.patch("/update-grade/:id", updateGrade);
router.delete("/delete-grade/:id", deleteGrade);

export default router;