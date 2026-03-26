import {
  AbiCoder,
  Contract,
  JsonRpcProvider,
  Wallet,
  TransactionReceipt,
  getBytes,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import { env } from "../config/env";
import type {
  AssessmentResultRecord,
  AssessmentType,
} from "../repositories/assessmentRepository";
import type { ConsultationRecord } from "../repositories/consultationRepository";

const CONSULTATION_EVIDENCE_ABI = [
  "function recordConsultation(string consultationId,string appointmentId,bytes32 recordHash) returns (uint256 revision)",
  "function recordConsultationWithSignature(string consultationId,string appointmentId,bytes32 recordHash,bytes ownerSignature) returns (uint256 revision)",
  "function getLatestConsultationEvidence(string consultationId) view returns (string appointmentId, bytes32 recordHash, uint256 revision, uint256 recordedAt, address operator)",
] as const;

const ASSESSMENT_EVIDENCE_ABI = [
  "function recordAssessment(bytes32 assessmentKey,uint8 assessmentType,bytes32 recordHash) returns (uint256 revision)",
  "function recordAssessmentWithSignature(bytes32 assessmentKey,uint8 assessmentType,bytes32 recordHash,bytes ownerSignature) returns (uint256 revision)",
  "function getLatestAssessmentEvidence(bytes32 assessmentKey) view returns (uint8 assessmentType, bytes32 recordHash, uint256 revision, uint256 recordedAt, address operator)",
] as const;

const ASSESSMENT_AUTHORIZATION_ACTION = "ASSESSMENT_RECORD";
const CONSULTATION_AUTHORIZATION_ACTION = "CONSULTATION_RECORD";
const abiCoder = AbiCoder.defaultAbiCoder();

type ChainResult = {
  recordHash: string;
  txHash: string;
  blockNumber: number | null;
  chainId: number;
  contractAddress: string;
  revision: number | null;
  recordedAt: Date;
};

export type ConsultationChainEvidence = {
  appointmentId: string;
  recordHash: string;
  revision: number | null;
  recordedAt: Date | null;
  operator: string | null;
};

export type AssessmentChainEvidence = {
  assessmentType: AssessmentType;
  recordHash: string;
  revision: number | null;
  recordedAt: Date | null;
  operator: string | null;
};

type ContractReceipt = { blockNumber?: number | null };
type ContractTx = { hash: string; wait: () => Promise<ContractReceipt> };

type ConsultationContractResult = {
  appointmentId: string;
  recordHash: string;
  revision: bigint | number | null | undefined;
  recordedAt: bigint | number | null | undefined;
  operator: string;
};

type AssessmentContractResult = {
  assessmentType: bigint | number;
  recordHash: string;
  revision: bigint | number | null | undefined;
  recordedAt: bigint | number | null | undefined;
  operator: string;
};

type ConsultationEvidenceContract = Contract & {
  recordConsultation: (
    consultationId: string,
    appointmentId: string,
    recordHash: string,
  ) => Promise<ContractTx>;
  getLatestConsultationEvidence: (
    consultationId: string,
  ) => Promise<ConsultationContractResult>;
};

type AssessmentEvidenceContract = Contract & {
  recordAssessment: (
    assessmentKey: string,
    assessmentType: number,
    recordHash: string,
  ) => Promise<ContractTx>;
  getLatestAssessmentEvidence: (
    assessmentKey: string,
  ) => Promise<AssessmentContractResult>;
};

const ASSESSMENT_TYPE_CODE_MAP: Record<AssessmentType, number> = {
  MOOD: 0,
  ANXIETY: 1,
  STRESS: 2,
  SLEEP: 3,
  SOCIAL: 4,
};

const ASSESSMENT_CODE_TYPE_MAP: Record<number, AssessmentType> = {
  0: "MOOD",
  1: "ANXIETY",
  2: "STRESS",
  3: "SLEEP",
  4: "SOCIAL",
};

function buildProvider() {
  return new JsonRpcProvider(env.chainRpcUrl);
}

function buildWallet() {
  return new Wallet(env.chainPrivateKey!, buildProvider());
}

async function resolveChainId() {
  if (env.chainId !== undefined) {
    return env.chainId;
  }
  if (!env.chainRpcUrl) {
    return null;
  }
  const network = await buildProvider().getNetwork();
  return Number(network.chainId);
}

export async function getAssessmentEvidenceContractConfig() {
  if (!isAssessmentEvidenceConfigured()) {
    return null;
  }
  return {
    contractAddress: env.assessmentEvidenceContractAddress!,
    chainId: await resolveChainId(),
  };
}

export async function getConsultationEvidenceContractConfig() {
  if (!isConsultationEvidenceConfigured()) {
    return null;
  }
  return {
    contractAddress: env.consultationEvidenceContractAddress!,
    chainId: await resolveChainId(),
  };
}

function isConsultationEvidenceConfigured() {
  return Boolean(
    env.chainRpcUrl &&
      env.chainPrivateKey &&
      env.consultationEvidenceContractAddress,
  );
}

function isAssessmentEvidenceConfigured() {
  return Boolean(
    env.chainRpcUrl &&
      env.chainPrivateKey &&
      env.assessmentEvidenceContractAddress,
  );
}

function normalizeNumber(value: bigint | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}

function normalizeRecordedAt(value: bigint | number | null | undefined) {
  const timestamp = normalizeNumber(value);
  if (timestamp === null) {
    return null;
  }
  return new Date(timestamp * 1000);
}

function mapConsultationChainEvidence(
  value: ConsultationContractResult,
): ConsultationChainEvidence {
  return {
    appointmentId: value.appointmentId,
    recordHash: value.recordHash,
    revision: normalizeNumber(value.revision),
    recordedAt: normalizeRecordedAt(value.recordedAt),
    operator: value.operator ?? null,
  };
}

function mapAssessmentChainEvidence(
  value: AssessmentContractResult,
): AssessmentChainEvidence {
  const assessmentTypeCode = normalizeNumber(value.assessmentType);
  if (
    assessmentTypeCode === null ||
    ASSESSMENT_CODE_TYPE_MAP[assessmentTypeCode] === undefined
  ) {
    throw new Error("assessmentType code is invalid");
  }
  return {
    assessmentType: ASSESSMENT_CODE_TYPE_MAP[assessmentTypeCode],
    recordHash: value.recordHash,
    revision: normalizeNumber(value.revision),
    recordedAt: normalizeRecordedAt(value.recordedAt),
    operator: value.operator ?? null,
  };
}

function buildCanonicalConsultationPayload(record: ConsultationRecord) {
  return {
    consultationId: record.id,
    appointmentId: record.appointmentId,
    userId: record.userId,
    counselorId: record.counselorId,
    summary: record.summary ?? "",
    counselorFeedback: record.counselorFeedback ?? "",
    homework: record.homework ?? "",
    followUpPlan: record.followUpPlan ?? "",
    assessmentSummary: record.assessmentSummary ?? "",
    issueCategory: record.issueCategory ?? "",
    isCrisis: record.isCrisis,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildCanonicalAssessmentPayload(record: AssessmentResultRecord) {
  return {
    assessmentId: record.id,
    userId: record.userId,
    type: record.type,
    score: record.score,
    level: record.level,
    answers: JSON.parse(record.answers) as number[],
    createdAt: record.createdAt.toISOString(),
  };
}

export function hashConsultationRecord(record: ConsultationRecord) {
  const payload = JSON.stringify(buildCanonicalConsultationPayload(record));
  return keccak256(toUtf8Bytes(payload));
}

export function hashAssessmentRecord(record: AssessmentResultRecord) {
  const payload = JSON.stringify(buildCanonicalAssessmentPayload(record));
  return keccak256(toUtf8Bytes(payload));
}

export function encodeAssessmentChainKey(assessmentId: string) {
  return keccak256(toUtf8Bytes(assessmentId));
}

export function getAssessmentTypeCode(type: AssessmentType) {
  return ASSESSMENT_TYPE_CODE_MAP[type];
}

export function getAssessmentAuthorizationHash(input: {
  assessmentKey: string;
  assessmentTypeCode: number;
  recordHash: string;
  contractAddress: string;
  chainId: number;
}) {
  return keccak256(
    abiCoder.encode(
      ["address", "uint256", "string", "bytes32", "uint8", "bytes32"],
      [
        input.contractAddress,
        input.chainId,
        ASSESSMENT_AUTHORIZATION_ACTION,
        input.assessmentKey,
        input.assessmentTypeCode,
        input.recordHash,
      ],
    ),
  );
}

export function getConsultationAuthorizationHash(input: {
  consultationId: string;
  appointmentId: string;
  recordHash: string;
  contractAddress: string;
  chainId: number;
}) {
  return keccak256(
    abiCoder.encode(
      ["address", "uint256", "string", "string", "string", "bytes32"],
      [
        input.contractAddress,
        input.chainId,
        CONSULTATION_AUTHORIZATION_ACTION,
        input.consultationId,
        input.appointmentId,
        input.recordHash,
      ],
    ),
  );
}

export async function signAssessmentChainAuthorization(input: {
  assessmentKey: string;
  assessmentTypeCode: number;
  recordHash: string;
}) {
  const contractConfig = await getAssessmentEvidenceContractConfig();
  if (!contractConfig?.contractAddress || contractConfig.chainId === null) {
    return null;
  }

  const wallet = buildWallet();
  const authorizationHash = getAssessmentAuthorizationHash({
    ...input,
    contractAddress: contractConfig.contractAddress,
    chainId: contractConfig.chainId,
  });

  return wallet.signMessage(getBytes(authorizationHash));
}

export async function signConsultationChainAuthorization(input: {
  consultationId: string;
  appointmentId: string;
  recordHash: string;
}) {
  const contractConfig = await getConsultationEvidenceContractConfig();
  if (!contractConfig?.contractAddress || contractConfig.chainId === null) {
    return null;
  }

  const wallet = buildWallet();
  const authorizationHash = getConsultationAuthorizationHash({
    ...input,
    contractAddress: contractConfig.contractAddress,
    chainId: contractConfig.chainId,
  });

  return wallet.signMessage(getBytes(authorizationHash));
}

export async function getLatestConsultationEvidenceOnChain(
  consultationId: string,
): Promise<ConsultationChainEvidence | null> {
  if (!isConsultationEvidenceConfigured()) {
    return null;
  }

  const wallet = buildWallet();
  const contract = new Contract(
    env.consultationEvidenceContractAddress!,
    CONSULTATION_EVIDENCE_ABI,
    wallet,
  ) as ConsultationEvidenceContract;
  const latestEvidence = await contract.getLatestConsultationEvidence(
    consultationId,
  );
  return mapConsultationChainEvidence(latestEvidence);
}

export async function getLatestAssessmentEvidenceOnChain(
  assessmentId: string,
): Promise<AssessmentChainEvidence | null> {
  if (!isAssessmentEvidenceConfigured()) {
    return null;
  }

  const wallet = buildWallet();
  const contract = new Contract(
    env.assessmentEvidenceContractAddress!,
    ASSESSMENT_EVIDENCE_ABI,
    wallet,
  ) as AssessmentEvidenceContract;
  const latestEvidence = await contract.getLatestAssessmentEvidence(
    encodeAssessmentChainKey(assessmentId),
  );
  return mapAssessmentChainEvidence(latestEvidence);
}

export async function recordConsultationEvidenceOnChain(
  record: ConsultationRecord,
): Promise<ChainResult | null> {
  if (!isConsultationEvidenceConfigured()) {
    return null;
  }

  const wallet = buildWallet();
  const contract = new Contract(
    env.consultationEvidenceContractAddress!,
    CONSULTATION_EVIDENCE_ABI,
    wallet,
  ) as ConsultationEvidenceContract;

  const recordHash = hashConsultationRecord(record);
  const tx = await contract.recordConsultation(
    record.id,
    record.appointmentId,
    recordHash,
  );
  const receipt = await tx.wait();
  const latestEvidence = await getLatestConsultationEvidenceOnChain(record.id);
  const network = await wallet.provider!.getNetwork();

  return {
    recordHash,
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
    chainId: Number(network.chainId),
    contractAddress: await contract.getAddress(),
    revision: latestEvidence?.revision ?? null,
    recordedAt: latestEvidence?.recordedAt ?? new Date(),
  };
}

export async function recordAssessmentEvidenceOnChain(
  record: AssessmentResultRecord,
): Promise<ChainResult | null> {
  if (!isAssessmentEvidenceConfigured()) {
    return null;
  }

  const wallet = buildWallet();
  const contract = new Contract(
    env.assessmentEvidenceContractAddress!,
    ASSESSMENT_EVIDENCE_ABI,
    wallet,
  ) as AssessmentEvidenceContract;

  const recordHash = hashAssessmentRecord(record);
  const tx = await contract.recordAssessment(
    encodeAssessmentChainKey(record.id),
    getAssessmentTypeCode(record.type),
    recordHash,
  );
  const receipt = await tx.wait();
  const latestEvidence = await getLatestAssessmentEvidenceOnChain(record.id);
  const network = await wallet.provider!.getNetwork();

  return {
    recordHash,
    txHash: tx.hash,
    blockNumber: receipt?.blockNumber ?? null,
    chainId: Number(network.chainId),
    contractAddress: await contract.getAddress(),
    revision: latestEvidence?.revision ?? null,
    recordedAt: latestEvidence?.recordedAt ?? new Date(),
  };
}

export async function getChainTransactionReceipt(
  txHash: string,
): Promise<TransactionReceipt | null> {
  if (!env.chainRpcUrl) {
    return null;
  }
  const provider = buildProvider();
  return provider.getTransactionReceipt(txHash);
}
