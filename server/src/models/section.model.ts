import { get } from "https";
import { db } from "../db/query-builder.js";

export interface Section {
  id: number;
  name: string;
  stream_id: string;
  status: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface SectionPayload {
  name: string;
  stream_id: string;
  status: string;
  description: string;
  display_order: number;
}

export interface SectionUpdatePayload {
  name?: string;
  stream_id?: string;
  status?: string;
  description?: string;
  display_order?:number
}

const tableName = "section";

export class SectionModel {
  static async findAll(statusFilter: string = "all"): Promise<Section[]> {
    let query = db.table<Section>(tableName);

    if (statusFilter === "trash") {
      query = query.whereNotNull("deleted_at");
    } else if (statusFilter === "active") {
      query = query.whereNull("deleted_at").where("status", "=", "active");
    } else if (statusFilter === "inactive") {
      query = query.whereNull("deleted_at").where("status", "=", "inactive");
    } else {
      // 'all' shows all non-deleted items
      query = query.whereNull("deleted_at");
    }

    const result = await query.orderBy("id", "DESC").get();
    return result;
  }

  static async findByStatus(
  statusFilter: string,
): Promise<Section[]> {
  let whereClause = "WHERE deleted_at IS NULL";

  if (statusFilter === "trash") {
    whereClause = "WHERE deleted_at IS NOT NULL";
  } else if (statusFilter === "active") {
    whereClause =
      "WHERE deleted_at IS NULL AND status = 'active'";
  } else if (statusFilter === "inactive") {
    whereClause =
      "WHERE deleted_at IS NULL AND status = 'inactive'";
  }

  const result = await db.query<Section>(
    `
      SELECT 
        id,
        name,
        stream_id,
        status,
        description,
        display_order,
        created_at,
        updated_at,
        deleted_at
      FROM ${tableName}
      ${whereClause}
      ORDER BY display_order ASC NULLS LAST, id ASC
    `,
  );

  return result.rows;
}

  static async findById(id: number): Promise<Section | null> {
    const result = await db.query<Section>(
      `
      SELECT 
        id,
        name,
        stream_id,
        status,
        description,
        display_order,
        "created_at",
        "updated_at",
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

  static async create(data: SectionPayload): Promise<Section> {
    const result = await db.query<Section>(
      `
      INSERT INTO ${tableName} 
        (name, stream_id, status, description,display_order)
      VALUES 
        ($1, $2, $3, $4,$5)
      RETURNING 
        id,
        name,
        stream_id,
        status,
        description,
        display_order,
        "created_at",
        "updated_at",
        deleted_at
      `,
      [data.name, data.stream_id, data.status, data.description,data.display_order],
    );

    return result.rows[0];
  }

  static async update(
    id: number,
    data: SectionUpdatePayload,
  ): Promise<Section | null> {
    const result = await db.query<Section>(
      `
      UPDATE ${tableName}
      SET
        name = COALESCE($1, name),
        stream_id = COALESCE($2, stream_id),
        status = COALESCE($3, status),
        description = COALESCE($4, description),
         display_order = COALESCE($5, display_order),
        "updated_at" = CURRENT_TIMESTAMP
      WHERE id = $6
      AND deleted_at IS NULL
      RETURNING 
        id,
        name,
        stream_id,
        status,
        display_order,
        description,
        "created_at",
        "updated_at",
        deleted_at
      `,
      [
        data.name ?? null,
        data.stream_id ?? null,
        data.status ?? null,
        data.description ?? null,
        data.display_order?? null,
        id,
      ],
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<Section | null> {
    const result = await db.query<Section>(
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
        stream_id,
        status,
        description,
        "created_at",
        "updated_at",
        deleted_at
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async restore(id: number): Promise<Section | null> {
    const result = await db.query<Section>(
      `
      UPDATE ${tableName}
      SET 
        deleted_at = NULL,
        "updated_at" = CURRENT_TIMESTAMP
      WHERE id = $1
      AND deleted_at IS NOT NULL
      RETURNING 
        id,
        name,
        stream_id,
        status,
        description,
        "created_at",
        "updated_at",
        deleted_at
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async hardDelete(id: number): Promise<boolean> {
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
