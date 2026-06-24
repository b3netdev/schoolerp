import express from "express";
import { createAdmin,adminLogin } from "../controllers/auth.controller.js";
const router = express.Router();

router.post("/create-admin",createAdmin)
router.post("/admin-login",adminLogin)

export default router
