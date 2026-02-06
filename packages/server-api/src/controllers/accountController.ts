import type { Context } from "koa";
import {
  profileUpdateSchema,
  passwordChangeSchema,
  passwordChangeRequestSchema,
  avatarUploadSchema,
} from "../schemas/accountSchema";
import {
  changePassword,
  getProfile,
  requestPasswordChangeVerification,
  updateAvatar,
  updateProfile,
} from "../services/profileService";
import { BadRequestError } from "../utils/errors";

/**
 * 将空字符串转换为 null，保留 undefined 以避免覆盖未提交字段。
 */
function normalizeOptionalText(value?: string) {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * 读取当前登录用户资料，并返回脱敏后的视图对象。
 */
export async function getAccountProfile(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const profile = await getProfile(authUser.sub);
  ctx.status = 200;
  ctx.body = { profile };
}

/**
 * 支持部分更新用户资料，客户端只需提交需要修改的字段。
 */
export async function patchAccountProfile(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const parsed = profileUpdateSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("资料更新信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const payload = {
    nickname: normalizeOptionalText(parsed.data.nickname),
    gender: normalizeOptionalText(parsed.data.gender),
    major: normalizeOptionalText(parsed.data.major),
    grade: normalizeOptionalText(parsed.data.grade),
    avatarUrl: normalizeOptionalText(parsed.data.avatarUrl),
  };
  const profile = await updateProfile(authUser.sub, payload);
  ctx.status = 200;
  ctx.body = { profile };
}

/**
 * 修改当前用户密码，使用验证码确认身份。
 */
export async function patchAccountPassword(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const parsed = passwordChangeSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("密码更新信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  await changePassword(authUser.sub, parsed.data);
  ctx.status = 200;
  ctx.body = { message: "密码修改成功" };
}

/**
 * 发送当前用户密码修改验证码。
 */
export async function requestAccountPasswordVerification(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const parsed = passwordChangeRequestSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("验证码请求信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await requestPasswordChangeVerification(
    authUser.sub,
    parsed.data.smtpAuthCode,
  );
  ctx.status = 200;
  ctx.body = result;
}

/**
 * 上传头像并返回更新后的资料。
 */
export async function uploadAccountAvatar(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const parsed = avatarUploadSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("头像数据不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const profile = await updateAvatar(authUser.sub, parsed.data.dataUrl);
  ctx.status = 200;
  ctx.body = { profile };
}
