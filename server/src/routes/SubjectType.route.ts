import { Router } from "express";

import { SubjectTypeController } from "../controllers/SubjectType.controller.js";
import {isAuthenticated} from "../middlewares/auth.middleware.js"; 

const router = Router();

router.use(isAuthenticated);

router.get(
  "/get-subject-types",
  SubjectTypeController.getSubjectTypes,
);

router.get(
  "/get-subject-type/:id",
  SubjectTypeController.getSubjectType,
);

router.post(
  "/add-subject-type",
  SubjectTypeController.addSubjectType,
);

router.patch(
  "/update-subject-type/:id",
  SubjectTypeController.updateSubjectType,
);

router.delete(
  "/delete-subject-type/:id",
  SubjectTypeController.deleteSubjectType,
);

router.patch(
  "/restore-subject-type/:id",
  SubjectTypeController.restoreSubjectType,
);

router.delete(
  "/hard-delete-subject-type/:id",
  SubjectTypeController.hardDeleteSubjectType,
);

export default router;