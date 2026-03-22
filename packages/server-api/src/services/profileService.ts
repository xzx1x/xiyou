import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import {
  findUserByNickname,
  findUserById,
  type UpdateUserProfileInput,
  type UserRecord,
  updateUserPassword,
  updateUserProfile,
} from "../repositories/userRepository";
import { BadRequestError, ConflictError } from "../utils/errors";
import {
  consumeEmailVerificationCode,
  sendEmailVerificationCode,
  validateEmailVerificationCode,
} from "./emailVerificationService";

// 资料更新载荷，允许字段为空或缺省。
export type ProfilePayload = {
  nickname?: string | null;
  gender?: string | null;
  major?: string | null;
  grade?: string | null;
  avatarUrl?: string | null;
};

// 修改密码时的输入结构。
export type PasswordChangePayload = {
  newPassword: string;
  verificationCode: string;
};

// 头像解析后的结构，包含二进制与扩展名。
type AvatarParseResult = {
  buffer: Buffer;
  extension: string;
};

// 密码哈希强度，保持与注册流程一致。
const SALT_ROUNDS = 10;
// 头像允许的最大体积（字节），避免 Base64 过大导致内存压力。
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
// 头像文件保存目录，统一放在 server-api 项目下的 uploads/avatars。
const AVATAR_STORAGE_DIR = resolve(process.cwd(), "uploads", "avatars");
// 允许的 MIME 类型与对应扩展名。
const AVATAR_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * 从数据库用户记录中剔除敏感字段，例如密码。
 */
function toSafeProfile(user: UserRecord) {
  const { password, ...rest } = user;
  return rest;
}

/**
 * 解析 Base64 头像数据，校验格式与大小，返回可落盘的 Buffer。
 */
function parseAvatarDataUrl(dataUrl: string): AvatarParseResult {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new BadRequestError("头像格式不正确，仅支持 PNG/JPEG/WEBP");
  }
  const mimeType = (match[1] ?? "").toLowerCase();
  const base64Payload = match[2] ?? "";
  if (!mimeType || !base64Payload) {
    throw new BadRequestError("头像格式不正确，仅支持 PNG/JPEG/WEBP");
  }
  const buffer = Buffer.from(base64Payload, "base64");
  if (buffer.length === 0) {
    throw new BadRequestError("头像内容为空");
  }
  if (buffer.length > MAX_AVATAR_BYTES) {
    throw new BadRequestError("头像大小不能超过 2MB");
  }
  const extension = AVATAR_MIME_TO_EXT[mimeType];
  if (!extension) {
    throw new BadRequestError("头像格式不正确，仅支持 PNG/JPEG/WEBP");
  }
  return { buffer, extension };
}

/**
 * 将头像数据写入磁盘，并返回前端可访问的路径。
 */
async function saveAvatarFile(userId: string, dataUrl: string): Promise<string> {
  const { buffer, extension } = parseAvatarDataUrl(dataUrl);
  await mkdir(AVATAR_STORAGE_DIR, { recursive: true });
  const fileName = `${userId}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = join(AVATAR_STORAGE_DIR, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/avatars/${fileName}`;
}

/**
 * 获取单条用户资料，若不存在则抛出异常。
 */
export async function getProfile(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new BadRequestError("用户不存在");
  }
  return toSafeProfile(user);
}

/**
 * 更新用户资料字段，允许部分提交。
 */
export async function updateProfile(
  userId: string,
  payload: ProfilePayload,
) {
  const normalizedNickname =
    payload.nickname === undefined
      ? undefined
      : payload.nickname === null
        ? null
        : payload.nickname.trim();

  if (normalizedNickname) {
    const existing = await findUserByNickname(normalizedNickname);
    if (existing && existing.id !== userId) {
      throw new ConflictError("昵称已被占用");
    }
  }

  // 转换为仓储层允许的结构，避免直接透传不必要字段。
  const normalized: UpdateUserProfileInput = {
    nickname: normalizedNickname === "" ? null : normalizedNickname,
    gender: payload.gender,
    major: payload.major,
    grade: payload.grade,
    avatarUrl: payload.avatarUrl,
  };
  const user = await updateUserProfile(userId, normalized);
  return toSafeProfile(user);
}

/**
 * 更新头像：保存文件并回写头像 URL。
 */
export async function updateAvatar(userId: string, dataUrl: string) {
  const avatarUrl = await saveAvatarFile(userId, dataUrl);
  const user = await updateUserProfile(userId, { avatarUrl });
  return toSafeProfile(user);
}

/**
 * 修改密码：校验验证码后写入新密码哈希。
 */
export async function changePassword(
  userId: string,
  payload: PasswordChangePayload,
) {
  const user = await findUserById(userId);
  if (!user) {
    throw new BadRequestError("用户不存在");
  }
  const isSamePassword = await bcrypt.compare(
    payload.newPassword,
    user.password,
  );
  if (isSamePassword) {
    throw new BadRequestError("新密码不能与当前密码相同");
  }
  const verification = await validateEmailVerificationCode(
    user.email,
    payload.verificationCode,
    "PASSWORD_CHANGE",
  );
  const hashed = await bcrypt.hash(payload.newPassword, SALT_ROUNDS);
  await updateUserPassword(userId, hashed);
  await consumeEmailVerificationCode(verification.id);
}

/**
 * 发送密码修改验证码。
 */
export async function requestPasswordChangeVerification(
  userId: string,
  smtpAuthCode: string,
) {
  const user = await findUserById(userId);
  if (!user) {
    throw new BadRequestError("用户不存在");
  }
  const { code } = await sendEmailVerificationCode({
    email: user.email,
    userId,
    purpose: "PASSWORD_CHANGE",
    label: "密码修改",
    smtpAuthCode,
  });
  return {
    message: "验证码已发送",
    verificationCode:
      process.env.NODE_ENV === "production" ? undefined : code,
  };
}
