import express from "express";
import {
  createAdmin,
  adminLogin,
  checkAuth,
  signOut,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create-admin", createAdmin);
router.post("/admin-login", adminLogin);
router.get("/check-auth", isAuthenticated, checkAuth);
router.post("/logout", signOut);
router.put("/update-profile", isAuthenticated, updateProfile);
router.post("/change-password", isAuthenticated, changePassword);

export default router;
