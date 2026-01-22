import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type FeedbackRecord = {
  id: string;
  appointmentId: string;
  userId: string;
  counselorId: string;
  rating: number;
  comment: string | null;
  liked: boolean;
  createdAt: Date;
};

/**
 * 写入咨询反馈。
 */
export async function createFeedback(
  payload: FeedbackRecord,
): Promise<FeedbackRecord> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO appointment_feedback (id, appointment_id, user_id, counselor_id, rating, comment, liked, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      payload.id,
      payload.appointmentId,
      payload.userId,
      payload.counselorId,
      payload.rating,
      payload.comment ?? null,
      payload.liked ? 1 : 0,
      payload.createdAt,
    ],
  );
  return payload;
}

/**
 * 查询心理师的反馈列表。
 */
export async function listFeedbackByCounselor(
  counselorId: string,
): Promise<FeedbackRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM appointment_feedback WHERE counselor_id = ? ORDER BY created_at DESC",
    [counselorId],
  );
  return rows.map(mapFeedback);
}

/**
 * 查询用户自己的反馈记录。
 */
export async function listFeedbackByUser(
  userId: string,
): Promise<FeedbackRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM appointment_feedback WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map(mapFeedback);
}

function mapFeedback(row: RowDataPacket): FeedbackRecord {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    userId: row.user_id,
    counselorId: row.counselor_id,
    rating: row.rating,
    comment: row.comment,
    liked: Boolean(row.liked),
    createdAt: new Date(row.created_at),
  };
}
