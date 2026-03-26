import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type EvidenceStatus = "PENDING" | "RECORDED";
export type EvidenceTargetType =
  | "APPOINTMENT"
  | "CONSULTATION"
  | "ASSESSMENT"
  | "FEEDBACK"
  | "FORUM_POST"
  | "REPORT"
  | "CONTENT"
  | "COUNSELOR_APPLICATION";

export type EvidenceRecord = {
  id: string;
  targetType: EvidenceTargetType;
  targetId: string;
  summary: string | null;
  status: EvidenceStatus;
  recordHash: string | null;
  txHash: string | null;
  blockNumber: number | null;
  chainId: number | null;
  contractAddress: string | null;
  revision: number | null;
  recordedAt: Date | null;
  syncError: string | null;
  createdAt: Date;
};

export type CreateEvidenceInput = {
  targetType: EvidenceTargetType;
  targetId: string;
  summary?: string | null;
  status?: EvidenceStatus;
};

export type UpdateEvidenceSyncInput = {
  summary?: string | null;
  status?: EvidenceStatus;
  recordHash?: string | null;
  txHash?: string | null;
  blockNumber?: number | null;
  chainId?: number | null;
  contractAddress?: string | null;
  revision?: number | null;
  recordedAt?: Date | null;
  syncError?: string | null;
};

export async function createEvidenceRecord(
  input: CreateEvidenceInput,
): Promise<EvidenceRecord> {
  const id = crypto.randomUUID();
  const createdAt = new Date();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO evidence_records (
      id, target_type, target_id, summary, status, record_hash, tx_hash, block_number,
      chain_id, contract_address, revision, recorded_at, sync_error, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.targetType,
      input.targetId,
      input.summary ?? null,
      input.status ?? "PENDING",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      createdAt,
    ],
  );
  return {
    id,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary ?? null,
    status: input.status ?? "PENDING",
    recordHash: null,
    txHash: null,
    blockNumber: null,
    chainId: null,
    contractAddress: null,
    revision: null,
    recordedAt: null,
    syncError: null,
    createdAt,
  };
}

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

export async function updateEvidenceRecordSync(
  id: string,
  payload: UpdateEvidenceSyncInput,
): Promise<EvidenceRecord> {
  const assignments: string[] = [];
  const values: Array<string | number | Date | null> = [];

  if (payload.summary !== undefined) {
    assignments.push("summary = ?");
    values.push(payload.summary);
  }
  if (payload.status !== undefined) {
    assignments.push("status = ?");
    values.push(payload.status);
  }
  if (payload.recordHash !== undefined) {
    assignments.push("record_hash = ?");
    values.push(payload.recordHash);
  }
  if (payload.txHash !== undefined) {
    assignments.push("tx_hash = ?");
    values.push(payload.txHash);
  }
  if (payload.blockNumber !== undefined) {
    assignments.push("block_number = ?");
    values.push(payload.blockNumber);
  }
  if (payload.chainId !== undefined) {
    assignments.push("chain_id = ?");
    values.push(payload.chainId);
  }
  if (payload.contractAddress !== undefined) {
    assignments.push("contract_address = ?");
    values.push(payload.contractAddress);
  }
  if (payload.revision !== undefined) {
    assignments.push("revision = ?");
    values.push(payload.revision);
  }
  if (payload.recordedAt !== undefined) {
    assignments.push("recorded_at = ?");
    values.push(payload.recordedAt);
  }
  if (payload.syncError !== undefined) {
    assignments.push("sync_error = ?");
    values.push(payload.syncError);
  }

  if (assignments.length === 0) {
    const current = await findEvidenceById(id);
    if (!current) {
      throw new Error("存证记录不存在");
    }
    return current;
  }

  values.push(id);
  await pool.execute<ResultSetHeader>(
    `UPDATE evidence_records SET ${assignments.join(", ")} WHERE id = ?`,
    values,
  );
  const updated = await findEvidenceById(id);
  if (!updated) {
    throw new Error("存证记录更新失败");
  }
  return updated;
}

function mapEvidence(row: RowDataPacket): EvidenceRecord {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    summary: row.summary,
    status: row.status,
    recordHash: row.record_hash ?? null,
    txHash: row.tx_hash ?? null,
    blockNumber:
      row.block_number === null || row.block_number === undefined
        ? null
        : Number(row.block_number),
    chainId:
      row.chain_id === null || row.chain_id === undefined
        ? null
        : Number(row.chain_id),
    contractAddress: row.contract_address ?? null,
    revision:
      row.revision === null || row.revision === undefined
        ? null
        : Number(row.revision),
    recordedAt: row.recorded_at ? new Date(row.recorded_at) : null,
    syncError: row.sync_error ?? null,
    createdAt: new Date(row.created_at),
  };
}
