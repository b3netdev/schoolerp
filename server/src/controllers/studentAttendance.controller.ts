import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  StudentAttendanceModel,
  AttendanceRow,
  AttendanceStatus,
} from "../models/studentAttendance.model.js";

import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

/**
 * Custom request properties populated by
 * your JWT/setAttended middleware.
 */
interface AttendanceRequest extends Request {
  admin_id?: number;
  teacher_id?: number;
  academic_year_id?: number;
}

export class StudentAttendanceController {
  /**
   * POST
   * /student-attendence/submit-attendence
   */
  static bulkSave = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const attendanceReq =
        req as AttendanceRequest;
        // console.log(req)
        // return
      const {
        class_section_id,
        attendance_date,
        attendance,
      } = req.body;

      /*
       * These values come from JWT middleware.
       * Do NOT accept them from frontend.
       */
      const admin_id =
        attendanceReq.admin_id ?? null;

      const teacher_id =
        attendanceReq.teacher_id ?? null;

      const academic_year_id =
        attendanceReq.academic_year_id;

    

      const hasAdmin = admin_id !== null;
      const hasTeacher = teacher_id !== null;

     
     

    

      if (
        !academic_year_id ||
        !Number.isInteger(
          Number(academic_year_id),
        )
      ) {
        return next(
          new AppError(
            "Academic year is missing from authenticated session",
            400,
          ),
        );
      }

   

      const classSectionId =
        Number(class_section_id);

      if (
        !Number.isInteger(classSectionId) ||
        classSectionId <= 0
      ) {
        return next(
          new AppError(
            "Valid class_section_id is required",
            400,
          ),
        );
      }

      /* ---------------------------------------------------- */
      /* Date                                                */
      /* ---------------------------------------------------- */

      if (!attendance_date) {
        return next(
          new AppError(
            "Attendance date is required",
            400,
          ),
        );
      }

      /* ---------------------------------------------------- */
      /* Attendance array                                    */
      /* ---------------------------------------------------- */

      if (
        !Array.isArray(attendance) ||
        attendance.length === 0
      ) {
        return next(
          new AppError(
            "Attendance must contain at least one student",
            400,
          ),
        );
      }

      const validStatuses: AttendanceStatus[] = [
        "present",
        "absent",
      ];

      /* ---------------------------------------------------- */
      /* Validate each student                               */
      /* ---------------------------------------------------- */

      for (const row of attendance as AttendanceRow[]) {
        const studentId = Number(
          row.student_id,
        );

        if (
          !Number.isInteger(studentId) ||
          studentId <= 0
        ) {
          return next(
            new AppError(
              "Valid student_id is required for every attendance row",
              400,
            ),
          );
        }

        if (
          !validStatuses.includes(
            row.attended,
          )
        ) {
          return next(
            new AppError(
              `Invalid attendance status for student ${row.student_id}. Allowed values are present or absent`,
              400,
            ),
          );
        }
      }

      /* ---------------------------------------------------- */
      /* Prevent duplicate students in request               */
      /* ---------------------------------------------------- */

      const studentIds = (
        attendance as AttendanceRow[]
      ).map((row) =>
        Number(row.student_id),
      );

      const uniqueStudentIds =
        new Set(studentIds);

      if (
        uniqueStudentIds.size !==
        studentIds.length
      ) {
        return next(
          new AppError(
            "Duplicate student found in attendance list",
            400,
          ),
        );
      }

      /* ---------------------------------------------------- */
      /* Normalize payload                                   */
      /* ---------------------------------------------------- */

      const normalizedAttendance: AttendanceRow[] =
        (
          attendance as AttendanceRow[]
        ).map((row) => ({
          student_id: Number(
            row.student_id,
          ),
          attended: row.attended,
        }));

      /* ---------------------------------------------------- */
      /* Save                                                */
      /* ---------------------------------------------------- */

      const result =
        await StudentAttendanceModel.bulkUpsert(
          {
            class_section_id:
              classSectionId,

            academic_year_id: Number(
              academic_year_id,
            ),

            admin_id,

            teacher_id,

            attendance_date,

            attendance:
              normalizedAttendance,
          },
        );

      res.status(200).json({
        status: "success",

        message:
          "Attendance saved successfully",

        total: result.length,

        data: result,
      });
    },
  );

  /**
   * GET
   * /student-attendence/class/:classSectionId?date=2026-08-18
   */
  static getClassAttendance = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const classSectionId = Number(
        req.params.classSectionId,
      );

      const attendanceDate =
        req.query.date as string;

      if (
        !Number.isInteger(classSectionId) ||
        classSectionId <= 0
      ) {
        return next(
          new AppError(
            "Invalid class section ID",
            400,
          ),
        );
      }

      if (!attendanceDate) {
        return next(
          new AppError(
            "Attendance date is required",
            400,
          ),
        );
      }

      const attendance =
        await StudentAttendanceModel.findByClassAndDate(
          classSectionId,
          attendanceDate,
        );

      res.status(200).json({
        status: "success",
        total: attendance.length,
        data: attendance,
      });
    },
  );

  /**
   * GET
   * /student-attendence/student/:studentId
   */
  static getStudentAttendance =
    catchAsync(
      async (
        req: Request,
        res: Response,
        next: NextFunction,
      ) => {
        const studentId = Number(
          req.params.studentId,
        );

        if (
          !Number.isInteger(studentId) ||
          studentId <= 0
        ) {
          return next(
            new AppError(
              "Invalid student ID",
              400,
            ),
          );
        }

        const attendance =
          await StudentAttendanceModel.findByStudent(
            studentId,
          );

        res.status(200).json({
          status: "success",
          total: attendance.length,
          data: attendance,
        });
      },
    );

  /**
   * DELETE
   * /student-attendence/class/:classSectionId?date=2026-08-18
   */
  static deleteClassAttendance =
    catchAsync(
      async (
        req: Request,
        res: Response,
        next: NextFunction,
      ) => {
        const classSectionId = Number(
          req.params.classSectionId,
        );

        const attendanceDate =
          req.query.date as string;

        if (
          !Number.isInteger(
            classSectionId,
          ) ||
          classSectionId <= 0
        ) {
          return next(
            new AppError(
              "Invalid class section ID",
              400,
            ),
          );
        }

        if (!attendanceDate) {
          return next(
            new AppError(
              "Attendance date is required",
              400,
            ),
          );
        }

        const deletedCount =
          await StudentAttendanceModel.deleteByClassAndDate(
            classSectionId,
            attendanceDate,
          );

        res.status(200).json({
          status: "success",

          message:
            "Attendance deleted successfully",

          deleted: deletedCount,
        });
      },
    );
}