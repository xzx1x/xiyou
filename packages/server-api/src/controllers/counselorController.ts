import type { Context } from "koa";
import {
  counselorApplicationSchema,
  counselorApplicationStatusSchema,
  counselorProfileSchema,
  counselorReviewSchema,
  counselorScheduleCancelSchema,
  counselorScheduleSchema,
  counselorScheduleStatusSchema,
} from "../schemas/counselorSchema";
import {
  applyForCounselor,
  cancelSchedule,
  createSchedule,
  getAvailableSchedules,
  getCounselorApplications,
  getCounselorList,
  getCounselorProfile,
  getCounselorSchedules,
  getMyCounselorApplication,
  reviewCounselorApplication,
  updateCounselorProfile,
} from "../services/counselorService";
import { getProfile } from "../services/profileService";
import { BadRequestError } from "../utils/errors";

/**
 * 提交心理师申请（普通用户）。
 */
export async function submitCounselorApplication(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const parsed = counselorApplicationSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("心理师申请信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await applyForCounselor(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

/**
 * 获取当前用户的心理师申请状态。
 */
export async function getMyApplication(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const application = await getMyCounselorApplication(authUser.sub);
  ctx.status = 200;
  ctx.body = { application };
}

/**
 * 获取可预约心理师列表。
 */
export async function listCounselors(ctx: Context) {
  const counselors = await getCounselorList();
  ctx.status = 200;
  ctx.body = { counselors };
}

/**
 * 获取心理师档案详情（用户端展示）。
 */
export async function getCounselorProfileDetail(ctx: Context) {
  const counselorId = ctx.params.id;
  if (!counselorId) {
    throw new BadRequestError("心理师编号不能为空");
  }
  const userProfile = await getProfile(counselorId);
  const counselorProfile = await getCounselorProfile(counselorId);
  ctx.status = 200;
  ctx.body = {
    profile: {
      user: userProfile,
      counselor: counselorProfile,
    },
  };
}

/**
 * 更新心理师档案。
 */
export async function patchCounselorProfile(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const parsed = counselorProfileSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("心理师档案信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const profile = await updateCounselorProfile(authUser.sub, parsed.data);
  ctx.status = 200;
  ctx.body = { profile };
}

/**
 * 新增心理师档期。
 */
export async function createCounselorSchedule(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const parsed = counselorScheduleSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("档期信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const schedule = await createSchedule(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = { schedule };
}

/**
 * 查询心理师自己的档期列表。
 */
export async function listCounselorSchedules(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  // 可选的档期状态筛选参数。
  const statusRaw = ctx.query.status;
  const status =
    typeof statusRaw === "string"
      ? counselorScheduleStatusSchema.safeParse(statusRaw)
      : null;
  if (statusRaw && (!status || !status.success)) {
    throw new BadRequestError("档期状态不合法");
  }
  const schedules = await getCounselorSchedules(
    authUser.sub,
    status && status.success ? status.data : undefined,
  );
  ctx.status = 200;
  ctx.body = { schedules };
}

/**
 * 查询用户端可预约档期。
 */
export async function listAvailableCounselorSchedules(ctx: Context) {
  const counselorId = ctx.params.id;
  if (!counselorId) {
    throw new BadRequestError("心理师编号不能为空");
  }
  const schedules = await getAvailableSchedules(counselorId);
  ctx.status = 200;
  ctx.body = { schedules };
}

/**
 * 心理师取消档期（请假）。
 */
export async function cancelCounselorSchedule(ctx: Context) {
  const parsed = counselorScheduleCancelSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("取消信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const scheduleId = ctx.params.id;
  if (!scheduleId) {
    throw new BadRequestError("档期编号不能为空");
  }
  await cancelSchedule(scheduleId, parsed.data.reason ?? null);
  ctx.status = 200;
  ctx.body = { message: "档期已取消" };
}

/**
 * 管理员查看心理师申请列表。
 */
export async function listCounselorApplications(ctx: Context) {
  // 可选的申请状态筛选参数。
  const statusRaw = ctx.query.status;
  const status =
    typeof statusRaw === "string"
      ? counselorApplicationStatusSchema.safeParse(statusRaw)
      : null;
  if (statusRaw && (!status || !status.success)) {
    throw new BadRequestError("申请状态不合法");
  }
  const applications = await getCounselorApplications(
    status && status.success ? status.data : undefined,
  );
  ctx.status = 200;
  ctx.body = { applications };
}

/**
 * 管理员审核心理师申请。
 */
export async function reviewCounselorApplicationRecord(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const parsed = counselorReviewSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("审核信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const applicationId = ctx.params.id;
  if (!applicationId) {
    throw new BadRequestError("申请编号不能为空");
  }
  await reviewCounselorApplication(
    applicationId,
    parsed.data.status,
    authUser.sub,
    parsed.data.reviewReason ?? null,
  );
  ctx.status = 200;
  ctx.body = { message: "审核完成" };
}
