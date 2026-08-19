import { query } from "../db/query.js";

export interface Class {
  id: number;
  class_name: string;
  status: string;
  description: string | null;
  display_order: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface ClassPayload {
  class_name: string;
  status: string;
  description: string;
  display_order?: number | null;
}

export interface ClassUpdatePayload {
  class_name?: string;
  status?: string;
  description?: string;
  display_order?: number | null;
}

const tableName = "classes";

export class ClassModel {
  /**
   * GET ALL CLASSES
   */
  static async findAll(): Promise<Class[]> {
    const result = await query<Class>(
      `
        SELECT
          id,
          class_name,
          status,
          description,
          display_order,
          created_at,
          updated_at,
          deleted_at
        FROM ${tableName}
        WHERE deleted_at IS NULL
        ORDER BY
          display_order ASC NULLS LAST,
          id ASC
      `,
    );

    return result.rows;
  }

  /**
   * GET CLASSES BY STATUS
   */
  static async findByStatus(
    statusFilter: string,
  ): Promise<Class[]> {
    let whereClause =
      "WHERE deleted_at IS NULL";

    if (statusFilter === "trash") {
      whereClause =
        "WHERE deleted_at IS NOT NULL";
    } else if (statusFilter === "active") {
      whereClause =
        "WHERE deleted_at IS NULL AND status = 'active'";
    } else if (statusFilter === "inactive") {
      whereClause =
        "WHERE deleted_at IS NULL AND status = 'inactive'";
    }

    const result = await query<Class>(
      `
        SELECT
          id,
          class_name,
          status,
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
   * GET CLASS BY ID
   */
  static async findById(
    id: number,
  ): Promise<Class | null> {
    const result = await query<Class>(
      `
        SELECT
          id,
          class_name,
          status,
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
   * CREATE CLASS
   */
  static async create(
    data: ClassPayload,
  ): Promise<Class> {
    const result = await query<Class>(
      `
        INSERT INTO ${tableName}
        (
          class_name,
          status,
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
          class_name,
          status,
          description,
          display_order,
          created_at,
          updated_at,
          deleted_at
      `,
      [
        data.class_name,
        data.status,
        data.description,
        data.display_order ?? null,
      ],
    );

    return result.rows[0];
  }

  /**
   * UPDATE CLASS
   *
   * undefined = do not update
   * null      = set database NULL
   */
  static async update(
    id: number,
    data: ClassUpdatePayload,
  ): Promise<Class | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    /**
     * Class name
     */
    if (data.class_name !== undefined) {
      updates.push(
        `class_name = $${parameterIndex}`,
      );

      values.push(data.class_name);

      parameterIndex++;
    }

    /**
     * Status
     */
    if (data.status !== undefined) {
      updates.push(
        `status = $${parameterIndex}`,
      );

      values.push(data.status);

      parameterIndex++;
    }

    /**
     * Description
     */
    if (data.description !== undefined) {
      updates.push(
        `description = $${parameterIndex}`,
      );

      values.push(data.description);

      parameterIndex++;
    }

    /**
     * Display Order
     *
     * undefined -> unchanged
     * null      -> NULL
     * number    -> new value
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
     * Updated time
     */
    updates.push(
      `updated_at = CURRENT_TIMESTAMP`,
    );

    /**
     * ID is last parameter
     */
    values.push(id);

    const idParameter = parameterIndex;

    const result = await query<Class>(
      `
        UPDATE ${tableName}
        SET
          ${updates.join(",\n          ")}
        WHERE id = $${idParameter}
          AND deleted_at IS NULL
        RETURNING
          id,
          class_name,
          status,
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
   * SOFT DELETE CLASS
   */
  static async delete(
    id: number,
  ): Promise<Class | null> {
    const result = await query<Class>(
      `
        UPDATE ${tableName}
        SET
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING
          id,
          class_name,
          status,
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
   * RESTORE CLASS
   */
  static async restore(
    id: number,
  ): Promise<Class | null> {
    const result = await query<Class>(
      `
        UPDATE ${tableName}
        SET
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING
          id,
          class_name,
          status,
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
    const result = await query(
      `
        DELETE FROM ${tableName}
        WHERE id = $1
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }
}