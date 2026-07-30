import { Request, Response, NextFunction } from "express";
import {
  StudentClassRelationModel,
  StudentClassRelationPayload,
  StudentClassRelationStatusFilter,
  StudentClassRelationUpdatePayload,
  DuplicateStudentEnrollmentError,
  InvalidStudentClassReferenceError,
} from "../models/student-class-relation.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

const VALID_STATUS_FILTERS: StudentClassRelationStatusFilter[] = [
  "all",
  "trash",
];

const parseStatusFilter = (
  value: unknown,
): StudentClassRelationStatusFilter => {
  return VALID_STATUS_FILTERS.includes(
    value as StudentClassRelationStatusFilter,
  )
    ? (value as StudentClassRelationStatusFilter)
    : "all";
};

const handleKnownModelErrors = (
  error: unknown,
  next: NextFunction,
): void => {
  if (error instanceof DuplicateStudentEnrollmentError) {
    next(new AppError(error.message, 409));
    return;
  }

  if (error instanceof InvalidStudentClassReferenceError) {
    next(new AppError(error.message, 400));
    return;
  }

  next(error);
};

export class StudentClassRelationController {
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const status = parseStatusFilter(req.query.status);
      const relations = await StudentClassRelationModel.findByStatus(status);

      res.status(200).json({
        success: true,
        count: relations.length,
        message: "Student class relations fetched successfully.",
        data: relations,
      });
    },
  );

  static getById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const relation = await StudentClassRelationModel.findById(id);

      if (!relation) {
        return next(new AppError("Student class relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Student class relation fetched successfully.",
        data: relation,
      });
    },
  );

  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { student_id, class_section_id } =
        req.body as StudentClassRelationPayload;

      const studentId = Number(student_id);
      const classSectionId = Number(class_section_id);

      if (!studentId || Number.isNaN(studentId)) {
        return next(new AppError("Student is required.", 400));
      }

      if (!classSectionId || Number.isNaN(classSectionId)) {
        return next(new AppError("Class & section is required.", 400));
      }

      try {
        const relation = await StudentClassRelationModel.create({
          student_id: studentId,
          class_section_id: classSectionId,
        });

        res.status(201).json({
          success: true,
          message: "Student enrolled successfully.",
          data: relation,
        });
      } catch (error) {
        handleKnownModelErrors(error, next);
      }
    },
  );

  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.body.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const { class_section_id } =
        req.body as StudentClassRelationUpdatePayload;

      const classSectionId = Number(class_section_id);

      if (!classSectionId || Number.isNaN(classSectionId)) {
        return next(
          new AppError("class_section_id is required to update relation.", 400),
        );
      }

      try {
        const relation = await StudentClassRelationModel.update(id, {
          class_section_id: classSectionId,
        });

        if (!relation) {
          return next(new AppError("Student class relation not found.", 404));
        }

        res.status(200).json({
          success: true,
          message: "Student class relation updated successfully.",
          data: relation,
        });
      } catch (error) {
        handleKnownModelErrors(error, next);
      }
    },
  );

  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const relation = await StudentClassRelationModel.delete(id);

      if (!relation) {
        return next(new AppError("Student class relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Student class relation moved to trash successfully.",
        data: relation,
      });
    },
  );

  static restore = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      try {
        const relation = await StudentClassRelationModel.restore(id);

        if (!relation) {
          return next(
            new AppError("Student class relation not found in trash.", 404),
          );
        }

        res.status(200).json({
          success: true,
          message: "Student class relation restored successfully.",
          data: relation,
        });
      } catch (error) {
        handleKnownModelErrors(error, next);
      }
    },
  );

  static hardDelete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid relation ID.", 400));
      }

      const deleted = await StudentClassRelationModel.hardDelete(id);

      if (!deleted) {
        return next(new AppError("Student class relation not found.", 404));
      }

      res.status(200).json({
        success: true,
        message: "Student class relation permanently deleted successfully.",
      });
    },
  );
}
