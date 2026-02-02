import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type ReportStatus = "PENDING" | "RESOLVED";
export type ReportTargetType = "POST" | "COMMENT" | "USER" | "COUNSELOR";

export type ReportRecord = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  attachmentUrl: string | null;
  status: ReportStatus;
  actionTaken: string | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

/**
 * 读取单条举报记录。
 */
export async function findReportById(
  id: string,
): Promise<ReportRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM reports WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapReport(rows[0]!);
}

/**
 * 创建举报记录。
 */
export async function createReport(
  payload: ReportRecord,
): Promise<ReportRecord> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO reports (id, reporter_id, target_type, target_id, reason, attachment_url, status, action_taken, resolved_by, resolved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      payload.id,
      payload.reporterId,
      payload.targetType,
      payload.targetId,
      payload.reason,
      payload.attachmentUrl ?? null,
      payload.status,
      payload.actionTaken ?? null,
      payload.resolvedBy ?? null,
      payload.resolvedAt ?? null,
      payload.createdAt,
    ],
  );
  return payload;
}

/**
 * 查询举报列表。
 */
export async function listReports(
  status?: ReportStatus,
): Promise<ReportRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    status
      ? "SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC"
      : "SELECT * FROM reports ORDER BY created_at DESC",
    status ? [status] : [],
  );
  return rows.map(mapReport);
}

/**
 * 更新举报处理状态。
 */
export async function resolveReport(
  id: string,
  resolvedBy: string,
  actionTaken?: string | null,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE reports SET status = 'RESOLVED', action_taken = ?, resolved_by = ?, resolved_at = ? WHERE id = ?",
    [actionTaken ?? null, resolvedBy, now, id],
  );
}

/**
 * 将数据库行映射为举报记录对象。
 */
function mapReport(row: RowDataPacket): ReportRecord {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    attachmentUrl: row.attachment_url ?? null,
    status: row.status,
    actionTaken: row.action_taken,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
    createdAt: new Date(row.created_at),
  };
}
