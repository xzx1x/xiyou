import nodemailer from "nodemailer";
import { env } from "../config/env";

export type SmtpOverride = {
  user: string;
  pass: string;
  from?: string;
  fromName?: string;
};

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  smtp?: SmtpOverride;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter(smtp?: SmtpOverride) {
  if (smtp) {
    if (!smtp.user || !smtp.pass) {
      throw new Error("SMTP 授权码未提供");
    }
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
  }
  if (!env.smtpUser || !env.smtpPass) {
    throw new Error("QQ SMTP 未配置");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return transporter;
}

function resolveFromAddress(smtp?: SmtpOverride) {
  const fromAddress = smtp?.from ?? smtp?.user ?? env.smtpFrom;
  if (!fromAddress) {
    throw new Error("SMTP 发件人未配置");
  }
  const fromName = smtp?.fromName ?? env.smtpFromName;
  if (fromName) {
    return `${fromName} <${fromAddress}>`;
  }
  return fromAddress;
}

/**
 * 发送邮件（QQ SMTP）。
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const mailer = getTransporter(input.smtp);
  await mailer.sendMail({
    from: resolveFromAddress(input.smtp),
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
}
