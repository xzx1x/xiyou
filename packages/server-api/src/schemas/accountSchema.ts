import { z } from "zod";

/**
 * 个人资料更新校验规则，所有字段均可选，允许为空字符串以便清空。
 */
export const profileUpdateSchema = z.object({
  nickname: z.string().max(50, "昵称不能超过 50 个字符").optional(),
  gender: z
    .enum(["female", "male", "other"], {
      message: "性别仅支持 female/male/other",
    })
    .optional()
    .or(z.literal("")),
  major: z.string().max(128, "专业不能超过 128 个字符").optional(),
  grade: z.string().max(64, "年级不能超过 64 个字符").optional(),
  avatarUrl: z
    .string()
    .max(255, "头像链接不能超过 255 个字符")
    .optional()
    .or(z.literal("")),
});

/**
 * 修改密码校验规则，避免弱密码与空密码。
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8, "当前密码至少 8 位"),
  newPassword: z.string().min(8, "新密码至少 8 位"),
});

/**
 * 头像上传校验规则，仅校验 Base64 数据 URL 是否存在。
 */
export const avatarUploadSchema = z.object({
  dataUrl: z.string().min(20, "头像数据不能为空"),
});
