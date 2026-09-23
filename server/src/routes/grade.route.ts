import { Router } from "express";



import {
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import {
  addGradesBulk,
  deleteGrade,
  getGrades,
  hardDeleteGrade,
  restoreGrade,
  updateGrade,
} from "../controllers/grade.controller.js";

const router = Router();

router.use(isAuthenticated);

router.get(
  "/get-grades",
  getGrades,
);

router.post(
  "/add-grades-bulk",
  addGradesBulk,
);

router.patch(
  "/update-grade/:id",
  updateGrade,
);

router.delete(
  "/delete-grade/:id",
  deleteGrade,
);

router.patch(
  "/restore-grade/:id",
  restoreGrade,
);

router.delete(
  "/hard-delete-grade/:id",
  hardDeleteGrade,
);

export default router;