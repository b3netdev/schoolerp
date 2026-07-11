import { query } from "../db/query.js";

export interface Stream {
    id: number;
    name: string;
    status?: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date | null;
}

export interface StreamPayload {
    name: string;
    status?: string;
}

export interface StreamUpdatePayload {
    name?: string;
    status?: string;
}

const tableName = "stream";
export type StreamStatusFilter = "all" | "active" | "inactive";

export class StreamModel {
    static async findAll(
        status: StreamStatusFilter = "all"
    ): Promise<Stream[]> {
        const values: unknown[] = [];
        const conditions: string[] = ["deleted_at IS NULL"];

        if (status !== "all") {
            values.push(status);
            conditions.push(`status = $${values.length}`);
        }

        const result = await query<Stream>(
            `
    SELECT
      id,
      name,
      status,
      created_at,
      updated_at,
      deleted_at
    FROM ${tableName}
    WHERE ${conditions.join(" AND ")}
    ORDER BY id DESC
    `,
            values
        );

        return result.rows;
    }

    static async findById(id: number): Promise<Stream | null> {
        const result = await query<Stream>(
            `
      SELECT
        id,
        name,
        status,
        created_at,
        updated_at,
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

    static async create(data: StreamPayload): Promise<Stream> {
        const result = await query<Stream>(
            `
      INSERT INTO ${tableName} (
        name,
        status
      )
      VALUES (
        $1, $2
      )
      RETURNING
        id,
        name,
        status,
        created_at,
        updated_at,
        deleted_at
      `,
            [
                data.name,
                data.status ?? "active",
            ]
        );

        return result.rows[0];
    }

    static async update(
        id: number,
        data: StreamUpdatePayload
    ): Promise<Stream | null> {
        const result = await query<Stream>(
            `
      UPDATE ${tableName}
      SET
        name = COALESCE($1, name),
        status = COALESCE($2, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      AND deleted_at IS NULL
      RETURNING
        id,
        name,
        status,
        created_at,
        updated_at,
        deleted_at
      `,
            [
                data.name ?? null,
                data.status ?? null,
                id,
            ]
        );

        return result.rows[0] || null;
    }

    static async delete(id: number): Promise<Stream | null> {
        const result = await query<Stream>(
            `
      UPDATE ${tableName}
      SET
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        status = 'inactive'
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING
        id,
        name,
        status,
        created_at,
        updated_at,
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