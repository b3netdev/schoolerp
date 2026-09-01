import { query } from "../db/query.js";

export type ExamStatus =
  | "draft"
  | "published"
  | "completed"
  | "cancelled";

export interface Exam {
  id: number;
  name: string;
  exam_type: string;
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
  academic_year_id: number;
  start_date: string;
  end_date: string;
  status?: ExamStatus;
  description?: string | null;
}

export interface UpdateExamPayload {
  name?: string;
  exam_type?: string;
  start_date?: string;
  end_date?: string;
  status?: ExamStatus;
  description?: string | null;
}

export type ExamStatusFilter = "all" | "active" | "trash" | ExamStatus;

const tableName = "exam";
const returningFields = `
  id,
  name,
  exam_type,
  academic_year_id,
  start_date,
  end_date,
  status,
  description,
  created_at,
  updated_at,
  deleted_at
`;

export class ExamModel {
  static async findByStatus(statusFilter: ExamStatusFilter = "all"): Promise<Exam[]> {
    let whereClause = "WHERE deleted_at IS NULL";
    const values: string[] = [];

    if (statusFilter === "trash") {
      whereClause = "WHERE deleted_at IS NOT NULL";
    } else if (statusFilter !== "all" && statusFilter !== "active") {
      whereClause = "WHERE deleted_at IS NULL AND status = $1";
      values.push(statusFilter);
    }

    const result = await query<Exam>(
      `
        SELECT ${returningFields}
        FROM ${tableName}
        ${whereClause}
        ORDER BY start_date DESC, id DESC
      `,
      values,
    );

    return result.rows;
  }

  static async findById(id: number): Promise<Exam | null> {
    const result = await query<Exam>(
      `
        SELECT ${returningFields}
        FROM ${tableName}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  static async create(data: CreateExamPayload): Promise<Exam> {
    const result = await query<Exam>(
      `
        INSERT INTO ${tableName} (
          name,
          exam_type,
          academic_year_id,
          start_date,
          end_date,
          status,
          description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING ${returningFields}
      `,
      [
        data.name,
        data.exam_type,
        data.academic_year_id,
        data.start_date,
        data.end_date,
        data.status ?? "draft",
        data.description ?? null,
      ],
    );

    return result.rows[0];
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
    if (data.start_date !== undefined) addUpdate("start_date", data.start_date);
    if (data.end_date !== undefined) addUpdate("end_date", data.end_date);
    if (data.status !== undefined) addUpdate("status", data.status);
    if (data.description !== undefined) addUpdate("description", data.description);

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const result = await query<Exam>(
      `
        UPDATE ${tableName}
        SET ${updates.join(", ")}
        WHERE id = $${parameterIndex}
          AND deleted_at IS NULL
        RETURNING ${returningFields}
      `,
      values,
    );

    return result.rows[0] ?? null;
  }

  static async softDelete(id: number): Promise<Exam | null> {
    const result = await query<Exam>(
      `
        UPDATE ${tableName}
        SET
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING ${returningFields}
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  static async restore(id: number): Promise<Exam | null> {
    const result = await query<Exam>(
      `
        UPDATE ${tableName}
        SET
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING ${returningFields}
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  static async hardDelete(id: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${tableName} WHERE id = $1`,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
