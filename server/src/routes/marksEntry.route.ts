import { Router } from "express";

import { MarksEntryController } from "../controllers/marksEntry.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { setMarksEntryContext } from "../middlewares/auth.middleware.js";

const router = Router();


router.use(isAuthenticated);
router.use(setMarksEntryContext);

router.get("/", MarksEntryController.getAll);
router.get("/:id", MarksEntryController.getOne);

router.post("/", MarksEntryController.create);
router.patch("/:id", MarksEntryController.update);

router.delete("/:id", MarksEntryController.delete);

export default router;