import { query } from "../db/query.js";

export type SubjectTypeStatus = "all" | "active" | "trash";

export interface SubjectType {
  id: number;
  title: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class SubjectTypeModel {
  static async getAll(
    status: SubjectTypeStatus = "active",
  ): Promise<SubjectType[]> {
    let whereClause = "";

    if (status === "active") {
      whereClause = "WHERE deleted_at IS NULL";
    }

    if (status === "trash") {
      whereClause = "WHERE deleted_at IS NOT NULL";
    }

    const result = await query<SubjectType>(
      `
        SELECT
          id,
          title,
          created_at,
          updated_at,
          deleted_at
        FROM public.subject_type
        ${whereClause}
        ORDER BY title ASC
      `,
    );

    return result.rows;
  }

  static async getById(
    id: number,
  ): Promise<SubjectType | null> {
    const result = await query<SubjectType>(
      `
        SELECT
          id,
          title,
          created_at,
          updated_at,
          deleted_at
        FROM public.subject_type
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async create(
    title: string,
  ): Promise<SubjectType> {
    const result = await query<SubjectType>(
      `
        INSERT INTO public.subject_type (
          title
        )
        VALUES ($1)
        RETURNING
          id,
          title,
          created_at,
          updated_at,
          deleted_at
      `,
      [title],
    );

    return result.rows[0];
  }

  static async update(
    id: number,
    title: string,
  ): Promise<SubjectType | null> {
    const result = await query<SubjectType>(
      `
        UPDATE public.subject_type
        SET
          title = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND deleted_at IS NULL
        RETURNING
          id,
          title,
          created_at,
          updated_at,
          deleted_at
      `,
      [title, id],
    );

    return result.rows[0] || null;
  }

  static async softDelete(
    id: number,
  ): Promise<SubjectType | null> {
    const result = await query<SubjectType>(
      `
        UPDATE public.subject_type
        SET
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING
          id,
          title,
          created_at,
          updated_at,
          deleted_at
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async restore(
    id: number,
  ): Promise<SubjectType | null> {
    const result = await query<SubjectType>(
      `
        UPDATE public.subject_type
        SET
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING
          id,
          title,
          created_at,
          updated_at,
          deleted_at
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async hardDelete(
    id: number,
  ): Promise<SubjectType | null> {
    const result = await query<SubjectType>(
      `
        DELETE FROM public.subject_type
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING
          id,
          title,
          created_at,
          updated_at,
          deleted_at
      `,
      [id],
    );

    return result.rows[0] || null;
  }
}