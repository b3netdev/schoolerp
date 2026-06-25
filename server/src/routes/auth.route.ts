import express from "express";
import {
  createAdmin,
  adminLogin,
  checkAuth,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create-admin", createAdmin);
router.post("/admin-login", adminLogin);
router.post("/check-auth", isAuthenticated, checkAuth);

export default router;
