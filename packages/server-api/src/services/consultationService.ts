import {
  createConsultationRecord,
  findConsultationRecordByAppointment,
  findConsultationRecordById,
  listConsultationRecords,
  updateConsultationRecord,
} from "../repositories/consultationRepository";
import { findAppointmentById } from "../repositories/appointmentRepository";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import {
  confirmConsultationEvidence,
  ensureEvidencePlaceholder,
  syncConsultationEvidence,
} from "./evidenceService";
import {
  getConsultationEvidenceContractConfig,
  hashConsultationRecord,
  signConsultationChainAuthorization,
} from "./blockchainEvidenceService";

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
  const evidence = await syncConsultationEvidence(record);
  return { record, evidence };
}

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
  const updatedRecord = await findConsultationRecordById(recordId);
  if (!updatedRecord) {
    throw new BadRequestError("咨询记录不存在");
  }
  const evidence = await syncConsultationEvidence(updatedRecord);
  return { record: updatedRecord, evidence };
}

export async function listRecords(options: {
  userId?: string;
  counselorId?: string;
}) {
  return listConsultationRecords(options);
}

export async function getRecord(
  recordId: string,
  userId: string,
  role: "USER" | "COUNSELOR" | "ADMIN",
) {
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

export async function syncRecordEvidence(
  recordId: string,
  userId: string,
  role: "USER" | "COUNSELOR" | "ADMIN",
) {
  const record = await findConsultationRecordById(recordId);
  if (!record) {
    throw new BadRequestError("咨询记录不存在");
  }
  if (role === "USER") {
    throw new UnauthorizedError("当前身份无权执行上链同步");
  }
  if (role === "COUNSELOR" && record.counselorId !== userId) {
    throw new UnauthorizedError("无权同步该咨询记录");
  }
  const evidence = await syncConsultationEvidence(record);
  return { record, evidence };
}

export async function prepareRecordEvidence(
  recordId: string,
  userId: string,
  role: "USER" | "COUNSELOR" | "ADMIN",
) {
  const record = await findConsultationRecordById(recordId);
  if (!record) {
    throw new BadRequestError("Consultation record does not exist");
  }
  if (role === "USER") {
    throw new UnauthorizedError("Current role cannot prepare consultation evidence");
  }
  if (role === "COUNSELOR" && record.counselorId !== userId) {
    throw new UnauthorizedError("No permission to prepare this consultation evidence");
  }

  const evidence = await ensureEvidencePlaceholder({
    targetType: "CONSULTATION",
    targetId: record.id,
    summary: "consultation record hash evidence",
  });
  const recordHash = hashConsultationRecord(record);
  const [contractConfig, authorizationSignature] = await Promise.all([
    getConsultationEvidenceContractConfig(),
    signConsultationChainAuthorization({
      consultationId: record.id,
      appointmentId: record.appointmentId,
      recordHash,
    }),
  ]);

  return {
    record,
    evidence,
    chainSubmission: {
      consultationId: record.id,
      appointmentId: record.appointmentId,
      recordHash,
      contractAddress: contractConfig?.contractAddress ?? null,
      chainId: contractConfig?.chainId ?? null,
      authorizationSignature,
    },
  };
}

export async function confirmRecordEvidence(
  recordId: string,
  userId: string,
  role: "USER" | "COUNSELOR" | "ADMIN",
  txHash: string,
) {
  const record = await findConsultationRecordById(recordId);
  if (!record) {
    throw new BadRequestError("Consultation record does not exist");
  }
  if (role === "USER") {
    throw new UnauthorizedError("Current role cannot confirm consultation evidence");
  }
  if (role === "COUNSELOR" && record.counselorId !== userId) {
    throw new UnauthorizedError("No permission to confirm this consultation evidence");
  }

  const evidence = await confirmConsultationEvidence(record, txHash);
  return { record, evidence };
}
