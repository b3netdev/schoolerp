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

type AcademicSessionStatusFilter = "all" | "active" | "inactive" | "trash";

const tableName = "academic_session";

export class AcademicSessionModel {
    static async findAll(status: AcademicSessionStatusFilter = "all"): Promise<AcademicSession[]> {
        let queryText = `SELECT * FROM ${tableName}`;
        const queryParams: string[] = [];
        
        if (status === "trash") {
            // Show soft-deleted records
            queryText += ` WHERE deleted_at IS NOT NULL`;
        } else {
            // Show non-deleted records
            queryText += ` WHERE deleted_at IS NULL`;
            
            if (status !== "all") {
                queryText += ` AND status = $1`;
                queryParams.push(status);
            }
        }
        
        queryText += ` ORDER BY id DESC`;
        
        const result = await query<AcademicSession>(queryText, queryParams);
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

    static async alreadyExists(field: string, value: string, excludeId?: number): Promise<boolean> {
        let queryText = `
            SELECT 1
            FROM ${tableName}
            WHERE ${field} = $1
            AND deleted_at IS NULL
        `;
        const queryParams: (string | number)[] = [value];
        
        if (excludeId !== undefined) {
            queryText += ` AND id != $2`;
            queryParams.push(excludeId);
        }
        
        queryText += ` LIMIT 1`;
        
        const result = await query<AcademicSession>(queryText, queryParams);
        return result.rows.length > 0;
    }

    static async hasActiveSession(excludeId?: number): Promise<boolean> {
        let queryText = `SELECT 1 FROM ${tableName} WHERE status = 'active' AND deleted_at IS NULL`;
        const queryParams: number[] = [];

        if (excludeId !== undefined) {
            queryText += ` AND id != $1`;
            queryParams.push(excludeId);
        }

        queryText += ` LIMIT 1`;

        const result = await query<AcademicSession>(queryText, queryParams);
        return result.rows.length > 0;
    }

    static async restore(id: number): Promise<AcademicSession | null> {
        const result = await query<AcademicSession>(
            `UPDATE ${tableName} SET deleted_at = NULL WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0] || null;
    }

    static async permanentDelete(id: number): Promise<void> {
        await query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    }

    
}