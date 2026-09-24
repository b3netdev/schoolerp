import type { NextFunction, Request, Response } from "express";

import {
  ExamModel,
  type CreateExamPayload,
  type ExamMarkType,
  type ExamStatus,
  type ExamStatusFilter,
  type UpdateExamPayload,
} from "../models/exam.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

type RequestWithUser = Request & {
  user?: { academic_year_id?: number | string };
};

const examStatuses: ExamStatus[] = [
  "draft",
  "published",
  "completed",
  "cancelled",
];

const getValidId = (value: unknown, fieldName: string): number => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`${fieldName} must be a valid ID.`, 400);
  }

  return id;
};

const getAcademicYearId = (req: Request): number =>
  getValidId(
    (req as RequestWithUser).user?.academic_year_id,
    "Current academic session",
  );

const getAcademicYearIdForListing = (req: Request): number => {
  const bodyAcademicYearId = (req.body as { academic_year_id?: unknown })
    ?.academic_year_id;

  if (bodyAcademicYearId !== undefined) {
    return getValidId(bodyAcademicYearId, "Academic session");
  }

  const queryAcademicYearId = req.query.academic_year_id;

  if (queryAcademicYearId !== undefined) {
    return getValidId(queryAcademicYearId, "Academic session");
  }

  return getAcademicYearId(req);
};

const getValidDate = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  const date = value.trim();
  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
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
  const status = String(value ?? "").trim() as ExamStatus;

  if (!examStatuses.includes(status)) {
    throw new AppError("Invalid exam status.", 400);
  }

  return status;
};

const getValidMarkType = (value: unknown): ExamMarkType => {
  const markType = String(value ?? "").trim().toLowerCase() as ExamMarkType;

  if (markType !== "number" && markType !== "letter") {
    throw new AppError("Mark type must be either number or letter.", 400);
  }

  return markType;
};

const getNormalizedFullMark = (value: unknown): string => {
  const fullMark = String(value ?? "").trim();

  if (!fullMark) {
    throw new AppError("Full mark is required when mark type is number.", 400);
  }

  const markValue = Number(fullMark);
  if (!Number.isFinite(markValue) || markValue <= 0) {
    throw new AppError("Full mark must be a positive number.", 400);
  }

  return fullMark;
};

const getNormalizedPassMark = (
  value: unknown,
  fullMarkValue: string,
): string => {
  const passMark = String(value ?? "").trim();

  if (!passMark) {
    throw new AppError("Pass mark is required when mark type is number.", 400);
  }

  const parsedPassMark = Number(passMark);
  const parsedFullMark = Number(fullMarkValue);

  if (!Number.isFinite(parsedPassMark) || parsedPassMark <= 0) {
    throw new AppError("Pass mark must be a positive number.", 400);
  }

  if (parsedPassMark > parsedFullMark) {
    throw new AppError("Pass mark cannot be greater than full mark.", 400);
  }

  return passMark;
};

const getNormalizedGrades = (value: unknown): string => {
  const grades = String(value ?? "").trim();

  if (!grades) {
    throw new AppError("Grades are required when mark type is letter.", 400);
  }

  const tokens = grades
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new AppError(
      "Provide grades as comma-separated values, for example A,B,C,D.",
      400,
    );
  }

  return tokens.join(",");
};

const normalizeMarksByType = (
  markType: ExamMarkType,
  fullMarkValue: unknown,
  passMarkValue: unknown,
  gradesValue: unknown,
): {
  full_mark: string | null;
  pass_mark: string | null;
  grades: string | null;
} => {
  if (markType === "number") {
    const fullMark = getNormalizedFullMark(fullMarkValue);

    return {
      full_mark: fullMark,
      pass_mark: getNormalizedPassMark(passMarkValue, fullMark),
      grades: null,
    };
  }

  return {
    full_mark: null,
    pass_mark: null,
    grades: getNormalizedGrades(gradesValue),
  };
};

export class ExamController {
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const status = String(req.query.status ?? "all") as ExamStatusFilter;
      const filters: ExamStatusFilter[] = ["all", "trash", ...examStatuses];

      if (!filters.includes(status)) {
        return next(new AppError("Invalid exam status filter.", 400));
      }
      const academicYearId = getAcademicYearIdForListing(req);

      const exams = await ExamModel.findByStatus(academicYearId, status);

      res.status(200).json({
        success: true,
        // message: "Exams fetched successfully.",
        data: exams,
      });
    },
  );

  static getOne = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const exam = await ExamModel.findById(getValidId(req.params.id, "Exam"));

      if (!exam) return next(new AppError("Exam not found.", 404));

      res.status(200).json({ success: true, data: exam });
    },
  );

  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const name = String(req.body.name ?? "").trim();
      const examType = String(req.body.exam_type ?? "").trim();
      const markType = getValidMarkType(req.body.mark_type);
      const startDate = getValidDate(req.body.start_date, "Start date");
      const endDate = getValidDate(req.body.end_date, "End date");

      if (!name) return next(new AppError("Exam name is required.", 400));
      if (!examType) return next(new AppError("Exam type is required.", 400));

      const marksData = normalizeMarksByType(
        markType,
        req.body.full_mark,
        req.body.pass_mark,
        req.body.grades,
      );

      ensureDateRange(startDate, endDate);

      const payload: CreateExamPayload = {
        name,
        exam_type: examType,
        mark_type: markType,
        full_mark: marksData.full_mark,
        pass_mark: marksData.pass_mark,
        grades: marksData.grades,
        class_id: getValidId(req.body.class_id, "Class"),
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
    },
  );

  static update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = getValidId(req.params.id, "Exam");
      const existingExam = await ExamModel.findById(id);

      if (!existingExam) return next(new AppError("Exam not found.", 404));

      const payload: UpdateExamPayload = {};

      if (req.body.name !== undefined) {
        const name = String(req.body.name).trim();
        if (!name) return next(new AppError("Exam name cannot be empty.", 400));
        payload.name = name;
      }

      if (req.body.exam_type !== undefined) {
        const examType = String(req.body.exam_type).trim();
        if (!examType)
          return next(new AppError("Exam type cannot be empty.", 400));
        payload.exam_type = examType;
      }

      if (req.body.mark_type !== undefined) {
        payload.mark_type = getValidMarkType(req.body.mark_type);
      }

      if (req.body.class_id !== undefined) {
        payload.class_id = getValidId(req.body.class_id, "Class");
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

      const resolvedMarkType = payload.mark_type ?? existingExam.mark_type;

      if (
        req.body.mark_type !== undefined ||
        req.body.full_mark !== undefined ||
        req.body.grades !== undefined
      ) {
        const marksData = normalizeMarksByType(
          resolvedMarkType,
          req.body.full_mark !== undefined
            ? req.body.full_mark
            : existingExam.full_mark,
          req.body.pass_mark !== undefined
            ? req.body.pass_mark
            : existingExam.pass_mark,
          req.body.grades !== undefined
            ? req.body.grades
            : existingExam.grades,
        );

        payload.full_mark = marksData.full_mark;
        payload.pass_mark = marksData.pass_mark;
        payload.grades = marksData.grades;
      }

      if (Object.keys(payload).length === 0) {
        return next(
          new AppError(
            "At least one field is required to update an exam.",
            400,
          ),
        );
      }

      ensureDateRange(
        payload.start_date ??
          existingExam.start_date.toISOString().slice(0, 10),
        payload.end_date ?? existingExam.end_date.toISOString().slice(0, 10),
      );

      const exam = await ExamModel.update(id, payload);

      res.status(200).json({
        success: true,
        message: "Exam updated successfully.",
        data: exam,
      });
    },
  );

  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const exam = await ExamModel.softDelete(
        getValidId(req.params.id, "Exam"),
      );

      if (!exam)
        return next(new AppError("Exam not found or already deleted.", 404));

      res
        .status(200)
        .json({
          success: true,
          message: "Exam moved to trash successfully.",
          data: exam,
        });
    },
  );

  static restore = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const exam = await ExamModel.restore(getValidId(req.params.id, "Exam"));

      if (!exam) return next(new AppError("Exam not found in trash.", 404));

      res
        .status(200)
        .json({
          success: true,
          message: "Exam restored successfully.",
          data: exam,
        });
    },
  );

  static hardDelete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const deleted = await ExamModel.hardDelete(
        getValidId(req.params.id, "Exam"),
      );

      if (!deleted) return next(new AppError("Exam not found.", 404));

      res
        .status(200)
        .json({
          success: true,
          message: "Exam permanently deleted successfully.",
        });
    },
  );
}
