import bcrypt from "bcryptjs";
import {
  findUserById,
  listUsers,
  updateUserPassword,
  updateUserRole,
  updateUserStatus,
  type UserRole,
} from "../repositories/userRepository";
import { BadRequestError } from "../utils/errors";
import { notifyEmail, notifyInApp } from "./notificationService";

// 管理员重置密码时的哈希强度。
const SALT_ROUNDS = 10;

// 管理端更新账号状态的输入结构。
export type UserStatusInput = {
  isDisabled: boolean;
  reason?: string | null;
};

// 管理员发布公告的输入结构。
export type AnnouncementInput = {
  title: string;
  message: string;
};

/**
 * 管理员查询用户列表，支持关键字检索。
 */
export async function getUserList(keyword?: string) {
  return listUsers(keyword);
}

/**
 * 更新用户角色（管理员权限）。
 */
export async function updateUserRoleByAdmin(
  userId: string,
  role: UserRole,
) {
  const user = await findUserById(userId);
  if (!user) {
    throw new BadRequestError("用户不存在");
  }
  await updateUserRole(userId, role);
  await notifyInApp(
    userId,
    "角色更新提醒",
    `你的账号角色已更新为 ${role}。`,
    "/profile",
  );
}

/**
 * 更新用户启用/禁用状态。
 */
export async function updateUserStatusByAdmin(
  userId: string,
  payload: UserStatusInput,
) {
  const user = await findUserById(userId);
  if (!user) {
    throw new BadRequestError("用户不存在");
  }
  await updateUserStatus(userId, payload.isDisabled, payload.reason ?? null);
  // 根据禁用状态生成通知文案。
  const message = payload.isDisabled
    ? "你的账号已被管理员禁用，请联系心理中心。"
    : "你的账号已恢复正常使用。";
  await notifyInApp(userId, "账号状态变更", message, "/profile");
}

/**
 * 管理员重置用户密码，并发送通知。
 */
export async function resetUserPasswordByAdmin(
  userId: string,
  newPassword: string,
) {
  const user = await findUserById(userId);
  if (!user) {
    throw new BadRequestError("用户不存在");
  }
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await updateUserPassword(userId, hashed);
  await notifyInApp(
    userId,
    "密码已重置",
    "管理员已为你重置密码，请尽快登录修改。",
    "/profile",
  );
  await notifyEmail(
    userId,
    user.email,
    "密码重置通知",
    "管理员已重置你的密码，请尽快登录修改以确保安全。",
  );
}

/**
 * 管理员发布公告，发送给当前已注册的所有账号。
 */
export async function publishAnnouncementByAdmin(
  input: AnnouncementInput,
): Promise<number> {
  const title = input.title.trim();
  const message = input.message.trim();
  const users = await listUsers();
  if (users.length === 0) {
    return 0;
  }
  await Promise.all(
    users.map((user) =>
      notifyInApp(user.id, title, message, "/notifications"),
    ),
  );
  return users.length;
}
