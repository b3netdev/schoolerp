import { query } from "../db/query.js";

export type ExamAssignStatus = "all" | "trash";

export interface ExamAssign {
  id: number;

  teacher_id: number;
  teacher_name?: string | null;
  employee_code?: string | null;

  exam_id: number;
  exam_name?: string | null;

  subject_id: number;
  subject_name?: string | null;

  class_section_id?: number;
  class_id?: number;
  class_name?: string | null;
  section_id?: number;
  section_name?: string | null;
  section_stream?: string | null;

  academic_year_id: number;
  academic_year_name?: string | null;

  assign_till: Date | null;

  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateExamAssignPayload {
  teacher_id: number;
  exam_id: number;
  subject_id: number;
  academic_year_id: number;
  assign_till?: string | null;
}

export interface UpdateExamAssignPayload {
  teacher_id?: number;
  exam_id?: number;
  subject_id?: number;
  assign_till?: string | null;
}

export class ExamAssignModel {
  static async findAll(
    academicYearId: number,
    status: ExamAssignStatus = "all",
    teacherId?: number,
  ): Promise<ExamAssign[]> {
    const values: number[] = [academicYearId];

    let sql = `
      SELECT
        ea.*,
        CONCAT(t.first_name, ' ', COALESCE(t.last_name, '')) AS teacher_name,
        t.employee_code,
        e.name AS exam_name,
        s.name AS subject_name,
        csr.id AS class_section_id,
        csr.class_id,
        c.class_name,
        csr.section_id,
        sec.name AS section_name,
        stream.name AS section_stream,
        ac.name AS academic_year_name
      FROM public.exam_assign ea
      INNER JOIN public.teachers t ON t.id = ea.teacher_id
      INNER JOIN public.exam e ON e.id = ea.exam_id
      INNER JOIN public.subjects s ON s.id = ea.subject_id
      INNER JOIN public.class_section_relation csr ON csr.id = s.class_section_id
      INNER JOIN public.classes c ON c.id = csr.class_id
      INNER JOIN public.section sec ON sec.id = csr.section_id
      LEFT JOIN public.stream stream ON stream.id = sec.stream_id
      INNER JOIN public.academic_session ac ON ac.id = ea.academic_year_id
      WHERE ea.academic_year_id = $1
    `;

    if (status === "trash") {
      sql += ` AND ea.deleted_at IS NOT NULL`;
    } else {
      sql += ` AND ea.deleted_at IS NULL`;
    }

    // Teacher can view only their own assignments.
    if (teacherId) {
      values.push(teacherId);
      sql += ` AND ea.teacher_id = $${values.length}`;
    }

    sql += ` ORDER BY ea.id DESC`;

    const result = await query<ExamAssign>(sql, values);
    return result.rows;
  }

  static async findById(
    id: number,
    academicYearId: number,
  ): Promise<ExamAssign | null> {
    const sql = `
      SELECT
        ea.*,
        CONCAT(t.first_name, ' ', COALESCE(t.last_name, '')) AS teacher_name,
        t.employee_code,
        e.name AS exam_name,
        s.name AS subject_name,
        csr.id AS class_section_id,
        csr.class_id,
        c.class_name,
        csr.section_id,
        sec.name AS section_name,
        stream.name AS section_stream,
        ac.name AS academic_year_name
      FROM public.exam_assign ea
      INNER JOIN public.teachers t ON t.id = ea.teacher_id
      INNER JOIN public.exam e ON e.id = ea.exam_id
      INNER JOIN public.subjects s ON s.id = ea.subject_id
      INNER JOIN public.class_section_relation csr ON csr.id = s.class_section_id
      INNER JOIN public.classes c ON c.id = csr.class_id
      INNER JOIN public.section sec ON sec.id = csr.section_id
      LEFT JOIN public.stream stream ON stream.id = sec.stream_id
      INNER JOIN public.academic_session ac ON ac.id = ea.academic_year_id
      WHERE ea.id = $1
        AND ea.academic_year_id = $2
      LIMIT 1
    `;

    const result = await query<ExamAssign>(sql, [id, academicYearId]);
    return result.rows[0] || null;
  }

  static async create(
    payload: CreateExamAssignPayload,
  ): Promise<ExamAssign> {
    const sql = `
      INSERT INTO public.exam_assign (
        teacher_id,
        exam_id,
        subject_id,
        academic_year_id,
        assign_till
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query<ExamAssign>(sql, [
      payload.teacher_id,
      payload.exam_id,
      payload.subject_id,
      payload.academic_year_id,
      payload.assign_till || null,
    ]);

    const assignment = await this.findById(
      result.rows[0].id,
      payload.academic_year_id,
    );

    if (!assignment) {
      throw new Error("Created exam assignment could not be reloaded.");
    }

    return assignment;
  }

  static async update(
    id: number,
    academicYearId: number,
    payload: UpdateExamAssignPayload,
  ): Promise<ExamAssign | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (payload.teacher_id !== undefined) {
      values.push(payload.teacher_id);
      fields.push(`teacher_id = $${values.length}`);
    }

    if (payload.exam_id !== undefined) {
      values.push(payload.exam_id);
      fields.push(`exam_id = $${values.length}`);
    }

    if (payload.subject_id !== undefined) {
      values.push(payload.subject_id);
      fields.push(`subject_id = $${values.length}`);
    }

    if (payload.assign_till !== undefined) {
      values.push(payload.assign_till || null);
      fields.push(`assign_till = $${values.length}`);
    }

    if (!fields.length) {
      return this.findById(id, academicYearId);
    }

    values.push(id);
    values.push(academicYearId);

    const sql = `
      UPDATE public.exam_assign
      SET
        ${fields.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length - 1}
        AND academic_year_id = $${values.length}
        AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query<ExamAssign>(sql, values);

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(result.rows[0].id, academicYearId);
  }

  static async softDelete(
    id: number,
    academicYearId: number,
  ): Promise<ExamAssign | null> {
    const sql = `
      UPDATE public.exam_assign
      SET
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND academic_year_id = $2
        AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query<ExamAssign>(sql, [id, academicYearId]);

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(result.rows[0].id, academicYearId);
  }

  static async restore(
    id: number,
    academicYearId: number,
  ): Promise<ExamAssign | null> {
    const sql = `
      UPDATE public.exam_assign
      SET
        deleted_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND academic_year_id = $2
        AND deleted_at IS NOT NULL
      RETURNING *
    `;

    const result = await query<ExamAssign>(sql, [id, academicYearId]);

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(result.rows[0].id, academicYearId);
  }

  static async hardDelete(
    id: number,
    academicYearId: number,
  ): Promise<boolean> {
    const result = await query<{ id: number }>(
      `
      DELETE FROM public.exam_assign
      WHERE id = $1
        AND academic_year_id = $2
        AND deleted_at IS NOT NULL
      RETURNING id
    `,
      [id, academicYearId],
    );

    return Boolean(result.rows[0]);
  }
}