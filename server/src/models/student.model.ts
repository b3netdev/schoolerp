import { db, type DatabaseValue } from "../db/query-builder.js";
import { AppError } from "../utils/AppError.js";
import {
  StudentClassRelationModel,
  type StudentClassRelation,
  InvalidStudentClassReferenceError,
  DuplicateStudentEnrollmentError,
} from "./student-class-relation.model.js";

export interface Student {
  id: number;
  student_code: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  class_section_id?: number;
  class_name?: string;
  section_name?: string;

  deleted_at?: Date | null;
}

/** Student row including the password hash — only for internal/auth use, never returned to a client. */
export interface StudentWithPassword extends Student {
  password: string;
}

export type StudentMetaType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "jsonb"
  | "text";

export type StudentMetaValue =
  | string
  | number
  | boolean
  | Date
  | Record<string, unknown>
  | unknown[]
  | null;

/** Arbitrary, admin-defined key/value profile fields — no schema migration needed to add a new one. */
export type StudentMetaInput = Record<string, StudentMetaValue | undefined>;
export type StudentMetaMap = Record<string, StudentMetaValue>;

export interface StudentWithMeta extends Student {
  meta: StudentMetaMap;
  current_class?: StudentClassRelation | null;
}

export interface StudentCreateData {
  student_code: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  hashedPassword: string;
  status?: string;
  meta?: StudentMetaInput;
  classAssignment?: {
    /** References an existing class_section_relation row. */
    class_section_id: number;
  };
}

export interface StudentUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  hashedPassword?: string;
  status?: string;
  meta?: StudentMetaInput;
   class_section_id?: number;
}

export type StudentStatusFilter = "all" | "active" | "inactive" | "trash";

export interface StudentListResult {
  students: StudentWithMeta[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const tableName = "students";
const metaTableName = "student_meta";

type StudentMetaRow = {
  student_id: number;
  meta_key: string;
  meta_value: string | null;
  meta_type: string;
};

const inferMetaType = (value: StudentMetaValue): StudentMetaType => {
  if (value === null) return "string";
  if (value instanceof Date) return "date";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "object") return "jsonb";
  return "string";
};

const serializeMetaValue = (value: StudentMetaValue): string | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const parseMetaValue = (
  value: string | null,
  type: string,
): StudentMetaValue => {
  if (value === null) return null;

  switch (type) {
    case "number": {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    case "boolean":
      return value === "true";
    case "date":
      return new Date(value);
    case "json":
    case "jsonb":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
};

const toStudent = (row: Student): Student => ({
  id: row.id,
  student_code: row.student_code,
  first_name: row.first_name,
  last_name: row.last_name,
  email: row.email,
  phone: row.phone,
  status: row.status,
  is_active: row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
  deleted_at: row.deleted_at,
});

/** Bulk-fetches meta rows for several students at once (avoids N+1 on listing pages). */
const fetchMetaForStudentIds = async (
  studentIds: number[],
): Promise<Map<number, StudentMetaMap>> => {
  const metaByStudent = new Map<number, StudentMetaMap>();

  if (studentIds.length === 0) {
    return metaByStudent;
  }

  const rows = await db
    .table<StudentMetaRow>(metaTableName)
    .whereIn("student_id", studentIds)
    .whereNull("deleted_at")
    .get();

  for (const row of rows) {
    const existing = metaByStudent.get(row.student_id) ?? {};
    existing[row.meta_key] = parseMetaValue(row.meta_value, row.meta_type);
    metaByStudent.set(row.student_id, existing);
  }

  return metaByStudent;
};

const upsertMeta = async (
  studentId: number,
  meta: StudentMetaInput,
): Promise<void> => {
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) {
      continue;
    }

    const metaValue: Record<string, DatabaseValue> = {
      meta_value: serializeMetaValue(value),
      meta_type: inferMetaType(value),
    };

    const existingRow = await db
      .table(metaTableName)
      .where("student_id", "=", studentId)
      .where("meta_key", "=", key)
      .whereNull("deleted_at")
      .first();

    if (existingRow) {
      await db
        .table(metaTableName)
        .where("student_id", "=", studentId)
        .where("meta_key", "=", key)
        .update(metaValue);
    } else {
      await db.table(metaTableName).insert({
        student_id: studentId,
        meta_key: key,
        ...metaValue,
      });
    }
  }
};

export class StudentModel {
  static async generateStudentCode(
    prefix: string,
    totalLength: number,
  ): Promise<string> {
    const cleanedPrefix = prefix.trim().toUpperCase();

    if (!cleanedPrefix) {
      throw new Error("Student code prefix is required");
    }

    if (!Number.isInteger(totalLength) || totalLength <= 0) {
      throw new Error("Student code length must be a positive integer");
    }

    const numericPartLength = totalLength - cleanedPrefix.length;

    if (numericPartLength <= 0) {
      throw new Error(
        "Student code length must be greater than the prefix length",
      );
    }

    const result = await db.query<{ sequence_value: string }>(
      `SELECT nextval('student_student_code_seq')::text AS sequence_value`,
    );

    const sequenceValue = result.rows[0].sequence_value;

    if (sequenceValue.length > numericPartLength) {
      throw new Error("Student code sequence exceeded the configured length");
    }

    const paddedNumber = sequenceValue.padStart(numericPartLength, "0");

    return `${cleanedPrefix}${paddedNumber}`;
  }

  static async alreadyExists(
    field: string,
    value: string,
    excludeId?: number,
  ): Promise<boolean> {
    let query = db
      .table(tableName)
      .where(field, "=", value)
      .whereNull("deleted_at");

    if (excludeId !== undefined) {
      query = query.where("id", "!=", excludeId);
    }

    return query.exists();
  }

  static async findByStatus(
    status: StudentStatusFilter = "all",
    page: number = 1,
    limit: number = 10,
    classId?: number,
    sectionId?: number,
    classSectionId?: number,
  ): Promise<StudentListResult> {
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const validLimits = [5, 10, 20];
    const safeLimit = validLimits.includes(Number(limit)) ? Number(limit) : 10;

    const values: string[] = [];
    const whereParts: string[] = ["s.deleted_at IS NULL"];

    if (status === "trash") {
      whereParts[0] = "s.deleted_at IS NOT NULL";
    } else if (status !== "all") {
      values.push(status);
      whereParts.push(`s.status = $${values.length}`);
    }

    if (classSectionId && Number.isInteger(classSectionId) && classSectionId > 0) {
      values.push(String(classSectionId));
      whereParts.push(`sc.class_section_id = $${values.length}`);
    } else {
      if (classId && Number.isInteger(classId) && classId > 0) {
        values.push(String(classId));
        whereParts.push(`csr.class_id = $${values.length}`);
      }

      if (sectionId && Number.isInteger(sectionId) && sectionId > 0) {
        values.push(String(sectionId));
        whereParts.push(`csr.section_id = $${values.length}`);
      }
    }

    const whereClause = whereParts.join(" AND ");

    const totalResult = await db.query<{ total: number }>(
      `
      SELECT COUNT(*)::int AS total
      FROM students AS s
      LEFT JOIN student_class_relation AS sc
        ON s.id = sc.student_id
        AND sc.deleted_at IS NULL
      LEFT JOIN class_section_relation AS csr
        ON sc.class_section_id = csr.id
        AND csr.deleted_at IS NULL
      WHERE ${whereClause}
      `,
      values,
    );

    const total = Number(totalResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const normalizedPage = Math.min(safePage, totalPages);
    const offset = (normalizedPage - 1) * safeLimit;

    const paginatedParams = [...values, String(safeLimit), String(offset)];
    const limitParamIndex = values.length + 1;
    const offsetParamIndex = values.length + 2;

    const result = await db.query<
      Student & {
        class_section_id: number | null;
        class_name: string | null;
        section_name: string | null;
      }
    >(
      `
      SELECT
        s.*,
        sc.class_section_id,
        c.class_name,
        sec.name AS section_name
      FROM students AS s

      LEFT JOIN student_class_relation AS sc
        ON s.id = sc.student_id
        AND sc.deleted_at IS NULL

      LEFT JOIN class_section_relation AS csr
        ON sc.class_section_id = csr.id
        AND csr.deleted_at IS NULL

      LEFT JOIN classes AS c
        ON c.id = csr.class_id
        AND c.deleted_at IS NULL

      LEFT JOIN section AS sec
        ON sec.id = csr.section_id
        AND sec.deleted_at IS NULL

      WHERE ${whereClause}
      ORDER BY s.id DESC
      LIMIT $${limitParamIndex}
      OFFSET $${offsetParamIndex}
    `,
      paginatedParams,
    );

    const rows = result.rows;

    const metaByStudent = await fetchMetaForStudentIds(
      rows.map((row) => row.id),
    );

    const students = rows.map((row) => ({
      ...toStudent(row),
      class_section_id: row.class_section_id ?? undefined,
      class_name: row.class_name ?? undefined,
      section_name: row.section_name ?? undefined,
      meta: metaByStudent.get(row.id) ?? {},
    }));

    return {
      students,
      total,
      page: normalizedPage,
      limit: safeLimit,
      totalPages,
    };
  }

  static async findById(id: number): Promise<StudentWithMeta | null> {
    const row = await db
      .table<Student>(tableName)
      .where("id", "=", id)
      .whereNull("deleted_at")
      .first();

    if (!row) {
      return null;
    }

    const metaByStudent = await fetchMetaForStudentIds([id]);
    const currentClass =
      await StudentClassRelationModel.findActiveByStudentId(id);

    return {
      ...toStudent(row),
      meta: metaByStudent.get(id) ?? {},
      current_class: currentClass,
    };
  }

  /** Includes the password hash — for internal auth use only. */
  static async findByStudentCodeForLogin(
    studentCode: string,
  ): Promise<StudentWithPassword | null> {
    const result = await db.query<StudentWithPassword>(
      `SELECT * FROM ${tableName}
        WHERE deleted_at IS NULL
          AND UPPER(student_code) = UPPER($1)
        LIMIT 1`,
      [studentCode],
    );

    return result.rows[0] ?? null;
  }

  static async create(data: StudentCreateData): Promise<StudentWithMeta> {
    return db.transaction(async () => {
      const student = await db.table<{ id: number }>(tableName).insert({
        student_code: data.student_code,
        first_name: data.first_name,
        last_name: data.last_name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        password: data.hashedPassword,
        status: data.status ?? "active",
      });

      if (data.meta) {
        await upsertMeta(student.id, data.meta);
      }

      if (data.classAssignment) {
        try {
          await StudentClassRelationModel.create({
            student_id: student.id,
            class_section_id: data.classAssignment.class_section_id,
          });
        } catch (error) {
          if (
            error instanceof InvalidStudentClassReferenceError ||
            error instanceof DuplicateStudentEnrollmentError
          ) {
            throw new AppError(error.message, 400);
          }

          throw error;
        }
      }

      const created = await this.findById(student.id);

      if (!created) {
        throw new Error("Student created but not found");
      }

      return created;
    });
  }

static async update(
  id: number,
  data: StudentUpdateData,
): Promise<StudentWithMeta | null> {
  return db.transaction(async () => {
    const studentUpdate: Record<string, DatabaseValue | undefined> = {};

    if (data.first_name !== undefined) {
      studentUpdate.first_name = data.first_name;
    }

    if (data.last_name !== undefined) {
      studentUpdate.last_name = data.last_name;
    }

    // `null` clears the value. `undefined` means do not change it.
    if (data.email !== undefined) {
      studentUpdate.email = data.email;
    }

    if (data.phone !== undefined) {
      studentUpdate.phone = data.phone;
    }

    if (data.status !== undefined) {
      studentUpdate.status = data.status;
    }

    if (data.hashedPassword !== undefined) {
      studentUpdate.password = data.hashedPassword;
    }

    let updatedId = id;

    if (Object.keys(studentUpdate).length > 0) {
      const updated = await db
        .table<{ id: number }>(tableName)
        .where("id", "=", id)
        .whereNull("deleted_at")
        .update(studentUpdate);

      if (!updated[0]) {
        return null;
      }

      updatedId = updated[0].id;
    } else {
      const existing = await this.findById(id);

      if (!existing) {
        return null;
      }
    }

    if (data.meta && Object.keys(data.meta).length > 0) {
      await upsertMeta(id, data.meta);
    }

    // Create a class assignment if none exists; otherwise update it.
    if (data.class_section_id !== undefined) {
      const existingRelation =
        await StudentClassRelationModel.findActiveByStudentId(id);

      if (existingRelation) {
        await StudentClassRelationModel.update(existingRelation.id, {
          class_section_id: data.class_section_id,
        });
      } else {
        await StudentClassRelationModel.create({
          student_id: id,
          class_section_id: data.class_section_id,
        });
      }
    }

    return this.findById(updatedId);
  });
}

  static async delete(id: number): Promise<StudentWithMeta | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    await db
      .table(tableName)
      .where("id", "=", id)
      .whereNull("deleted_at")
      .softDelete();

    return { ...existing, deleted_at: new Date() };
  }

  static async restore(id: number): Promise<StudentWithMeta | null> {
    const restored = await db
      .table<{ id: number }>(tableName)
      .where("id", "=", id)
      .whereNotNull("deleted_at")
      .restore();

    if (!restored[0]) {
      return null;
    }

    return this.findById(restored[0].id);
  }

  static async hardDelete(id: number): Promise<boolean> {
    const deletedCount = await db
      .table(tableName)
      .where("id", "=", id)
      .delete();

    return deletedCount > 0;
  }
}
