import express from "express";
import { StreamController } from "../controllers/stream.controller.js";

const router = express.Router();

router.get("/get-streams", StreamController.getAll);

router.get("/get-stream/:id", StreamController.getById);

router.post("/add-stream", StreamController.create);

router.post("/update-stream", StreamController.update);

router.delete("/delete-stream/:id", StreamController.delete);

router.delete("/hard-delete-stream/:id", StreamController.hardDelete);

export default router;