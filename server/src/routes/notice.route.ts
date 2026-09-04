import { Router } from "express";
import { NoticeController } from "../controllers/notice.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { adminOnly } from "../middlewares/adminOnly.middleware.js";

const NoticeRouter = Router();


NoticeRouter.use(isAuthenticated);


NoticeRouter.get(
  "/get-notices",
  NoticeController.getAll,
);

NoticeRouter.get(
  "/get-notice/:id",
  NoticeController.getOne,
);


NoticeRouter.post(
  "/add-notice",
  adminOnly,
  NoticeController.create,
);

NoticeRouter.post(
  "/update-notice/:id",
  adminOnly,
  NoticeController.update,
);

NoticeRouter.delete(
  "/delete-notice/:id",
  adminOnly,
  NoticeController.delete,
);

NoticeRouter.patch(
  "/restore-notice/:id",
  adminOnly,
  NoticeController.restore,
);

NoticeRouter.delete(
  "/hard-delete-notice/:id",
  adminOnly,
  NoticeController.hardDelete,
);

export default NoticeRouter;