import pool from "../config/database.js";

export interface Grade {
  id: number;
  grade: string;
  range_from: number | null;
  range_to: number | null;
  remarks: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateGradePayload {
  grade: string;
  range_from?: number | null;
  range_to?: number | null;
  remarks?: string | null;
  description?: string | null;
}

export interface UpdateGradePayload extends Partial<CreateGradePayload> {}

export class GradeModel {
  static async findAll(): Promise<Grade[]> {
    const result = await pool.query<Grade>(
      `SELECT *
       FROM grade
       WHERE deleted_at IS NULL
       ORDER BY range_from DESC NULLS LAST, id DESC`
    );

    return result.rows;
  }

  static async findById(id: number): Promise<Grade | null> {
    const result = await pool.query<Grade>(
      `SELECT *
       FROM grade
       WHERE id = $1
         AND deleted_at IS NULL`,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByGradeName(
    grade: string,
    excludeId?: number
  ): Promise<Grade | null> {
    const values: (string | number)[] = [grade.trim()];

    let query = `
      SELECT *
      FROM grade
      WHERE LOWER(grade) = LOWER($1)
        AND deleted_at IS NULL
    `;

    if (excludeId) {
      query += ` AND id != $2`;
      values.push(excludeId);
    }

    const result = await pool.query<Grade>(query, values);
    return result.rows[0] || null;
  }

  static async create(payload: CreateGradePayload): Promise<Grade> {
    const result = await pool.query<Grade>(
      `INSERT INTO grade (
        grade,
        range_from,
        range_to,
        remarks,
        description
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        payload.grade.trim(),
        payload.range_from ?? null,
        payload.range_to ?? null,
        payload.remarks?.trim() || null,
        payload.description?.trim() || null,
      ]
    );

    return result.rows[0];
  }

  static async update(
    id: number,
    payload: UpdateGradePayload
  ): Promise<Grade | null> {
    const result = await pool.query<Grade>(
      `UPDATE grade
       SET
         grade = COALESCE($1, grade),
         range_from = $2,
         range_to = $3,
         remarks = $4,
         description = $5,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
         AND deleted_at IS NULL
       RETURNING *`,
      [
        payload.grade?.trim() || null,
        payload.range_from ?? null,
        payload.range_to ?? null,
        payload.remarks?.trim() || null,
        payload.description?.trim() || null,
        id,
      ]
    );

    return result.rows[0] || null;
  }

  static async softDelete(id: number): Promise<Grade | null> {
    const result = await pool.query<Grade>(
      `UPDATE grade
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );

    return result.rows[0] || null;
  }
}