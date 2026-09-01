import { query } from "../db/query.js";

export type ExamStatus = "draft" | "published" | "completed" | "cancelled";
export type ExamStatusFilter = "all" | "trash" | ExamStatus;

export interface Exam {
  id: number;
  name: string;
  exam_type: string;
  class_id: number;
  class_name: string;
  academic_year_id: number;
  start_date: Date;
  end_date: Date;
  status: ExamStatus;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateExamPayload {
  name: string;
  exam_type: string;
  class_id: number;
  academic_year_id: number;
  start_date: string;
  end_date: string;
  status?: ExamStatus;
  description?: string | null;
}

export interface UpdateExamPayload {
  name?: string;
  exam_type?: string;
  class_id?: number;
  start_date?: string;
  end_date?: string;
  status?: ExamStatus;
  description?: string | null;
}

const tableName = "exam";
const selectFields = `
  e.id, e.name, e.exam_type, e.class_id, c.class_name,
  e.academic_year_id, e.start_date, e.end_date, e.status,
  e.description, e.created_at, e.updated_at, e.deleted_at
`;

export class ExamModel {
  static async findByStatus(
    statusFilter: ExamStatusFilter = "all",
  ): Promise<Exam[]> {
    let whereClause = "WHERE e.deleted_at IS NULL";
    const values: ExamStatus[] = [];

    if (statusFilter === "trash") {
      whereClause = "WHERE e.deleted_at IS NOT NULL";
    } else if (statusFilter !== "all") {
      whereClause = "WHERE e.deleted_at IS NULL AND e.status = $1";
      values.push(statusFilter);
    }

    const result = await query<Exam>(
      `
        SELECT ${selectFields}
        FROM ${tableName} e
        INNER JOIN classes c ON c.id = e.class_id
        ${whereClause}
        ORDER BY e.start_date DESC, e.id DESC
      `,
      values,
    );

    return result.rows;
  }

  static async findById(id: number): Promise<Exam | null> {
    const result = await query<Exam>(
      `
        SELECT ${selectFields}
        FROM ${tableName} e
        INNER JOIN classes c ON c.id = e.class_id
        WHERE e.id = $1 AND e.deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  static async create(data: CreateExamPayload): Promise<Exam> {
    const result = await query<{ id: number }>(
      `
        INSERT INTO ${tableName} (
          name, exam_type, class_id, academic_year_id,
          start_date, end_date, status, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        data.name,
        data.exam_type,
        data.class_id,
        data.academic_year_id,
        data.start_date,
        data.end_date,
        data.status ?? "draft",
        data.description ?? null,
      ],
    );

    const exam = result.rows[0] ? await this.findById(result.rows[0].id) : null;

    if (!exam) throw new Error("Exam could not be created.");

    return exam;
  }

  static async update(id: number, data: UpdateExamPayload): Promise<Exam | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let parameterIndex = 1;

    const addUpdate = (column: string, value: unknown) => {
      updates.push(`${column} = $${parameterIndex}`);
      values.push(value);
      parameterIndex += 1;
    };

    if (data.name !== undefined) addUpdate("name", data.name);
    if (data.exam_type !== undefined) addUpdate("exam_type", data.exam_type);
    if (data.class_id !== undefined) addUpdate("class_id", data.class_id);
    if (data.start_date !== undefined) addUpdate("start_date", data.start_date);
    if (data.end_date !== undefined) addUpdate("end_date", data.end_date);
    if (data.status !== undefined) addUpdate("status", data.status);
    if (data.description !== undefined) addUpdate("description", data.description);

    if (updates.length === 0) return this.findById(id);

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const result = await query<{ id: number }>(
      `
        UPDATE ${tableName}
        SET ${updates.join(", ")}
        WHERE id = $${parameterIndex} AND deleted_at IS NULL
        RETURNING id
      `,
      values,
    );

    return result.rows[0] ? this.findById(result.rows[0].id) : null;
  }

  static async softDelete(id: number): Promise<Exam | null> {
    const result = await query<Exam>(
      `
        WITH deleted_exam AS (
          UPDATE ${tableName}
          SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING *
        )
        SELECT ${selectFields}
        FROM deleted_exam e
        INNER JOIN classes c ON c.id = e.class_id
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  static async restore(id: number): Promise<Exam | null> {
    const result = await query<{ id: number }>(
      `
        UPDATE ${tableName}
        SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NOT NULL
        RETURNING id
      `,
      [id],
    );

    return result.rows[0] ? this.findById(result.rows[0].id) : null;
  }

  static async hardDelete(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
