import type { NextFunction, Request, Response } from "express";

import {
  MarksEntryModel,
  type AttendanceStatus,
  type EnteredRole,
  type MarksEntryFilters,
} from "../models/marksEntry.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const getAcademicYearId = (req: Request): number => {
  const academicYearId = Number(req.user?.academic_year_id);

  if (!academicYearId || Number.isNaN(academicYearId)) {
    throw new AppError(
      "Academic year is missing from your login session.",
      400,
    );
  }

  return academicYearId;
};

const getAuditFields = (req: Request) => {
  if (!req.user || !req.userId) {
    throw new AppError("Unable to get authenticated user.", 401);
  }

  if (req.user.role === "admin") {
    return {
      entered_by_user_id: req.userId,
      entered_by_teacher_id: null,
      entered_role: "admin" as EnteredRole,
    };
  }

  if (req.user.role === "teacher") {
    return {
      entered_by_user_id: null,
      entered_by_teacher_id: req.userId,
      entered_role: "teacher" as EnteredRole,
    };
  }

  throw new AppError("Invalid user role.", 403);
};

const getMarkData = (body: Record<string, unknown>) => {
  const attendanceStatus = String(
    body.attendance_status || "present",
  ) as AttendanceStatus;

  if (!["present", "absent"].includes(attendanceStatus)) {
    throw new AppError(
      "attendance_status must be present or absent.",
      400,
    );
  }

  const rawMark = body.mark_obtained;

  const markObtained =
    rawMark === undefined || rawMark === null || rawMark === ""
      ? null
      : Number(rawMark);

  if (
    markObtained !== null &&
    (!Number.isFinite(markObtained) || markObtained < 0)
  ) {
    throw new AppError("mark_obtained must be a valid positive number.", 400);
  }

  if (attendanceStatus === "present" && markObtained === null) {
    throw new AppError(
      "mark_obtained is required when student is present.",
      400,
    );
  }

  if (attendanceStatus === "absent" && markObtained !== null) {
    throw new AppError(
      "mark_obtained must be empty when student is absent.",
      400,
    );
  }

  return {
    mark_obtained: markObtained,
    attendance_status: attendanceStatus,
    remarks: body.remarks ? String(body.remarks).trim() : null,
  };
};

const verifyTeacherAssignment = async (
  req: Request,
  examAssignId: number,
  academicYearId: number,
) => {
  const assignment = await MarksEntryModel.findAssignment(
    examAssignId,
    academicYearId,
  );

  if (!assignment) {
    throw new AppError(
      "Exam assignment was not found for this academic year.",
      404,
    );
  }

  if (
    req.user?.role === "teacher" &&
    assignment.teacher_id !== Number(req.userId)
  ) {
    throw new AppError(
      "You are not assigned to enter marks for this exam and subject.",
      403,
    );
  }

  if (
    req.user?.role === "teacher" &&
    assignment.assign_till &&
    new Date(assignment.assign_till) < new Date()
  ) {
    throw new AppError("Your marks entry assignment has expired.", 403);
  }

  return assignment;
};

export class MarksEntryController {
  static getAll = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Please login first.", 401));
      }

      const academicYearId = getAcademicYearId(req);

      const filters: MarksEntryFilters = {
        status: req.query.status === "trash" ? "trash" : "all",
        exam_id: req.query.exam_id
          ? Number(req.query.exam_id)
          : undefined,
        subject_id: req.query.subject_id
          ? Number(req.query.subject_id)
          : undefined,
        student_id: req.query.student_id
          ? Number(req.query.student_id)
          : undefined,
        teacher_id:
          req.user.role === "teacher" ? Number(req.userId) : undefined,
      };

      const marks = await MarksEntryModel.findAll(
        academicYearId,
        filters,
      );

      res.status(200).json({
        success: true,
        message: "Marks fetched successfully.",
        results: marks.length,
        data: marks,
      });
    },
  );

  static getOne = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);
      const academicYearId = getAcademicYearId(req);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid marks entry ID.", 400));
      }

      const mark = await MarksEntryModel.findById(id, academicYearId);

      if (!mark) {
        return next(new AppError("Marks entry not found.", 404));
      }

      if (req.user?.role === "teacher") {
        await verifyTeacherAssignment(
          req,
          mark.exam_assign_id,
          academicYearId,
        );
      }

      res.status(200).json({
        success: true,
        data: mark,
      });
    },
  );

  static create = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const academicYearId = getAcademicYearId(req);

      const examAssignId = Number(req.body.exam_assign_id);
      const studentId = Number(req.body.student_id);

      if (!examAssignId || !studentId) {
        return next(
          new AppError("exam_assign_id and student_id are required.", 400),
        );
      }

      // Gets exam_id and subject_id from exam_assign.
      // Frontend does not send these values.
      const assignment = await verifyTeacherAssignment(
        req,
        examAssignId,
        academicYearId,
      );

      const markData = getMarkData(req.body);
      const auditFields = getAuditFields(req);

      try {
        const createdMark = await MarksEntryModel.create({
          exam_assign_id: assignment.id,
          exam_id: assignment.exam_id,
          student_id: studentId,
          subject_id: assignment.subject_id,
          academic_year_id: academicYearId,
          ...auditFields,
          ...markData,
        });

        const mark = await MarksEntryModel.findById(
          createdMark.id,
          academicYearId,
        );

        res.status(201).json({
          success: true,
          message: "Marks added successfully.",
          data: mark,
        });
      } catch (error: any) {
        if (error?.code === "23505") {
          return next(
            new AppError(
              "Marks already exist for this student, exam, and subject.",
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
      const id = Number(req.params.id);
      const academicYearId = getAcademicYearId(req);

      if (!id || Number.isNaN(id)) {
        return next(new AppError("Invalid marks entry ID.", 400));
      }

      const existingMark = await MarksEntryModel.findById(
        id,
        academicYearId,
      );

      if (!existingMark || existingMark.deleted_at) {
        return next(new AppError("Active marks entry not found.", 404));
      }

      // Teacher can edit only their assigned exam and subject.
      if (req.user?.role === "teacher") {
        await verifyTeacherAssignment(
          req,
          existingMark.exam_assign_id,
          academicYearId,
        );
      }

      const markData = getMarkData(req.body);
      const auditFields = getAuditFields(req);

      const mark = await MarksEntryModel.update(id, academicYearId, {
        ...auditFields,
        ...markData,
      });

      if (!mark) {
        return next(new AppError("Unable to update marks entry.", 400));
      }

      const updatedMark = await MarksEntryModel.findById(
        mark.id,
        academicYearId,
      );

      res.status(200).json({
        success: true,
        message: "Marks updated successfully.",
        data: updatedMark,
      });
    },
  );

  static delete = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);
      const academicYearId = getAcademicYearId(req);

      const existingMark = await MarksEntryModel.findById(
        id,
        academicYearId,
      );

      if (!existingMark || existingMark.deleted_at) {
        return next(new AppError("Active marks entry not found.", 404));
      }

      // Teacher can delete only their assigned exam-subject marks.
      if (req.user?.role === "teacher") {
        await verifyTeacherAssignment(
          req,
          existingMark.exam_assign_id,
          academicYearId,
        );
      }

      const mark = await MarksEntryModel.softDelete(id, academicYearId);

      if (!mark) {
        return next(new AppError("Unable to delete marks entry.", 400));
      }

      res.status(200).json({
        success: true,
        message: "Marks deleted successfully.",
      });
    },
  );
}