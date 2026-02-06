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

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置");
}

if (!jwtSecret) {
  throw new Error("JWT_SECRET 未配置");
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
};
