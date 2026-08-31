import express from "express";
import {
  getAllSubjects,
  getSubjectById,
  getSubjectsByClassSectionId,
  createSubject,
  updateSubject,
  deleteSubject,
  restoreSubject,
  hardDeleteSubject,
} from "../controllers/subjects.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { withAcademicYearContext } from "../middlewares/academicYearContext.middleware.js";

const router = express.Router();

router.use(isAuthenticated, withAcademicYearContext);

router.get("/get-subjects", getAllSubjects);
router.get("/get-subject/:id", getSubjectById);
router.get(
  "/get-subjects-by-class-section/:classSectionId",
  getSubjectsByClassSectionId,
);

router.post("/add-subject", createSubject);
router.post("/update-subject/:id", updateSubject);

router.delete("/delete-subject/:id", deleteSubject);
router.post("/restore-subject/:id", restoreSubject);
router.delete("/permanent-delete-subject/:id", hardDeleteSubject);

export default router;