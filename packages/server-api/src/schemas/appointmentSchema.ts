import { z } from "zod";

// 创建预约所需的字段校验。
export const appointmentCreateSchema = z.object({
  counselorId: z.string().min(1, "心理师编号不能为空"),
  scheduleId: z.string().min(1, "档期编号不能为空"),
  userNote: z.string().max(2000).optional(),
});

// 取消预约时的原因校验。
export const appointmentCancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

// 心理师更新预约备注时的校验。
export const appointmentNoteSchema = z.object({
  note: z.string().max(2000).optional(),
});
