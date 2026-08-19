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

const tableName = "subjects";

export class SubjectModel {
  /**
   * GET ALL SUBJECTS
   */
  static async findAll(
    statusFilter: string = "all",
  ): Promise<Subject[]> {
    let whereClause = "WHERE deleted_at IS NULL";

    if (statusFilter === "trash") {
      whereClause = "WHERE deleted_at IS NOT NULL";
    }

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
        ${whereClause}
        ORDER BY
          display_order ASC NULLS LAST,
          id ASC
      `,
    );

    return result.rows;
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