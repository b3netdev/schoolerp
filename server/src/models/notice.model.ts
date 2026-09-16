import { query } from "../db/query.js";

export type NoticeFor = "student" | "teacher" | "admin";
export type NoticeForList = NoticeFor[];

export type NoticeStatus = "all" | "active" | "trash";

export interface Notice {
  id: number;
  notice_for: NoticeForList;
  posted_by: number;
  posted_by_name?: string | null;
  title: string;
  description: string;
  academic_year_id: number;
  class_ids: number[];
  class_names?: string[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateNoticePayload {
  notice_for: NoticeForList;
  title: string;
  description: string;
  class_ids: number[];
}

export interface UpdateNoticePayload {
  notice_for?: NoticeForList;
  title?: string;
  description?: string;
  class_ids?: number[];
}

export interface NoticeFilters {
  status?: NoticeStatus;
  notice_for?: NoticeFor;
  class_id?: number;
  date?: string;
}

const tableName = "notice";
const validNoticeFor: NoticeFor[] = ["student", "teacher", "admin"];

function prepareNoticeForJson(noticeFor: NoticeForList): string {
  const uniqueValues = [...new Set(noticeFor)];

  if (uniqueValues.length === 0) {
    throw new Error("Select at least one notice recipient.");
  }

  const hasInvalidValue = uniqueValues.some(
    (value) => !validNoticeFor.includes(value),
  );

  if (hasInvalidValue) {
    throw new Error(
      "Notice recipients can only be student, teacher, or admin.",
    );
  }

  return JSON.stringify(uniqueValues);
}

function prepareClassIdsJson(classIds: number[]): string {
  const uniqueClassIds = [...new Set(classIds)];

  if (uniqueClassIds.length === 0) {
    throw new Error("Select at least one class.");
  }

  const hasInvalidId = uniqueClassIds.some(
    (id) => !Number.isInteger(id) || id <= 0,
  );

  if (hasInvalidId) {
    throw new Error("Class IDs must be valid positive numbers.");
  }

  return JSON.stringify(uniqueClassIds);
}

export class NoticeModel {
  static async findAll(
    academicYearId: number,
    filters: NoticeFilters = {},
  ): Promise<Notice[]> {
    const values: unknown[] = [academicYearId];
    const conditions: string[] = ["n.academic_year_id = $1"];

    if (filters.status === "trash") {
      conditions.push("n.deleted_at IS NOT NULL");
    } else {
      conditions.push("n.deleted_at IS NULL");
    }

    if (filters.notice_for) {
      values.push(JSON.stringify([filters.notice_for]));
      conditions.push(`n.notice_for @> $${values.length}::jsonb`);
    }

    if (filters.class_id) {
      values.push(JSON.stringify([filters.class_id]));
      const classIdsArrayPosition = values.length;

      values.push(filters.class_id);
      const classIdScalarPosition = values.length;

      conditions.push(`(
        (jsonb_typeof(n.class_id) = 'array' AND n.class_id @> $${classIdsArrayPosition}::jsonb)
        OR
        (jsonb_typeof(n.class_id) = 'number' AND n.class_id = to_jsonb($${classIdScalarPosition}::INTEGER))
      )`);
    }

    if (filters.date) {
      values.push(filters.date);
      conditions.push(`n.created_at::date = $${values.length}::date`);
    }

    const result = await query<Notice>(
      `
        SELECT
          n.id,
          n.notice_for,
          n.posted_by,
          u.name AS posted_by_name,
          n.title,
          n.description,
          n.academic_year_id,
          CASE
            WHEN jsonb_typeof(n.class_id) = 'array'
              THEN n.class_id
            ELSE jsonb_build_array(n.class_id)
          END AS class_ids,
          COALESCE(class_meta.class_names, ARRAY[]::TEXT[]) AS class_names,
          n.created_at,
          n.updated_at,
          n.deleted_at
        FROM public.${tableName} n
        LEFT JOIN public.users u
          ON u.id = n.posted_by
        LEFT JOIN LATERAL (
          SELECT ARRAY_AGG(c.class_name ORDER BY c.class_name) AS class_names
          FROM public.classes c
          WHERE c.id IN (
            SELECT value::INTEGER
            FROM jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(n.class_id) = 'array'
                  THEN n.class_id
                ELSE jsonb_build_array(n.class_id)
              END
            )
          )
        ) class_meta ON TRUE
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
          n.id,
          n.notice_for,
          n.posted_by,
          u.name AS posted_by_name,
          n.title,
          n.description,
          n.academic_year_id,
          CASE
            WHEN jsonb_typeof(n.class_id) = 'array'
              THEN n.class_id
            ELSE jsonb_build_array(n.class_id)
          END AS class_ids,
          COALESCE(class_meta.class_names, ARRAY[]::TEXT[]) AS class_names,
          n.created_at,
          n.updated_at,
          n.deleted_at
        FROM public.${tableName} n
        LEFT JOIN public.users u
          ON u.id = n.posted_by
        LEFT JOIN LATERAL (
          SELECT ARRAY_AGG(c.class_name ORDER BY c.class_name) AS class_names
          FROM public.classes c
          WHERE c.id IN (
            SELECT value::INTEGER
            FROM jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(n.class_id) = 'array'
                  THEN n.class_id
                ELSE jsonb_build_array(n.class_id)
              END
            )
          )
        ) class_meta ON TRUE
        WHERE n.id = $1
          AND n.academic_year_id = $2
          AND ($3 = TRUE OR n.deleted_at IS NULL)
        LIMIT 1
      `,
      [id, academicYearId, includeDeleted],
    );

    return result.rows[0] || null;
  }

  static async create(
    payload: CreateNoticePayload,
    postedBy: number,
    academicYearId: number,
  ): Promise<Notice | null> {
    const noticeForJson = prepareNoticeForJson(payload.notice_for);
    const classIdsJson = prepareClassIdsJson(payload.class_ids);

    const result = await query<{ id: number }>(
      `
        INSERT INTO public.${tableName} (
          notice_for,
          posted_by,
          title,
          description,
          academic_year_id,
          class_id
        )
        VALUES ($1::jsonb, $2, $3, $4, $5, $6::jsonb)
        RETURNING id
      `,
      [
        noticeForJson,
        postedBy,
        payload.title,
        payload.description,
        academicYearId,
        classIdsJson,
      ],
    );

    const insertedId = result.rows[0]?.id;
    if (!insertedId) {
      return null;
    }

    return this.findById(insertedId, academicYearId);
  }

  static async update(
    id: number,
    academicYearId: number,
    payload: UpdateNoticePayload,
  ): Promise<Notice | null> {
    const values: unknown[] = [];
    const fields: string[] = [];

    if (payload.notice_for !== undefined) {
      values.push(prepareNoticeForJson(payload.notice_for));
      fields.push(`notice_for = $${values.length}::jsonb`);
    }

    if (payload.title !== undefined) {
      values.push(payload.title);
      fields.push(`title = $${values.length}`);
    }

    if (payload.description !== undefined) {
      values.push(payload.description);
      fields.push(`description = $${values.length}`);
    }

    if (payload.class_ids !== undefined) {
      values.push(prepareClassIdsJson(payload.class_ids));
      fields.push(`class_id = $${values.length}::jsonb`);
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

  static async getValidClassIdsForAcademicYear(
    classIds: number[],
    academicYearId: number,
  ): Promise<number[]> {
    if (classIds.length === 0) {
      return [];
    }

    const uniqueClassIds = [...new Set(classIds)];

    const result = await query<{ class_id: number }>(
      `
        SELECT DISTINCT csr.class_id
        FROM public.class_section_relation csr
        INNER JOIN public.classes c
          ON c.id = csr.class_id
        WHERE csr.academic_year_id = $1
          AND csr.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND csr.class_id = ANY($2::INTEGER[])
      `,
      [academicYearId, uniqueClassIds],
    );

    return result.rows.map((row) => row.class_id);
  }
}