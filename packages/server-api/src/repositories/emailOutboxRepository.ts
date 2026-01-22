import type { ResultSetHeader } from "mysql2";
import { pool } from "../config/database";

export type EmailOutboxStatus = "PENDING" | "SENT" | "FAILED";

export type CreateEmailOutboxInput = {
  userId?: string | null;
  email: string;
  subject: string;
  body: string;
  status?: EmailOutboxStatus;
};

/**
 * 写入邮件待发送记录，供后续接入 QQ 邮件接口。
 */
export async function createEmailOutbox(
  input: CreateEmailOutboxInput,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO email_outbox (id, user_id, email, subject, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      crypto.randomUUID(),
      input.userId ?? null,
      input.email,
      input.subject,
      input.body,
      input.status ?? "PENDING",
      new Date(),
    ],
  );
}
