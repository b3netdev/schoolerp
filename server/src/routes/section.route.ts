import express from "express";
import { SectionController } from "../controllers/section.controller.js";
const router = express.Router();

router.get('/get-sections', SectionController.findAll)
router.post('/add-section',SectionController.create)
router.post("/update-section",SectionController.update)

export default router