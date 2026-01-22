import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type PasswordResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

/**
 * 写入密码重置记录，用于后续校验。
 */
export async function createPasswordReset(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<PasswordResetRecord> {
  const id = crypto.randomUUID();
  const createdAt = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, userId, tokenHash, expiresAt, createdAt],
  );
  return {
    id,
    userId,
    tokenHash,
    expiresAt,
    usedAt: null,
    createdAt,
  };
}

/**
 * 根据 token hash 查询可用的重置记录。
 */
export async function findValidPasswordReset(
  tokenHash: string,
): Promise<PasswordResetRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1",
    [tokenHash],
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0]!;
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: new Date(row.expires_at),
    usedAt: row.used_at ? new Date(row.used_at) : null,
    createdAt: new Date(row.created_at),
  };
}

/**
 * 标记重置记录已使用，避免重复提交。
 */
export async function markPasswordResetUsed(id: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "UPDATE password_resets SET used_at = ? WHERE id = ?",
    [new Date(), id],
  );
}
