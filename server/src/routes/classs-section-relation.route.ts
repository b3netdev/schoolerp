import express from "express";
import { ClassSectionRelationController } from "../controllers/class-section-relation.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { withAcademicYearContext } from "../middlewares/academicYearContext.middleware.js";

const router = express.Router();


router.use(isAuthenticated, withAcademicYearContext);

router.get(
  "/get-class-section-relations",
  ClassSectionRelationController.getAll,
);

router.get("/get-class-section-relation/:id", ClassSectionRelationController.getById);

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

router.patch(
  "/restore-class-section-relation/:id",
  ClassSectionRelationController.restore,
);

router.delete(
  "/hard-delete-class-section-relation/:id",
  ClassSectionRelationController.hardDelete,
);

export default router;
