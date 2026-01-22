import { z } from "zod";

// 发起好友申请的校验。
export const friendRequestSchema = z.object({
  targetId: z.string().min(1, "目标用户编号不能为空"),
});

// 处理好友申请的校验。
export const friendResponseSchema = z.object({
  accept: z.boolean(),
});
