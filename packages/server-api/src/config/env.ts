import { config } from "dotenv";

config();

const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const port = Number(process.env.PORT ?? 3001);
const smtpHost = process.env.QQ_SMTP_HOST ?? "smtp.qq.com";
const smtpPort = Number(process.env.QQ_SMTP_PORT ?? 465);
const smtpSecure = process.env.QQ_SMTP_SECURE
  ? process.env.QQ_SMTP_SECURE === "true"
  : smtpPort === 465;
const smtpUser = process.env.QQ_SMTP_USER;
const smtpPass = process.env.QQ_SMTP_PASS;
const smtpFrom = process.env.QQ_SMTP_FROM ?? smtpUser;
const smtpFromName = process.env.QQ_SMTP_FROM_NAME ?? "校园心理咨询平台";
const chainRpcUrl = process.env.CHAIN_RPC_URL;
const chainPrivateKey = process.env.CHAIN_PRIVATE_KEY;
const chainId = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : undefined;
const consultationEvidenceContractAddress =
  process.env.CONSULTATION_EVIDENCE_CONTRACT_ADDRESS;
const assessmentEvidenceContractAddress =
  process.env.ASSESSMENT_EVIDENCE_CONTRACT_ADDRESS;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置");
}

if (!jwtSecret) {
  throw new Error("JWT_SECRET 未配置");
}

if (chainId !== undefined && Number.isNaN(chainId)) {
  throw new Error("CHAIN_ID 格式不正确");
}

export const env = {
  databaseUrl,
  jwtSecret,
  port,
  smtpHost,
  smtpPort,
  smtpSecure,
  smtpUser,
  smtpPass,
  smtpFrom,
  smtpFromName,
  chainRpcUrl,
  chainPrivateKey,
  chainId,
  consultationEvidenceContractAddress,
  assessmentEvidenceContractAddress,
};
