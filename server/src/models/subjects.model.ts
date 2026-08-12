import { db } from "../db/query-builder.js";

export interface Subject {
  id: number;
  class_section_id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface SubjectPayload {
  class_section_id: number;
  name: string;
  description?: string | null;
}

export interface SubjectUpdatePayload {
  class_section_id?: number;
  name?: string;
  description?: string | null;
}

const tableName = "subjects";

export class SubjectModel {
  static async findAll(statusFilter: string = "all"): Promise<Subject[]> {
    let query = db.table<Subject>(tableName);

    if (statusFilter === "trash") {
      query = query.whereNotNull("deleted_at");
    } else {
      query = query.whereNull("deleted_at");
    }

    return query.orderBy("id", "DESC").get();
  }

  static async findById(id: number): Promise<Subject | null> {
    const result = await db.query<Subject>(
      `
        SELECT
          id,
          class_section_id,
          name,
          description,
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

  static async findByClassSectionId(
    classSectionId: number
  ): Promise<Subject[]> {
    const result = await db.query<Subject>(
      `
        SELECT
          id,
          class_section_id,
          name,
          description,
          created_at,
          updated_at,
          deleted_at
        FROM ${tableName}
        WHERE class_section_id = $1
          AND deleted_at IS NULL
        ORDER BY id DESC
      `,
      [classSectionId]
    );

    return result.rows;
  }

  static async create(data: SubjectPayload): Promise<Subject> {
    const result = await db.query<Subject>(
      `
        INSERT INTO ${tableName}
          (class_section_id, name, description)
        VALUES
          ($1, $2, $3)
        RETURNING
          id,
          class_section_id,
          name,
          description,
          created_at,
          updated_at,
          deleted_at
      `,
      [data.class_section_id, data.name, data.description ?? null]
    );

    return result.rows[0];
  }

  static async update(
    id: number,
    data: SubjectUpdatePayload
  ): Promise<Subject | null> {
    const result = await db.query<Subject>(
      `
        UPDATE ${tableName}
        SET
          class_section_id = COALESCE($1, class_section_id),
          name = COALESCE($2, name),
          description = COALESCE($3, description)
        WHERE id = $4
          AND deleted_at IS NULL
        RETURNING
          id,
          class_section_id,
          name,
          description,
          created_at,
          updated_at,
          deleted_at
      `,
      [
        data.class_section_id ?? null,
        data.name ?? null,
        data.description ?? null,
        id,
      ]
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<Subject | null> {
    const result = await db.query<Subject>(
      `
        UPDATE ${tableName}
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING
          id,
          class_section_id,
          name,
          description,
          created_at,
          updated_at,
          deleted_at
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async restore(id: number): Promise<Subject | null> {
    const result = await db.query<Subject>(
      `
        UPDATE ${tableName}
        SET deleted_at = NULL
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING
          id,
          class_section_id,
          name,
          description,
          created_at,
          updated_at,
          deleted_at
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async hardDelete(id: number): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM ${tableName}
        WHERE id = $1
      `,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  }
}