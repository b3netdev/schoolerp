import { query } from "../db/query.js";

export interface ClassSectionRelation {
  id: number;

  class_id: number;
  class_name: string;

  section_id: number;
  section_name: string;
  section_stream?: string | null;

  teacher_id?: number | null;
  teacher_name?: string | null;
  employee_code?: string | null;

  created_at: Date;
  updated_at: Date;
}

export interface ClassSectionRelationPayload {
  class_id: number;
  section_id: number;
  teacher_id?: number | null;
}

export interface ClassSectionRelationUpdatePayload {
  class_id?: number;
  section_id?: number;
  teacher_id?: number | null;
}

const tableName = "class_section_relation";

export class ClassSectionRelationModel {
  static async findAll(): Promise<ClassSectionRelation[]> {
    const result = await query<ClassSectionRelation>(
      `
      SELECT
        csr.id,

        csr.class_id,
        c.class_name,

        csr.section_id,
        s.name AS section_name,
        s.stream AS section_stream,

        csr.teacher_id,
        CONCAT(t.first_name, ' ', COALESCE(t.last_name, '')) AS teacher_name,
        t.employee_code,

        csr.created_at,
        csr.updated_at
      FROM ${tableName} csr
      INNER JOIN classes c ON c.id = csr.class_id
      INNER JOIN section s ON s.id = csr.section_id
      LEFT JOIN teachers t ON t.id = csr.teacher_id
      ORDER BY csr.id DESC
      `
    );

    return result.rows;
  }

  static async findById(id: number): Promise<ClassSectionRelation | null> {
    const result = await query<ClassSectionRelation>(
      `
      SELECT
        csr.id,

        csr.class_id,
        c.class_name,

        csr.section_id,
        s.name AS section_name,
        s.stream AS section_stream,

        csr.teacher_id,
        CONCAT(t.first_name, ' ', COALESCE(t.last_name, '')) AS teacher_name,
        t.employee_code,

        csr.created_at,
        csr.updated_at
      FROM ${tableName} csr
      INNER JOIN classes c ON c.id = csr.class_id
      INNER JOIN section s ON s.id = csr.section_id
      LEFT JOIN teachers t ON t.id = csr.teacher_id
      WHERE csr.id = $1
      LIMIT 1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async create(
    data: ClassSectionRelationPayload
  ): Promise<ClassSectionRelation> {
    const result = await query<{ id: number }>(
      `
      INSERT INTO ${tableName}
        (class_id, section_id, teacher_id)
      VALUES
        ($1, $2, $3)
      RETURNING id
      `,
      [
        data.class_id,
        data.section_id,
        data.teacher_id ?? null,
      ]
    );

    const createdRelation = await this.findById(result.rows[0].id);

    if (!createdRelation) {
      throw new Error("Class section relation created but not found");
    }

    return createdRelation;
  }

  static async update(
    id: number,
    data: ClassSectionRelationUpdatePayload
  ): Promise<ClassSectionRelation | null> {
    const result = await query<{ id: number }>(
      `
      UPDATE ${tableName}
      SET
        class_id = COALESCE($1, class_id),
        section_id = COALESCE($2, section_id),
        teacher_id = COALESCE($3, teacher_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id
      `,
      [
        data.class_id ?? null,
        data.section_id ?? null,
        data.teacher_id ?? null,
        id,
      ]
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(result.rows[0].id);
  }

  static async delete(id: number): Promise<ClassSectionRelation | null> {
    const existingRelation = await this.findById(id);

    if (!existingRelation) {
      return null;
    }

    await query(
      `
      DELETE FROM ${tableName}
      WHERE id = $1
      `,
      [id]
    );

    return existingRelation;
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