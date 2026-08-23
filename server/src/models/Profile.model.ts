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

const tableName = "users";

export class ProfileModel {
    /**
     * GET PROFILE
     */
    static async findByUserId(
        userId: number,
    ): Promise<Profile | null> {
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
        data: ProfileUpdatePayload,
    ): Promise<Profile | null> {
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

    /**
     * UPDATE PROFILE PICTURE
     */
    static async updateProfileImage(
        userId: number,
        profileImage: string,
    ): Promise<Profile | null> {
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
    ): Promise<Profile | null> {
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
    ): Promise<string | null> {
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