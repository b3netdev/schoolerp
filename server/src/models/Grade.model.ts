import pool from "../config/database.js";

export type GradeStatus =
  | "active"
  | "trash"
  | "all";

export interface Grade {
  id: number;
  grade: string;
  class_id: number;
  class_name?: string;
  range_from: number | null;
  range_to: number | null;
  remarks: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface GradePayload {
  grade: string;
  class_id: number;
  range_from: number | null;
  range_to: number | null;
  remarks: string | null;
  description: string | null;
}

export class GradeModel {
  static async classExists(
    classId: number,
  ): Promise<boolean> {
    const result = await pool.query(
      `
        SELECT id
        FROM public.classes
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [classId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  static async findAll(
    classId?: number,
    status: GradeStatus = "active",
  ): Promise<Grade[]> {
    const values: number[] = [];
    const conditions: string[] = [];

    if (status === "active") {
      conditions.push(
        "g.deleted_at IS NULL",
      );
    }

    if (status === "trash") {
      conditions.push(
        "g.deleted_at IS NOT NULL",
      );
    }

    if (classId) {
      values.push(classId);
      conditions.push(
        `g.class_id = $${values.length}`,
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query<Grade>(
      `
        SELECT
          g.*,
          c.class_name
        FROM public.grade g
        INNER JOIN public.classes c
          ON c.id = g.class_id
        ${whereClause}
        ORDER BY
          c.class_name ASC,
          g.range_from DESC NULLS LAST,
          g.id DESC
      `,
      values,
    );

    return result.rows;
  }

  static async findById(
    id: number,
    includeTrash = false,
  ): Promise<Grade | null> {
    const result = await pool.query<Grade>(
      `
        SELECT *
        FROM public.grade
        WHERE id = $1
        ${
          includeTrash
            ? ""
            : "AND deleted_at IS NULL"
        }
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async findDuplicate(
    grade: string,
    classId: number,
    excludeId?: number,
  ): Promise<Grade | null> {
    const values: (string | number)[] = [
      grade.trim(),
      classId,
    ];

    let sql = `
      SELECT *
      FROM public.grade
      WHERE LOWER(TRIM(grade)) =
            LOWER(TRIM($1))
        AND class_id = $2
        AND deleted_at IS NULL
    `;

    if (excludeId) {
      values.push(excludeId);

      sql += `
        AND id != $3
      `;
    }

    const result = await pool.query<Grade>(
      sql,
      values,
    );

    return result.rows[0] || null;
  }

  static async createBulk(
    grades: GradePayload[],
  ): Promise<Grade[]> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const createdGrades: Grade[] = [];

      for (const item of grades) {
        const result =
          await client.query<Grade>(
            `
              INSERT INTO public.grade (
                grade,
                class_id,
                range_from,
                range_to,
                remarks,
                description
              )
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING *
            `,
            [
              item.grade,
              item.class_id,
              item.range_from,
              item.range_to,
              item.remarks,
              item.description,
            ],
          );

        createdGrades.push(
          result.rows[0],
        );
      }

      await client.query("COMMIT");

      return createdGrades;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(
    id: number,
    payload: GradePayload,
  ): Promise<Grade | null> {
    const result = await pool.query<Grade>(
      `
        UPDATE public.grade
        SET
          grade = $1,
          class_id = $2,
          range_from = $3,
          range_to = $4,
          remarks = $5,
          description = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        payload.grade,
        payload.class_id,
        payload.range_from,
        payload.range_to,
        payload.remarks,
        payload.description,
        id,
      ],
    );

    return result.rows[0] || null;
  }

  static async softDelete(
    id: number,
  ): Promise<Grade | null> {
    const result = await pool.query<Grade>(
      `
        UPDATE public.grade
        SET
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async restore(
    id: number,
  ): Promise<Grade | null> {
    const result = await pool.query<Grade>(
      `
        UPDATE public.grade
        SET
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING *
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async hardDelete(
    id: number,
  ): Promise<Grade | null> {
    const result = await pool.query<Grade>(
      `
        DELETE FROM public.grade
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING *
      `,
      [id],
    );

    return result.rows[0] || null;
  }
}