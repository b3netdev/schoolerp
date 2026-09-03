import { query } from "../db/query.js";

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6;

export interface ClassRoutine {
  id: number;
  academic_year_id: number;
  class_id: number;
  section_id: number;
  subject_id: number;
  teacher_id: number | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_number: string | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ClassRoutineDetails extends ClassRoutine {
  class_name: string;
  section_name: string;
  subject_name: string;
  teacher_name: string | null;
}

export interface CreateClassRoutinePayload {
  class_id: number;
  section_id: number;
  subject_id: number;
  teacher_id?: number | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_number?: string | null;
  remarks?: string | null;
}

export interface UpdateClassRoutinePayload {
  class_id?: number;
  section_id?: number;
  subject_id?: number;
  teacher_id?: number | null;
  day_of_week?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  room_number?: string | null;
  remarks?: string | null;
}

export interface ClassRoutineFilters {
  class_id?: number;
  section_id?: number;
  day_of_week?: DayOfWeek;
  status?: "all" | "trash";
}

const tableName = "class_routine";

const selectRoutineFields = `
  cr.id,
  cr.academic_year_id,
  cr.class_id,
  cr.section_id,
  cr.subject_id,
  cr.teacher_id,
  cr.day_of_week,
  cr.start_time,
  cr.end_time,
  cr.room_number,
  cr.remarks,
  cr.created_at,
  cr.updated_at,
  cr.deleted_at,
  c.class_name,
  sec.name AS section_name,
  sub.name AS subject_name,
  NULLIF(
    CONCAT_WS(' ', teacher.first_name, teacher.last_name),
    ''
  ) AS teacher_name
`;

export class ClassRoutineModel {
  /**
   * Gets all routines for one academic session.
   * `academicYearId` should always come from the authenticated JWT session.
   */
  static async findAll(
    academicYearId: number,
    filters: ClassRoutineFilters = {},
  ): Promise<ClassRoutineDetails[]> {
    const conditions: string[] = ["cr.academic_year_id = $1"];
    const values: Array<number> = [academicYearId];
    let parameterIndex = 2;

    if (filters.status === "trash") {
      conditions.push("cr.deleted_at IS NOT NULL");
    } else {
      conditions.push("cr.deleted_at IS NULL");
    }

    if (filters.class_id !== undefined) {
      conditions.push(`cr.class_id = $${parameterIndex}`);
      values.push(filters.class_id);
      parameterIndex++;
    }

    if (filters.section_id !== undefined) {
      conditions.push(`cr.section_id = $${parameterIndex}`);
      values.push(filters.section_id);
      parameterIndex++;
    }

    if (filters.day_of_week !== undefined) {
      conditions.push(`cr.day_of_week = $${parameterIndex}`);
      values.push(filters.day_of_week);
    }

    const result = await query<ClassRoutineDetails>(
      `
        SELECT ${selectRoutineFields}
        FROM ${tableName} cr
        INNER JOIN classes c ON c.id = cr.class_id
        INNER JOIN section sec ON sec.id = cr.section_id
        INNER JOIN subjects sub ON sub.id = cr.subject_id
        LEFT JOIN teachers teacher ON teacher.id = cr.teacher_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY
          cr.day_of_week ASC,
          cr.start_time ASC,
          cr.class_id ASC,
          cr.section_id ASC
      `,
      values,
    );

    return result.rows;
  }

  static async findById(
    id: number,
    academicYearId: number,
    includeDeleted = false,
  ): Promise<ClassRoutineDetails | null> {
    const deletedCondition = includeDeleted ? "" : "AND cr.deleted_at IS NULL";

    const result = await query<ClassRoutineDetails>(
      `
        SELECT ${selectRoutineFields}
        FROM ${tableName} cr
        INNER JOIN classes c ON c.id = cr.class_id
        INNER JOIN section sec ON sec.id = cr.section_id
        INNER JOIN subjects sub ON sub.id = cr.subject_id
        LEFT JOIN teachers teacher ON teacher.id = cr.teacher_id
        WHERE cr.id = $1
          AND cr.academic_year_id = $2
          ${deletedCondition}
        LIMIT 1
      `,
      [id, academicYearId],
    );

    return result.rows[0] ?? null;
  }

  /** Confirms this section is assigned to this class in the current session. */
  static async isClassSectionValid(
    classId: number,
    sectionId: number,
    academicYearId: number,
  ): Promise<boolean> {
    const result = await query<{ id: number }>(
      `
        SELECT id
        FROM class_section_relation
        WHERE class_id = $1
          AND section_id = $2
          AND academic_year_id = $3
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [classId, sectionId, academicYearId],
    );

    return Boolean(result.rows[0]);
  }

  static async create(
    data: CreateClassRoutinePayload,
    academicYearId: number,
  ): Promise<ClassRoutineDetails> {
    const result = await query<{ id: number }>(
      `
        INSERT INTO ${tableName} (
          academic_year_id,
          class_id,
          section_id,
          subject_id,
          teacher_id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          remarks
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        academicYearId,
        data.class_id,
        data.section_id,
        data.subject_id,
        data.teacher_id ?? null,
        data.day_of_week,
        data.start_time,
        data.end_time,
        data.room_number ?? null,
        data.remarks ?? null,
      ],
    );

    const id = result.rows[0]?.id;

    if (!id) {
      throw new Error("Routine could not be created.");
    }

    const createdRoutine = await this.findById(id, academicYearId);

    if (!createdRoutine) {
      throw new Error("Created routine could not be found.");
    }

    return createdRoutine;
  }

  static async update(
    id: number,
    data: UpdateClassRoutinePayload,
    academicYearId: number,
  ): Promise<ClassRoutineDetails | null> {
    const updates: string[] = [];
    const values: Array<string | number | null> = [];
    let parameterIndex = 1;

    const addUpdate = (column: string, value: string | number | null) => {
      updates.push(`${column} = $${parameterIndex}`);
      values.push(value);
      parameterIndex++;
    };

    if (data.class_id !== undefined) addUpdate("class_id", data.class_id);
    if (data.section_id !== undefined) addUpdate("section_id", data.section_id);
    if (data.subject_id !== undefined) addUpdate("subject_id", data.subject_id);
    if (data.teacher_id !== undefined) addUpdate("teacher_id", data.teacher_id);
    if (data.day_of_week !== undefined)
      addUpdate("day_of_week", data.day_of_week);
    if (data.start_time !== undefined) addUpdate("start_time", data.start_time);
    if (data.end_time !== undefined) addUpdate("end_time", data.end_time);
    if (data.room_number !== undefined)
      addUpdate("room_number", data.room_number);
    if (data.remarks !== undefined) addUpdate("remarks", data.remarks);

    if (updates.length === 0) {
      return this.findById(id, academicYearId);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id, academicYearId);

    const result = await query<{ id: number }>(
      `
        UPDATE ${tableName}
        SET ${updates.join(", ")}
        WHERE id = $${parameterIndex}
          AND academic_year_id = $${parameterIndex + 1}
          AND deleted_at IS NULL
        RETURNING id
      `,
      values,
    );

    if (!result.rows[0]) return null;

    return this.findById(id, academicYearId);
  }

  static async delete(
    id: number,
    academicYearId: number,
  ): Promise<ClassRoutineDetails | null> {
    const result = await query<{ id: number }>(
      `
        UPDATE ${tableName}
        SET
          deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND academic_year_id = $2
          AND deleted_at IS NULL
        RETURNING id
      `,
      [id, academicYearId],
    );

    if (!result.rows[0]) return null;

    return this.findById(id, academicYearId, true);
  }

  static async restore(
    id: number,
    academicYearId: number,
  ): Promise<ClassRoutineDetails | null> {
    const result = await query<{ id: number }>(
      `
        UPDATE ${tableName}
        SET
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND academic_year_id = $2
          AND deleted_at IS NOT NULL
        RETURNING id
      `,
      [id, academicYearId],
    );

    if (!result.rows[0]) return null;

    return this.findById(id, academicYearId);
  }

  static async hardDelete(
    id: number,
    academicYearId: number,
  ): Promise<boolean> {
    const result = await query(
      `
        DELETE FROM ${tableName}
        WHERE id = $1
          AND academic_year_id = $2
      `,
      [id, academicYearId],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
