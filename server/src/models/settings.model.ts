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

export interface UpdateSettingsPayload {
  id?: number;
  key?: string;
  name?: string;
  setting_group?: string;
  type?: string;
  value?: string;
}

export class SettingsModel {


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

  static generateSettingKey(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };


  static async update(
    data: UpdateSettingsPayload | UpdateSettingsPayload[]
  ): Promise<Settings[]> {
    const settingsArray = Array.isArray(data) ? data : [data];

    const updatedSettings: Settings[] = [];

    for (const item of settingsArray) {
      const settingKey = item.key
        ? item.key
        : item.name
          ? this.generateSettingKey(item.name)
          : null;
      if (!settingKey) {
        continue;
      }


      const existing = await this.findByKey(settingKey);
      if (existing) {
        const result = await query<Settings>(
          `
        UPDATE ${tableName}
        SET
          name = $1,
          setting_group = $2,
          type = $3,
          value = $4,
          updated_at = NOW(),
          deleted_at = NULL
        WHERE "key" = $5
        RETURNING *
        `,
          [
            item.name ?? existing.name,
            item.setting_group ?? existing.setting_group,
            item.type ?? existing.type,
            item.value ?? existing.value,
            settingKey,
          ]
        );

        if (result.rows[0]) {
          updatedSettings.push(result.rows[0]);
        }

        continue;
      }

      const result = await query<Settings>(
        `
      INSERT INTO ${tableName}
      (name, setting_group, "key", type, value)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
        [
          item.name ?? settingKey,
          item.setting_group ?? "general",
          settingKey,
          item.type ?? "text",
          item.value ?? "",
        ]
      );

      if (result.rows[0]) {
        updatedSettings.push(result.rows[0]);
      }
    }

    return updatedSettings;
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
