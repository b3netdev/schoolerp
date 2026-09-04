import { query } from "../db/query.js";

export type NoticeFor = "student" | "teacher" | "admin";
export type NoticeStatus = "all" | "active" | "trash";

export interface Notice {
  id: number;
  notice_for: NoticeFor;
  posted_by: number;
  posted_by_name?: string | null;

  title: string;
  description: string;

  academic_year_id: number;

  class_id: number;
  class_name?: string;

  section_id: number;
  section_name?: string;

  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateNoticePayload {
  notice_for: NoticeFor;
  title: string;
  description: string;
  class_id: number;

  /*
    Optional from frontend.
    If empty, controller finds all sections of the class.
  */
  section_id?: number;
}

export interface UpdateNoticePayload {
  notice_for?: NoticeFor;
  title?: string;
  description?: string;
  class_id?: number;
  section_id?: number;
}

export interface NoticeFilters {
  status?: NoticeStatus;
  notice_for?: NoticeFor;
  class_id?: number;
  section_id?: number;
  date?: string;
}

const tableName = "notice";

export class NoticeModel {
  static async findAll(
    academicYearId: number,
    filters: NoticeFilters = {},
  ): Promise<Notice[]> {
    const values: unknown[] = [academicYearId];

    const conditions: string[] = [
      "n.academic_year_id = $1",
    ];

    if (filters.status === "trash") {
      conditions.push("n.deleted_at IS NOT NULL");
    } else {
      /*
        "all" and "active" both show non-deleted notices.
      */
      conditions.push("n.deleted_at IS NULL");
    }

    if (filters.notice_for) {
      values.push(filters.notice_for);
      conditions.push(`n.notice_for = $${values.length}`);
    }

    if (filters.class_id) {
      values.push(filters.class_id);
      conditions.push(`n.class_id = $${values.length}`);
    }

    if (filters.section_id) {
      values.push(filters.section_id);
      conditions.push(`n.section_id = $${values.length}`);
    }

    if (filters.date) {
      values.push(filters.date);
      conditions.push(
        `n.created_at::date = $${values.length}::date`,
      );
    }

    const result = await query<Notice>(
      `
        SELECT
          n.*,
          c.class_name,
          s.name AS section_name,
          u.name AS posted_by_name
        FROM public.${tableName} n
        INNER JOIN public.classes c
          ON c.id = n.class_id
        INNER JOIN public.section s
          ON s.id = n.section_id
        LEFT JOIN public.users u
          ON u.id = n.posted_by
        WHERE ${conditions.join(" AND ")}
        ORDER BY n.created_at DESC, n.id DESC
      `,
      values,
    );

    return result.rows;
  }

  static async findById(
    id: number,
    academicYearId: number,
    includeDeleted = false,
  ): Promise<Notice | null> {
    const result = await query<Notice>(
      `
        SELECT
          n.*,
          c.class_name,
          s.name AS section_name,
          u.name AS posted_by_name
        FROM public.${tableName} n
        INNER JOIN public.classes c
          ON c.id = n.class_id
        INNER JOIN public.section s
          ON s.id = n.section_id
        LEFT JOIN public.users u
          ON u.id = n.posted_by
        WHERE n.id = $1
          AND n.academic_year_id = $2
          AND ($3 = TRUE OR n.deleted_at IS NULL)
        LIMIT 1
      `,
      [id, academicYearId, includeDeleted],
    );

    return result.rows[0] || null;
  }

  static async findByIds(
    ids: number[],
    academicYearId: number,
  ): Promise<Notice[]> {
    if (ids.length === 0) {
      return [];
    }

    const result = await query<Notice>(
      `
        SELECT
          n.*,
          c.class_name,
          s.name AS section_name,
          u.name AS posted_by_name
        FROM public.${tableName} n
        INNER JOIN public.classes c
          ON c.id = n.class_id
        INNER JOIN public.section s
          ON s.id = n.section_id
        LEFT JOIN public.users u
          ON u.id = n.posted_by
        WHERE n.id = ANY($1::INTEGER[])
          AND n.academic_year_id = $2
        ORDER BY n.id DESC
      `,
      [ids, academicYearId],
    );

    return result.rows;
  }

  /*
    Checks whether the selected section belongs to
    the selected class in the current academic year.
  */
  static async isValidClassSection(
    classId: number,
    sectionId: number,
    academicYearId: number,
  ): Promise<boolean> {
    const result = await query<{ id: number }>(
      `
        SELECT id
        FROM public.class_section_relation
        WHERE class_id = $1
          AND section_id = $2
          AND academic_year_id = $3
        LIMIT 1
      `,
      [classId, sectionId, academicYearId],
    );

    return result.rows.length > 0;
  }

  /*
    Gets every section linked to the selected class.
  */
  static async findSectionIdsByClass(
    classId: number,
    academicYearId: number,
  ): Promise<number[]> {
    const result = await query<{ section_id: number }>(
      `
        SELECT section_id
        FROM public.class_section_relation
        WHERE class_id = $1
          AND academic_year_id = $2
        ORDER BY section_id ASC
      `,
      [classId, academicYearId],
    );

    return result.rows.map((row) => row.section_id);
  }

  /*
    Inserts one row for each section.

    Example:
    Class 1 has Section A, B and C.

    sectionIds = [1, 2, 3]

    Result:
    Three notice rows are inserted in one SQL query.
  */
  static async createMany(
    payload: CreateNoticePayload,
    postedBy: number,
    academicYearId: number,
    sectionIds: number[],
  ): Promise<Notice[]> {
    const values: unknown[] = [];

    const insertRows = sectionIds.map((sectionId) => {
      const startPosition = values.length + 1;

      values.push(
        payload.notice_for,
        postedBy,
        payload.title,
        payload.description,
        academicYearId,
        payload.class_id,
        sectionId,
      );

      return `
        (
          $${startPosition},
          $${startPosition + 1},
          $${startPosition + 2},
          $${startPosition + 3},
          $${startPosition + 4},
          $${startPosition + 5},
          $${startPosition + 6}
        )
      `;
    });

    const insertedResult = await query<{ id: number }>(
      `
        INSERT INTO public.${tableName} (
          notice_for,
          posted_by,
          title,
          description,
          academic_year_id,
          class_id,
          section_id
        )
        VALUES ${insertRows.join(", ")}
        RETURNING id
      `,
      values,
    );

    const insertedIds = insertedResult.rows.map(
      (notice) => notice.id,
    );

    return this.findByIds(insertedIds, academicYearId);
  }

  static async update(
    id: number,
    academicYearId: number,
    payload: UpdateNoticePayload,
  ): Promise<Notice | null> {
    const values: unknown[] = [];
    const fields: string[] = [];

    if (payload.notice_for !== undefined) {
      values.push(payload.notice_for);
      fields.push(`notice_for = $${values.length}`);
    }

    if (payload.title !== undefined) {
      values.push(payload.title);
      fields.push(`title = $${values.length}`);
    }

    if (payload.description !== undefined) {
      values.push(payload.description);
      fields.push(`description = $${values.length}`);
    }

    if (payload.class_id !== undefined) {
      values.push(payload.class_id);
      fields.push(`class_id = $${values.length}`);
    }

    if (payload.section_id !== undefined) {
      values.push(payload.section_id);
      fields.push(`section_id = $${values.length}`);
    }

    if (fields.length === 0) {
      return this.findById(id, academicYearId);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");

    values.push(id);
    const idPosition = values.length;

    values.push(academicYearId);
    const academicYearPosition = values.length;

    const result = await query<{ id: number }>(
      `
        UPDATE public.${tableName}
        SET ${fields.join(", ")}
        WHERE id = $${idPosition}
          AND academic_year_id = $${academicYearPosition}
          AND deleted_at IS NULL
        RETURNING id
      `,
      values,
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(id, academicYearId);
  }

  static async softDelete(
    id: number,
    academicYearId: number,
  ): Promise<Notice | null> {
    const result = await query<{ id: number }>(
      `
        UPDATE public.${tableName}
        SET
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND academic_year_id = $2
          AND deleted_at IS NULL
        RETURNING id
      `,
      [id, academicYearId],
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(id, academicYearId, true);
  }

  static async restore(
    id: number,
    academicYearId: number,
  ): Promise<Notice | null> {
    const result = await query<{ id: number }>(
      `
        UPDATE public.${tableName}
        SET
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND academic_year_id = $2
          AND deleted_at IS NOT NULL
        RETURNING id
      `,
      [id, academicYearId],
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(id, academicYearId);
  }

  static async hardDelete(
    id: number,
    academicYearId: number,
  ): Promise<boolean> {
    const result = await query<{ id: number }>(
      `
        DELETE FROM public.${tableName}
        WHERE id = $1
          AND academic_year_id = $2
        RETURNING id
      `,
      [id, academicYearId],
    );

    return result.rows.length > 0;
  }
}