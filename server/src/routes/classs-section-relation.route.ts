import express from "express";
import { ClassSectionRelationController } from "../controllers/class-section-relation.controller.js";

const router = express.Router();

router.get(
  "/get-class-section-relations",
  ClassSectionRelationController.getAll,
);

router.get("/get-class-section-relation/:id",ClassSectionRelationController.getById,);

router.post(
  "/add-class-section-relation",
  ClassSectionRelationController.create,
);

router.post(
  "/update-class-section-relation",
  ClassSectionRelationController.update,
);

router.delete(
  "/delete-class-section-relation/:id",
  ClassSectionRelationController.delete,
);

export default router;
