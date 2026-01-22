import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type NotificationChannel = "IN_APP" | "EMAIL";

export type NotificationRecord = {
  id: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type CreateNotificationInput = {
  userId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  link?: string | null;
};

/**
 * 写入站内通知或邮件通知记录。
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationRecord> {
  const id = crypto.randomUUID();
  const createdAt = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO notifications (id, user_id, channel, title, message, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, input.userId, input.channel, input.title, input.message, input.link ?? null, createdAt],
  );
  return {
    id,
    userId: input.userId,
    channel: input.channel,
    title: input.title,
    message: input.message,
    link: input.link ?? null,
    readAt: null,
    createdAt,
  };
}

/**
 * 标记通知已读。
 */
export async function markNotificationRead(
  id: string,
  userId: string,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?",
    [new Date(), id, userId],
  );
}

/**
 * 查询指定用户的通知列表。
 */
export async function listNotifications(
  userId: string,
): Promise<NotificationRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    channel: row.channel,
    title: row.title,
    message: row.message,
    link: row.link,
    readAt: row.read_at ? new Date(row.read_at) : null,
    createdAt: new Date(row.created_at),
  }));
}
