import { Router } from "express";

import { StudentAttendanceController } from "../controllers/studentAttendance.controller.js";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(isAuthenticated);
router.use(authorizeRoles("admin", "teacher"));

router.post(
  "/submit-attendence",
  StudentAttendanceController.bulkSave,
);

router.get(
  "/class/:classSectionId",
  StudentAttendanceController.getClassAttendance,
);

router.get(
  "/student/:studentId",
  StudentAttendanceController.getStudentAttendance,
);

router.delete(
  "/class/:classSectionId",
  StudentAttendanceController.deleteClassAttendance,
);

export default router;
