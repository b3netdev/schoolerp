import { db, type DatabaseValue } from "../db/query-builder.js";
import {
  StudentClassRelationModel,
  type StudentClassRelation,
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
}

export type StudentStatusFilter = "all" | "active" | "inactive" | "trash";

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
  ): Promise<StudentWithMeta[]> {
    let query = db.table<Student>(tableName);

    if (status === "trash") {
      query = query.whereNotNull("deleted_at");
    } else {
      query = query.whereNull("deleted_at");

      if (status !== "all") {
        query = query.where("status", "=", status);
      }
    }

    const rows = await query.orderBy("id", "DESC").get();
    const metaByStudent = await fetchMetaForStudentIds(rows.map((r) => r.id));

    return rows.map((row) => ({
      ...toStudent(row),
      meta: metaByStudent.get(row.id) ?? {},
    }));
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
  static async findByLoginIdentifier(
    identifier: string,
  ): Promise<StudentWithPassword | null> {
    const result = await db.query<StudentWithPassword>(
      `SELECT * FROM ${tableName}
        WHERE deleted_at IS NULL
          AND (student_code = $1 OR phone = $1 OR LOWER(email) = LOWER($1))
        LIMIT 1`,
      [identifier],
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
        await StudentClassRelationModel.create({
          student_id: student.id,
          class_section_id: data.classAssignment.class_section_id,
        });
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
      if (data.first_name !== undefined) studentUpdate.first_name = data.first_name;
      if (data.last_name !== undefined) studentUpdate.last_name = data.last_name;
      // null clears the field; undefined (checked above) means "leave unchanged".
      if (data.email !== undefined) studentUpdate.email = data.email;
      if (data.phone !== undefined) studentUpdate.phone = data.phone;
      if (data.status !== undefined) studentUpdate.status = data.status;
      if (data.hashedPassword !== undefined) studentUpdate.password = data.hashedPassword;

      let updatedId: number = id;

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
