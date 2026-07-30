import express from "express";
import { StudentClassRelationController } from "../controllers/student-class-relation.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { withAcademicYearContext } from "../middlewares/academicYearContext.middleware.js";

const router = express.Router();

// student_class_relation.academic_year_id is NOT NULL, so every route here
// needs the trusted academic year resolved from the JWT before it can touch
// the query builder.
router.use(isAuthenticated, withAcademicYearContext);

router.get("/get-student-class-relations", StudentClassRelationController.getAll);
router.get("/get-student-class-relation/:id", StudentClassRelationController.getById);
router.post("/add-student-class-relation", StudentClassRelationController.create);
router.post("/update-student-class-relation", StudentClassRelationController.update);
router.delete("/delete-student-class-relation/:id", StudentClassRelationController.delete);
router.patch("/restore-student-class-relation/:id", StudentClassRelationController.restore);
router.delete(
  "/hard-delete-student-class-relation/:id",
  StudentClassRelationController.hardDelete,
);

export default router;
