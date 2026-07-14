import { query } from "../db/query.js";


export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}


export class UserModel {
  static async create(data: CreateUserInput): Promise<User> {
    const result = await query<User>(
      `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [data.name, data.email, data.password, data.role]
    );

    return result.rows[0];
  }

  static async findAll(): Promise<User[]> {
    const result = await query<User>(
      `
      SELECT *
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY id DESC
      `
    );

    return result.rows;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query<User>(
      `
      SELECT *
      FROM users
      WHERE id = $1
      AND deleted_at IS NULL
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query<User>(
      `
      SELECT *
      FROM users
      WHERE email = $1
      AND deleted_at IS NULL
      `,
      [email]
    );

    return result.rows[0] || null;
  }

  static async updateName(id: number, name: string): Promise<User | null> {
    const result = await query<User>(
      `
      UPDATE users
      SET name = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      AND deleted_at IS NULL
      RETURNING *
      `,
      [name, id]
    );

    return result.rows[0] || null;
  }

  static async updateProfile(
    id: number,
    data: { name: string; email: string }
  ): Promise<User | null> {
    const result = await query<User>(
      `
      UPDATE users
      SET name = $1,
          email = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      AND deleted_at IS NULL
      RETURNING *
      `,
      [data.name, data.email, id]
    );

    return result.rows[0] || null;
  }

  static async updatePassword(
    id: number,
    hashedPassword: string
  ): Promise<User | null> {
    const result = await query<User>(
      `
      UPDATE users
      SET password = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      AND deleted_at IS NULL
      RETURNING *
      `,
      [hashedPassword, id]
    );

    return result.rows[0] || null;
  }

  static async softDelete(id: number): Promise<User | null> {
    const result = await query<User>(
      `
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING *
      `,
      [id]
    );

    return result.rows[0] || null;
  }
}