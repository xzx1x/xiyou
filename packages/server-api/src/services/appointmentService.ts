import {
  createAppointment,
  findAppointmentById,
  listAppointments,
  updateAppointmentCounselorNote,
  updateAppointmentStatus,
  type AppointmentStatus,
} from "../repositories/appointmentRepository";
import {
  findCounselorScheduleById,
  markScheduleBooked,
  updateCounselorScheduleStatus,
} from "../repositories/counselorRepository";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";
import { notifyInApp } from "./notificationService";

/**
 * 创建预约：校验档期有效并标记为已预约。
 */
export async function bookAppointment(
  userId: string,
  payload: {
    counselorId: string;
    scheduleId: string;
    userNote?: string | null;
  },
) {
  const schedule = await findCounselorScheduleById(payload.scheduleId);
  if (!schedule) {
    throw new BadRequestError("档期不存在");
  }
  if (schedule.status !== "AVAILABLE") {
    throw new BadRequestError("该档期已被占用或不可用");
  }
  if (schedule.counselorId !== payload.counselorId) {
    throw new BadRequestError("档期与心理师不匹配");
  }
  const id = crypto.randomUUID();
  const appointment = await createAppointment({
    id,
    userId,
    counselorId: payload.counselorId,
    scheduleId: payload.scheduleId,
    status: "BOOKED",
    userNote: payload.userNote ?? null,
    counselorNote: null,
    cancelReason: null,
  });
  // 写入预约存证占位，留待后续链上补录。
  const evidence = await createEvidencePlaceholder({
    targetType: "APPOINTMENT",
    targetId: appointment.id,
    summary: "心理咨询预约申请",
  });
  await markScheduleBooked(payload.scheduleId);
  await notifyInApp(
    payload.counselorId,
    "新预约提醒",
    "有新的预约请求，请查看详情。",
    `/counselor/appointments/${id}`,
  );
  return { appointment, evidence };
}

/**
 * 查询预约列表，角色不同返回不同视图。
 */
export async function getAppointments(options: {
  userId?: string;
  counselorId?: string;
}) {
  return listAppointments(options);
}

/**
 * 查询预约详情。
 */
export async function getAppointmentDetail(id: string) {
  const appointment = await findAppointmentById(id);
  if (!appointment) {
    throw new BadRequestError("预约不存在");
  }
  return appointment;
}

/**
 * 取消预约：用户取消将释放档期，心理师取消视为请假。
 */
export async function cancelAppointment(
  appointmentId: string,
  actor: { userId: string; role: "USER" | "COUNSELOR" | "ADMIN" },
  reason?: string | null,
) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) {
    throw new BadRequestError("预约不存在");
  }
  if (appointment.status !== "BOOKED") {
    throw new BadRequestError("当前预约无法取消");
  }
  if (actor.role === "USER" && appointment.userId !== actor.userId) {
    throw new UnauthorizedError("无权取消该预约");
  }
  if (actor.role === "COUNSELOR" && appointment.counselorId !== actor.userId) {
    throw new UnauthorizedError("无权取消该预约");
  }
  const nextStatus: AppointmentStatus =
    actor.role === "COUNSELOR" ? "CANCELLED_BY_COUNSELOR" : "CANCELLED_BY_USER";
  await updateAppointmentStatus(appointmentId, nextStatus, reason ?? null);
  if (actor.role === "USER") {
    await updateCounselorScheduleStatus(
      appointment.scheduleId,
      "AVAILABLE",
      null,
    );
    await notifyInApp(
      appointment.counselorId,
      "预约取消提醒",
      "用户取消了预约，请查看档期安排。",
      `/counselor/appointments/${appointmentId}`,
    );
  } else if (actor.role === "COUNSELOR") {
    await updateCounselorScheduleStatus(
      appointment.scheduleId,
      "CANCELLED",
      reason ?? null,
    );
    await notifyInApp(
      appointment.userId,
      "预约变更提醒",
      "心理师临时请假导致预约取消，请重新选择档期。",
      "/appointments",
    );
  }
}

/**
 * 心理师填写准备备注。
 */
export async function updateAppointmentNote(
  appointmentId: string,
  counselorId: string,
  note?: string | null,
) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) {
    throw new BadRequestError("预约不存在");
  }
  if (appointment.counselorId !== counselorId) {
    throw new UnauthorizedError("无权更新该预约");
  }
  await updateAppointmentCounselorNote(appointmentId, note ?? null);
}

/**
 * 心理师标记预约完成。
 */
export async function completeAppointment(
  appointmentId: string,
  counselorId: string,
) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) {
    throw new BadRequestError("预约不存在");
  }
  if (appointment.counselorId !== counselorId) {
    throw new UnauthorizedError("无权更新该预约");
  }
  await updateAppointmentStatus(appointmentId, "COMPLETED");
  await notifyInApp(
    appointment.userId,
    "预约已完成",
    "本次咨询已结束，请填写满意度反馈。",
    `/appointments/${appointmentId}`,
  );
}
