import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginInput, RegisterInput } from "../schemas/authSchema";
import {
  createUser,
  findUserByEmail,
  findUserByIdentityCode,
  type UserRecord,
} from "../repositories/userRepository";
import { findAllowedIdentity } from "../repositories/identityWhitelistRepository";
import { env } from "../config/env";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../utils/errors";

const SALT_ROUNDS = 10;

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
export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError("账号或密码错误");
  }
  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("账号或密码错误");
  }
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
 * JWT 验证工具，供未来的鉴权中间件复用。
 */
export async function verifyToken(token?: string) {
  if (!token) {
    throw new UnauthorizedError();
  }
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new UnauthorizedError("Token 无效或已过期");
  }
}
