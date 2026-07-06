
import express from "express";
import { ClassController } from "../controllers/class.controller.js";

const router = express.Router();

router.get("/get-classes", ClassController.findAll);
router.post("/add-class", ClassController.create);
router.post("/update-class", ClassController.update);
router.delete("/delete-class/:id", ClassController.delete);

export default router;