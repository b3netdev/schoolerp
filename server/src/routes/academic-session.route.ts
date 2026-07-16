import express from "express";
import { AcademicSessionController } from "../controllers/AcademicSession.controller.js";

const router = express.Router();

router.get("/get-academic-sessions", AcademicSessionController.findAll);
router.post("/add-academic-session", AcademicSessionController.create);
router.post("/update-academic-session", AcademicSessionController.update);
router.delete("/delete-academic-session/:id", AcademicSessionController.delete);

export default router;