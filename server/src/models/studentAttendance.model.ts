import { query } from "../db/query.js";

const tableName = "student_attendence";

export type AttendanceStatus = "p" | "a";

export interface StudentAttendance {
  id: number;
  student_id: number;
  attend_by: number;
  class_section_id: number;
  attendance_date: string;
  attended: AttendanceStatus;
  created_at: Date;
  updated_at: Date;
}

export interface AttendanceRow {
  student_id: number;
  attended: AttendanceStatus;
}

export interface BulkAttendancePayload {
  class_section_id: number;
  attend_by: number;
  attendance_date: string;
  attendance: AttendanceRow[];
}

export class StudentAttendanceModel {
  /**
   * Insert/update attendance for multiple students.
   *
   * Requires unique constraint/index on:
   * student_id + class_section_id + attendance_date
   */
  static async bulkUpsert(
    payload: BulkAttendancePayload
  ): Promise<StudentAttendance[]> {
    const {
      class_section_id,
      attend_by,
      attendance_date,
      attendance,
    } = payload;

    if (!attendance.length) {
      return [];
    }

    const values: any[] = [];
    const placeholders: string[] = [];

    attendance.forEach((row, index) => {
      const offset = index * 5;

      placeholders.push(
        `(
          $${offset + 1},
          $${offset + 2},
          $${offset + 3},
          $${offset + 4},
          $${offset + 5}
        )`
      );

      values.push(
        row.student_id,
        attend_by,
        class_section_id,
        attendance_date,
        row.attended
      );
    });

    const sql = `
      INSERT INTO ${tableName} (
        student_id,
        attend_by,
        class_section_id,
        attendance_date,
        attended
      )
      VALUES ${placeholders.join(",")}
      
      ON CONFLICT (
        student_id,
        class_section_id,
        attendance_date
      )
      DO UPDATE SET
        attended = EXCLUDED.attended,
        attend_by = EXCLUDED.attend_by,
        updated_at = CURRENT_TIMESTAMP

      RETURNING *;
    `;

    const result = await query<StudentAttendance>(sql, values);

    return result.rows;
  }

  /**
   * Get attendance of a class for a particular date.
   */
  static async findByClassAndDate(
    classSectionId: number,
    attendanceDate: string
  ): Promise<StudentAttendance[]> {
    const result = await query<StudentAttendance>(
      `
      SELECT *
      FROM ${tableName}
      WHERE class_section_id = $1
        AND attendance_date = $2
      ORDER BY student_id ASC
      `,
      [classSectionId, attendanceDate]
    );

    return result.rows;
  }

  /**
   * Get attendance history of a student.
   */
  static async findByStudent(
    studentId: number
  ): Promise<StudentAttendance[]> {
    const result = await query<StudentAttendance>(
      `
      SELECT *
      FROM ${tableName}
      WHERE student_id = $1
      ORDER BY attendance_date DESC
      `,
      [studentId]
    );

    return result.rows;
  }

  /**
   * Get single student's attendance for a date.
   */
  static async findStudentAttendance(
    studentId: number,
    classSectionId: number,
    attendanceDate: string
  ): Promise<StudentAttendance | null> {
    const result = await query<StudentAttendance>(
      `
      SELECT *
      FROM ${tableName}
      WHERE student_id = $1
        AND class_section_id = $2
        AND attendance_date = $3
      LIMIT 1
      `,
      [studentId, classSectionId, attendanceDate]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete attendance for a complete class/day.
   */
  static async deleteByClassAndDate(
    classSectionId: number,
    attendanceDate: string
  ): Promise<number> {
    const result = await query(
      `
      DELETE FROM ${tableName}
      WHERE class_section_id = $1
        AND attendance_date = $2
      `,
      [classSectionId, attendanceDate]
    );

    return result.rowCount || 0;
  }
}