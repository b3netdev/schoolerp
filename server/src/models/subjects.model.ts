import { db } from "../db/query-builder.js";

export interface Subject {
  id: number;
  class_section_id: number;
  name: string;
  description: string | null;
  display_order: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface SubjectPayload {
  class_section_id: number;
  name: string;
  description?: string | null;
  display_order?: number | null;
}

export interface SubjectUpdatePayload {
  class_section_id?: number;
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
  Partial<Pick<SubjectListQuery, "classId" | "sectionId" | "classSectionId">> => {
  const statusParam =
    typeof query.status === "string" ? query.status.trim().toLowerCase() : "all";

  const status = statusParam === "trash" ? "trash" : "all";

  const pageValue = Number(
    Array.isArray(query.page) ? query.page[0] : query.page ?? "1",
  );
  const limitValue = Number(
    Array.isArray(query.limit) ? query.limit[0] : query.limit ?? "10",
  );

  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const limit = [5, 10, 20].includes(limitValue) ? limitValue : 10;

  const toPositiveInteger = (raw: unknown) => {
    const value = Number(Array.isArray(raw) ? raw[0] : raw);
    return Number.isInteger(value) && value > 0 ? value : undefined;
  };

  const result: Required<Pick<SubjectListQuery, "status" | "page" | "limit">> &
    Partial<Pick<SubjectListQuery, "classId" | "sectionId" | "classSectionId">> = {
    status,
    page,
    limit,
  };

  const classSectionId = toPositiveInteger(query.class_section_id);
  if (classSectionId !== undefined) {
    result.classSectionId = classSectionId;
  }

  const classId = toPositiveInteger(query.class_id);
  if (classId !== undefined) {
    result.classId = classId;
  }

  const sectionId = toPositiveInteger(query.section_id);
  if (sectionId !== undefined) {
    result.sectionId = sectionId;
  }

  return result;
};

const tableName = "subjects";

export class SubjectModel {
  /**
   * GET ALL SUBJECTS
   */
  static async findAll(
    statusFilter: string = "all",
    page: number = 1,
    limit: number = 10,
    classId?: number,
    sectionId?: number,
    classSectionId?: number,
  ): Promise<SubjectListResult> {
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const validLimits = [5, 10, 20];
    const safeLimit = validLimits.includes(Number(limit)) ? Number(limit) : 10;

    const values: string[] = [];
    const whereParts: string[] = ["s.deleted_at IS NULL"];

    if (statusFilter === "trash") {
      whereParts[0] = "s.deleted_at IS NOT NULL";
    } else if (statusFilter !== "all") {
      values.push(statusFilter);
      whereParts.push(`s.status = $${values.length}`);
    }

    if (classSectionId && Number.isInteger(classSectionId) && classSectionId > 0) {
      values.push(String(classSectionId));
      whereParts.push(`s.class_section_id = $${values.length}`);
    } else {
      if (classId && Number.isInteger(classId) && classId > 0) {
        values.push(String(classId));
        whereParts.push(`csr.class_id = $${values.length}`);
      }

      if (sectionId && Number.isInteger(sectionId) && sectionId > 0) {
        values.push(String(sectionId));
        whereParts.push(`csr.section_id = $${values.length}`);
      }
    }

    const whereClause = whereParts.join(" AND ");

    const totalResult = await db.query<{ total: number }>(
      `
        SELECT COUNT(*)::int AS total
        FROM ${tableName} AS s
        LEFT JOIN class_section_relation AS csr
          ON csr.id = s.class_section_id
          AND csr.deleted_at IS NULL
        WHERE ${whereClause}
      `,
      values,
    );

    const total = Number(totalResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const normalizedPage = Math.min(safePage, totalPages);
    const offset = (normalizedPage - 1) * safeLimit;

    const queryValues = [...values, String(safeLimit), String(offset)];
    const limitParamIndex = values.length + 1;
    const offsetParamIndex = values.length + 2;

    const result = await db.query<Subject>(
      `
        SELECT
          s.id,
          s.class_section_id,
          s.name,
          s.description,
          s.display_order,
          s.created_at,
          s.updated_at,
          s.deleted_at
        FROM ${tableName} AS s
        LEFT JOIN class_section_relation AS csr
          ON csr.id = s.class_section_id
          AND csr.deleted_at IS NULL
        WHERE ${whereClause}
        ORDER BY
          s.display_order ASC NULLS LAST,
          s.id ASC
        LIMIT $${limitParamIndex}
        OFFSET $${offsetParamIndex}
      `,
      queryValues,
    );

    return {
      subjects: result.rows,
      total,
      page: normalizedPage,
      limit: safeLimit,
      totalPages,
    };
  }

  /**
   * GET SUBJECT BY ID
   */
  static async findById(
    id: number,
  ): Promise<Subject | null> {
    const result = await db.query<Subject>(
      `
        SELECT
          id,
          class_section_id,
          name,
          description,
          display_order,
          created_at,
          updated_at,
          deleted_at
        FROM ${tableName}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * GET SUBJECTS BY CLASS SECTION
   */
  static async findByClassSectionId(
    classSectionId: number,
  ): Promise<Subject[]> {
    const result = await db.query<Subject>(
      `
        SELECT
          id,
          class_section_id,
          name,
          description,
          display_order,
          created_at,
          updated_at,
          deleted_at
        FROM ${tableName}
        WHERE class_section_id = $1
          AND deleted_at IS NULL
        ORDER BY
          display_order ASC NULLS LAST,
          id ASC
      `,
      [classSectionId],
    );

    return result.rows;
  }

  /**
   * CREATE SUBJECT
   */
  static async create(
    data: SubjectPayload,
  ): Promise<Subject> {
    const result = await db.query<Subject>(
      `
        INSERT INTO ${tableName}
        (
          class_section_id,
          name,
          description,
          display_order
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING
          id,
          class_section_id,
          name,
          description,
          display_order,
          created_at,
          updated_at,
          deleted_at
      `,
      [
        data.class_section_id,
        data.name,
        data.description ?? null,
        data.display_order ?? null,
      ],
    );

    return result.rows[0];
  }

  /**
   * UPDATE SUBJECT
   *
   * undefined = don't update field
   * null = set database value to NULL
   */
  static async update(
    id: number,
    data: SubjectUpdatePayload,
  ): Promise<Subject | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    /**
     * Class section
     */
    if (data.class_section_id !== undefined) {
      updates.push(
        `class_section_id = $${parameterIndex}`,
      );

      values.push(data.class_section_id);
      parameterIndex++;
    }

    /**
     * Name
     */
    if (data.name !== undefined) {
      updates.push(
        `name = $${parameterIndex}`,
      );

      values.push(data.name);
      parameterIndex++;
    }

    /**
     * Description
     *
     * null is allowed
     */
    if (data.description !== undefined) {
      updates.push(
        `description = $${parameterIndex}`,
      );

      values.push(data.description);
      parameterIndex++;
    }

    /**
     * Display order
     *
     * undefined -> unchanged
     * null      -> database NULL
     * number    -> update number
     */
    if (data.display_order !== undefined) {
      updates.push(
        `display_order = $${parameterIndex}`,
      );

      values.push(data.display_order);
      parameterIndex++;
    }

    /**
     * Nothing to update
     */
    if (updates.length === 0) {
      return this.findById(id);
    }

    /**
     * Always update updated_at
     */
    updates.push(
      `updated_at = CURRENT_TIMESTAMP`,
    );

    /**
     * Add ID as final parameter
     */
    values.push(id);

    const idParameter = parameterIndex;

    const result = await db.query<Subject>(
      `
        UPDATE ${tableName}
        SET
          ${updates.join(",\n          ")}
        WHERE id = $${idParameter}
          AND deleted_at IS NULL
        RETURNING
          id,
          class_section_id,
          name,
          description,
          display_order,
          created_at,
          updated_at,
          deleted_at
      `,
      values,
    );

    return result.rows[0] || null;
  }

  /**
   * SOFT DELETE SUBJECT
   */
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
        RETURNING
          id,
          class_section_id,
          name,
          description,
          display_order,
          created_at,
          updated_at,
          deleted_at
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * RESTORE SUBJECT
   */
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
        RETURNING
          id,
          class_section_id,
          name,
          description,
          display_order,
          created_at,
          updated_at,
          deleted_at
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * PERMANENT DELETE
   */
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