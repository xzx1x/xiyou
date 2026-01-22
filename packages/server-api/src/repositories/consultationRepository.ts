import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type ConsultationRecord = {
  id: string;
  appointmentId: string;
  userId: string;
  counselorId: string;
  summary: string | null;
  counselorFeedback: string | null;
  homework: string | null;
  followUpPlan: string | null;
  assessmentSummary: string | null;
  issueCategory: string | null;
  isCrisis: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 创建咨询记录。
 */
export async function createConsultationRecord(
  payload: Omit<ConsultationRecord, "createdAt" | "updatedAt">,
): Promise<ConsultationRecord> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO consultation_records (id, appointment_id, user_id, counselor_id, summary, counselor_feedback, homework, follow_up_plan, assessment_summary, issue_category, is_crisis, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.id,
      payload.appointmentId,
      payload.userId,
      payload.counselorId,
      payload.summary ?? null,
      payload.counselorFeedback ?? null,
      payload.homework ?? null,
      payload.followUpPlan ?? null,
      payload.assessmentSummary ?? null,
      payload.issueCategory ?? null,
      payload.isCrisis ? 1 : 0,
      now,
      now,
    ],
  );
  const record = await findConsultationRecordById(payload.id);
  if (!record) {
    throw new Error("咨询记录创建失败");
  }
  return record;
}

/**
 * 更新咨询记录。
 */
export async function updateConsultationRecord(
  id: string,
  payload: Partial<Omit<ConsultationRecord, "id" | "appointmentId" | "userId" | "counselorId" | "createdAt" | "updatedAt">>,
): Promise<void> {
  const assignments: string[] = [];
  const values: Array<string | number | Date | null> = [];

  if (payload.summary !== undefined) {
    assignments.push("summary = ?");
    values.push(payload.summary);
  }
  if (payload.counselorFeedback !== undefined) {
    assignments.push("counselor_feedback = ?");
    values.push(payload.counselorFeedback);
  }
  if (payload.homework !== undefined) {
    assignments.push("homework = ?");
    values.push(payload.homework);
  }
  if (payload.followUpPlan !== undefined) {
    assignments.push("follow_up_plan = ?");
    values.push(payload.followUpPlan);
  }
  if (payload.assessmentSummary !== undefined) {
    assignments.push("assessment_summary = ?");
    values.push(payload.assessmentSummary);
  }
  if (payload.issueCategory !== undefined) {
    assignments.push("issue_category = ?");
    values.push(payload.issueCategory);
  }
  if (payload.isCrisis !== undefined) {
    assignments.push("is_crisis = ?");
    values.push(payload.isCrisis ? 1 : 0);
  }

  if (assignments.length > 0) {
    values.push(new Date());
    values.push(id);
    const query = `UPDATE consultation_records SET ${assignments.join(", ")}, updated_at = ? WHERE id = ?`;
    await pool.execute<ResultSetHeader>(query, values);
  }
}

/**
 * 查询单条咨询记录。
 */
export async function findConsultationRecordById(
  id: string,
): Promise<ConsultationRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM consultation_records WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapConsultationRecord(rows[0]!);
}

/**
 * 通过预约编号查询咨询记录。
 */
export async function findConsultationRecordByAppointment(
  appointmentId: string,
): Promise<ConsultationRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM consultation_records WHERE appointment_id = ? LIMIT 1",
    [appointmentId],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapConsultationRecord(rows[0]!);
}

/**
 * 列出用户或心理师的咨询记录。
 */
export async function listConsultationRecords(
  options: { userId?: string; counselorId?: string },
): Promise<ConsultationRecord[]> {
  if (options.userId) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM consultation_records WHERE user_id = ? ORDER BY created_at DESC",
      [options.userId],
    );
    return rows.map(mapConsultationRecord);
  }
  if (options.counselorId) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM consultation_records WHERE counselor_id = ? ORDER BY created_at DESC",
      [options.counselorId],
    );
    return rows.map(mapConsultationRecord);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM consultation_records ORDER BY created_at DESC",
  );
  return rows.map(mapConsultationRecord);
}

function mapConsultationRecord(row: RowDataPacket): ConsultationRecord {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    userId: row.user_id,
    counselorId: row.counselor_id,
    summary: row.summary,
    counselorFeedback: row.counselor_feedback,
    homework: row.homework,
    followUpPlan: row.follow_up_plan,
    assessmentSummary: row.assessment_summary,
    issueCategory: row.issue_category,
    isCrisis: Boolean(row.is_crisis),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
