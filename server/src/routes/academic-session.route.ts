import express from "express";
import { AcademicSessionController } from "../controllers/AcademicSession.controller.js";

const router = express.Router();

router.get("/get-academic-sessions", AcademicSessionController.findAll);
router.post("/add-academic-session", AcademicSessionController.create);
router.put("/update-academic-session/:id", AcademicSessionController.update);
router.delete("/delete-academic-session/:id", AcademicSessionController.delete);
router.patch("/restore-academic-session/:id", AcademicSessionController.restore);
router.delete("/permanent-delete-academic-session/:id", AcademicSessionController.permanentDelete);

export default router;