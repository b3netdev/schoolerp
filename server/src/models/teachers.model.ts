import bcrypt from "bcrypt";

import { query } from "../db/query.js";

/**
 * bcrypt cost factor.
 */
const BCRYPT_SALT_ROUNDS = 12;

const tableName = "teachers";

type TeacherStatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "resigned"
  | "trash";

/**
 * Normal teacher response.
 *
 * IMPORTANT:
 * Password is intentionally NOT included here.
 */
export interface Teacher {
  id: number;
  employee_code: string;

  // Basic teacher details
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;

  // Personal details
  gender?: string | null;
  date_of_birth?: Date | null;
  blood_group?: string | null;
  marital_status?: string | null;

  // Address details
  current_address?: string | null;
  permanent_address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  // Professional details
  qualification?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  joining_date?: Date | null;
  employment_type?: string | null;
  status?: string | null;

  // Salary / HR details
  basic_salary?: number | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  ifsc_code?: string | null;
  pan_number?: string | null;

  // Emergency contact
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;

  // Profile
  profile_image?: string | null;
  remarks?: string | null;

  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

/**
 * Teacher create payload.
 *
 * Password is optional.
 */
export interface TeacherPayload {
  first_name: string;
  last_name?: string;
  employee_code?: string;

  /**
   * Optional password.
   *
   * Not supplied / null / empty:
   * password will be stored as NULL.
   *
   * Supplied:
   * password will be bcrypt hashed.
   */
  password?: string | null;

  email?: string;
  phone?: string;
  alternate_phone?: string;

  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  marital_status?: string;

  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  qualification?: string;
  specialization?: string;
  experience_years?: number;
  joining_date?: string;
  employment_type?: string;
  status?: string;

  basic_salary?: number;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  pan_number?: string;

  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;

  profile_image?: string;
  remarks?: string;
}

/**
 * Teacher update payload.
 *
 * Password is optional.
 *
 * undefined / null / empty:
 * existing password remains unchanged.
 *
 * non-empty:
 * new password will be hashed and stored.
 */
export interface TeacherUpdatePayload {
  first_name?: string;
  last_name?: string;
  employee_code?: string;

  password?: string | null;

  email?: string;
  phone?: string;
  alternate_phone?: string;

  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  marital_status?: string;

  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  qualification?: string;
  specialization?: string;
  experience_years?: number;
  joining_date?: string;
  employment_type?: string;
  status?: string;

  basic_salary?: number;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  pan_number?: string;

  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;

  profile_image?: string;
  remarks?: string;
}

/**
 * Special interface used ONLY for login.
 *
 * This is intentionally separate from Teacher
 * because this query needs the password hash.
 */
export interface TeacherLoginRecord {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  password: string | null;
  status: string | null;
  profile_image: string | null;
}

/**
 * Fields safe to return from normal teacher queries.
 *
 * Never add password here.
 */
const teacherSelectFields = `
  id,
  employee_code,
  first_name,
  last_name,
  email,
  phone,
  alternate_phone,
  gender,
  date_of_birth,
  blood_group,
  marital_status,
  current_address,
  permanent_address,
  city,
  state,
  country,
  pincode,
  qualification,
  specialization,
  experience_years,
  joining_date,
  employment_type,
  status,
  basic_salary,
  bank_name,
  bank_account_number,
  ifsc_code,
  pan_number,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relation,
  profile_image,
  remarks,
  created_at,
  updated_at,
  deleted_at
`;

export class TeacherModel {
  /**
   * Hash password only when a real password
   * has been supplied.
   *
   * CREATE:
   * null means store NULL.
   */
  private static async hashPasswordIfProvided(
    password?: string | null,
  ): Promise<string | null> {
    if (
      typeof password !== "string" ||
      password.trim() === ""
    ) {
      return null;
    }

    return bcrypt.hash(
      password,
      BCRYPT_SALT_ROUNDS,
    );
  }

  /**
   * FIND ALL TEACHERS
   *
   * Password is NEVER returned.
   */
  static async findAll(
    status: TeacherStatusFilter = "all",
  ): Promise<Teacher[]> {
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (status === "trash") {
      conditions.push(
        "deleted_at IS NOT NULL",
      );
    } else {
      conditions.push(
        "deleted_at IS NULL",
      );

      if (status !== "all") {
        values.push(status);

        conditions.push(
          `status = $${values.length}`,
        );
      }
    }

    const result =
      await query<Teacher>(
        `
        SELECT
          ${teacherSelectFields}
        FROM ${tableName}
        WHERE ${conditions.join(
          " AND ",
        )}
        ORDER BY id DESC
        `,
        values,
      );

    return result.rows;
  }

  /**
   * GENERATE EMPLOYEE CODE
   */
  static async generateEmployeeCode(
    prefix: string,
    totalLength: number,
  ): Promise<string> {
    const cleanedPrefix =
      prefix.trim().toUpperCase();

    if (!cleanedPrefix) {
      throw new Error(
        "Employee code prefix is required",
      );
    }

    if (
      !Number.isInteger(totalLength) ||
      totalLength <= 0
    ) {
      throw new Error(
        "Employee code length must be a positive integer",
      );
    }

    const numericPartLength =
      totalLength -
      cleanedPrefix.length;

    if (
      numericPartLength <= 0
    ) {
      throw new Error(
        "Employee code length must be greater than the prefix length",
      );
    }

    const result = await query<{
      sequence_value: string;
    }>(
      `
      SELECT nextval(
        'teacher_employee_code_seq'
      )::text AS sequence_value
      `,
    );

    const sequenceValue =
      result.rows[0]
        .sequence_value;

    if (
      sequenceValue.length >
      numericPartLength
    ) {
      throw new Error(
        "Employee code sequence exceeded the configured length",
      );
    }

    const paddedNumber =
      sequenceValue.padStart(
        numericPartLength,
        "0",
      );

    return `${cleanedPrefix}${paddedNumber}`;
  }

  /**
   * FIND TEACHER BY ID
   *
   * Password is NEVER returned.
   */
  static async findById(
    id: number,
  ): Promise<Teacher | null> {
    const result =
      await query<Teacher>(
        `
        SELECT
          ${teacherSelectFields}
        FROM ${tableName}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [id],
      );

    return result.rows[0] || null;
  }

  /**
   * CHECK UNIQUE VALUE
   */
  static async alreadyExists(
    field: string,
    value: string,
    excludeId?: number,
  ): Promise<boolean> {
    /**
     * Prevent arbitrary column names
     * from entering the SQL statement.
     */
    const allowedFields = [
      "employee_code",
      "email",
      "phone",
    ];

    if (
      !allowedFields.includes(field)
    ) {
      throw new Error(
        "Invalid teacher field",
      );
    }

    let queryText = `
      SELECT 1
      FROM ${tableName}
      WHERE ${field} = $1
        AND deleted_at IS NULL
    `;

    const queryParams: (
      | string
      | number
    )[] = [value];

    if (
      excludeId !== undefined
    ) {
      queryText += `
        AND id != $2
      `;

      queryParams.push(
        excludeId,
      );
    }

    queryText += `
      LIMIT 1
    `;

    const result =
      await query(
        queryText,
        queryParams,
      );

    return (
      result.rows.length > 0
    );
  }

  /**
   * CREATE TEACHER
   *
   * PASSWORD BEHAVIOR:
   *
   * password not sent
   *        ↓
   * NULL
   *
   * password = null
   *        ↓
   * NULL
   *
   * password = ""
   *        ↓
   * NULL
   *
   * password = "teacher123"
   *        ↓
   * bcrypt hash
   */
  static async create(
    data: TeacherPayload,
  ): Promise<Teacher> {
    const hashedPassword =
      await this.hashPasswordIfProvided(
        data.password,
      );

    const result =
      await query<Teacher>(
        `
        INSERT INTO ${tableName} (
          first_name,
          last_name,
          employee_code,
          password,
          email,
          phone,
          alternate_phone,

          gender,
          date_of_birth,
          blood_group,
          marital_status,

          current_address,
          permanent_address,
          city,
          state,
          country,
          pincode,

          qualification,
          specialization,
          experience_years,
          joining_date,
          employment_type,
          status,

          basic_salary,
          bank_name,
          bank_account_number,
          ifsc_code,
          pan_number,

          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relation,

          profile_image,
          remarks
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30,
          $31, $32, $33
        )
        RETURNING
          ${teacherSelectFields}
        `,
        [
          data.first_name,
          data.last_name ??
            null,
          data.employee_code ??
            null,

          /**
           * Only hashed password
           * reaches PostgreSQL.
           */
          hashedPassword,

          data.email ?? null,
          data.phone ?? null,
          data.alternate_phone ??
            null,

          data.gender ?? null,
          data.date_of_birth ??
            null,
          data.blood_group ??
            null,
          data.marital_status ??
            null,

          data.current_address ??
            null,
          data.permanent_address ??
            null,
          data.city ?? null,
          data.state ?? null,
          data.country ?? null,
          data.pincode ?? null,

          data.qualification ??
            null,
          data.specialization ??
            null,
          data.experience_years ??
            0,
          data.joining_date ??
            null,
          data.employment_type ??
            null,
          data.status ??
            "active",

          data.basic_salary ??
            null,
          data.bank_name ?? null,
          data.bank_account_number ??
            null,
          data.ifsc_code ?? null,
          data.pan_number ?? null,

          data.emergency_contact_name ??
            null,
          data.emergency_contact_phone ??
            null,
          data.emergency_contact_relation ??
            null,

          data.profile_image ??
            null,
          data.remarks ?? null,
        ],
      );

    return result.rows[0];
  }

  /**
   * UPDATE TEACHER
   *
   * PASSWORD BEHAVIOR:
   *
   * not sent → keep old
   * null     → keep old
   * ""       → keep old
   * password → hash + replace
   */
  static async update(
    id: number,
    data: TeacherUpdatePayload,
  ): Promise<Teacher | null> {
    /**
     * Password only counts as provided
     * when it is a non-empty string.
     */
    const passwordProvided =
      typeof data.password ===
        "string" &&
      data.password.trim() !==
        "";

    let hashedPassword:
      | string
      | null = null;

    if (passwordProvided) {
      hashedPassword =
        await bcrypt.hash(
          data.password!.trim(),
          BCRYPT_SALT_ROUNDS,
        );
    }

    const result =
      await query<Teacher>(
        `
        UPDATE ${tableName}
        SET
          first_name =
            COALESCE($1, first_name),

          last_name =
            COALESCE($2, last_name),

          employee_code =
            COALESCE($3, employee_code),

          password =
            CASE
              WHEN $4::boolean = TRUE
              THEN $5
              ELSE password
            END,

          email =
            COALESCE($6, email),

          phone =
            COALESCE($7, phone),

          alternate_phone =
            COALESCE($8, alternate_phone),

          gender =
            COALESCE($9, gender),

          date_of_birth =
            COALESCE($10, date_of_birth),

          blood_group =
            COALESCE($11, blood_group),

          marital_status =
            COALESCE($12, marital_status),

          current_address =
            COALESCE($13, current_address),

          permanent_address =
            COALESCE($14, permanent_address),

          city =
            COALESCE($15, city),

          state =
            COALESCE($16, state),

          country =
            COALESCE($17, country),

          pincode =
            COALESCE($18, pincode),

          qualification =
            COALESCE($19, qualification),

          specialization =
            COALESCE($20, specialization),

          experience_years =
            COALESCE($21, experience_years),

          joining_date =
            COALESCE($22, joining_date),

          employment_type =
            COALESCE($23, employment_type),

          status =
            COALESCE($24, status),

          basic_salary =
            COALESCE($25, basic_salary),

          bank_name =
            COALESCE($26, bank_name),

          bank_account_number =
            COALESCE(
              $27,
              bank_account_number
            ),

          ifsc_code =
            COALESCE($28, ifsc_code),

          pan_number =
            COALESCE($29, pan_number),

          emergency_contact_name =
            COALESCE(
              $30,
              emergency_contact_name
            ),

          emergency_contact_phone =
            COALESCE(
              $31,
              emergency_contact_phone
            ),

          emergency_contact_relation =
            COALESCE(
              $32,
              emergency_contact_relation
            ),

          profile_image =
            COALESCE(
              $33,
              profile_image
            ),

          remarks =
            COALESCE(
              $34,
              remarks
            ),

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = $35
          AND deleted_at IS NULL

        RETURNING
          ${teacherSelectFields}
        `,
        [
          data.first_name ??
            null,

          data.last_name ??
            null,

          data.employee_code ??
            null,

          /**
           * $4:
           * tells PostgreSQL whether
           * password should change.
           */
          passwordProvided,

          /**
           * $5:
           * new hash or null.
           */
          hashedPassword,

          data.email ?? null,
          data.phone ?? null,
          data.alternate_phone ??
            null,

          data.gender ?? null,
          data.date_of_birth ??
            null,
          data.blood_group ??
            null,
          data.marital_status ??
            null,

          data.current_address ??
            null,
          data.permanent_address ??
            null,
          data.city ?? null,
          data.state ?? null,
          data.country ?? null,
          data.pincode ?? null,

          data.qualification ??
            null,
          data.specialization ??
            null,
          data.experience_years ??
            null,
          data.joining_date ??
            null,
          data.employment_type ??
            null,
          data.status ?? null,

          data.basic_salary ??
            null,
          data.bank_name ?? null,
          data.bank_account_number ??
            null,
          data.ifsc_code ?? null,
          data.pan_number ?? null,

          data.emergency_contact_name ??
            null,
          data.emergency_contact_phone ??
            null,
          data.emergency_contact_relation ??
            null,

          data.profile_image ??
            null,

          data.remarks ?? null,

          id,
        ],
      );

    return (
      result.rows[0] ||
      null
    );
  }

  /**
   * FIND TEACHER FOR LOGIN
   *
   * This is deliberately separate from
   * findById/findAll because login needs
   * access to the password hash.
   */
  static async findByEmployeeCodeForLogin(
    employeeCode: string,
  ): Promise<TeacherLoginRecord | null> {
    const result =
      await query<TeacherLoginRecord>(
        `
        SELECT
          id,
          employee_code,
          first_name,
          last_name,
          email,
          password,
          status,
          profile_image
        FROM ${tableName}
        WHERE UPPER(employee_code)
          = UPPER($1)
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [
          employeeCode.trim(),
        ],
      );

    return (
      result.rows[0] ||
      null
    );
  }

  /**
   * COMPARE TEACHER PASSWORD
   *
   * Optional helper for the login
   * controller.
   */
  static async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(
      plainPassword,
      hashedPassword,
    );
  }

  /**
   * SOFT DELETE
   */
  static async delete(
    id: number,
  ): Promise<Teacher | null> {
    const result =
      await query<Teacher>(
        `
        UPDATE ${tableName}
        SET
          deleted_at =
            CURRENT_TIMESTAMP,

          updated_at =
            CURRENT_TIMESTAMP,

          status = 'inactive'

        WHERE id = $1
          AND deleted_at IS NULL

        RETURNING
          ${teacherSelectFields}
        `,
        [id],
      );

    return (
      result.rows[0] ||
      null
    );
  }

  /**
   * RESTORE
   */
  static async restore(
    id: number,
  ): Promise<Teacher | null> {
    const result =
      await query<Teacher>(
        `
        UPDATE ${tableName}
        SET
          deleted_at = NULL,
          updated_at =
            CURRENT_TIMESTAMP,
          status = 'active'

        WHERE id = $1
          AND deleted_at IS NOT NULL

        RETURNING
          ${teacherSelectFields}
        `,
        [id],
      );

    return (
      result.rows[0] ||
      null
    );
  }

  /**
   * PERMANENT DELETE
   */
  static async hardDelete(
    id: number,
  ): Promise<boolean> {
    const result =
      await query(
        `
        DELETE FROM ${tableName}
        WHERE id = $1
        `,
        [id],
      );

    return (
      (result.rowCount ?? 0) >
      0
    );
  }
}