import crypto from "crypto";
import {
  createEmailVerification,
  findValidEmailVerification,
  markEmailVerificationUsed,
  type EmailVerificationPurpose,
} from "../repositories/emailVerificationRepository";
import { BadRequestError } from "../utils/errors";
import { notifyEmail } from "./notificationService";

const EMAIL_VERIFICATION_EXPIRE_MINUTES = 10;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function sendEmailVerificationCode(input: {
  email: string;
  userId?: string | null;
  purpose: EmailVerificationPurpose;
  label: string;
  smtpAuthCode: string;
}): Promise<{ code: string; expiresAt: Date }> {
  const code = generateCode();
  const tokenHash = hashToken(code);
  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_EXPIRE_MINUTES * 60 * 1000,
  );
  await createEmailVerification({
    userId: input.userId ?? null,
    email: input.email,
    tokenHash,
    purpose: input.purpose,
    expiresAt,
  });
  await notifyEmail(
    input.userId ?? null,
    input.email,
    `${input.label}验证码`,
    `你的${input.label}验证码：${code}（${EMAIL_VERIFICATION_EXPIRE_MINUTES} 分钟内有效）`,
    {
      throwOnFailure: true,
      smtp: {
        user: input.email,
        pass: input.smtpAuthCode,
        from: input.email,
      },
    },
  );
  return { code, expiresAt };
}

export async function validateEmailVerificationCode(
  email: string,
  code: string,
  purpose: EmailVerificationPurpose,
) {
  const tokenHash = hashToken(code);
  const record = await findValidEmailVerification(
    email,
    tokenHash,
    purpose,
  );
  if (!record) {
    throw new BadRequestError("验证码无效或已过期");
  }
  return record;
}

export async function consumeEmailVerificationCode(id: string) {
  await markEmailVerificationUsed(id);
}
