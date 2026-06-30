import { query } from "../db/query.js";

export interface Settings {
  id: number;
  name: string;
  setting_group: string;
  key: string;
  type: string;
  value: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateSettings {
  name: string;
  setting_group: string;
  key: string;
  type: string;
  value: string;
}

export interface UpdateSettings {
  name?: string;
  setting_group?: string;
  key?: string;
  type?: string;
  value?: string;
}


export interface BulkUpdateSetting {
  key: string;
  value: string;
}

const tableName = "settings";

export class SettingsModel {
  static async create(data: CreateSettings): Promise<Settings> {
    const result = await query<Settings>(
      `
      INSERT INTO ${tableName} 
      (name, setting_group, key, type, value)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [data.name, data.setting_group, data.key, data.type, data.value],
    );

    return result.rows[0];
  }

  static async findAll(): Promise<Settings[]> {
    const result = await query<Settings>(
      `
      SELECT *
      FROM ${tableName}
      WHERE deleted_at IS NULL
      ORDER BY id DESC
      `,
    );

    return result.rows;
  }

  static async findById(id: number): Promise<Settings | null> {
    const result = await query<Settings>(
      `
      SELECT *
      FROM ${tableName}
      WHERE id = $1
      AND deleted_at IS NULL
      LIMIT 1
      `,
      [id],
    );

    return result.rows[0] || null;
  }

  static async bulkUpdateByKey(
    settings: BulkUpdateSetting[],
  ): Promise<Settings[]> {
    const updatedSettings: Settings[] = [];

    for (const item of settings) {
      const result = await query<Settings>(
        `
      UPDATE ${tableName}
      SET value = $1,
          updated_at = NOW()
      WHERE "key" = $2
      AND deleted_at IS NULL
      RETURNING *
      `,
        [item.value, item.key],
      );

      if (result.rows[0]) {
        updatedSettings.push(result.rows[0]);
      }
    }

    return updatedSettings;
  }

  static async findByKey(key: string): Promise<Settings | null> {
    const result = await query<Settings>(
      `
      SELECT *
      FROM ${tableName}
      WHERE key = $1
      AND deleted_at IS NULL
      LIMIT 1
      `,
      [key],
    );

    return result.rows[0] || null;
  }

  static async findByGroup(setting_group: string): Promise<Settings[]> {
    const result = await query<Settings>(
      `
      SELECT *
      FROM ${tableName}
      WHERE setting_group = $1
      AND deleted_at IS NULL
      ORDER BY id DESC
      `,
      [setting_group],
    );

    return result.rows;
  }

  static async update(
    id: number,
    data: UpdateSettings,
  ): Promise<Settings | null> {
    const existing = await this.findById(id);

    if (!existing) {
      return null;
    }

    const result = await query<Settings>(
      `
      UPDATE ${tableName}
      SET
        name = $1,
        setting_group = $2,
        key = $3,
        type = $4,
        value = $5,
        updated_at = NOW()
      WHERE id = $6
      AND deleted_at IS NULL
      RETURNING *
      `,
      [
        data.name ?? existing.name,
        data.setting_group ?? existing.setting_group,
        data.key ?? existing.key,
        data.type ?? existing.type,
        data.value ?? existing.value,
        id,
      ],
    );

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query<Settings>(
      `
      UPDATE ${tableName}
      SET deleted_at = NOW()
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING *
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  static async hardDelete(id: number): Promise<boolean> {
    const result = await query(
      `
      DELETE FROM ${tableName}
      WHERE id = $1
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
