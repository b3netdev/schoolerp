import { createHash, randomBytes } from "node:crypto";
import { db } from "../db/query-builder.js";

const tableName = "student_refresh_tokens";

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface IssuedRefreshToken {
  /** The raw token — only ever sent to the client as a cookie, never stored. */
  token: string;
  expiresAt: Date;
}

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export class StudentRefreshTokenModel {
  /** Creates and stores a new refresh token for a student, returning the raw value once. */
  static async issue(studentId: number): Promise<IssuedRefreshToken> {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await db.table(tableName).insert({
      student_id: studentId,
      token_hash: hashToken(token),
      expires_at: expiresAt,
    });

    return { token, expiresAt };
  }

  /** Finds the student_id for a valid (unexpired, unrevoked) raw token. */
  static async findValidStudentId(token: string): Promise<number | null> {
    const row = await db
      .table<{ student_id: number }>(tableName)
      .select("student_id")
      .where("token_hash", "=", hashToken(token))
      .whereNull("revoked_at")
      .where("expires_at", ">", new Date())
      .first();

    return row?.student_id ?? null;
  }

  /** Revokes a single token by its raw value (e.g. on logout or rotation). */
  static async revoke(token: string): Promise<void> {
    await db
      .table(tableName)
      .where("token_hash", "=", hashToken(token))
      .update({ revoked_at: new Date() });
  }

  /** Revokes every active token for a student (e.g. "log out everywhere"). */
  static async revokeAllForStudent(studentId: number): Promise<void> {
    await db
      .table(tableName)
      .where("student_id", "=", studentId)
      .whereNull("revoked_at")
      .update({ revoked_at: new Date() });
  }

  /** Rotation: atomically revoke the old token and issue a new one. */
  static async rotate(
    oldToken: string,
    studentId: number,
  ): Promise<IssuedRefreshToken> {
    return db.transaction(async () => {
      await this.revoke(oldToken);
      return this.issue(studentId);
    });
  }
}
