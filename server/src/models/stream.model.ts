import { db } from "../db/query-builder.js";

export interface Stream {
    id: number;
    name: string;
    status?: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date | null;
}

export interface StreamPayload {
    name: string;
    status?: string;
}

export interface StreamUpdatePayload {
    name?: string;
    status?: string;
}

type StreamStatus = "active" | "inactive" | null;

const tableName = "stream";
export type StreamStatusFilter = "all" | "active" | "inactive" | "trash";

export class StreamModel {
    static async findAll(
        statusFilter: StreamStatusFilter = "all"
    ): Promise<Stream[]> {
        let query = db.table<Stream>(tableName);

        if (statusFilter === "trash") {
            query = query.whereNotNull("deleted_at");
        } else if (statusFilter === "active") {
            query = query.whereNull("deleted_at").where("status", "=", "active");
        } else if (statusFilter === "inactive") {
            query = query.whereNull("deleted_at").where("status", "=", "inactive");
        } else {
            // 'all' shows all non-deleted items
            query = query.whereNull("deleted_at");
        }

        const result = await query.orderBy("id", "DESC").get();
        return result;
    }

    static async findById(id: number): Promise<Stream | null> {
        const result = await db
            .table<Stream>(tableName)
            .where("id", "=", id)
            .whereNull("deleted_at")
            .first();

        return result || null;
    }

    static async create(data: StreamPayload): Promise<Stream> {
        const result = await db
            .table<Stream>(tableName)
            .insert({
                name: data.name,
                status: data.status ?? "active",
            });

        return result;
    }

    static async update(
        id: number,
        data: StreamUpdatePayload
    ): Promise<Stream | null> {
        const updateData: Record<string, any> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.status !== undefined) updateData.status = data.status;

        const result = await db
            .table<Stream>(tableName)
            .where("id", "=", id)
            .whereNull("deleted_at")
            .update(updateData);

        return result[0] || null;
    }

    static async delete(id: number): Promise<Stream | null> {
        const result = await db
            .table<Stream>(tableName)
            .where("id", "=", id)
            .whereNull("deleted_at")
            .softDelete();

        return result[0] || null;
    }

    static async restore(id: number): Promise<Stream | null> {
        const result = await db
            .table<Stream>(tableName)
            .where("id", "=", id)
            .whereNotNull("deleted_at")
            .restore();

        return result[0] || null;
    }

    static async hardDelete(id: number): Promise<boolean> {
        const result = await db
            .table(tableName)
            .where("id", "=", id)
            .delete();

        return result > 0;
    }
}