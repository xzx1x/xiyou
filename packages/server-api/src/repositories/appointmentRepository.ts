import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type AppointmentStatus =
  | "BOOKED"
  | "CANCELLED_BY_USER"
  | "CANCELLED_BY_COUNSELOR"
  | "COMPLETED";

export type AppointmentRecord = {
  id: string;
  userId: string;
  counselorId: string;
  scheduleId: string;
  status: AppointmentStatus;
  userNote: string | null;
  counselorNote: string | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  completedAt: Date | null;
};

/**
 * 创建预约记录。
 */
export async function createAppointment(
  payload: Omit<AppointmentRecord, "createdAt" | "updatedAt" | "cancelledAt" | "completedAt">,
): Promise<AppointmentRecord> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO appointments (id, user_id, counselor_id, schedule_id, status, user_note, counselor_note, cancel_reason, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.id,
      payload.userId,
      payload.counselorId,
      payload.scheduleId,
      payload.status,
      payload.userNote ?? null,
      payload.counselorNote ?? null,
      payload.cancelReason ?? null,
      now,
      now,
    ],
  );
  const record = await findAppointmentById(payload.id);
  if (!record) {
    throw new Error("预约创建失败");
  }
  return record;
}

/**
 * 读取预约详情。
 */
export async function findAppointmentById(
  id: string,
): Promise<AppointmentRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM appointments WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapAppointment(rows[0]!);
}

/**
 * 查询用户或心理师的预约列表。
 */
export async function listAppointments(
  options: { userId?: string; counselorId?: string },
): Promise<AppointmentRecord[]> {
  if (options.userId) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM appointments WHERE user_id = ? ORDER BY created_at DESC",
      [options.userId],
    );
    return rows.map(mapAppointment);
  }
  if (options.counselorId) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM appointments WHERE counselor_id = ? ORDER BY created_at DESC",
      [options.counselorId],
    );
    return rows.map(mapAppointment);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM appointments ORDER BY created_at DESC",
  );
  return rows.map(mapAppointment);
}

/**
 * 更新预约状态与取消原因。
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancelReason?: string | null,
): Promise<void> {
  const now = new Date();
  const cancelledAt =
    status === "CANCELLED_BY_USER" || status === "CANCELLED_BY_COUNSELOR"
      ? now
      : null;
  const completedAt = status === "COMPLETED" ? now : null;
  await pool.execute<ResultSetHeader>(
    "UPDATE appointments SET status = ?, cancel_reason = ?, cancelled_at = ?, completed_at = ?, updated_at = ? WHERE id = ?",
    [status, cancelReason ?? null, cancelledAt, completedAt, now, id],
  );
}

/**
 * 更新心理师的准备备注。
 */
export async function updateAppointmentCounselorNote(
  id: string,
  note: string | null,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE appointments SET counselor_note = ?, updated_at = ? WHERE id = ?",
    [note ?? null, now, id],
  );
}

function mapAppointment(row: RowDataPacket): AppointmentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    counselorId: row.counselor_id,
    scheduleId: row.schedule_id,
    status: row.status,
    userNote: row.user_note,
    counselorNote: row.counselor_note,
    cancelReason: row.cancel_reason,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  };
}
