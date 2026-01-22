import {
  createConsultationRecord,
  findConsultationRecordByAppointment,
  findConsultationRecordById,
  listConsultationRecords,
  updateConsultationRecord,
} from "../repositories/consultationRepository";
import { findAppointmentById } from "../repositories/appointmentRepository";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";

export type ConsultationInput = {
  appointmentId: string;
  summary?: string | null;
  counselorFeedback?: string | null;
  homework?: string | null;
  followUpPlan?: string | null;
  assessmentSummary?: string | null;
  issueCategory?: string | null;
  isCrisis?: boolean;
};

/**
 * 创建咨询记录（心理师端）。
 */
export async function createRecord(
  counselorId: string,
  payload: ConsultationInput,
) {
  const appointment = await findAppointmentById(payload.appointmentId);
  if (!appointment) {
    throw new BadRequestError("预约不存在");
  }
  if (appointment.counselorId !== counselorId) {
    throw new UnauthorizedError("无权创建该预约的记录");
  }
  const existing = await findConsultationRecordByAppointment(
    payload.appointmentId,
  );
  if (existing) {
    throw new BadRequestError("该预约已存在咨询记录");
  }
  const record = await createConsultationRecord({
    id: crypto.randomUUID(),
    appointmentId: payload.appointmentId,
    userId: appointment.userId,
    counselorId,
    summary: payload.summary ?? null,
    counselorFeedback: payload.counselorFeedback ?? null,
    homework: payload.homework ?? null,
    followUpPlan: payload.followUpPlan ?? null,
    assessmentSummary: payload.assessmentSummary ?? null,
    issueCategory: payload.issueCategory ?? null,
    isCrisis: payload.isCrisis ?? false,
  });
  // 生成咨询记录的存证占位，用于后续链上存证。
  const evidence = await createEvidencePlaceholder({
    targetType: "CONSULTATION",
    targetId: record.id,
    summary: "咨询记录存证占位",
  });
  return { record, evidence };
}

/**
 * 更新咨询记录内容。
 */
export async function updateRecord(
  recordId: string,
  counselorId: string,
  payload: Partial<Omit<ConsultationInput, "appointmentId">>,
) {
  const record = await findConsultationRecordById(recordId);
  if (!record) {
    throw new BadRequestError("咨询记录不存在");
  }
  if (record.counselorId !== counselorId) {
    throw new UnauthorizedError("无权更新该记录");
  }
  await updateConsultationRecord(recordId, {
    summary: payload.summary,
    counselorFeedback: payload.counselorFeedback,
    homework: payload.homework,
    followUpPlan: payload.followUpPlan,
    assessmentSummary: payload.assessmentSummary,
    issueCategory: payload.issueCategory,
    isCrisis: payload.isCrisis,
  });
  return findConsultationRecordById(recordId);
}

/**
 * 列出咨询记录（用户或心理师）。
 */
export async function listRecords(options: {
  userId?: string;
  counselorId?: string;
}) {
  return listConsultationRecords(options);
}

/**
 * 获取咨询记录详情。
 */
export async function getRecord(recordId: string, userId: string, role: "USER" | "COUNSELOR" | "ADMIN") {
  const record = await findConsultationRecordById(recordId);
  if (!record) {
    throw new BadRequestError("咨询记录不存在");
  }
  if (role === "USER" && record.userId !== userId) {
    throw new UnauthorizedError("无权查看该记录");
  }
  if (role === "COUNSELOR" && record.counselorId !== userId) {
    throw new UnauthorizedError("无权查看该记录");
  }
  return record;
}
