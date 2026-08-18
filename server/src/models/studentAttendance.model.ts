import { query } from "../db/query.js";

const tableName = "student_attendence";

export type AttendanceStatus = "present" | "absent";

export interface StudentAttendance {
  id: number;

  student_id: number;
  academic_year_id: number;

  admin_id: number | null;
  teacher_id: number | null;

  class_section_id: number;

  attendance_date: string;

  attended: AttendanceStatus | null;

  created_at: Date;
  updated_at: Date;
}

export interface AttendanceRow {
  student_id: number;
  attended: AttendanceStatus;
}

export interface BulkAttendancePayload {
  class_section_id: number;
  academic_year_id: number;

  admin_id: number | null;
  teacher_id: number | null;

  attendance_date: string;
  attendance: AttendanceRow[];
}

export class StudentAttendanceModel {

  static async bulkUpsert(
    payload: BulkAttendancePayload,
  ): Promise<StudentAttendance[]> {
    const {
      class_section_id,
      academic_year_id,
      admin_id,
      teacher_id,
      attendance_date,
      attendance,
    } = payload;

    if (!attendance.length) {
      return [];
    }

    const values: unknown[] = [];
    const placeholders: string[] = [];

    attendance.forEach((row, index) => {
      const offset = index * 7;

      placeholders.push(`
        (
          $${offset + 1},
          $${offset + 2},
          $${offset + 3},
          $${offset + 4},
          $${offset + 5},
          $${offset + 6},
          $${offset + 7}
        )
      `);

      values.push(
        row.student_id,
        academic_year_id,
        admin_id,
        teacher_id,
        class_section_id,
        attendance_date,
        row.attended,
      );
    });

    const sql = `
      INSERT INTO ${tableName} (
        student_id,
        academic_year_id,
        admin_id,
        teacher_id,
        class_section_id,
        attendance_date,
        attended
      )
      VALUES ${placeholders.join(", ")}

      ON CONFLICT (
        student_id,
        academic_year_id,
        class_section_id,
        attendance_date
      )
      DO UPDATE SET
        attended = EXCLUDED.attended,
        admin_id = EXCLUDED.admin_id,
        teacher_id = EXCLUDED.teacher_id,
        updated_at = CURRENT_TIMESTAMP

      RETURNING *;
    `;

    const result = await query<StudentAttendance>(
      sql,
      values,
    );

    return result.rows;
  }

  /**
   * Get attendance of a class for a particular date.
   */
  static async findByClassAndDate(
    classSectionId: number,
    attendanceDate: string,
  ): Promise<StudentAttendance[]> {
    const result = await query<StudentAttendance>(
      `
        SELECT *
        FROM ${tableName}
        WHERE class_section_id = $1
          AND attendance_date = $2
        ORDER BY student_id ASC
      `,
      [classSectionId, attendanceDate],
    );

    return result.rows;
  }

  /**
   * Get attendance history of a student.
   */
  static async findByStudent(
    studentId: number,
  ): Promise<StudentAttendance[]> {
    const result = await query<StudentAttendance>(
      `
        SELECT *
        FROM ${tableName}
        WHERE student_id = $1
        ORDER BY attendance_date DESC
      `,
      [studentId],
    );

    return result.rows;
  }

  /**
   * Get single student attendance.
   */
  static async findStudentAttendance(
    studentId: number,
    classSectionId: number,
    academicYearId: number,
    attendanceDate: string,
  ): Promise<StudentAttendance | null> {
    const result = await query<StudentAttendance>(
      `
        SELECT *
        FROM ${tableName}
        WHERE student_id = $1
          AND class_section_id = $2
          AND academic_year_id = $3
          AND attendance_date = $4
        LIMIT 1
      `,
      [
        studentId,
        classSectionId,
        academicYearId,
        attendanceDate,
      ],
    );

    return result.rows[0] || null;
  }

  /**
   * Delete attendance for a complete class/day.
   */
  static async deleteByClassAndDate(
    classSectionId: number,
    attendanceDate: string,
  ): Promise<number> {
    const result = await query(
      `
        DELETE FROM ${tableName}
        WHERE class_section_id = $1
          AND attendance_date = $2
      `,
      [classSectionId, attendanceDate],
    );

    return result.rowCount || 0;
  }
}