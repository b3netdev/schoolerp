import express from "express";

import { ClassRoutineController } from "../controllers/classRoutine.controller.js";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";

const router = express.Router();


router.use(isAuthenticated);


router.get("/get-routines", ClassRoutineController.getAll);
router.get("/get-routine/:id", ClassRoutineController.getOne);




router.post("/add-routine",authorizeRoles("admin"), ClassRoutineController.create);
router.post("/update-routine/:id",authorizeRoles("admin"), ClassRoutineController.update);

router.delete("/delete-routine/:id",authorizeRoles("admin"), ClassRoutineController.delete);
router.patch("/restore-routine/:id",authorizeRoles("admin"), ClassRoutineController.restore);
router.delete("/hard-delete-routine/:id",authorizeRoles("admin"), ClassRoutineController.hardDelete);
router.get(
  "/assigned-routine",
  authorizeRoles("teacher"),
  ClassRoutineController.getMyAssignedRoutine
);

export default router;