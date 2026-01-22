import { z } from "zod";

// 心理师申请信息校验，字段可选用于最小闭环。
export const counselorApplicationSchema = z.object({
  qualifications: z.string().max(2000).optional(),
  motivation: z.string().max(2000).optional(),
  attachmentUrls: z.string().max(2000).optional(),
});

// 心理师档案更新信息校验。
export const counselorProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  specialties: z.string().max(2000).optional(),
  serviceMode: z.enum(["ONLINE", "OFFLINE", "BOTH"]).optional(),
  officeLocation: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

// 新增档期时的时间与地点校验。
export const counselorScheduleSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  mode: z.enum(["ONLINE", "OFFLINE"]),
  location: z.string().max(255).optional(),
});

// 档期取消时的原因校验。
export const counselorScheduleCancelSchema = z.object({
  reason: z.string().max(255).optional(),
});

// 管理员审核心理师申请时的校验。
export const counselorReviewSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  reviewReason: z.string().max(1000).optional(),
});

// 档期状态查询校验。
export const counselorScheduleStatusSchema = z.enum([
  "AVAILABLE",
  "BOOKED",
  "CANCELLED",
]);

// 申请状态查询校验。
export const counselorApplicationStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
