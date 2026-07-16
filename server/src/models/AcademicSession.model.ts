import { query } from "../db/query.js";

export interface AcademicSession {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive';
  description?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface AcademicSessionPayload {
  name: string;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive';
  description?: string | null;
}

const tableName = "academic_session";

export class AcademicSessionModel {
    static async findAll(): Promise<AcademicSession[]> {
        const result = await query<AcademicSession>(`SELECT * FROM ${tableName} WHERE deleted_at IS NULL`);
        return result.rows;
    }

    static async findById(id: number): Promise<AcademicSession | null> {
        const result = await query<AcademicSession>(`SELECT * FROM ${tableName} WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return result.rows[0] || null;
    }

    static async create(payload: AcademicSessionPayload): Promise<AcademicSession> {
        const result = await query<AcademicSession>(
            `INSERT INTO ${tableName} (name, start_date, end_date, status, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [payload.name, payload.start_date, payload.end_date, payload.status, payload.description]
        );
        return result.rows[0];
    }

    static async update(id: number, payload: Partial<AcademicSessionPayload>): Promise<AcademicSession | null> {
        const fields = Object.keys(payload);
        const values = Object.values(payload);
        const setString = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        const result = await query<AcademicSession>(
            `UPDATE ${tableName} SET ${setString} WHERE id = $${fields.length + 1} AND deleted_at IS NULL RETURNING *`,
            [...values, id]
        );
        return result.rows[0] || null;
    }

    static async delete(id: number): Promise<void> {
        await query(`UPDATE ${tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    }

    
}