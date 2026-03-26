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
 * 淇濆瓨娴嬭瘎缁撴灉璁板綍銆? */
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

export async function findAssessmentResultById(
  id: string,
): Promise<AssessmentResultRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM assessment_results WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0]!;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    score: row.score,
    level: row.level,
    answers: row.answers,
    createdAt: new Date(row.created_at),
  };
}

/**
 * 鏌ヨ鐢ㄦ埛鍘嗗彶娴嬭瘎缁撴灉銆? */
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
