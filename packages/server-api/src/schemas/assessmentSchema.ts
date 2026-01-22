import { z } from "zod";

// 测评提交表单校验，限制题目类型与分数范围。
export const assessmentSubmitSchema = z.object({
  type: z.enum(["PHQ9", "GAD7"]),
  answers: z.array(z.number().min(0).max(3)),
});
