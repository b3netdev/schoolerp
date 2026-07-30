import { db } from "../db/query-builder.js";
import { ClassSectionRelationModel } from "./class-section-relation.model.js";

export interface StudentClassRelation {
  id: number;

  student_id: number;
  student_name: string;
  student_code: string;

  class_section_id: number;
  class_id: number;
  class_name: string;

  section_id: number;
  section_name: string;
  section_stream?: string | null;

  teacher_id: number | null;
  teacher_name: string;

  academic_year_id: number;

  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface StudentClassRelationPayload {
  student_id: number;
  /** References an existing class_section_relation row (class + section + teacher for a year). */
  class_section_id: number;
}

export interface StudentClassRelationUpdatePayload {
  class_section_id?: number;
}

export type StudentClassRelationStatusFilter = "all" | "trash";

/** student_id is already enrolled for the current academic year. */
export class DuplicateStudentEnrollmentError extends Error {
  constructor() {
    super(
      "This student already has a class/section assigned for the current academic year.",
    );
    this.name = "DuplicateStudentEnrollmentError";
  }
}

/**
 * student_id doesn't exist, or class_section_id doesn't reference a
 * class_section_relation for the current academic year.
 */
export class InvalidStudentClassReferenceError extends Error {
  constructor() {
    super(
      "Student not found, or the class/section does not exist for the current academic year.",
    );
    this.name = "InvalidStudentClassReferenceError";
  }
}

const tableName = "student_class_relation";
const alias = "scr";

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
    throw new DuplicateStudentEnrollmentError();
  }

  if (isForeignKeyViolation(error)) {
    throw new InvalidStudentClassReferenceError();
  }

  throw error;
};

type JoinedRow = {
  id: number;
  student_id: number;
  student_first_name: string;
  student_last_name: string | null;
  student_code: string;
  class_section_id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  section_stream: string | null;
  teacher_id: number | null;
  teacher_first_name: string | null;
  teacher_last_name: string | null;
  academic_year_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

const toStudentClassRelation = (
  row: JoinedRow,
): StudentClassRelation => ({
  id: row.id,
  student_id: row.student_id,
  student_name: `${row.student_first_name} ${
    row.student_last_name ?? ""
  }`.trim(),
  student_code: row.student_code,
  class_section_id: row.class_section_id,
  class_id: row.class_id,
  class_name: row.class_name,
  section_id: row.section_id,
  section_name: row.section_name,
  section_stream: row.section_stream,
  teacher_id: row.teacher_id,
  teacher_name: `${row.teacher_first_name ?? ""} ${
    row.teacher_last_name ?? ""
  }`.trim(),
  academic_year_id: row.academic_year_id,
  created_at: row.created_at,
  updated_at: row.updated_at,
  deleted_at: row.deleted_at,
});

/**
 * Base select used by every listing/lookup — auto-scoped to the current
 * academic year. Joins through class_section_relation to reach class,
 * section, stream, and teacher, instead of duplicating class_id/section_id
 * on this table.
 */
const joinedQuery = () =>
  db
    .table<JoinedRow>(tableName, alias)
    .select(
      `${alias}.id`,
      `${alias}.student_id`,
      `${alias}.class_section_id`,
      `${alias}.academic_year_id`,
      `${alias}.created_at`,
      `${alias}.updated_at`,
      `${alias}.deleted_at`,
    )
    .selectAs("students.first_name", "student_first_name")
    .selectAs("students.last_name", "student_last_name")
    .selectAs("students.student_code", "student_code")
    .selectAs("class_section_relation.class_id", "class_id")
    .selectAs("classes.class_name", "class_name")
    .selectAs("class_section_relation.section_id", "section_id")
    .selectAs("section.name", "section_name")
    .selectAs("stream.name", "section_stream")
    .selectAs("class_section_relation.teacher_id", "teacher_id")
    .selectAs("teachers.first_name", "teacher_first_name")
    .selectAs("teachers.last_name", "teacher_last_name")
    .join("students", `${alias}.student_id`, "=", "students.id")
    .join(
      "class_section_relation",
      `${alias}.class_section_id`,
      "=",
      "class_section_relation.id",
    )
    .join("classes", "class_section_relation.class_id", "=", "classes.id")
    .join("section", "class_section_relation.section_id", "=", "section.id")
    .leftJoin("stream", "section.stream_id", "=", "stream.id")
    .leftJoin(
      "teachers",
      "class_section_relation.teacher_id",
      "=",
      "teachers.id",
    );

export class StudentClassRelationModel {
  static async findByStatus(
    statusFilter: StudentClassRelationStatusFilter = "all",
  ): Promise<StudentClassRelation[]> {
    let query = joinedQuery();

    query =
      statusFilter === "trash"
        ? query.whereNotNull(`${alias}.deleted_at`)
        : query.whereNull(`${alias}.deleted_at`);

    const rows = await query.orderBy(`${alias}.id`, "DESC").get();

    return rows.map(toStudentClassRelation);
  }

  static async findById(
    id: number,
  ): Promise<StudentClassRelation | null> {
    const row = await joinedQuery()
      .where(`${alias}.id`, "=", id)
      .whereNull(`${alias}.deleted_at`)
      .first();

    return row ? toStudentClassRelation(row) : null;
  }

  static async findActiveByStudentId(
    studentId: number,
  ): Promise<StudentClassRelation | null> {
    const row = await joinedQuery()
      .where(`${alias}.student_id`, "=", studentId)
      .whereNull(`${alias}.deleted_at`)
      .first();

    return row ? toStudentClassRelation(row) : null;
  }

  private static async findByIdIncludingTrashed(
    id: number,
  ): Promise<StudentClassRelation | null> {
    const row = await joinedQuery()
      .where(`${alias}.id`, "=", id)
      .first();

    return row ? toStudentClassRelation(row) : null;
  }

  /**
   * ClassSectionRelationModel.findById() is itself academic-year scoped, so
   * this both confirms the row exists AND that it belongs to the current
   * academic year — a class_section_id from a different year is rejected
   * the same way a nonexistent one would be.
   */
  private static async assertClassSectionBelongsToCurrentYear(
    classSectionId: number,
  ): Promise<void> {
    const classSection = await ClassSectionRelationModel.findById(
      classSectionId,
    );

    if (!classSection) {
      throw new InvalidStudentClassReferenceError();
    }
  }

  static async create(
    data: StudentClassRelationPayload,
  ): Promise<StudentClassRelation> {
    await this.assertClassSectionBelongsToCurrentYear(data.class_section_id);

    try {
      const inserted = await db
        .table<{ id: number }>(tableName)
        .insert({
          student_id: data.student_id,
          class_section_id: data.class_section_id,
        });

      const created = await this.findById(inserted.id);

      if (!created) {
        throw new Error("Student class relation created but not found");
      }

      return created;
    } catch (error) {
      return rethrowKnownConstraintErrors(error);
    }
  }

  static async update(
    id: number,
    data: StudentClassRelationUpdatePayload,
  ): Promise<StudentClassRelation | null> {
    if (data.class_section_id !== undefined) {
      await this.assertClassSectionBelongsToCurrentYear(
        data.class_section_id,
      );
    }

    try {
      const updated = await db
        .table<{ id: number }>(tableName)
        .where("id", "=", id)
        .whereNull("deleted_at")
        .update({ class_section_id: data.class_section_id });

      if (!updated[0]) {
        return null;
      }

      return this.findById(updated[0].id);
    } catch (error) {
      return rethrowKnownConstraintErrors(error);
    }
  }

  static async delete(
    id: number,
  ): Promise<StudentClassRelation | null> {
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

  static async restore(
    id: number,
  ): Promise<StudentClassRelation | null> {
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
