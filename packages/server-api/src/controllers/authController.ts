import type { Context } from "koa";
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  registerSchema,
  registerRequestSchema,
} from "../schemas/authSchema";
import {
  confirmPasswordReset,
  loginUser,
  registerUser,
  requestRegisterVerification,
  requestPasswordReset,
} from "../services/authService";
import { BadRequestError } from "../utils/errors";

export async function register(ctx: Context) {
  const parsed = registerSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("注册信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const user = await registerUser(parsed.data);
  ctx.status = 201;
  ctx.body = { user };
}

/**
 * 发送注册验证码。
 */
export async function requestRegisterCode(ctx: Context) {
  const parsed = registerRequestSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("注册验证码请求不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await requestRegisterVerification(
    parsed.data.email,
    parsed.data.smtpAuthCode,
  );
  ctx.status = 200;
  ctx.body = result;
}

export async function login(ctx: Context) {
  const parsed = loginSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("登录信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await loginUser(parsed.data);
  ctx.status = 200;
  ctx.body = result;
}

/**
 * 发送密码重置验证码/令牌。
 */
export async function requestResetPassword(ctx: Context) {
  const parsed = passwordResetRequestSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("密码重置请求不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await requestPasswordReset(
    parsed.data.email,
    parsed.data.smtpAuthCode,
  );
  ctx.status = 200;
  ctx.body = result;
}

/**
 * 校验令牌并更新密码。
 */
export async function confirmResetPassword(ctx: Context) {
  const parsed = passwordResetConfirmSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("密码重置信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  await confirmPasswordReset(parsed.data.token, parsed.data.newPassword);
  ctx.status = 200;
  ctx.body = { message: "密码重置成功" };
}
