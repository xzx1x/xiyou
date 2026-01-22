import { z } from "zod";

// 新增咨询记录的校验规则。
export const consultationCreateSchema = z.object({
  appointmentId: z.string().min(1, "预约编号不能为空"),
  summary: z.string().max(4000).optional(),
  counselorFeedback: z.string().max(4000).optional(),
  homework: z.string().max(2000).optional(),
  followUpPlan: z.string().max(2000).optional(),
  assessmentSummary: z.string().max(4000).optional(),
  issueCategory: z.string().max(200).optional(),
  isCrisis: z.boolean().optional(),
});

// 更新咨询记录的校验规则。
export const consultationUpdateSchema = z.object({
  summary: z.string().max(4000).optional(),
  counselorFeedback: z.string().max(4000).optional(),
  homework: z.string().max(2000).optional(),
  followUpPlan: z.string().max(2000).optional(),
  assessmentSummary: z.string().max(4000).optional(),
  issueCategory: z.string().max(200).optional(),
  isCrisis: z.boolean().optional(),
});
