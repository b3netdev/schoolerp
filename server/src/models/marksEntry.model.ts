import { query } from "../db/query.js";

export type AttendanceStatus = "present" | "absent";
export type EnteredRole = "admin" | "teacher";
export type MarksEntryStatus = "all" | "trash";

export interface MarksEntry {
  id: number;

  exam_assign_id: number;
  exam_id: number;
  exam_name?: string | null;

  student_id: number;
  student_name?: string | null;
  student_unique_id?: string | null;

  subject_id: number;
  subject_name?: string | null;

  academic_year_id: number;

  entered_by_user_id: number | null;
  entered_by_teacher_id: number | null;
  entered_role: EnteredRole;
  entered_by_name?: string | null;

  mark_obtained: number | null;
  attendance_status: AttendanceStatus;
  remarks: string | null;

  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ExamAssignmentDetails {
  id: number;
  teacher_id: number;
  exam_id: number;
  subject_id: number;
  academic_year_id: number;
  assign_till: Date | null;
}

export interface CreateMarksEntryPayload {
  exam_assign_id: number;
  exam_id: number;
  student_id: number;
  subject_id: number;
  academic_year_id: number;

  entered_by_user_id: number | null;
  entered_by_teacher_id: number | null;
  entered_role: EnteredRole;

  mark_obtained: number | null;
  attendance_status: AttendanceStatus;
  remarks: string | null;
}

export interface UpdateMarksEntryPayload {
  entered_by_user_id: number | null;
  entered_by_teacher_id: number | null;
  entered_role: EnteredRole;

  mark_obtained: number | null;
  attendance_status: AttendanceStatus;
  remarks: string | null;
}

export interface MarksEntryFilters {
  status?: MarksEntryStatus;
  exam_assign_id?: number;
  exam_id?: number;
  subject_id?: number;
  student_id?: number;
  teacher_id?: number;
}

export class MarksEntryModel {
  static async findAssignment(
    examAssignId: number,
    academicYearId: number,
  ): Promise<ExamAssignmentDetails | null> {
    const sql = `
      SELECT
        id,
        teacher_id,
        exam_id,
        subject_id,
        academic_year_id,
        assign_till
      FROM public.exam_assign
      WHERE id = $1
        AND academic_year_id = $2
        AND deleted_at IS NULL
      LIMIT 1
    `;

    const result = await query<ExamAssignmentDetails>(sql, [
      examAssignId,
      academicYearId,
    ]);

    return result.rows[0] || null;
  }

  static async findAll(
    academicYearId: number,
    filters: MarksEntryFilters = {},
  ): Promise<MarksEntry[]> {
    const values: unknown[] = [academicYearId];

    let sql = `
      SELECT
        me.*,
        e.name AS exam_name,
        sub.name AS subject_name,
        CONCAT_WS(' ', st.first_name, st.last_name) AS student_name,
        st.student_code AS student_unique_id,
        COALESCE(
          u.name,
          CONCAT_WS(' ', t.first_name, t.last_name)
        ) AS entered_by_name
      FROM public.marks_entry me
      INNER JOIN public.exam e ON e.id = me.exam_id
      INNER JOIN public.subjects sub ON sub.id = me.subject_id
      INNER JOIN public.students st ON st.id = me.student_id
      LEFT JOIN public.users u ON u.id = me.entered_by_user_id
      LEFT JOIN public.teachers t ON t.id = me.entered_by_teacher_id
      WHERE me.academic_year_id = $1
    `;

    if (filters.status === "trash") {
      sql += ` AND me.deleted_at IS NOT NULL`;
    } else {
      sql += ` AND me.deleted_at IS NULL`;
    }

    if (filters.exam_assign_id) {
      values.push(filters.exam_assign_id);
      sql += ` AND me.exam_assign_id = $${values.length}`;
    }

    if (filters.exam_id) {
      values.push(filters.exam_id);
      sql += ` AND me.exam_id = $${values.length}`;
    }

    if (filters.subject_id) {
      values.push(filters.subject_id);
      sql += ` AND me.subject_id = $${values.length}`;
    }

    if (filters.student_id) {
      values.push(filters.student_id);
      sql += ` AND me.student_id = $${values.length}`;
    }

    // Teacher can view only marks for their assigned exam-subject.
    if (filters.teacher_id) {
      values.push(filters.teacher_id);

      sql += `
        AND EXISTS (
          SELECT 1
          FROM public.exam_assign ea
          WHERE ea.id = me.exam_assign_id
            AND ea.teacher_id = $${values.length}
            AND ea.deleted_at IS NULL
        )
      `;
    }

    sql += ` ORDER BY me.student_id ASC, me.id DESC`;

    const result = await query<MarksEntry>(sql, values);
    return result.rows;
  }

  static async findById(
    id: number,
    academicYearId: number,
  ): Promise<MarksEntry | null> {
    const sql = `
      SELECT
        me.*,
        e.name AS exam_name,
        sub.name AS subject_name,
        CONCAT_WS(' ', st.first_name, st.last_name) AS student_name,
        st.student_code AS student_unique_id,
        COALESCE(
          u.name,
          CONCAT_WS(' ', t.first_name, t.last_name)
        ) AS entered_by_name
      FROM public.marks_entry me
      INNER JOIN public.exam e ON e.id = me.exam_id
      INNER JOIN public.subjects sub ON sub.id = me.subject_id
      INNER JOIN public.students st ON st.id = me.student_id
      LEFT JOIN public.users u ON u.id = me.entered_by_user_id
      LEFT JOIN public.teachers t ON t.id = me.entered_by_teacher_id
      WHERE me.id = $1
        AND me.academic_year_id = $2
      LIMIT 1
    `;

    const result = await query<MarksEntry>(sql, [id, academicYearId]);
    return result.rows[0] || null;
  }

  static async create(
    payload: CreateMarksEntryPayload,
  ): Promise<MarksEntry> {
    const sql = `
      INSERT INTO public.marks_entry (
        exam_assign_id,
        exam_id,
        student_id,
        subject_id,
        academic_year_id,
        entered_by_user_id,
        entered_by_teacher_id,
        entered_role,
        mark_obtained,
        attendance_status,
        remarks
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )
      RETURNING *
    `;

    const result = await query<MarksEntry>(sql, [
      payload.exam_assign_id,
      payload.exam_id,
      payload.student_id,
      payload.subject_id,
      payload.academic_year_id,
      payload.entered_by_user_id,
      payload.entered_by_teacher_id,
      payload.entered_role,
      payload.mark_obtained,
      payload.attendance_status,
      payload.remarks,
    ]);

    return result.rows[0];
  }

  static async update(
    id: number,
    academicYearId: number,
    payload: UpdateMarksEntryPayload,
  ): Promise<MarksEntry | null> {
    const sql = `
      UPDATE public.marks_entry
      SET
        entered_by_user_id = $1,
        entered_by_teacher_id = $2,
        entered_role = $3,
        mark_obtained = $4,
        attendance_status = $5,
        remarks = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
        AND academic_year_id = $8
        AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query<MarksEntry>(sql, [
      payload.entered_by_user_id,
      payload.entered_by_teacher_id,
      payload.entered_role,
      payload.mark_obtained,
      payload.attendance_status,
      payload.remarks,
      id,
      academicYearId,
    ]);

    return result.rows[0] || null;
  }

  static async softDelete(
    id: number,
    academicYearId: number,
  ): Promise<MarksEntry | null> {
    const sql = `
      UPDATE public.marks_entry
      SET
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND academic_year_id = $2
        AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query<MarksEntry>(sql, [id, academicYearId]);
    return result.rows[0] || null;
  }
}