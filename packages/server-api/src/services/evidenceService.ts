import {
  findAssessmentResultById,
  type AssessmentResultRecord,
} from "../repositories/assessmentRepository";
import {
  findConsultationRecordById,
  type ConsultationRecord,
} from "../repositories/consultationRepository";
import {
  createEvidenceRecord,
  findEvidenceById,
  findEvidenceByTarget,
  updateEvidenceRecordSync,
  type EvidenceRecord,
  type EvidenceTargetType,
} from "../repositories/evidenceRepository";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import {
  getChainTransactionReceipt,
  getLatestAssessmentEvidenceOnChain,
  getAssessmentEvidenceContractConfig,
  getConsultationEvidenceContractConfig,
  getLatestConsultationEvidenceOnChain,
  hashAssessmentRecord,
  hashConsultationRecord,
  recordAssessmentEvidenceOnChain,
  recordConsultationEvidenceOnChain,
} from "./blockchainEvidenceService";

export type EvidenceAuthUser = {
  sub: string;
  role: "USER" | "COUNSELOR" | "ADMIN";
};

export type EvidenceVerification = {
  targetType: "CONSULTATION" | "ASSESSMENT";
  isVerified: boolean | null;
  localRecordHash: string | null;
  evidenceRecordHash: string | null;
  chainRecordHash: string | null;
  chainRevision: number | null;
  chainRecordedAt: Date | null;
  chainOperator: string | null;
  reason: string | null;
};

export type EvidenceLookupResult = {
  evidence: EvidenceRecord | null;
  verification: EvidenceVerification | null;
};

export type EvidencePlaceholderInput = {
  targetType: EvidenceTargetType;
  targetId: string;
  summary?: string | null;
};

function buildChainReadErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 1000);
  }
  return fallback;
}

function buildUnsupportedVerificationResult(
  targetType: "CONSULTATION" | "ASSESSMENT",
  evidence: EvidenceRecord,
  reason: string,
): EvidenceVerification {
  return {
    targetType,
    isVerified: null,
    localRecordHash: null,
    evidenceRecordHash: evidence.recordHash ?? null,
    chainRecordHash: null,
    chainRevision: null,
    chainRecordedAt: null,
    chainOperator: null,
    reason,
  };
}

function assertConsultationAccess(
  record: ConsultationRecord,
  authUser: EvidenceAuthUser,
) {
  if (authUser.role === "ADMIN") {
    return;
  }
  if (authUser.role === "USER" && record.userId === authUser.sub) {
    return;
  }
  if (authUser.role === "COUNSELOR" && record.counselorId === authUser.sub) {
    return;
  }
  throw new UnauthorizedError("无权查看该存证记录");
}

function assertAssessmentAccess(
  record: AssessmentResultRecord,
  authUser: EvidenceAuthUser,
) {
  if (authUser.role === "ADMIN") {
    return;
  }
  if (authUser.role === "USER" && record.userId === authUser.sub) {
    return;
  }
  throw new UnauthorizedError("无权查看该存证记录");
}

async function assertEvidenceAccess(
  evidence: EvidenceRecord,
  authUser: EvidenceAuthUser,
) {
  if (evidence.targetType === "CONSULTATION") {
    const record = await findConsultationRecordById(evidence.targetId);
    if (!record) {
      if (authUser.role === "ADMIN") {
        return;
      }
      throw new UnauthorizedError("无权查看该存证记录");
    }
    assertConsultationAccess(record, authUser);
    return;
  }

  if (evidence.targetType === "ASSESSMENT") {
    const record = await findAssessmentResultById(evidence.targetId);
    if (!record) {
      if (authUser.role === "ADMIN") {
        return;
      }
      throw new UnauthorizedError("无权查看该存证记录");
    }
    assertAssessmentAccess(record, authUser);
  }
}

async function buildConsultationVerification(
  evidence: EvidenceRecord,
): Promise<EvidenceVerification> {
  const record = await findConsultationRecordById(evidence.targetId);
  if (!record) {
    return buildUnsupportedVerificationResult(
      "CONSULTATION",
      evidence,
      "咨询记录不存在，无法校验",
    );
  }

  const localRecordHash = hashConsultationRecord(record);

  try {
    const chainEvidence = await getLatestConsultationEvidenceOnChain(record.id);
    if (!chainEvidence) {
      return {
        targetType: "CONSULTATION",
        isVerified: null,
        localRecordHash,
        evidenceRecordHash: evidence.recordHash ?? null,
        chainRecordHash: null,
        chainRevision: null,
        chainRecordedAt: null,
        chainOperator: null,
        reason: "未配置咨询存证合约或链上暂无记录",
      };
    }

    const isVerified =
      localRecordHash === chainEvidence.recordHash &&
      (evidence.recordHash ? evidence.recordHash === chainEvidence.recordHash : true);

    return {
      targetType: "CONSULTATION",
      isVerified,
      localRecordHash,
      evidenceRecordHash: evidence.recordHash ?? null,
      chainRecordHash: chainEvidence.recordHash,
      chainRevision: chainEvidence.revision,
      chainRecordedAt: chainEvidence.recordedAt,
      chainOperator: chainEvidence.operator,
      reason: isVerified ? null : "本地记录哈希与链上最新哈希不一致",
    };
  } catch (error) {
    return {
      targetType: "CONSULTATION",
      isVerified: null,
      localRecordHash,
      evidenceRecordHash: evidence.recordHash ?? null,
      chainRecordHash: null,
      chainRevision: null,
      chainRecordedAt: null,
      chainOperator: null,
      reason: buildChainReadErrorMessage(error, "咨询记录链上校验失败"),
    };
  }
}

async function buildAssessmentVerification(
  evidence: EvidenceRecord,
): Promise<EvidenceVerification> {
  const record = await findAssessmentResultById(evidence.targetId);
  if (!record) {
    return buildUnsupportedVerificationResult(
      "ASSESSMENT",
      evidence,
      "测评结果不存在，无法校验",
    );
  }

  const localRecordHash = hashAssessmentRecord(record);

  try {
    const chainEvidence = await getLatestAssessmentEvidenceOnChain(record.id);
    if (!chainEvidence) {
      return {
        targetType: "ASSESSMENT",
        isVerified: null,
        localRecordHash,
        evidenceRecordHash: evidence.recordHash ?? null,
        chainRecordHash: null,
        chainRevision: null,
        chainRecordedAt: null,
        chainOperator: null,
        reason: "未配置测评存证合约或链上暂无记录",
      };
    }

    const isVerified =
      localRecordHash === chainEvidence.recordHash &&
      (evidence.recordHash ? evidence.recordHash === chainEvidence.recordHash : true);

    return {
      targetType: "ASSESSMENT",
      isVerified,
      localRecordHash,
      evidenceRecordHash: evidence.recordHash ?? null,
      chainRecordHash: chainEvidence.recordHash,
      chainRevision: chainEvidence.revision,
      chainRecordedAt: chainEvidence.recordedAt,
      chainOperator: chainEvidence.operator,
      reason: isVerified ? null : "本地记录哈希与链上最新哈希不一致",
    };
  } catch (error) {
    return {
      targetType: "ASSESSMENT",
      isVerified: null,
      localRecordHash,
      evidenceRecordHash: evidence.recordHash ?? null,
      chainRecordHash: null,
      chainRevision: null,
      chainRecordedAt: null,
      chainOperator: null,
      reason: buildChainReadErrorMessage(error, "测评结果链上校验失败"),
    };
  }
}

async function buildEvidenceVerification(
  evidence: EvidenceRecord,
): Promise<EvidenceVerification | null> {
  if (evidence.targetType === "CONSULTATION") {
    return buildConsultationVerification(evidence);
  }
  if (evidence.targetType === "ASSESSMENT") {
    return buildAssessmentVerification(evidence);
  }
  return null;
}

export async function createEvidencePlaceholder(
  input: EvidencePlaceholderInput,
): Promise<EvidenceRecord> {
  return createEvidenceRecord({
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary ?? null,
  });
}

export async function ensureEvidencePlaceholder(
  input: EvidencePlaceholderInput,
): Promise<EvidenceRecord> {
  const existing = await findEvidenceByTarget(input.targetType, input.targetId);
  if (existing) {
    if (input.summary && input.summary !== existing.summary) {
      return updateEvidenceRecordSync(existing.id, { summary: input.summary });
    }
    return existing;
  }
  return createEvidencePlaceholder(input);
}

export async function getEvidenceById(
  id: string,
  authUser: EvidenceAuthUser,
): Promise<EvidenceLookupResult> {
  const record = await findEvidenceById(id);
  if (!record) {
    throw new BadRequestError("存证记录不存在");
  }
  await assertEvidenceAccess(record, authUser);
  return {
    evidence: record,
    verification: await buildEvidenceVerification(record),
  };
}

export async function getEvidenceByTarget(
  targetType: EvidenceTargetType,
  targetId: string,
  authUser: EvidenceAuthUser,
): Promise<EvidenceLookupResult> {
  const evidence = await findEvidenceByTarget(targetType, targetId);
  if (!evidence) {
    return { evidence: null, verification: null };
  }
  await assertEvidenceAccess(evidence, authUser);
  return {
    evidence,
    verification: await buildEvidenceVerification(evidence),
  };
}

export async function syncConsultationEvidence(
  record: ConsultationRecord,
): Promise<EvidenceRecord> {
  const evidence = await ensureEvidencePlaceholder({
    targetType: "CONSULTATION",
    targetId: record.id,
    summary: "咨询记录哈希存证",
  });

  try {
    const chainResult = await recordConsultationEvidenceOnChain(record);
    if (!chainResult) {
      return evidence;
    }
    return updateEvidenceRecordSync(evidence.id, {
      status: "RECORDED",
      recordHash: chainResult.recordHash,
      txHash: chainResult.txHash,
      blockNumber: chainResult.blockNumber,
      chainId: chainResult.chainId,
      contractAddress: chainResult.contractAddress,
      revision: chainResult.revision,
      recordedAt: chainResult.recordedAt,
      syncError: null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 1000) : "咨询记录上链失败";
    return updateEvidenceRecordSync(evidence.id, {
      status: "PENDING",
      syncError: message,
    });
  }
}

export async function syncAssessmentEvidence(
  record: AssessmentResultRecord,
): Promise<EvidenceRecord> {
  const evidence = await ensureEvidencePlaceholder({
    targetType: "ASSESSMENT",
    targetId: record.id,
    summary: "心理测评结果哈希存证",
  });

  try {
    const chainResult = await recordAssessmentEvidenceOnChain(record);
    if (!chainResult) {
      return evidence;
    }
    return updateEvidenceRecordSync(evidence.id, {
      status: "RECORDED",
      recordHash: chainResult.recordHash,
      txHash: chainResult.txHash,
      blockNumber: chainResult.blockNumber,
      chainId: chainResult.chainId,
      contractAddress: chainResult.contractAddress,
      revision: chainResult.revision,
      recordedAt: chainResult.recordedAt,
      syncError: null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 1000) : "心理测评上链失败";
    return updateEvidenceRecordSync(evidence.id, {
      status: "PENDING",
      syncError: message,
    });
  }
}

export async function confirmConsultationEvidence(
  record: ConsultationRecord,
  txHash: string,
): Promise<EvidenceRecord> {
  const evidence = await ensureEvidencePlaceholder({
    targetType: "CONSULTATION",
    targetId: record.id,
    summary: "consultation record hash evidence",
  });

  const contractConfig = await getConsultationEvidenceContractConfig();
  if (!contractConfig) {
    return updateEvidenceRecordSync(evidence.id, {
      status: "PENDING",
      syncError: "Consultation evidence contract is not configured",
    });
  }

  const localRecordHash = hashConsultationRecord(record);

  try {
    const [chainEvidence, receipt] = await Promise.all([
      getLatestConsultationEvidenceOnChain(record.id),
      getChainTransactionReceipt(txHash),
    ]);

    if (!chainEvidence) {
      return updateEvidenceRecordSync(evidence.id, {
        status: "PENDING",
        txHash,
        syncError: "No consultation evidence record was found on chain",
      });
    }

    const isMatched =
      chainEvidence.appointmentId === record.appointmentId &&
      chainEvidence.recordHash === localRecordHash;

    if (!isMatched) {
      return updateEvidenceRecordSync(evidence.id, {
        status: "PENDING",
        txHash,
        syncError: "On-chain consultation evidence does not match the current record",
      });
    }

    return updateEvidenceRecordSync(evidence.id, {
      status: "RECORDED",
      recordHash: chainEvidence.recordHash,
      txHash,
      blockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : null,
      chainId: contractConfig.chainId,
      contractAddress: contractConfig.contractAddress,
      revision: chainEvidence.revision,
      recordedAt: chainEvidence.recordedAt,
      syncError: null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 1000) : "Consultation evidence confirm failed";
    return updateEvidenceRecordSync(evidence.id, {
      status: "PENDING",
      txHash,
      syncError: message,
    });
  }
}

export async function confirmAssessmentEvidence(
  record: AssessmentResultRecord,
  txHash: string,
): Promise<EvidenceRecord> {
  const evidence = await ensureEvidencePlaceholder({
    targetType: "ASSESSMENT",
    targetId: record.id,
    summary: "心理测评结果哈希存证",
  });

  const contractConfig = await getAssessmentEvidenceContractConfig();
  if (!contractConfig) {
    return updateEvidenceRecordSync(evidence.id, {
      status: "PENDING",
      syncError: "测评存证合约未配置，无法确认链上交易",
    });
  }

  const localRecordHash = hashAssessmentRecord(record);

  try {
    const [chainEvidence, receipt] = await Promise.all([
      getLatestAssessmentEvidenceOnChain(record.id),
      getChainTransactionReceipt(txHash),
    ]);

    if (!chainEvidence) {
      return updateEvidenceRecordSync(evidence.id, {
        status: "PENDING",
        txHash,
        syncError: "链上未找到该测评的最新存证记录",
      });
    }

    const isMatched =
      chainEvidence.assessmentType === record.type &&
      chainEvidence.recordHash === localRecordHash;

    if (!isMatched) {
      return updateEvidenceRecordSync(evidence.id, {
        status: "PENDING",
        txHash,
        syncError: "链上测评存证与当前测评结果不一致",
      });
    }

    return updateEvidenceRecordSync(evidence.id, {
      status: "RECORDED",
      recordHash: chainEvidence.recordHash,
      txHash,
      blockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : null,
      chainId: contractConfig.chainId,
      contractAddress: contractConfig.contractAddress,
      revision: chainEvidence.revision,
      recordedAt: chainEvidence.recordedAt,
      syncError: null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 1000) : "测评链上确认失败";
    return updateEvidenceRecordSync(evidence.id, {
      status: "PENDING",
      txHash,
      syncError: message,
    });
  }
}
