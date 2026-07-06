import { query } from "../db/query.js";

export interface Class {
    id: number;
    class_name: string;
    status: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date | null;
}

export interface ClassPayload {
    class_name: string;
    status: string;
    description: string;
}

export interface ClassUpdatePayload {
    class_name?: string;
    status?: string;
    description?: string;
}

const tableName = "classes";

export class ClassModel {
    static async findAll(): Promise<Class[]> {
        const result = await query<Class>(
            `
      SELECT 
        id,
        class_name,
        status,
        description,
        "created_at",
        "updated_at",
        deleted_at
      FROM ${tableName}
      WHERE deleted_at IS NULL
      ORDER BY id DESC
      `
        );

        return result.rows;
    }

    static async findById(id: number): Promise<Class | null> {
        const result = await query<Class>(
            `
      SELECT 
        id,
        class_name,
        status,
        description,
        "created_at",
        "updated_at",
        deleted_at
      FROM ${tableName}
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
      `,
            [id]
        );

        return result.rows[0] || null;
    }

    static async create(data: ClassPayload): Promise<Class> {
        const result = await query<Class>(
            `
      INSERT INTO ${tableName} 
        (class_name, status, description)
      VALUES 
        ($1, $2, $3)
      RETURNING 
        id,
        class_name,
        status,
        description,
        "created_at",
        "updated_at",
        deleted_at
      `,
            [data.class_name, data.status, data.description]
        );

        return result.rows[0];
    }

    static async update(
        id: number,
        data: ClassUpdatePayload
    ): Promise<Class | null> {
        const result = await query<Class>(
            `
    UPDATE ${tableName}
    SET
      class_name = COALESCE($1, class_name),
      status = COALESCE($2, status),
      description = COALESCE($3, description),
      "updated_at" = CURRENT_TIMESTAMP
    WHERE id = $4
      AND deleted_at IS NULL
    RETURNING 
      id,
      class_name,
      status,
      description,
      "created_at",
      "updated_at",
      deleted_at
    `,
            [
                data.class_name ?? null,
                data.status ?? null,
                data.description ?? null,
                id
            ]
        );

        return result.rows[0] || null;
    }
    static async delete(id: number): Promise<Class | null> {
        const result = await query<Class>(
            `
      UPDATE ${tableName}
      SET 
        deleted_at = CURRENT_TIMESTAMP,
        "updated_at" = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING 
        id,
        class_name,
        status,
        description,
        "created_at",
        "updated_at",
        deleted_at
      `,
            [id]
        );

        return result.rows[0] || null;
    }

    static async hardDelete(id: number): Promise<boolean> {
        const result = await query(
            `
      DELETE FROM ${tableName}
      WHERE id = $1
      `,
            [id]
        );

        return (result.rowCount ?? 0) > 0;
    }
}