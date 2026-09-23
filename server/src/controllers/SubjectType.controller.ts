import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  SubjectTypeModel,
  SubjectTypeStatus,
} from "../models/SubjectType.model.js";

import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const getId = (
  value: string | string[] | undefined,
): number | null => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
};

const cleanTitle = (
  title: unknown,
): string | null => {
  if (typeof title !== "string") {
    return null;
  }

  const value = title.trim().replace(/\s+/g, " ");

  if (!value || value.length > 100) {
    return null;
  }

  return value;
};

export class SubjectTypeController {
  static getSubjectTypes = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const status = String(
        req.query.status || "active",
      ) as SubjectTypeStatus;

      if (
        !["all", "active", "trash"].includes(
          status,
        )
      ) {
        return next(
          new AppError(
            "Invalid status value",
            400,
          ),
        );
      }

      const subjectTypes =
        await SubjectTypeModel.getAll(status);

      res.status(200).json({
        success: true,
        message:
          "Subject types fetched successfully",
        data: subjectTypes,
      });
    },
  );

  static getSubjectType = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = getId(req.params.id);

      if (!id) {
        return next(
          new AppError(
            "Invalid subject type ID",
            400,
          ),
        );
      }

      const subjectType =
        await SubjectTypeModel.getById(id);

      if (!subjectType) {
        return next(
          new AppError(
            "Subject type not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Subject type fetched successfully",
        data: subjectType,
      });
    },
  );

  static addSubjectType = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const title = cleanTitle(req.body.title);

      if (!title) {
        return next(
          new AppError(
            "Title is required and must be within 100 characters",
            400,
          ),
        );
      }

      const subjectType =
        await SubjectTypeModel.create(title);

      res.status(201).json({
        success: true,
        message:
          "Subject type added successfully",
        data: subjectType,
      });
    },
  );

  static updateSubjectType = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = getId(req.params.id);
      const title = cleanTitle(req.body.title);

      if (!id) {
        return next(
          new AppError(
            "Invalid subject type ID",
            400,
          ),
        );
      }

      if (!title) {
        return next(
          new AppError(
            "Title is required and must be within 100 characters",
            400,
          ),
        );
      }

      const subjectType =
        await SubjectTypeModel.update(
          id,
          title,
        );

      if (!subjectType) {
        return next(
          new AppError(
            "Active subject type not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Subject type updated successfully",
        data: subjectType,
      });
    },
  );

  static deleteSubjectType = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = getId(req.params.id);

      if (!id) {
        return next(
          new AppError(
            "Invalid subject type ID",
            400,
          ),
        );
      }

      const subjectType =
        await SubjectTypeModel.softDelete(id);

      if (!subjectType) {
        return next(
          new AppError(
            "Active subject type not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Subject type moved to trash",
        data: subjectType,
      });
    },
  );

  static restoreSubjectType = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = getId(req.params.id);

      if (!id) {
        return next(
          new AppError(
            "Invalid subject type ID",
            400,
          ),
        );
      }

      const subjectType =
        await SubjectTypeModel.restore(id);

      if (!subjectType) {
        return next(
          new AppError(
            "Trashed subject type not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Subject type restored successfully",
        data: subjectType,
      });
    },
  );

  static hardDeleteSubjectType = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const id = getId(req.params.id);

      if (!id) {
        return next(
          new AppError(
            "Invalid subject type ID",
            400,
          ),
        );
      }

      const subjectType =
        await SubjectTypeModel.hardDelete(id);

      if (!subjectType) {
        return next(
          new AppError(
            "Trashed subject type not found",
            404,
          ),
        );
      }

      res.status(200).json({
        success: true,
        message:
          "Subject type permanently deleted",
        data: subjectType,
      });
    },
  );
}