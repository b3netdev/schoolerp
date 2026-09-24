import type { NextFunction, Request, Response } from "express";

import {
  ExamAssignModel,
  type UpdateExamAssignPayload,
} from "../models/examAssign.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const getAcademicYearIdFromMiddleware = (req: Request): number => {
  const academicYearId = Number(req.user?.academic_year_id);

  if (!academicYearId || Number.isNaN(academicYearId)) {
    throw new AppError(
      "Academic year is missing from your current login session.",
      400,
    );
  }

  return academicYearId;
};

const checkAdmin = (req: Request, next: NextFunction): boolean => {
  if (!req.user) {
    next(new AppError("Please login first.", 401));
    return false;
  }

  if (req.user.role !== "admin") {
    next(new AppError("Only admin can manage exam assignments.", 403));
    return false;
  }

  return true;
};

export class ExamAssignController {
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Please login first.", 401));
      }

      const academicYearId = getAcademicYearIdFromMiddleware(req);
      const status = req.query.status === "trash" ? "trash" : "all";

      // Admin sees all assignments.
      // Teacher sees only their own assignments.
      const teacherId =
        req.user.role === "teacher" ? Number(req.user.id) : undefined;

      const assignments = await ExamAssignModel.findAll(
        academicYearId,
        status,
        teacherId,
      );

      res.status(200).json({
        status: "success",
        results: assignments.length,
        data: assignments,
      });
    },
  );

  static getOne = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Please login first.", 401));
      }

      const id = Number(req.params.id);
      const academicYearId = getAcademicYearIdFromMiddleware(req);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid exam assignment ID.", 400));
      }

      const assignment = await ExamAssignModel.findById(id, academicYearId);

      if (!assignment) {
        return next(new AppError("Exam assignment not found.", 404));
      }

      // A teacher cannot open another teacher's assignment.
      if (
        req.user.role === "teacher" &&
        assignment.teacher_id !== Number(req.user.id)
      ) {
        return next(new AppError("Permission denied.", 403));
      }

      res.status(200).json({
        status: "success",
        data: assignment,
      });
    },
  );

  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!checkAdmin(req, next)) return;

      const academicYearId = getAcademicYearIdFromMiddleware(req);

      const teacherId = Number(req.body.teacher_id);
      const examId = Number(req.body.exam_id);
      const subjectId = Number(req.body.subject_id);

      if (!teacherId || !examId || !subjectId) {
        return next(
          new AppError("Teacher, exam, and subject are required.", 400),
        );
      }

      try {
        const assignment = await ExamAssignModel.create({
          teacher_id: teacherId,
          exam_id: examId,
          subject_id: subjectId,
          academic_year_id: academicYearId,
          assign_till: req.body.assign_till || null,
        });

        res.status(201).json({
          status: "success",
          message: "Exam assigned successfully.",
          data: assignment,
        });
      } catch (error: any) {
        if (error?.code === "23505") {
          return next(
            new AppError(
              "This exam and subject are already assigned to this teacher.",
              409,
            ),
          );
        }

        throw error;
      }
    },
  );

  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!checkAdmin(req, next)) return;

      const id = Number(req.params.id);
      const academicYearId = getAcademicYearIdFromMiddleware(req);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid exam assignment ID.", 400));
      }

      const payload: UpdateExamAssignPayload = {
        ...(req.body.teacher_id !== undefined && {
          teacher_id: Number(req.body.teacher_id),
        }),
        ...(req.body.exam_id !== undefined && {
          exam_id: Number(req.body.exam_id),
        }),
        ...(req.body.subject_id !== undefined && {
          subject_id: Number(req.body.subject_id),
        }),
        ...(req.body.assign_till !== undefined && {
          assign_till: req.body.assign_till || null,
        }),
      };

      try {
        const assignment = await ExamAssignModel.update(
          id,
          academicYearId,
          payload,
        );

        if (!assignment) {
          return next(new AppError("Active exam assignment not found.", 404));
        }

        res.status(200).json({
          status: "success",
          message: "Exam assignment updated successfully.",
          data: assignment,
        });
      } catch (error: any) {
        if (error?.code === "23505") {
          return next(
            new AppError(
              "This exam and subject are already assigned to this teacher.",
              409,
            ),
          );
        }

        throw error;
      }
    },
  );

  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!checkAdmin(req, next)) return;

      const id = Number(req.params.id);
      const academicYearId = getAcademicYearIdFromMiddleware(req);

      const assignment = await ExamAssignModel.softDelete(id, academicYearId);

      if (!assignment) {
        return next(new AppError("Active exam assignment not found.", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Exam assignment deleted successfully.",
        data: assignment,
      });
    },
  );

  static restore = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!checkAdmin(req, next)) return;

      const id = Number(req.params.id);
      const academicYearId = getAcademicYearIdFromMiddleware(req);

      try {
        const assignment = await ExamAssignModel.restore(id, academicYearId);

        if (!assignment) {
          return next(
            new AppError(
              "Deleted exam assignment was not found in this academic year.",
              404,
            ),
          );
        }

        res.status(200).json({
          status: "success",
          message: "Exam assignment restored successfully.",
          data: assignment,
        });
      } catch (error: any) {
        if (error?.code === "23505") {
          return next(
            new AppError(
              "Cannot restore because this exam assignment already exists.",
              409,
            ),
          );
        }

        throw error;
      }
    },
  );

  static hardDelete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!checkAdmin(req, next)) return;

      const id = Number(req.params.id);
      const academicYearId = getAcademicYearIdFromMiddleware(req);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid exam assignment ID.", 400));
      }

      const deleted = await ExamAssignModel.hardDelete(id, academicYearId);

      if (!deleted) {
        return next(
          new AppError(
            "Deleted exam assignment was not found in this academic year.",
            404,
          ),
        );
      }

      res.status(200).json({
        status: "success",
        message: "Exam assignment permanently deleted successfully.",
      });
    },
  );
}