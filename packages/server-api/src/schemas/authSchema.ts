import { z } from "zod";

/**
 * 统一 QQ 邮箱校验规则，后续如果需要支持学校邮箱，只需调整这里。
 */
const qqEmail = z
  .string()
  .email("邮箱格式不正确")
  .regex(/@qq\.com$/i, "仅支持 QQ 邮箱");

export const registerSchema = z.object({
  email: qqEmail,
  password: z.string().min(8, "密码至少 8 位"),
  verificationCode: z
    .string()
    .regex(/^\d{6}$/, "验证码应为 6 位数字"),
  nickname: z.string().min(2).max(50).optional(),
  identityCode: z
    .string()
    .min(4, "学号/工号至少 4 位")
    .max(18, "学号/工号不能超过 18 位")
    .regex(/^[A-Za-z0-9-]+$/, "学号/工号仅支持字母、数字与 -"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * 注册验证码申请。
 */
export const registerRequestSchema = z.object({
  email: qqEmail,
  smtpAuthCode: z
    .string()
    .min(6, "授权码不能为空")
    .max(64, "授权码长度不合法"),
});

export type RegisterRequestInput = z.infer<typeof registerRequestSchema>;

export const loginSchema = z.object({
  email: qqEmail,
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * 密码重置申请：仅需邮箱即可触发重置流程。
 */
export const passwordResetRequestSchema = z.object({
  email: qqEmail,
  smtpAuthCode: z
    .string()
    .min(6, "授权码不能为空")
    .max(64, "授权码长度不合法"),
});

export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;

/**
 * 密码重置确认：需提交验证码/令牌与新密码。
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(6, "重置验证码不能为空"),
  newPassword: z.string().min(8, "新密码至少 8 位"),
});

export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
