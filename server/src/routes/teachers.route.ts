import express from "express";
import {
  TeacherController,
  uploadTeacherBulkFile,
} from "../controllers/teacher.controller.js";
import {
  isAuthenticated,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", TeacherController.login);
router.use(isAuthenticated);
router.get("/get-teachers", TeacherController.findAll);
router.get("/get-teacher/:id", TeacherController.findById);
router.post("/add-teacher", TeacherController.create);
router.post("/update-teacher", TeacherController.update);
router.delete("/delete-teacher/:id", TeacherController.delete);
router.post("/restore-teacher/:id", TeacherController.restore);
router.get(
  "/check-teacher-auth",
  TeacherController.checkTeacherAuth,
);
router.delete(
  "/permanent-delete-teacher/:id",
  TeacherController.permanentDelete,
);
router.post(
  "/bulk-upload",
  authorizeRoles("admin"),
  uploadTeacherBulkFile,
  TeacherController.bulkUpload,
);

//Teachers auth routes

export default router;
