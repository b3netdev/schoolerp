import express from "express";
import {
  studentLogin,
  studentRefresh,
  studentLogout,
  studentCheckAuth,
} from "../controllers/student-auth.controller.js";
import { isStudentAuthenticated } from "../middlewares/studentAuth.middleware.js";

const router = express.Router();

router.post("/login", studentLogin);
router.post("/refresh", studentRefresh);
router.post("/logout", studentLogout);
router.get("/check-auth", isStudentAuthenticated, studentCheckAuth);

export default router;
