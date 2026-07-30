import { db } from "../db/query-builder.js";

export interface ClassSectionRelation {
  id: number;

  class_id: number;
  class_name: string;

  section_id: number;
  section_name: string;
  section_stream?: string | null;

  teacher_id: number | null;
  teacher_name: string;
  employee_code?: string | null;

  academic_year_id: number;

  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
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

export type ClassSectionRelationStatusFilter = "all" | "trash";

/** class_id + section_id is already taken for the current academic year. */
export class DuplicateClassSectionError extends Error {
  constructor() {
    super(
      "This class and section are already assigned for the current academic year.",
    );
    this.name = "DuplicateClassSectionError";
  }
}

/** class_id / section_id / teacher_id does not reference an existing row. */
export class InvalidClassSectionReferenceError extends Error {
  constructor() {
    super("Class, section or teacher not found.");
    this.name = "InvalidClassSectionReferenceError";
  }
}

const tableName = "class_section_relation";
const alias = "csr";

// pg unique_violation / foreign_key_violation error codes.
const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: string }).code === "23505";

const isForeignKeyViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: string }).code === "23503";

const rethrowKnownConstraintErrors = (error: unknown): never => {
  if (isUniqueViolation(error)) {
    throw new DuplicateClassSectionError();
  }

  if (isForeignKeyViolation(error)) {
    throw new InvalidClassSectionReferenceError();
  }

  throw error;
};

type JoinedRow = {
  id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  section_stream: string | null;
  teacher_id: number | null;
  teacher_first_name: string | null;
  teacher_last_name: string | null;
  employee_code: string | null;
  academic_year_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

const toClassSectionRelation = (
  row: JoinedRow,
): ClassSectionRelation => ({
  id: row.id,
  class_id: row.class_id,
  class_name: row.class_name,
  section_id: row.section_id,
  section_name: row.section_name,
  section_stream: row.section_stream,
  teacher_id: row.teacher_id,
  teacher_name: `${row.teacher_first_name ?? ""} ${
    row.teacher_last_name ?? ""
  }`.trim(),
  employee_code: row.employee_code,
  academic_year_id: row.academic_year_id,
  created_at: row.created_at,
  updated_at: row.updated_at,
  deleted_at: row.deleted_at,
});

/** Base select used by every listing/lookup — auto-scoped to the current academic year. */
const joinedQuery = () =>
  db
    .table<JoinedRow>(tableName, alias)
    .select(
      `${alias}.id`,
      `${alias}.class_id`,
      `${alias}.section_id`,
      `${alias}.teacher_id`,
      `${alias}.academic_year_id`,
      `${alias}.created_at`,
      `${alias}.updated_at`,
      `${alias}.deleted_at`,
    )
    .selectAs("classes.class_name", "class_name")
    .selectAs("section.name", "section_name")
    .selectAs("stream.name", "section_stream")
    .selectAs("teachers.first_name", "teacher_first_name")
    .selectAs("teachers.last_name", "teacher_last_name")
    .selectAs("teachers.employee_code", "employee_code")
    .join("classes", `${alias}.class_id`, "=", "classes.id")
    .join("section", `${alias}.section_id`, "=", "section.id")
    .leftJoin("stream", "section.stream_id", "=", "stream.id")
    .leftJoin("teachers", `${alias}.teacher_id`, "=", "teachers.id");

export class ClassSectionRelationModel {
  static async findByStatus(
    statusFilter: ClassSectionRelationStatusFilter = "all",
  ): Promise<ClassSectionRelation[]> {
    let query = joinedQuery();

    query =
      statusFilter === "trash"
        ? query.whereNotNull(`${alias}.deleted_at`)
        : query.whereNull(`${alias}.deleted_at`);

    const rows = await query.orderBy(`${alias}.id`, "DESC").get();

    return rows.map(toClassSectionRelation);
  }

  static async findAll(): Promise<ClassSectionRelation[]> {
    return this.findByStatus("all");
  }

  static async findById(id: number): Promise<ClassSectionRelation | null> {
    const row = await joinedQuery()
      .where(`${alias}.id`, "=", id)
      .whereNull(`${alias}.deleted_at`)
      .first();

    return row ? toClassSectionRelation(row) : null;
  }

  private static async findByIdIncludingTrashed(
    id: number,
  ): Promise<ClassSectionRelation | null> {
    const row = await joinedQuery()
      .where(`${alias}.id`, "=", id)
      .first();

    return row ? toClassSectionRelation(row) : null;
  }

  static async create(
    data: ClassSectionRelationPayload,
  ): Promise<ClassSectionRelation> {
    try {
      const inserted = await db
        .table<{ id: number }>(tableName)
        .insert({
          class_id: data.class_id,
          section_id: data.section_id,
          teacher_id: data.teacher_id ?? null,
        });

      const created = await this.findById(inserted.id);

      if (!created) {
        throw new Error("Class section relation created but not found");
      }

      return created;
    } catch (error) {
      return rethrowKnownConstraintErrors(error);
    }
  }

  static async update(
    id: number,
    data: ClassSectionRelationUpdatePayload,
  ): Promise<ClassSectionRelation | null> {
    const updateData: Record<string, number | null> = {};
    if (data.class_id !== undefined) updateData.class_id = data.class_id;
    if (data.section_id !== undefined) updateData.section_id = data.section_id;
    // teacher_id may be explicitly null to unassign the teacher.
    if (data.teacher_id !== undefined) updateData.teacher_id = data.teacher_id;

    try {
      const updated = await db
        .table<{ id: number }>(tableName)
        .where("id", "=", id)
        .whereNull("deleted_at")
        .update(updateData);

      if (!updated[0]) {
        return null;
      }

      return this.findById(updated[0].id);
    } catch (error) {
      return rethrowKnownConstraintErrors(error);
    }
  }

  static async delete(id: number): Promise<ClassSectionRelation | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await db
      .table(tableName)
      .where("id", "=", id)
      .whereNull("deleted_at")
      .softDelete();

    return this.findByIdIncludingTrashed(id);
  }

  static async restore(id: number): Promise<ClassSectionRelation | null> {
    try {
      const restored = await db
        .table<{ id: number }>(tableName)
        .where("id", "=", id)
        .whereNotNull("deleted_at")
        .restore();

      if (!restored[0]) {
        return null;
      }

      return this.findById(restored[0].id);
    } catch (error) {
      return rethrowKnownConstraintErrors(error);
    }
  }

  static async hardDelete(id: number): Promise<boolean> {
    const deletedCount = await db
      .table(tableName)
      .where("id", "=", id)
      .delete();

    return deletedCount > 0;
  }
}
