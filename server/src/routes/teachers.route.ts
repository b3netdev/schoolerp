import express from "express";
import { TeacherController } from "../controllers/teacher.controller.js";

const router = express.Router();

router.get("/get-teachers", TeacherController.findAll);
router.get("/get-teacher/:id", TeacherController.findById);
router.post("/add-teacher", TeacherController.create);
router.post("/update-teacher", TeacherController.update);
router.delete("/delete-teacher/:id", TeacherController.delete);

export default router;