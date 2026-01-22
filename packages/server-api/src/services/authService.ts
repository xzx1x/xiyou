import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { LoginInput, RegisterInput } from "../schemas/authSchema";
import {
  createUser,
  findUserByEmail,
  findUserByIdentityCode,
  type UserRecord,
  type UserRole,
  updateUserLastLogin,
  updateUserPassword,
} from "../repositories/userRepository";
import { findAllowedIdentity } from "../repositories/identityWhitelistRepository";
import { env } from "../config/env";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../utils/errors";
import {
  createPasswordReset,
  findValidPasswordReset,
  markPasswordResetUsed,
} from "../repositories/passwordResetRepository";
import { notifyEmail, notifyInApp } from "./notificationService";

const SALT_ROUNDS = 10;
// 密码重置 Token 过期时间（分钟）。
const RESET_TOKEN_EXPIRE_MINUTES = 30;

/**
 * 从用户对象中移除加密后的密码，避免泄漏到响应体。
 */
function toSafeUser(user: UserRecord) {
  const { password, ...rest } = user;
  return rest;
}

/**
 * 注册流程：
 * 1. 校验邮箱是否唯一
 * 2. 校验学号/工号是否在白名单、是否被占用（白名单默认只开放普通用户与管理员，心理师必须后续申请）
 * 3. 哈希密码并写入数据库
 */
export async function registerUser(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError("邮箱已注册");
  }
  const normalizedIdentity = input.identityCode.trim();
  if (!normalizedIdentity) {
    throw new BadRequestError("学号/工号不能为空");
  }
  const allowedIdentity = await findAllowedIdentity(normalizedIdentity);
  if (!allowedIdentity) {
    throw new BadRequestError("当前学号/工号不存在或尚未开放注册");
  }
  if (allowedIdentity.defaultRole === "COUNSELOR") {
    throw new BadRequestError("心理咨询师身份需申请审核，暂不支持直接注册");
  }
  const identityOwner = await findUserByIdentityCode(normalizedIdentity);
  if (identityOwner) {
    throw new ConflictError("账号已存在，该学号/工号与邮箱已绑定");
  }
  const normalizedForStore = normalizedIdentity.toUpperCase();
  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await createUser({
    email: input.email,
    password: hashed,
    nickname: input.nickname,
    identityCode: normalizedForStore,
    role: allowedIdentity.defaultRole,
  });
  return toSafeUser(user);
}

/**
 * 登录流程：按邮箱取出用户，核对密码后签发 JWT。
 * Token 目前包含 `sub` 和 `role`，前端可据此切换界面。
 */
export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError("账号或密码错误");
  }
  if (user.isDisabled) {
    throw new UnauthorizedError("账号已被禁用");
  }
  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("账号或密码错误");
  }
  await updateUserLastLogin(user.id);
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: "2h" },
  );
  return {
    token,
    user: toSafeUser(user),
  };
}

/**
 * 发起密码重置：生成 Token 并写入重置记录与通知。
 */
export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    return {
      message: "如果账号存在，我们已发送重置指引。",
    };
  }
  if (user.isDisabled) {
    throw new UnauthorizedError("账号已被禁用");
  }
  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRE_MINUTES * 60 * 1000,
  );
  await createPasswordReset(user.id, tokenHash, expiresAt);
  await notifyInApp(
    user.id,
    "密码重置请求",
    "我们已收到你的密码重置请求，请尽快完成验证。",
    "/reset-password",
  );
  await notifyEmail(
    user.id,
    user.email,
    "密码重置请求",
    `你的密码重置验证码：${rawToken}（${RESET_TOKEN_EXPIRE_MINUTES} 分钟内有效）`,
  );
  return {
    message: "如果账号存在，我们已发送重置指引。",
    resetToken:
      process.env.NODE_ENV === "production" ? undefined : rawToken,
  };
}

/**
 * 确认密码重置：校验 Token 并更新密码。
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string,
) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const reset = await findValidPasswordReset(tokenHash);
  if (!reset) {
    throw new BadRequestError("重置凭证无效或已过期");
  }
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await updateUserPassword(reset.userId, hashed);
  await markPasswordResetUsed(reset.id);
}

/**
 * JWT 验证工具，供未来的鉴权中间件复用。
 */
export async function verifyToken(token?: string) {
  if (!token) {
    throw new UnauthorizedError();
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string"
    ) {
      throw new UnauthorizedError("Token 无效或已过期");
    }
    return {
      sub: payload.sub,
      role: payload.role as UserRole,
      iat: typeof payload.iat === "number" ? payload.iat : 0,
      exp: typeof payload.exp === "number" ? payload.exp : 0,
    };
  } catch {
    throw new UnauthorizedError("Token 无效或已过期");
  }
}
