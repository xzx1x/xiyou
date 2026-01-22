import { z } from "zod";

// 咨询结果反馈提交校验。
export const feedbackSubmitSchema = z.object({
  appointmentId: z.string().min(1, "预约编号不能为空"),
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
  liked: z.boolean().optional(),
});
