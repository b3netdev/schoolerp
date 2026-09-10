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


const getAcademicYearIdFromSession = (req: Request): number => {
  const academicYearId = Number(req.user?.academic_year_id);

  if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
    throw new AppError(
      "Academic year is missing from authenticated session",
      400,
    );
  }

  return academicYearId;
};

export class StudentAttendanceController {
  
  static bulkSave = catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const attendanceReq =
        req;
        // console.log(req)
        // return
      const {
        class_section_id,
        attendance_date,
        attendance,
      } = req.body;

      
      const userId = Number(attendanceReq.userId);
      const userRole = attendanceReq.user?.role;
      const admin_id = userRole === "admin" && Number.isInteger(userId) ? userId : null;
      const teacher_id = userRole === "teacher" && Number.isInteger(userId) ? userId : null;
      const academic_year_id = getAcademicYearIdFromSession(req);

   

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

      if (!attendance_date) {
        return next(
          new AppError(
            "Attendance date is required",
            400,
          ),
        );
      }

    

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

      

      const normalizedAttendance: AttendanceRow[] =
        (
          attendance as AttendanceRow[]
        ).map((row) => ({
          student_id: Number(
            row.student_id,
          ),
          attended: row.attended,
        }));

     

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

      const academicYearId = getAcademicYearIdFromSession(req);
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
          academicYearId,
        );

      res.status(200).json({
        status: "success",
        total: attendance.length,
        data: attendance,
      });
    },
  );

  
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

        const academicYearId = getAcademicYearIdFromSession(req);

        const attendance =
          await StudentAttendanceModel.findByStudent(
            studentId,
            academicYearId,
          );

        res.status(200).json({
          status: "success",
          total: attendance.length,
          data: attendance,
        });
      },
    );

  
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
        const academicYearId = getAcademicYearIdFromSession(req);

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
            academicYearId,
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