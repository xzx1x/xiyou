import { z } from "zod";

// 通过业务对象查询存证时的参数校验。
export const evidenceQuerySchema = z.object({
  targetType: z.enum([
    "APPOINTMENT",
    "CONSULTATION",
    "ASSESSMENT",
    "FEEDBACK",
    "FORUM_POST",
    "REPORT",
    "CONTENT",
    "COUNSELOR_APPLICATION",
  ]),
  targetId: z.string().min(1, "业务对象编号不能为空"),
});
