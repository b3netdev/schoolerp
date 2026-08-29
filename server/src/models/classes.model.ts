import { query } from "../db/query.js";

export interface Class {
  id: number;
  class_name: string;
  status: "active" | "inactive";
  description: string | null;
  display_order: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface SectionPayload {
  /** Send id to attach an already-existing section. */
  id?: number;
  /** Required when creating a new section. */
  name?: string;
  description?: string | null;
  display_order?: number | null;
}

export interface ClassPayload {
  class_name: string;
  status: "active" | "inactive";
  description?: string | null;
  display_order?: number | null;
  sections?: SectionPayload[];
}

export interface ClassUpdatePayload {
  class_name?: string;
  status?: "active" | "inactive";
  description?: string | null;
  display_order?: number | null;
  sections?: SectionPayload[];
}

export interface ClassSection {
  relation_id: number;
  id: number;
  name: string;
  description: string | null;
  display_order: number | null;
  teacher_id: number | null;
}

export interface ClassWithSections extends Class {
  sections: ClassSection[];
}

const tableName = "classes";

export class ClassModel {
  static async findAll(): Promise<Class[]> {
    const result = await query<Class>(`
      SELECT id, class_name, status, description, display_order,
             created_at, updated_at, deleted_at
      FROM ${tableName}
      WHERE deleted_at IS NULL
      ORDER BY display_order ASC NULLS LAST, id ASC
    `);

    return result.rows;
  }

  static async findByStatus(statusFilter: string): Promise<Class[]> {
    let whereClause = "WHERE deleted_at IS NULL";
    const values: string[] = [];

    if (statusFilter === "trash") {
      whereClause = "WHERE deleted_at IS NOT NULL";
    } else if (statusFilter === "active" || statusFilter === "inactive") {
      whereClause = "WHERE deleted_at IS NULL AND status = $1";
      values.push(statusFilter);
    }

    const result = await query<Class>(`
      SELECT id, class_name, status, description, display_order,
             created_at, updated_at, deleted_at
      FROM ${tableName}
      ${whereClause}
      ORDER BY display_order ASC NULLS LAST, id ASC
    `, values);

    return result.rows;
  }

  static async findById(id: number): Promise<Class | null> {
    const result = await query<Class>(`
      SELECT id, class_name, status, description, display_order,
             created_at, updated_at, deleted_at
      FROM ${tableName}
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1
    `, [id]);

    return result.rows[0] || null;
  }

  static async findByIdWithSections(
    id: number,
    academicYearId: number,
  ): Promise<ClassWithSections | null> {
    const classData = await this.findById(id);
    if (!classData) return null;

    const sectionResult = await query<ClassSection>(`
      SELECT
        csr.id AS relation_id,
        s.id,
        s.name,
        s.description,
        s.display_order,
        csr.teacher_id
      FROM class_section_relation csr
      INNER JOIN section s ON s.id = csr.section_id
      WHERE csr.class_id = $1
        AND csr.academic_year_id = $2
        AND csr.deleted_at IS NULL
        AND s.deleted_at IS NULL
      ORDER BY s.display_order ASC NULLS LAST, s.id ASC
    `, [id, academicYearId]);

    return {
      ...classData,
      sections: sectionResult.rows,
    };
  }

  static async create(
    data: ClassPayload,
    academicYearId?: number,
  ): Promise<ClassWithSections> {
    const classResult = await query<Class>(`
      INSERT INTO ${tableName}
        (class_name, status, description, display_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id, class_name, status, description, display_order,
                created_at, updated_at, deleted_at
    `, [
      data.class_name.trim(),
      data.status,
      data.description ?? null,
      data.display_order ?? null,
    ]);

    const createdClass = classResult.rows[0];
    if (!createdClass) throw new Error("Class could not be created.");

    const sections = data.sections?.length
      ? await this.addSectionsToClass(
        createdClass.id,
        this.requireAcademicYearId(academicYearId),
        data.sections,
      )
      : [];

    return { ...createdClass, sections };
  }

  static async update(
    id: number,
    data: ClassUpdatePayload,
    academicYearId?: number,
  ): Promise<ClassWithSections | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let parameterIndex = 1;

    if (data.class_name !== undefined) {
      updates.push(`class_name = $${parameterIndex++}`);
      values.push(data.class_name.trim());
    }

    if (data.status !== undefined) {
      updates.push(`status = $${parameterIndex++}`);
      values.push(data.status);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${parameterIndex++}`);
      values.push(data.description);
    }

    if (data.display_order !== undefined) {
      updates.push(`display_order = $${parameterIndex++}`);
      values.push(data.display_order);
    }

    let updatedClass: Class | null;

    if (updates.length === 0) {
      updatedClass = await this.findById(id);
    } else {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      const result = await query<Class>(`
        UPDATE ${tableName}
        SET ${updates.join(", ")}
        WHERE id = $${parameterIndex} AND deleted_at IS NULL
        RETURNING id, class_name, status, description, display_order,
                  created_at, updated_at, deleted_at
      `, values);

      updatedClass = result.rows[0] || null;
    }

    if (!updatedClass) return null;

    const sections = data.sections?.length
      ? await this.addSectionsToClass(
        id,
        this.requireAcademicYearId(academicYearId),
        data.sections,
      )
      : [];

    return { ...updatedClass, sections };
  }

  static async delete(id: number): Promise<Class | null> {
    const result = await query<Class>(`
      UPDATE ${tableName}
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, class_name, status, description, display_order,
                created_at, updated_at, deleted_at
    `, [id]);

    return result.rows[0] || null;
  }

  static async restore(id: number): Promise<Class | null> {
    const result = await query<Class>(`
      UPDATE ${tableName}
      SET deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING id, class_name, status, description, display_order,
                created_at, updated_at, deleted_at
    `, [id]);

    return result.rows[0] || null;
  }

  static async hardDelete(id: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${tableName} WHERE id = $1`,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  private static async addSectionsToClass(
    classId: number,
    academicYearId: number,
    requestedSections: SectionPayload[],
  ): Promise<ClassSection[]> {
    const addedSections: ClassSection[] = [];
    const usedSectionIds = new Set<number>();

    for (const sectionData of requestedSections) {
      let sectionId = sectionData.id;

      if (sectionId !== undefined) {
        const sectionExists = await query<{ id: number }>(`
          SELECT id
          FROM section
          WHERE id = $1 AND deleted_at IS NULL
          LIMIT 1
        `, [sectionId]);

        if (!sectionExists.rows[0]) {
          throw new Error(`Section with ID ${sectionId} was not found.`);
        }
      } else {
        if (!sectionData.name?.trim()) {
          throw new Error("Section name is required for a new section.");
        }

        const newSection = await query<{ id: number }>(`
          INSERT INTO section (name, description, display_order)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [
          sectionData.name.trim(),
          sectionData.description ?? null,
          sectionData.display_order ?? null,
        ]);

        sectionId = newSection.rows[0]?.id;
      }

      if (!sectionId || usedSectionIds.has(sectionId)) continue;
      usedSectionIds.add(sectionId);

      const existingRelation = await query<{ id: number }>(`
        SELECT id
        FROM class_section_relation
        WHERE class_id = $1
          AND section_id = $2
          AND academic_year_id = $3
          AND deleted_at IS NULL
        LIMIT 1
      `, [classId, sectionId, academicYearId]);

      // Existing sections sent back from Edit Class must not create duplicates.
      if (existingRelation.rows[0]) continue;

      const relationResult = await query<{ relation_id: number }>(`
        INSERT INTO class_section_relation
          (class_id, section_id, teacher_id, academic_year_id)
        VALUES ($1, $2, NULL, $3)
        RETURNING id AS relation_id
      `, [classId, sectionId, academicYearId]);

      const relation = relationResult.rows[0];
      if (!relation) throw new Error("Class section relation could not be created.");

      const sectionResult = await query<Omit<ClassSection, "relation_id" | "teacher_id">>(`
        SELECT id, name, description, display_order
        FROM section
        WHERE id = $1
      `, [sectionId]);

      const section = sectionResult.rows[0];
      if (section) {
        addedSections.push({
          ...section,
          relation_id: relation.relation_id,
          teacher_id: null,
        });
      }
    }

    return addedSections;
  }

  private static requireAcademicYearId(academicYearId?: number): number {
    if (!Number.isInteger(academicYearId) || !academicYearId || academicYearId <= 0) {
      throw new Error("Valid academic year is required when adding sections.");
    }

    return academicYearId;
  }
}
