import type { ResultSetHeader } from "mysql2";
import { pool } from "../config/database";

export type RequestLogInput = {
  userId?: string | null;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip?: string | null;
  userAgent?: string | null;
};

// 请求日志记录结构，用于管理员查看。
export type RequestLogRecord = {
  id: string;
  userId: string | null;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
};

/**
 * 写入接口访问日志，用于审计与问题排查。
 */
export async function createRequestLog(
  payload: RequestLogInput,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO request_logs (id, user_id, method, path, status, duration_ms, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      crypto.randomUUID(),
      payload.userId ?? null,
      payload.method,
      payload.path,
      payload.status,
      payload.durationMs,
      payload.ip ?? null,
      payload.userAgent ?? null,
      new Date(),
    ],
  );
}

/**
 * 查询最近的请求日志列表。
 */
export async function listRequestLogs(
  limit = 200,
): Promise<RequestLogRecord[]> {
  // 限制返回数量，避免日志查询过大影响性能。
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 500);
  const [rows] = await pool.query<any[]>(
    `SELECT * FROM request_logs ORDER BY created_at DESC LIMIT ${safeLimit}`,
  );
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    method: row.method,
    path: row.path,
    status: row.status,
    durationMs: row.duration_ms,
    ip: row.ip,
    userAgent: row.user_agent,
    createdAt: new Date(row.created_at),
  }));
}
