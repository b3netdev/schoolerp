import { Router } from "express";

import { ProfileController } from "../controllers/profile.controller.js";
import { profileUpload } from "../middlewares/profileUpload.middleware.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(isAuthenticated);


router.get(
    "/",
    ProfileController.getProfile,
);

router.post(
    "/update",
    ProfileController.updateProfile,
);

router.post(
    "/image",
    profileUpload.single("profile_image"),
    ProfileController.uploadProfileImage,
);

router.delete(
    "/image",
    ProfileController.removeProfileImage,
);

export default router;