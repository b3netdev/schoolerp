import { db } from "../db/query-builder.js";

export interface Subject {
  id: number;
  class_section_id: number;

  subject_type_id: number | null;
  subject_type_title?: string | null;

  name: string;
  description: string | null;
  display_order: number | null;

  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface SubjectPayload {
  class_section_id: number;
  subject_type_id?: number | null;

  name: string;
  description?: string | null;
  display_order?: number | null;
}

export interface SubjectUpdatePayload {
  class_section_id?: number;
  subject_type_id?: number | null;

  name?: string;
  description?: string | null;
  display_order?: number | null;
}

export interface SubjectListResult {
  subjects: Subject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubjectListQuery {
  status?: string;
  page?: number;
  limit?: number;

  classId?: number;
  sectionId?: number;
  classSectionId?: number;
}

export const normalizeSubjectListQuery = (
  query: Record<string, unknown> = {},
): Required<Pick<SubjectListQuery, "status" | "page" | "limit">> &
  Partial<
    Pick<
      SubjectListQuery,
      "classId" | "sectionId" | "classSectionId"
    >
  > => {
  const statusParam =
    typeof query.status === "string"
      ? query.status.trim().toLowerCase()
      : "all";

  const status =
    statusParam === "trash" ? "trash" : "all";

  const pageValue = Number(
    Array.isArray(query.page)
      ? query.page[0]
      : query.page ?? "1",
  );

  const limitValue = Number(
    Array.isArray(query.limit)
      ? query.limit[0]
      : query.limit ?? "10",
  );

  const page =
    Number.isInteger(pageValue) && pageValue > 0
      ? pageValue
      : 1;

  const limit = [5, 10, 20].includes(limitValue)
    ? limitValue
    : 10;

  const getPositiveInteger = (
    value: unknown,
  ): number | undefined => {
    const parsed = Number(
      Array.isArray(value) ? value[0] : value,
    );

    return Number.isInteger(parsed) && parsed > 0
      ? parsed
      : undefined;
  };

  const result: Required<
    Pick<SubjectListQuery, "status" | "page" | "limit">
  > &
    Partial<
      Pick<
        SubjectListQuery,
        "classId" | "sectionId" | "classSectionId"
      >
    > = {
    status,
    page,
    limit,
  };

  const classSectionId = getPositiveInteger(
    query.class_section_id,
  );

  if (classSectionId !== undefined) {
    result.classSectionId = classSectionId;
  }

  const classId = getPositiveInteger(query.class_id);

  if (classId !== undefined) {
    result.classId = classId;
  }

  const sectionId = getPositiveInteger(
    query.section_id,
  );

  if (sectionId !== undefined) {
    result.sectionId = sectionId;
  }

  return result;
};

const tableName = "subjects";

const subjectColumns = `
  s.id,
  s.class_section_id,
  s.subject_type_id,
  st.title AS subject_type_title,
  s.name,
  s.description,
  s.display_order,
  s.created_at,
  s.updated_at,
  s.deleted_at
`;

export class SubjectModel {
  /**
   * Checks that the selected type exists and was not soft deleted.
   */
  static async isSubjectTypeValid(
    subjectTypeId: number,
  ): Promise<boolean> {
    const result = await db.query(
      `
        SELECT id
        FROM subject_type
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [subjectTypeId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  static async findAll(
    statusFilter: string = "all",
    page: number = 1,
    limit: number = 10,
    classId?: number,
    sectionId?: number,
    classSectionId?: number,
  ): Promise<SubjectListResult> {
    const safePage =
      Number.isInteger(page) && page > 0 ? page : 1;

    const safeLimit = [5, 10, 20].includes(Number(limit))
      ? Number(limit)
      : 10;

    const values: unknown[] = [];

    const whereParts: string[] = [
      statusFilter === "trash"
        ? "s.deleted_at IS NOT NULL"
        : "s.deleted_at IS NULL",
    ];

    if (classSectionId) {
      values.push(classSectionId);

      whereParts.push(
        `s.class_section_id = $${values.length}`,
      );
    } else {
      if (classId) {
        values.push(classId);

        whereParts.push(
          `csr.class_id = $${values.length}`,
        );
      }

      if (sectionId) {
        values.push(sectionId);

        whereParts.push(
          `csr.section_id = $${values.length}`,
        );
      }
    }

    const whereClause = whereParts.join(" AND ");

    const totalResult = await db.query<{
      total: number;
    }>(
      `
        SELECT COUNT(*)::int AS total
        FROM ${tableName} AS s
        LEFT JOIN class_section_relation AS csr
          ON csr.id = s.class_section_id
        WHERE ${whereClause}
      `,
      values,
    );

    const total = Number(
      totalResult.rows[0]?.total ?? 0,
    );

    const totalPages = Math.max(
      1,
      Math.ceil(total / safeLimit),
    );

    const normalizedPage = Math.min(
      safePage,
      totalPages,
    );

    const offset =
      (normalizedPage - 1) * safeLimit;

    const listValues = [
      ...values,
      safeLimit,
      offset,
    ];

    const limitIndex = values.length + 1;
    const offsetIndex = values.length + 2;

    const result = await db.query<Subject>(
      `
        SELECT ${subjectColumns}
        FROM ${tableName} AS s
        LEFT JOIN class_section_relation AS csr
          ON csr.id = s.class_section_id
        LEFT JOIN subject_type AS st
          ON st.id = s.subject_type_id
        WHERE ${whereClause}
        ORDER BY
          s.display_order ASC NULLS LAST,
          s.id ASC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      listValues,
    );

    return {
      subjects: result.rows,
      total,
      page: normalizedPage,
      limit: safeLimit,
      totalPages,
    };
  }

  static async findById(
    id: number,
  ): Promise<Subject | null> {
    const result = await db.query<Subject>(
      `
        SELECT ${subjectColumns}
        FROM ${tableName} AS s
        LEFT JOIN subject_type AS st
          ON st.id = s.subject_type_id
        WHERE s.id = $1
          AND s.deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  static async findByClassSectionId(
    classSectionId: number,
  ): Promise<Subject[]> {
    const result = await db.query<Subject>(
      `
        SELECT ${subjectColumns}
        FROM ${tableName} AS s
        LEFT JOIN subject_type AS st
          ON st.id = s.subject_type_id
        WHERE s.class_section_id = $1
          AND s.deleted_at IS NULL
        ORDER BY
          s.display_order ASC NULLS LAST,
          s.id ASC
      `,
      [classSectionId],
    );

    return result.rows;
  }

  static async create(
    data: SubjectPayload,
  ): Promise<Subject> {
    const result = await db.query<Subject>(
      `
        WITH inserted_subject AS (
          INSERT INTO ${tableName} (
            class_section_id,
            subject_type_id,
            name,
            description,
            display_order
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        )
        SELECT
          s.id,
          s.class_section_id,
          s.subject_type_id,
          st.title AS subject_type_title,
          s.name,
          s.description,
          s.display_order,
          s.created_at,
          s.updated_at,
          s.deleted_at
        FROM inserted_subject AS s
        LEFT JOIN subject_type AS st
          ON st.id = s.subject_type_id
      `,
      [
        data.class_section_id,
        data.subject_type_id ?? null,
        data.name,
        data.description ?? null,
        data.display_order ?? null,
      ],
    );

    return result.rows[0];
  }

  static async update(
    id: number,
    data: SubjectUpdatePayload,
  ): Promise<Subject | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.class_section_id !== undefined) {
      values.push(data.class_section_id);

      updates.push(
        `class_section_id = $${values.length}`,
      );
    }

    if (data.subject_type_id !== undefined) {
      values.push(data.subject_type_id);

      updates.push(
        `subject_type_id = $${values.length}`,
      );
    }

    if (data.name !== undefined) {
      values.push(data.name);

      updates.push(`name = $${values.length}`);
    }

    if (data.description !== undefined) {
      values.push(data.description);

      updates.push(
        `description = $${values.length}`,
      );
    }

    if (data.display_order !== undefined) {
      values.push(data.display_order);

      updates.push(
        `display_order = $${values.length}`,
      );
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const result = await db.query(
      `
        UPDATE ${tableName}
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
          AND deleted_at IS NULL
        RETURNING id
      `,
      values,
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    return this.findById(id);
  }

  static async delete(
    id: number,
  ): Promise<Subject | null> {
    const result = await db.query<Subject>(
      `
        UPDATE ${tableName}
        SET
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  static async restore(
    id: number,
  ): Promise<Subject | null> {
    const result = await db.query<Subject>(
      `
        UPDATE ${tableName}
        SET
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING *
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  static async hardDelete(
    id: number,
  ): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM ${tableName}
        WHERE id = $1
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }
}