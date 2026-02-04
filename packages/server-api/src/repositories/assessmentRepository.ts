import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type AssessmentType =
  | "MOOD"
  | "ANXIETY"
  | "STRESS"
  | "SLEEP"
  | "SOCIAL";

export type AssessmentResultRecord = {
  id: string;
  userId: string;
  type: AssessmentType;
  score: number;
  level: string;
  answers: string;
  createdAt: Date;
};

/**
 * 保存测评结果记录。
 */
export async function createAssessmentResult(
  payload: AssessmentResultRecord,
): Promise<AssessmentResultRecord> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO assessment_results (id, user_id, type, score, level, answers, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      payload.id,
      payload.userId,
      payload.type,
      payload.score,
      payload.level,
      payload.answers,
      payload.createdAt,
    ],
  );
  return payload;
}

/**
 * 查询用户历史测评结果。
 */
export async function listAssessmentResults(
  userId: string,
): Promise<AssessmentResultRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM assessment_results WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    score: row.score,
    level: row.level,
    answers: row.answers,
    createdAt: new Date(row.created_at),
  }));
}
