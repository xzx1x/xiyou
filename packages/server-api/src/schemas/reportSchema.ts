import { z } from "zod";

// 举报提交校验。
export const reportCreateSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER", "COUNSELOR"]),
  targetId: z.string().min(1, "举报对象编号不能为空"),
  reason: z.string().min(1, "举报原因不能为空").max(2000),
});

// 举报处理校验。
export const reportResolveSchema = z.object({
  actionTaken: z.string().max(2000).optional(),
  disableTarget: z.boolean().optional(),
});
