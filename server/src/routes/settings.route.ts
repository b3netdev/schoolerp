import express from "express";
import { SettingsController } from "../controllers/settings.controller.js";
// import { protect } from "../middlewares/auth.middleware.js";
// import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// router.use(protect);

router.post("/", SettingsController.create);

router.get("/", SettingsController.getAll);

router.post ("/getBykey", SettingsController.getByKey);

router.post("/getbygroup", SettingsController.getByGroup);

router.get("/:id", SettingsController.getById);

router.patch("/:id", SettingsController.update);

router.delete("/:id", SettingsController.delete);

router.delete("/:id/hard", SettingsController.hardDelete);

export default router;