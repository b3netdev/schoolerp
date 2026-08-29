import express from "express";

import { ClassController } from "../controllers/class.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/get-classes", ClassController.getAll);

router.get(
    "/get-class/:id",
    isAuthenticated,
    ClassController.getOne,
);

router.post(
    "/add-class",
    isAuthenticated,
    ClassController.create,
);

router.post(
    "/update-class/:id",
    isAuthenticated,
    ClassController.update,
);

router.delete(
    "/delete-class/:id",
    ClassController.delete,
);

router.patch(
    "/restore-class/:id",
    ClassController.restore,
);

router.delete(
    "/hard-delete-class/:id",
    ClassController.hardDelete,
);

export default router;