import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type EmailVerificationPurpose = "REGISTER" | "PASSWORD_CHANGE";

export type EmailVerificationRecord = {
  id: string;
  userId: string | null;
  email: string;
  tokenHash: string;
  purpose: EmailVerificationPurpose;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

type CreateEmailVerificationInput = {
  userId?: string | null;
  email: string;
  tokenHash: string;
  purpose: EmailVerificationPurpose;
  expiresAt: Date;
};

/**
 * 写入邮箱验证码记录。
 */
export async function createEmailVerification(
  input: CreateEmailVerificationInput,
): Promise<EmailVerificationRecord> {
  const id = crypto.randomUUID();
  const createdAt = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO email_verifications (id, user_id, email, token_hash, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      input.userId ?? null,
      input.email,
      input.tokenHash,
      input.purpose,
      input.expiresAt,
      createdAt,
    ],
  );
  return {
    id,
    userId: input.userId ?? null,
    email: input.email,
    tokenHash: input.tokenHash,
    purpose: input.purpose,
    expiresAt: input.expiresAt,
    usedAt: null,
    createdAt,
  };
}

/**
 * 查询有效的邮箱验证码记录。
 */
export async function findValidEmailVerification(
  email: string,
  tokenHash: string,
  purpose: EmailVerificationPurpose,
): Promise<EmailVerificationRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM email_verifications WHERE email = ? AND token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1",
    [email, tokenHash, purpose],
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0]!;
  return {
    id: row.id,
    userId: row.user_id ?? null,
    email: row.email,
    tokenHash: row.token_hash,
    purpose: row.purpose,
    expiresAt: new Date(row.expires_at),
    usedAt: row.used_at ? new Date(row.used_at) : null,
    createdAt: new Date(row.created_at),
  };
}

/**
 * 标记验证码记录已使用。
 */
export async function markEmailVerificationUsed(id: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "UPDATE email_verifications SET used_at = ? WHERE id = ?",
    [new Date(), id],
  );
}
