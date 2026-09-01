import type { NextFunction, Request, Response } from "express";

import {
  ExamModel,
  type CreateExamPayload,
  type ExamStatus,
  type ExamStatusFilter,
  type UpdateExamPayload,
} from "../models/exam.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type RequestWithUser = Request & {
  user?: {
    academic_year_id?: number | string;
  };
};

const examStatuses: ExamStatus[] = [
  "draft",
  "published",
  "completed",
  "cancelled",
];

const getValidId = (value: string | undefined): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid exam ID.", 400);
  }

  return id;
};

const getAcademicYearId = (req: Request): number => {
  const academicYearId = Number(
    (req as RequestWithUser).user?.academic_year_id,
  );

  if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
    throw new AppError("Current academic session is missing or invalid.", 400);
  }

  return academicYearId;
};

const getValidDate = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  const date = value.trim();
  const validDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    !validDateFormat ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new AppError(`${fieldName} must be a valid date.`, 400);
  }

  return date;
};

const ensureDateRange = (startDate: string, endDate: string) => {
  if (startDate > endDate) {
    throw new AppError("End date cannot be before start date.", 400);
  }
};

const getValidStatus = (value: unknown): ExamStatus => {
  const status = String(value ?? "").trim();

  if (!examStatuses.includes(status as ExamStatus)) {
    throw new AppError("Invalid exam status.", 400);
  }

  return status as ExamStatus;
};

export class ExamController {
  /** GET /exam/get-exams?status=all|draft|published|completed|cancelled|trash */
  static getAll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const status = String(req.query.status ?? "all");
    const allowedFilters: ExamStatusFilter[] = ["all", "trash", ...examStatuses];

    if (!allowedFilters.includes(status as ExamStatusFilter)) {
      return next(new AppError("Invalid exam status filter.", 400));
    }

    const exams = await ExamModel.findByStatus(status as ExamStatusFilter);

    res.status(200).json({
      success: true,
      message: "Exams fetched successfully.",
      data: exams,
    });
  });

  /** GET /exam/get-exam/:id */
  static getOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const exam = await ExamModel.findById(getValidId(req.params.id));

    if (!exam) {
      return next(new AppError("Exam not found.", 404));
    }

    res.status(200).json({
      success: true,
      message: "Exam fetched successfully.",
      data: exam,
    });
  });

  /** POST /exam/add-exam */
  static create = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const name = String(req.body.name ?? "").trim();
    const examType = String(req.body.exam_type ?? "").trim();
    const startDate = getValidDate(req.body.start_date, "Start date");
    const endDate = getValidDate(req.body.end_date, "End date");

    if (!name) {
      return next(new AppError("Exam name is required.", 400));
    }

    if (!examType) {
      return next(new AppError("Exam type is required.", 400));
    }

    ensureDateRange(startDate, endDate);

    const payload: CreateExamPayload = {
      name,
      exam_type: examType,
      academic_year_id: getAcademicYearId(req),
      start_date: startDate,
      end_date: endDate,
      status:
        req.body.status === undefined
          ? "draft"
          : getValidStatus(req.body.status),
      description:
        req.body.description === undefined || req.body.description === null
          ? null
          : String(req.body.description).trim(),
    };

    const exam = await ExamModel.create(payload);

    res.status(201).json({
      success: true,
      message: "Exam created successfully.",
      data: exam,
    });
  });

  /** POST /exam/update-exam/:id */
  static update = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = getValidId(req.params.id);
    const existingExam = await ExamModel.findById(id);

    if (!existingExam) {
      return next(new AppError("Exam not found.", 404));
    }

    const payload: UpdateExamPayload = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();

      if (!name) {
        return next(new AppError("Exam name cannot be empty.", 400));
      }

      payload.name = name;
    }

    if (req.body.exam_type !== undefined) {
      const examType = String(req.body.exam_type).trim();

      if (!examType) {
        return next(new AppError("Exam type cannot be empty.", 400));
      }

      payload.exam_type = examType;
    }

    if (req.body.start_date !== undefined) {
      payload.start_date = getValidDate(req.body.start_date, "Start date");
    }

    if (req.body.end_date !== undefined) {
      payload.end_date = getValidDate(req.body.end_date, "End date");
    }

    if (req.body.status !== undefined) {
      payload.status = getValidStatus(req.body.status);
    }

    if (req.body.description !== undefined) {
      payload.description =
        req.body.description === null
          ? null
          : String(req.body.description).trim();
    }

    if (Object.keys(payload).length === 0) {
      return next(new AppError("At least one field is required to update an exam.", 400));
    }

    const currentStartDate = existingExam.start_date.toISOString().slice(0, 10);
    const currentEndDate = existingExam.end_date.toISOString().slice(0, 10);

    ensureDateRange(
      payload.start_date ?? currentStartDate,
      payload.end_date ?? currentEndDate,
    );

    const exam = await ExamModel.update(id, payload);

    res.status(200).json({
      success: true,
      message: "Exam updated successfully.",
      data: exam,
    });
  });

  /** DELETE /exam/delete-exam/:id */
  static delete = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const exam = await ExamModel.softDelete(getValidId(req.params.id));

    if (!exam) {
      return next(new AppError("Exam not found or already deleted.", 404));
    }

    res.status(200).json({
      success: true,
      message: "Exam moved to trash successfully.",
      data: exam,
    });
  });

  /** PATCH /exam/restore-exam/:id */
  static restore = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const exam = await ExamModel.restore(getValidId(req.params.id));

    if (!exam) {
      return next(new AppError("Exam not found in trash.", 404));
    }

    res.status(200).json({
      success: true,
      message: "Exam restored successfully.",
      data: exam,
    });
  });

  /** DELETE /exam/hard-delete-exam/:id */
  static hardDelete = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const deleted = await ExamModel.hardDelete(getValidId(req.params.id));

    if (!deleted) {
      return next(new AppError("Exam not found.", 404));
    }

    res.status(200).json({
      success: true,
      message: "Exam permanently deleted successfully.",
    });
  });
}
