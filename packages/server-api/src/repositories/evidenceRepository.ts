import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

// 存证记录状态，用于标识是否已真正上链。
export type EvidenceStatus = "PENDING" | "RECORDED";
// 存证关联的业务对象类型，用于后续链上索引。
export type EvidenceTargetType =
  | "APPOINTMENT"
  | "CONSULTATION"
  | "ASSESSMENT"
  | "FEEDBACK"
  | "FORUM_POST"
  | "REPORT"
  | "CONTENT"
  | "COUNSELOR_APPLICATION";

// 存证记录的结构定义，便于统一读写。
export type EvidenceRecord = {
  id: string;
  targetType: EvidenceTargetType;
  targetId: string;
  summary: string | null;
  status: EvidenceStatus;
  createdAt: Date;
};

// 创建存证记录所需的输入结构。
export type CreateEvidenceInput = {
  targetType: EvidenceTargetType;
  targetId: string;
  summary?: string | null;
  status?: EvidenceStatus;
};

/**
 * 写入存证占位记录，后续可对接上链服务更新状态。
 */
export async function createEvidenceRecord(
  input: CreateEvidenceInput,
): Promise<EvidenceRecord> {
  const id = crypto.randomUUID();
  const createdAt = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO evidence_records (id, target_type, target_id, summary, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      input.targetType,
      input.targetId,
      input.summary ?? null,
      input.status ?? "PENDING",
      createdAt,
    ],
  );
  return {
    id,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary ?? null,
    status: input.status ?? "PENDING",
    createdAt,
  };
}

/**
 * 读取单条存证记录。
 */
export async function findEvidenceById(
  id: string,
): Promise<EvidenceRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM evidence_records WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapEvidence(rows[0]!);
}

/**
 * 通过业务对象查询对应的存证记录。
 */
export async function findEvidenceByTarget(
  targetType: EvidenceTargetType,
  targetId: string,
): Promise<EvidenceRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM evidence_records WHERE target_type = ? AND target_id = ? LIMIT 1",
    [targetType, targetId],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapEvidence(rows[0]!);
}

/**
 * 将数据库行转换为存证记录对象。
 */
function mapEvidence(row: RowDataPacket): EvidenceRecord {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    summary: row.summary,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}
