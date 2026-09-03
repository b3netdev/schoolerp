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


router.use(authorizeRoles("admin"));

router.post("/add-routine", ClassRoutineController.create);
router.post("/update-routine/:id", ClassRoutineController.update);

router.delete("/delete-routine/:id", ClassRoutineController.delete);
router.patch("/restore-routine/:id", ClassRoutineController.restore);
router.delete("/hard-delete-routine/:id", ClassRoutineController.hardDelete);

export default router;