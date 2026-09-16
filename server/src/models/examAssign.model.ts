import { query } from "../db/query.js";

export interface ExamAssign {
  id: number;
  teacher_id: number;
  teacher_name?: string | null;
  employee_code?: string | null;

  exam_id: number;
  exam_name?: string | null;

  subject_id: number;
  subject_name?: string | null;

  academic_year_id: number;
  academic_year_name?: string | null;

  assign_till?: string | null;

  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
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
  academic_year_id?: number;
  assign_till?: string | null;
}

export class ExamAssignModel {
  static async findAll(
    academicYearId: number,
    status: "all" | "trash" = "all"
  ): Promise<ExamAssign[]> {
    const deletedCondition =
      status === "trash" ? "ea.deleted_at IS NOT NULL" : "ea.deleted_at IS NULL";

    const sql = `
      SELECT
        ea.*,
        CONCAT(t.first_name, ' ', COALESCE(t.last_name, '')) AS teacher_name,
        t.employee_code,
        e.name AS exam_name,
        s.name AS subject_name,
        ac.name AS academic_year_name
      FROM exam_assign ea
      INNER JOIN teachers t ON t.id = ea.teacher_id
      INNER JOIN exam e ON e.id = ea.exam_id
      INNER JOIN subjects s ON s.id = ea.subject_id
      INNER JOIN academic_session ac ON ac.id = ea.academic_year_id
      WHERE ea.academic_year_id = $1
        AND ${deletedCondition}
      ORDER BY ea.id DESC
    `;

    const result = await query<ExamAssign>(sql, [academicYearId]);
    return result.rows;
  }

  static async findById(id: number): Promise<ExamAssign | null> {
    const sql = `
      SELECT
        ea.*,
        CONCAT(t.first_name, ' ', COALESCE(t.last_name, '')) AS teacher_name,
        t.employee_code,
        e.name AS exam_name,
        s.name AS subject_name,
        ac.name AS academic_year_name
      FROM exam_assign ea
      INNER JOIN teachers t ON t.id = ea.teacher_id
      INNER JOIN exam e ON e.id = ea.exam_id
      INNER JOIN subjects s ON s.id = ea.subject_id
      INNER JOIN academic_session ac ON ac.id = ea.academic_year_id
      WHERE ea.id = $1
      LIMIT 1
    `;

    const result = await query<ExamAssign>(sql, [id]);
    return result.rows[0] || null;
  }

  static async create(payload: CreateExamAssignPayload): Promise<ExamAssign> {
    const sql = `
      INSERT INTO exam_assign (
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

    return result.rows[0];
  }

  static async update(
    id: number,
    payload: UpdateExamAssignPayload
  ): Promise<ExamAssign | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowedFields = [
      "teacher_id",
      "exam_id",
      "subject_id",
      "academic_year_id",
      "assign_till",
    ] as const;

    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        values.push(payload[field]);
        fields.push(`${field} = $${values.length}`);
      }
    });

    if (!fields.length) {
      return this.findById(id);
    }

    values.push(id);

    const sql = `
      UPDATE exam_assign
      SET
        ${fields.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
        AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query<ExamAssign>(sql, values);
    return result.rows[0] || null;
  }

  static async softDelete(id: number): Promise<ExamAssign | null> {
    const sql = `
      UPDATE exam_assign
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await query<ExamAssign>(sql, [id]);
    return result.rows[0] || null;
  }

  static async restore(id: number): Promise<ExamAssign | null> {
    const sql = `
      UPDATE exam_assign
      SET deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NOT NULL
      RETURNING *
    `;

    const result = await query<ExamAssign>(sql, [id]);
    return result.rows[0] || null;
  }
}