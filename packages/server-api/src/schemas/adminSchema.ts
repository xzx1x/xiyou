import { z } from "zod";

// 管理员更新用户状态的校验。
export const adminUserStatusSchema = z.object({
  isDisabled: z.boolean(),
  reason: z.string().max(255).optional(),
});

// 管理员更新用户角色的校验。
export const adminUserRoleSchema = z.object({
  role: z.enum(["USER", "COUNSELOR", "ADMIN"]),
});

// 管理员重置密码的校验。
export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(8, "新密码至少 8 位"),
});

// 管理员发布公告的校验。
export const adminAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "公告标题不能为空")
    .max(60, "公告标题最多 60 个字"),
  message: z
    .string()
    .trim()
    .min(1, "公告内容不能为空")
    .max(1000, "公告内容最多 1000 个字"),
});
