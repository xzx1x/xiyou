import type { Context } from "koa";
import {
  adminAnnouncementSchema,
  adminResetPasswordSchema,
  adminUserRoleSchema,
  adminUserStatusSchema,
} from "../schemas/adminSchema";
import {
  getUserList,
  publishAnnouncementByAdmin,
  resetUserPasswordByAdmin,
  updateUserRoleByAdmin,
  updateUserStatusByAdmin,
} from "../services/adminService";
import { BadRequestError } from "../utils/errors";

/**
 * 管理员查询用户列表。
 */
export async function listUsers(ctx: Context) {
  // 用户检索关键词，用于模糊搜索邮箱或学号。
  const keyword = typeof ctx.query.keyword === "string" ? ctx.query.keyword : undefined;
  const users = await getUserList(keyword);
  ctx.status = 200;
  ctx.body = { users };
}

/**
 * 管理员更新用户角色。
 */
export async function updateUserRole(ctx: Context) {
  const userId = ctx.params.id;
  if (!userId) {
    throw new BadRequestError("用户编号不能为空");
  }
  const parsed = adminUserRoleSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("角色信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  await updateUserRoleByAdmin(userId, parsed.data.role);
  ctx.status = 200;
  ctx.body = { message: "角色更新成功" };
}

/**
 * 管理员更新用户启用状态。
 */
export async function updateUserStatus(ctx: Context) {
  const userId = ctx.params.id;
  if (!userId) {
    throw new BadRequestError("用户编号不能为空");
  }
  const parsed = adminUserStatusSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("状态信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  await updateUserStatusByAdmin(userId, parsed.data);
  ctx.status = 200;
  ctx.body = { message: "状态更新成功" };
}

/**
 * 管理员重置用户密码。
 */
export async function resetUserPassword(ctx: Context) {
  const userId = ctx.params.id;
  if (!userId) {
    throw new BadRequestError("用户编号不能为空");
  }
  const parsed = adminResetPasswordSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("密码信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  await resetUserPasswordByAdmin(userId, parsed.data.newPassword);
  ctx.status = 200;
  ctx.body = { message: "密码已重置" };
}

/**
 * 管理员发布公告（发送系统消息给当前所有账号）。
 */
export async function publishAnnouncement(ctx: Context) {
  const parsed = adminAnnouncementSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("公告内容不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const sent = await publishAnnouncementByAdmin(parsed.data);
  ctx.status = 200;
  ctx.body = { message: "公告已发送", sent };
}
