import type { Context } from "koa";
import {
  appointmentCancelSchema,
  appointmentCreateSchema,
  appointmentNoteSchema,
} from "../schemas/appointmentSchema";
import {
  bookAppointment,
  cancelAppointment,
  completeAppointment,
  getAppointmentDetail,
  getAppointments,
  updateAppointmentNote,
} from "../services/appointmentService";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

/**
 * 提交预约申请。
 */
export async function createAppointment(ctx: Context) {
  // 当前登录用户，用于绑定预约人。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = appointmentCreateSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("预约信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await bookAppointment(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

/**
 * 查询预约列表（按角色区分）。
 */
export async function listAppointmentRecords(ctx: Context) {
  // 当前登录用户与角色，用于区分查询视角。
  const authUser = ctx.state.user as { sub?: string; role?: string } | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "未授权");
  }
  const appointments =
    authUser.role === "USER"
      ? await getAppointments({ userId: authUser.sub })
      : authUser.role === "COUNSELOR"
        ? await getAppointments({ counselorId: authUser.sub })
        : await getAppointments({});
  ctx.status = 200;
  ctx.body = { appointments };
}

/**
 * 查询预约详情，并校验访问权限。
 */
export async function getAppointmentRecord(ctx: Context) {
  // 当前登录用户与角色，用于校验访问权限。
  const authUser = ctx.state.user as { sub?: string; role?: string } | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "未授权");
  }
  const appointmentId = ctx.params.id;
  if (!appointmentId) {
    throw new BadRequestError("预约编号不能为空");
  }
  const appointment = await getAppointmentDetail(appointmentId);
  if (
    authUser.role === "USER" &&
    appointment.userId !== authUser.sub
  ) {
    throw new UnauthorizedError("无权查看该预约");
  }
  if (
    authUser.role === "COUNSELOR" &&
    appointment.counselorId !== authUser.sub
  ) {
    throw new UnauthorizedError("无权查看该预约");
  }
  ctx.status = 200;
  ctx.body = { appointment };
}

/**
 * 取消预约（用户或心理师）。
 */
export async function cancelAppointmentRecord(ctx: Context) {
  // 当前登录用户与角色，用于执行取消逻辑。
  const authUser = ctx.state.user as { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" } | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "未授权");
  }
  const parsed = appointmentCancelSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("取消信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const appointmentId = ctx.params.id;
  if (!appointmentId) {
    throw new BadRequestError("预约编号不能为空");
  }
  await cancelAppointment(appointmentId, { userId: authUser.sub, role: authUser.role }, parsed.data.reason ?? null);
  ctx.status = 200;
  ctx.body = { message: "预约已取消" };
}

/**
 * 心理师更新预约准备备注。
 */
export async function updateAppointmentCounselorNote(ctx: Context) {
  // 当前登录心理师，用于权限校验。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = appointmentNoteSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("备注信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const appointmentId = ctx.params.id;
  if (!appointmentId) {
    throw new BadRequestError("预约编号不能为空");
  }
  await updateAppointmentNote(appointmentId, authUser.sub, parsed.data.note ?? null);
  ctx.status = 200;
  ctx.body = { message: "备注已更新" };
}

/**
 * 心理师标记预约完成。
 */
export async function completeAppointmentRecord(ctx: Context) {
  // 当前登录心理师，用于权限校验。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const appointmentId = ctx.params.id;
  if (!appointmentId) {
    throw new BadRequestError("预约编号不能为空");
  }
  await completeAppointment(appointmentId, authUser.sub);
  ctx.status = 200;
  ctx.body = { message: "预约已完成" };
}
