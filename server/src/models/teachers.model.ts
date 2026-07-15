import { query } from "../db/query.js";

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

export interface TeacherPayload {
  first_name: string;
  last_name?: string;
  employee_code?: string;
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

export interface TeacherUpdatePayload {
  first_name?: string;
  last_name?: string;
  employee_code?: string;
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

const tableName = "teachers";
type TeacherStatusFilter = "all" | "active" | "inactive";
export class TeacherModel {
  static async findAll(status: TeacherStatusFilter = "all"): Promise<Teacher[]> {
    const values: unknown[] = [];
    const conditions: string[] = ["deleted_at IS NULL"];

    if (status !== "all") {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    const result = await query<Teacher>(
      `
      SELECT *
      FROM ${tableName}
    WHERE ${conditions.join(" AND ")}
      ORDER BY id DESC
      `,
      values
    );

    return result.rows;
  }

  static async findById(id: number): Promise<Teacher | null> {
    const result = await query<Teacher>(
      `
      SELECT *
      FROM ${tableName}
      WHERE id = $1
      AND deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async alreadyExists(field: string, value: string): Promise<boolean> {
    const result = await query<Teacher>(
      `
      SELECT 1
      FROM ${tableName}
      WHERE ${field} = $1
      AND deleted_at IS NULL
      LIMIT 1
      `,
      [value]
    );

    return result.rows.length > 0;
  }

  static async create(data: TeacherPayload): Promise<Teacher> {
    const result = await query<Teacher>(
      `
      INSERT INTO ${tableName} (
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
        remarks
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30,
        $31
      )
      RETURNING
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
      `,
      [
        data.first_name,
        data.last_name ?? null,
        data.email ?? null,
        data.phone ?? null,
        data.alternate_phone ?? null,

        data.gender ?? null,
        data.date_of_birth ?? null,
        data.blood_group ?? null,
        data.marital_status ?? null,

        data.current_address ?? null,
        data.permanent_address ?? null,
        data.city ?? null,
        data.state ?? null,
        data.country ?? null,
        data.pincode ?? null,

        data.qualification ?? null,
        data.specialization ?? null,
        data.experience_years ?? 0,
        data.joining_date ?? null,
        data.employment_type ?? null,
        data.status ?? "active",

        data.basic_salary ?? null,
        data.bank_name ?? null,
        data.bank_account_number ?? null,
        data.ifsc_code ?? null,
        data.pan_number ?? null,

        data.emergency_contact_name ?? null,
        data.emergency_contact_phone ?? null,
        data.emergency_contact_relation ?? null,

        data.profile_image ?? null,
        data.remarks ?? null,
      ]
    );

    return result.rows[0];
  }

  static async update(
    id: number,
    data: TeacherUpdatePayload
  ): Promise<Teacher | null> {
    const result = await query<Teacher>(
      `
      UPDATE ${tableName}
      SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        employee_code = COALESCE($3, employee_code),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        alternate_phone = COALESCE($6, alternate_phone),

        gender = COALESCE($7, gender),
        date_of_birth = COALESCE($8, date_of_birth),
        blood_group = COALESCE($9, blood_group),
        marital_status = COALESCE($10, marital_status),

        current_address = COALESCE($11, current_address),
        permanent_address = COALESCE($12, permanent_address),
        city = COALESCE($13, city),
        state = COALESCE($14, state),
        country = COALESCE($15, country),
        pincode = COALESCE($16, pincode),

        qualification = COALESCE($17, qualification),
        specialization = COALESCE($18, specialization),
        experience_years = COALESCE($19, experience_years),
        joining_date = COALESCE($20, joining_date),
        employment_type = COALESCE($21, employment_type),
        status = COALESCE($22, status),

        basic_salary = COALESCE($23, basic_salary),
        bank_name = COALESCE($24, bank_name),
        bank_account_number = COALESCE($25, bank_account_number),
        ifsc_code = COALESCE($26, ifsc_code),
        pan_number = COALESCE($27, pan_number),

        emergency_contact_name = COALESCE($28, emergency_contact_name),
        emergency_contact_phone = COALESCE($29, emergency_contact_phone),
        emergency_contact_relation = COALESCE($30, emergency_contact_relation),

        profile_image = COALESCE($31, profile_image),
        remarks = COALESCE($32, remarks),

        updated_at = CURRENT_TIMESTAMP
      WHERE id = $33
      AND deleted_at IS NULL
      RETURNING
        id,
        first_name,
        last_name,
        employee_code,
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
      `,
      [
        data.first_name ?? null,
        data.last_name ?? null,
        data.employee_code ?? null,
        data.email ?? null,
        data.phone ?? null,
        data.alternate_phone ?? null,

        data.gender ?? null,
        data.date_of_birth ?? null,
        data.blood_group ?? null,
        data.marital_status ?? null,

        data.current_address ?? null,
        data.permanent_address ?? null,
        data.city ?? null,
        data.state ?? null,
        data.country ?? null,
        data.pincode ?? null,

        data.qualification ?? null,
        data.specialization ?? null,
        data.experience_years ?? null,
        data.joining_date ?? null,
        data.employment_type ?? null,
        data.status ?? null,

        data.basic_salary ?? null,
        data.bank_name ?? null,
        data.bank_account_number ?? null,
        data.ifsc_code ?? null,
        data.pan_number ?? null,

        data.emergency_contact_name ?? null,
        data.emergency_contact_phone ?? null,
        data.emergency_contact_relation ?? null,

        data.profile_image ?? null,
        data.remarks ?? null,

        id,
      ]
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<Teacher | null> {
    const result = await query<Teacher>(
      `
      UPDATE ${tableName}
      SET
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        status='inactive',
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING
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
      `,
      [id]
    );

    return result.rows[0] || null;
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