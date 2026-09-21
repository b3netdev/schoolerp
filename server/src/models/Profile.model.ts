import { query } from "../db/query.js";

export interface Profile {
    id: number;
    name: string;
    email: string;
    role: string;
    profile_image: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface ProfileUpdatePayload {
    name?: string;
    email?: string;
}

export type ProfileRole = "admin" | "teacher";

const tableName = "users";

export class ProfileModel {
    private static splitTeacherName(
        name?: string,
    ): {
        firstName: string | null;
        lastName: string | null;
    } {
        if (!name) {
            return {
                firstName: null,
                lastName: null,
            };
        }

        const trimmedName =
            name.trim();

        if (!trimmedName) {
            return {
                firstName: null,
                lastName: null,
            };
        }

        const parts =
            trimmedName.split(/\s+/);

        return {
            firstName:
                parts[0] ?? null,
            lastName:
                parts.length > 1
                    ? parts.slice(1).join(" ")
                    : null,
        };
    }

    /**
     * GET PROFILE
     */
    static async findByUserId(
        userId: number,
        role: ProfileRole,
    ): Promise<Profile | null> {
        if (role === "teacher") {
            const result = await query<Profile>(
                `
            SELECT
              id,
              CONCAT_WS(' ', first_name, last_name) AS name,
              COALESCE(email, '') AS email,
              'teacher' AS role,
              profile_image,
              created_at,
              updated_at
            FROM teachers
            WHERE id = $1
              AND deleted_at IS NULL
            LIMIT 1
          `,
                [userId],
            );

            return result.rows[0] || null;
        }

        const result = await query<Profile>(
            `
        SELECT
          id,
          name,
          email,
          role,
          profile_image,
          created_at,
          updated_at
        FROM ${tableName}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
            [userId],
        );

        return result.rows[0] || null;
    }

    /**
     * UPDATE BASIC PROFILE INFORMATION
     */
    static async updateProfile(
        userId: number,
        role: ProfileRole,
        data: ProfileUpdatePayload,
    ): Promise<Profile | null> {
        if (role === "teacher") {
            const {
                firstName,
                lastName,
            } = this.splitTeacherName(
                data.name,
            );

            const result = await query<Profile>(
                `
            UPDATE teachers
            SET
              first_name = COALESCE($1, first_name),
              last_name = COALESCE($2, last_name),
              email = COALESCE($3, email),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
              AND deleted_at IS NULL
            RETURNING
              id,
              CONCAT_WS(' ', first_name, last_name) AS name,
              COALESCE(email, '') AS email,
              'teacher' AS role,
              profile_image,
              created_at,
              updated_at
          `,
                [
                    firstName,
                    lastName,
                    data.email ?? null,
                    userId,
                ],
            );

            return result.rows[0] || null;
        }

        const result = await query<Profile>(
            `
        UPDATE ${tableName}
        SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND deleted_at IS NULL
        RETURNING
          id,
          name,
          email,
          role,
          profile_image,
          created_at,
          updated_at
      `,
            [
                data.name ?? null,
                data.email ?? null,
                userId,
            ],
        );

        return result.rows[0] || null;
    }

   
    static async updateProfileImage(
        userId: number,
        role: ProfileRole,
        profileImage: string,
    ): Promise<Profile | null> {
        if (role === "teacher") {
            const result = await query<Profile>(
                `
            UPDATE teachers
            SET
              profile_image = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
              AND deleted_at IS NULL
            RETURNING
              id,
              CONCAT_WS(' ', first_name, last_name) AS name,
              COALESCE(email, '') AS email,
              'teacher' AS role,
              profile_image,
              created_at,
              updated_at
          `,
                [
                    profileImage,
                    userId,
                ],
            );

            return result.rows[0] || null;
        }

        const result = await query<Profile>(
            `
        UPDATE ${tableName}
        SET
          profile_image = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND deleted_at IS NULL
        RETURNING
          id,
          name,
          email,
          role,
          profile_image,
          created_at,
          updated_at
      `,
            [
                profileImage,
                userId,
            ],
        );

        return result.rows[0] || null;
    }

    /**
     * REMOVE PROFILE PICTURE
     */
    static async removeProfileImage(
        userId: number,
        role: ProfileRole,
    ): Promise<Profile | null> {
        if (role === "teacher") {
            const result = await query<Profile>(
                `
            UPDATE teachers
            SET
              profile_image = NULL,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING
              id,
              CONCAT_WS(' ', first_name, last_name) AS name,
              COALESCE(email, '') AS email,
              'teacher' AS role,
              profile_image,
              created_at,
              updated_at
          `,
                [userId],
            );

            return result.rows[0] || null;
        }

        const result = await query<Profile>(
            `
        UPDATE ${tableName}
        SET
          profile_image = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING
          id,
          name,
          email,
          role,
          profile_image,
          created_at,
          updated_at
      `,
            [userId],
        );

        return result.rows[0] || null;
    }

    /**
     * GET CURRENT PROFILE IMAGE
     *
     * Useful when replacing an image,
     * so the old file can be deleted.
     */
    static async getProfileImage(
        userId: number,
        role: ProfileRole,
    ): Promise<string | null> {
        if (role === "teacher") {
            const result = await query<{
                profile_image: string | null;
            }>(
                `
            SELECT profile_image
            FROM teachers
            WHERE id = $1
              AND deleted_at IS NULL
            LIMIT 1
          `,
                [userId],
            );

            return (
                result.rows[0]?.profile_image ??
                null
            );
        }

        const result = await query<{
            profile_image: string | null;
        }>(
            `
        SELECT profile_image
        FROM ${tableName}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
            [userId],
        );

        return (
            result.rows[0]?.profile_image ??
            null
        );
    }
}