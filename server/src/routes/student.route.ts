import express from "express";
import { StudentController, uploadStudentBulkFile } from "../controllers/student.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { withAcademicYearContext } from "../middlewares/academicYearContext.middleware.js";
import { authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Optional class/section assignment on create touches student_class_relation,
// which is academic-year scoped, so every route here needs the trusted
// academic year resolved from the admin's JWT.
router.use(isAuthenticated, withAcademicYearContext);

router.get("/get-students", StudentController.findAll);
router.get("/get-student/:id", StudentController.findById);
router.post("/add-student", StudentController.create);
router.post("/update-student", StudentController.update);
router.delete("/delete-student/:id", StudentController.delete);
router.post("/restore-student/:id", StudentController.restore);
router.delete("/permanent-delete-student/:id", StudentController.permanentDelete);
router.post(
  "/bulk-upload",
  authorizeRoles("admin"),
  uploadStudentBulkFile,
  StudentController.bulkUpload,
);

export default router;
