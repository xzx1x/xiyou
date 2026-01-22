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
