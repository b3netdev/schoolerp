import { Request, Response, NextFunction } from "express";
import {
  ClassSectionRelationModel,
  ClassSectionRelationPayload,
  ClassSectionRelationStatusFilter,
  ClassSectionRelationUpdatePayload,
  DuplicateClassSectionError,
  InvalidClassSectionReferenceError,
} from "../models/class-section-relation.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

const VALID_STATUS_FILTERS: ClassSectionRelationStatusFilter[] = [
  "all",
  "trash",
];

const parseStatusFilter = (
  value: unknown,
): ClassSectionRelationStatusFilter => {
  return VALID_STATUS_FILTERS.includes(
    value as ClassSectionRelationStatusFilter,
  )
    ? (value as ClassSectionRelationStatusFilter)
    : "all";
};

// Teacher is optional: absent/undefined means "leave unchanged" on update,
// null/empty string means "no teacher assigned".
const parseOptionalTeacherId = (
  value: unknown,
): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
};

const handleKnownModelErrors = (
  error: unknown,
  next: NextFunction,
): void => {
  if (error instanceof DuplicateClassSectionError) {
    next(new AppError(error.message, 409));
    return;
  }

  if (error instanceof InvalidClassSectionReferenceError) {
    next(new AppError(error.message, 400));
    return;
  }

  next(error);
};

export class ClassSectionRelationController {
  // Get all class-section-teacher relations, optionally filtered by ?status=all|trash
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const status = parseStatusFilter(req.query.status);
      const relations = await ClassSectionRelationModel.findByStatus(status);

      res.status(200).json({
        success: true,
        count: relations.length,
        message: "Class section relations fetched successfully.",
        data: relations,
      });
    }
  );

  // Get single relation by ID
  static getById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const relation = await ClassSectionRelationModel.findById(id);

      if (!relation) {
        return next(new AppError("Class section relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Class section relation fetched successfully.",
        data: relation,
      });
    }
  );

  // Create class-section-teacher relation
  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { class_id, section_id, teacher_id } =
        req.body as ClassSectionRelationPayload;

      const classId = Number(class_id);
      const sectionId = Number(section_id);

      if (!classId || Number.isNaN(classId)) {
        return next(new AppError("Class is required.", 400));
      }

      if (!sectionId || Number.isNaN(sectionId)) {
        return next(new AppError("Section is required.", 400));
      }

      try {
        const relation = await ClassSectionRelationModel.create({
          class_id: classId,
          section_id: sectionId,
          teacher_id: parseOptionalTeacherId(teacher_id) ?? null,
        });

        res.status(201).json({
          success: true,
          message: "Class section relation created successfully.",
          data: relation,
        });
      } catch (error) {
        handleKnownModelErrors(error, next);
      }
    }
  );

  // Update class-section-teacher relation
  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.body.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const { class_id, section_id, teacher_id } =
        req.body as ClassSectionRelationUpdatePayload;

      if (!class_id && !section_id && !teacher_id) {
        return next(
          new AppError("At least one field is required to update relation.", 400)
        );
      }

      try {
        const relation = await ClassSectionRelationModel.update(id, {
          class_id: class_id ? Number(class_id) : undefined,
          section_id: section_id ? Number(section_id) : undefined,
          teacher_id: parseOptionalTeacherId(teacher_id),
        });

        if (!relation) {
          return next(new AppError("Class section relation not found.", 404));
        }

        res.status(200).json({
          success: true,
          message: "Class section relation updated successfully.",
          data: relation,
        });
      } catch (error) {
        handleKnownModelErrors(error, next);
      }
    }
  );

  // Soft delete (move to trash) a class-section-teacher relation
  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const relation = await ClassSectionRelationModel.delete(id);

      if (!relation) {
        return next(new AppError("Class section relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Class section relation moved to trash successfully.",
        data: relation,
      });
    }
  );

  // Restore a trashed class-section-teacher relation
  static restore = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      try {
        const relation = await ClassSectionRelationModel.restore(id);

        if (!relation) {
          return next(
            new AppError("Class section relation not found in trash.", 404),
          );
        }

        res.status(200).json({
          success: true,
          message: "Class section relation restored successfully.",
          data: relation,
        });
      } catch (error) {
        handleKnownModelErrors(error, next);
      }
    }
  );

  // Hard delete class-section-teacher relation
  static hardDelete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const deleted = await ClassSectionRelationModel.hardDelete(id);

      if (!deleted) {
        return next(new AppError("Class section relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Class section relation permanently deleted successfully.",
      });
    }
  );
}
