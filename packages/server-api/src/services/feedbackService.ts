import { findAppointmentById } from "../repositories/appointmentRepository";
import {
  createFeedback,
  listFeedbackByCounselor,
  listFeedbackByUser,
} from "../repositories/feedbackRepository";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";
import { notifyInApp } from "./notificationService";

export type FeedbackInput = {
  appointmentId: string;
  rating: number;
  comment?: string | null;
  liked?: boolean;
};

/**
 * 提交咨询反馈。
 */
export async function submitFeedback(
  userId: string,
  payload: FeedbackInput,
) {
  const appointment = await findAppointmentById(payload.appointmentId);
  if (!appointment) {
    throw new BadRequestError("预约不存在");
  }
  if (appointment.userId !== userId) {
    throw new UnauthorizedError("无权为该预约提交反馈");
  }
  if (appointment.status !== "COMPLETED") {
    throw new BadRequestError("预约未完成，无法提交反馈");
  }
  if (payload.rating < 1 || payload.rating > 5) {
    throw new BadRequestError("评分需在 1-5 之间");
  }
  const feedback = await createFeedback({
    id: crypto.randomUUID(),
    appointmentId: payload.appointmentId,
    userId,
    counselorId: appointment.counselorId,
    rating: payload.rating,
    comment: payload.comment ?? null,
    liked: payload.liked ?? false,
    createdAt: new Date(),
  });
  // 生成反馈的存证占位，用于后续链上存档。
  const evidence = await createEvidencePlaceholder({
    targetType: "FEEDBACK",
    targetId: feedback.id,
    summary: "咨询结果满意度反馈",
  });
  await notifyInApp(
    appointment.counselorId,
    "收到新的咨询反馈",
    "一位来访者提交了满意度反馈，请查看详情。",
    "/counselor/feedback",
  );
  return { feedback, evidence };
}

/**
 * 查询反馈列表（用户或心理师）。
 */
export async function getFeedbackList(options: {
  userId?: string;
  counselorId?: string;
}) {
  if (options.userId) {
    return listFeedbackByUser(options.userId);
  }
  if (options.counselorId) {
    return listFeedbackByCounselor(options.counselorId);
  }
  return [];
}
