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
 * 写入邮件待发送记录，便于追踪发送状态。
 */
export async function createEmailOutbox(
  input: CreateEmailOutboxInput,
): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO email_outbox (id, user_id, email, subject, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      input.userId ?? null,
      input.email,
      input.subject,
      input.body,
      input.status ?? "PENDING",
      new Date(),
    ],
  );
  return { id };
}

/**
 * 更新邮件队列状态与错误信息。
 */
export async function updateEmailOutboxStatus(
  id: string,
  status: EmailOutboxStatus,
  errorMessage?: string | null,
): Promise<void> {
  const sentAt = status === "SENT" ? new Date() : null;
  await pool.execute<ResultSetHeader>(
    "UPDATE email_outbox SET status = ?, sent_at = ?, error_message = ? WHERE id = ?",
    [status, sentAt, errorMessage ?? null, id],
  );
}
