import { Request, Response, NextFunction } from "express";


import {
  StudentAttendanceModel,
  AttendanceRow,
} from "../models/studentAttendance.model.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

export class StudentAttendanceController {
 
  static bulkSave = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const {
        class_section_id,
        attendance_date,
        attendance,
      } = req.body;


      const attend_by = req.user?.id;

      if (!attend_by) {
        return next(
          new AppError("Authenticated teacher is required", 401)
        );
      }

      if (!class_section_id) {
        return next(
          new AppError("class_section_id is required", 400)
        );
      }

      if (!attendance_date) {
        return next(
          new AppError("attendance_date is required", 400)
        );
      }

      if (!Array.isArray(attendance) || attendance.length === 0) {
        return next(
          new AppError(
            "Attendance must contain at least one student",
            400
          )
        );
      }

      const validStatus = ["p", "a"];

      for (const row of attendance as AttendanceRow[]) {
        if (!row.student_id) {
          return next(
            new AppError(
              "student_id is required for every attendance row",
              400
            )
          );
        }

        if (!validStatus.includes(row.attended)) {
          return next(
            new AppError(
              `Invalid attendance status for student ${row.student_id}`,
              400
            )
          );
        }
      }

      /*
       * Protect against duplicate student IDs
       * in the same request.
       */
      const studentIds = attendance.map(
        (row: AttendanceRow) => row.student_id
      );

      const uniqueStudentIds = new Set(studentIds);

      if (uniqueStudentIds.size !== studentIds.length) {
        return next(
          new AppError(
            "Duplicate student found in attendance list",
            400
          )
        );
      }

      const result =
        await StudentAttendanceModel.bulkUpsert({
          class_section_id: Number(class_section_id),
          attend_by: Number(attend_by),
          attendance_date,
          attendance,
        });

      res.status(200).json({
        status: "success",
        message: "Attendance saved successfully",
        total: result.length,
        data: result,
      });
    }
  );

  /**
   * GET /attendance/class/:classSectionId?date=2026-08-17
   */
  static getClassAttendance = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const classSectionId = Number(
        req.params.classSectionId
      );

      const attendanceDate = req.query.date as string;

      if (!classSectionId) {
        return next(
          new AppError("Invalid class section ID", 400)
        );
      }

      if (!attendanceDate) {
        return next(
          new AppError("Attendance date is required", 400)
        );
      }

      const attendance =
        await StudentAttendanceModel.findByClassAndDate(
          classSectionId,
          attendanceDate
        );

      res.status(200).json({
        status: "success",
        total: attendance.length,
        data: attendance,
      });
    }
  );

  /**
   * GET /attendance/student/:studentId
   */
  static getStudentAttendance = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const studentId = Number(req.params.studentId);

      if (!studentId) {
        return next(
          new AppError("Invalid student ID", 400)
        );
      }

      const attendance =
        await StudentAttendanceModel.findByStudent(
          studentId
        );

      res.status(200).json({
        status: "success",
        total: attendance.length,
        data: attendance,
      });
    }
  );

  /**
   * DELETE /attendance/class/:classSectionId?date=2026-08-17
   */
  static deleteClassAttendance = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const classSectionId = Number(
        req.params.classSectionId
      );

      const attendanceDate = req.query.date as string;

      if (!classSectionId || !attendanceDate) {
        return next(
          new AppError(
            "Class section and attendance date are required",
            400
          )
        );
      }

      const deletedCount =
        await StudentAttendanceModel.deleteByClassAndDate(
          classSectionId,
          attendanceDate
        );

      res.status(200).json({
        status: "success",
        message: "Attendance deleted successfully",
        deleted: deletedCount,
      });
    }
  );
}