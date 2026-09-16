import type { NextFunction, Request, Response } from "express";
import { ExamAssignModel } from "../models/examAssign.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const getSelectedAcademicYearId = (req: Request): number => {
  const requestedAcademicYearId =
    req.body?.academic_year_id ||
    req.query?.academic_year_id ||
    req.user?.academic_year_id;

  const academicYearId = Number(requestedAcademicYearId);

  if (!academicYearId || Number.isNaN(academicYearId)) {
    throw new AppError("Academic year is required.", 400);
  }

  return academicYearId;
};

const requireAdmin = (req: Request, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return next(new AppError("Only admin can manage exam assignments.", 403));
  }
};

export class ExamAssignController {
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const academicYearId = getSelectedAcademicYearId(req);
      const status = req.query.status === "trash" ? "trash" : "all";

      const assignments = await ExamAssignModel.findAll(
        academicYearId,
        status
      );

      res.status(200).json({
        status: "success",
        results: assignments.length,
        data: assignments,
      });
    }
  );

  static getOne = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid exam assignment ID.", 400));
      }

      const assignment = await ExamAssignModel.findById(id);

      if (!assignment) {
        return next(new AppError("Exam assignment not found.", 404));
      }

      res.status(200).json({
        status: "success",
        data: assignment,
      });
    }
  );

  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      requireAdmin(req, next);
      if (req.user?.role !== "admin") return;

      const teacherId = Number(req.body.teacher_id);
      const examId = Number(req.body.exam_id);
      const subjectId = Number(req.body.subject_id);
      const academicYearId = getSelectedAcademicYearId(req);

      if (!teacherId || !examId || !subjectId) {
        return next(
          new AppError("Teacher, exam, and subject are required.", 400)
        );
      }

      const assignment = await ExamAssignModel.create({
        teacher_id: teacherId,
        exam_id: examId,
        subject_id: subjectId,
        academic_year_id: academicYearId,
        assign_till: req.body.assign_till || null,
      });

      res.status(201).json({
        status: "success",
        message: "Exam assignment created successfully.",
        data: assignment,
      });
    }
  );

  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      requireAdmin(req, next);
      if (req.user?.role !== "admin") return;

      const id = Number(req.params.id);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid exam assignment ID.", 400));
      }

      const payload = {
        ...(req.body.teacher_id !== undefined && {
          teacher_id: Number(req.body.teacher_id),
        }),
        ...(req.body.exam_id !== undefined && {
          exam_id: Number(req.body.exam_id),
        }),
        ...(req.body.subject_id !== undefined && {
          subject_id: Number(req.body.subject_id),
        }),
        ...(req.body.academic_year_id !== undefined && {
          academic_year_id: Number(req.body.academic_year_id),
        }),
        ...(req.body.assign_till !== undefined && {
          assign_till: req.body.assign_till || null,
        }),
      };

      const assignment = await ExamAssignModel.update(id, payload);

      if (!assignment) {
        return next(new AppError("Active exam assignment not found.", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Exam assignment updated successfully.",
        data: assignment,
      });
    }
  );

  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      requireAdmin(req, next);
      if (req.user?.role !== "admin") return;

      const id = Number(req.params.id);
      const assignment = await ExamAssignModel.softDelete(id);

      if (!assignment) {
        return next(new AppError("Active exam assignment not found.", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Exam assignment deleted successfully.",
      });
    }
  );

  static restore = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      requireAdmin(req, next);
      if (req.user?.role !== "admin") return;

      const id = Number(req.params.id);
      const assignment = await ExamAssignModel.restore(id);

      if (!assignment) {
        return next(
          new AppError(
            "Assignment cannot be restored or it is already active.",
            409
          )
        );
      }

      res.status(200).json({
        status: "success",
        message: "Exam assignment restored successfully.",
        data: assignment,
      });
    }
  );
}