import { query } from "../db/query.js";

export interface Section {
  id: number;
  name: string;
  stream: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface SectionPayload {
  name: string;
  stream: string;
}

export interface SectionUpdatePayload {
  name?: string;
  stream?: string;
}

const tableName = "section";

export class SectionModel {
  static async findAll(): Promise<Section[]> {
    const result = await query<Section>(
      `
      SELECT 
        id,
        name,
        stream,
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

  static async findById(id: number): Promise<Section | null> {
    const result = await query<Section>(
      `
      SELECT 
        id,
        name,
        stream,
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

  static async create(data: SectionPayload): Promise<Section> {
    const result = await query<Section>(
      `
      INSERT INTO ${tableName} 
        (name, stream)
      VALUES 
        ($1, $2)
      RETURNING 
        id,
        name,
        stream,
        "created_at",
        "updated_at",
        deleted_at
      `,
      [data.name, data.stream]
    );

    return result.rows[0];
  }

  static async update(
    id: number,
    data: SectionUpdatePayload
  ): Promise<Section | null> {
    const result = await query<Section>(
      `
      UPDATE ${tableName}
      SET
        name = COALESCE($1, name),
        stream = COALESCE($2, stream),
        "updated_at" = CURRENT_TIMESTAMP
      WHERE id = $3
      AND deleted_at IS NULL
      RETURNING 
        id,
        name,
        stream,
        "created_at",
        "updated_at",
        deleted_at
      `,
      [data.name ?? null, data.stream ?? null, id]
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<Section | null> {
    const result = await query<Section>(
      `
      UPDATE ${tableName}
      SET 
        deleted_at = CURRENT_TIMESTAMP,
        "updated_at" = CURRENT_TIMESTAMP
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING 
        id,
        name,
        stream,
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