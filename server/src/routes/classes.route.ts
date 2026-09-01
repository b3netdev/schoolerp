import express from "express";

import { ClassController } from "../controllers/class.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(isAuthenticated)

router.get("/get-classes", ClassController.getAll);

router.get(
  "/get-class/:id",
  ClassController.getOne,
);

router.post(
  "/add-class",
  ClassController.create,
);

router.post(
  "/update-class/:id",
  ClassController.update,
);

router.delete("/delete-class/:id", ClassController.delete);
router.patch("/restore-class/:id", ClassController.restore);
router.delete("/hard-delete-class/:id", ClassController.hardDelete);

router.patch(
  "/update-section/:classId/:sectionId",
  ClassController.updateSection,
);

router.delete(
  "/remove-section/:classId/:sectionId",
  ClassController.removeSection,
);

export default router;
