import {
  createCounselorApplication,
  findCounselorApplicationById,
  findCounselorProfile,
  findLatestApplicationByUserId,
  listActiveCounselors,
  listCounselorApplications,
  listCounselorSchedules,
  listAvailableSchedules,
  updateCounselorApplicationStatus,
  upsertCounselorProfile,
  createCounselorSchedule,
  updateCounselorScheduleStatus,
  type CounselorApplicationStatus,
  type ServiceMode,
  type ScheduleStatus,
} from "../repositories/counselorRepository";
import { listUsersByRole, updateUserRole } from "../repositories/userRepository";
import { BadRequestError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";
import { notifyInApp } from "./notificationService";

export type CounselorApplicationInput = {
  qualifications?: string | null;
  motivation?: string | null;
  attachmentUrls?: string | null;
};

export type CounselorProfileInput = {
  bio?: string | null;
  specialties?: string | null;
  serviceMode?: ServiceMode;
  officeLocation?: string | null;
  isActive?: boolean;
};

export type CounselorScheduleInput = {
  startTime: Date;
  endTime: Date;
  mode: "ONLINE" | "OFFLINE";
  location?: string | null;
};

/**
 * 提交心理师申请，若已有待审核申请则阻止重复提交。
 */
export async function applyForCounselor(
  userId: string,
  payload: CounselorApplicationInput,
) {
  const latest = await findLatestApplicationByUserId(userId);
  if (latest && latest.status === "PENDING") {
    throw new BadRequestError("已有待审核申请，请勿重复提交");
  }
  const record = await createCounselorApplication(userId, payload);
  // 生成心理师申请的存证占位记录，后续链上存证可直接补写。
  const evidence = await createEvidencePlaceholder({
    targetType: "COUNSELOR_APPLICATION",
    targetId: record.id,
    summary: "心理咨询师资质申请",
  });
  const admins = await listUsersByRole("ADMIN");
  await Promise.all(
    admins.map((admin) =>
      notifyInApp(
        admin.id,
        "心理师申请待审核",
        `用户 ${record.userId} 提交了新的心理师申请，请及时审核。`,
        "/admin/counselor-applications",
      ),
    ),
  );
  return { application: record, evidence };
}

/**
 * 查询当前用户的心理师申请状态。
 */
export async function getMyCounselorApplication(userId: string) {
  return findLatestApplicationByUserId(userId);
}

/**
 * 列出可预约的心理师列表。
 */
export async function getCounselorList() {
  return listActiveCounselors();
}

/**
 * 获取心理师档案信息。
 */
export async function getCounselorProfile(userId: string) {
  return findCounselorProfile(userId);
}

/**
 * 更新心理师档案。
 */
export async function updateCounselorProfile(
  userId: string,
  payload: CounselorProfileInput,
) {
  return upsertCounselorProfile(userId, payload);
}

/**
 * 创建心理师档期，校验时间区间。
 */
export async function createSchedule(
  counselorId: string,
  payload: CounselorScheduleInput,
) {
  if (payload.endTime <= payload.startTime) {
    throw new BadRequestError("结束时间必须晚于开始时间");
  }
  return createCounselorSchedule(counselorId, payload);
}

/**
 * 查询心理师全部档期。
 */
export async function getCounselorSchedules(
  counselorId: string,
  status?: ScheduleStatus,
) {
  return listCounselorSchedules(counselorId, status);
}

/**
 * 查询心理师可预约档期（用户端）。
 */
export async function getAvailableSchedules(counselorId: string) {
  return listAvailableSchedules(counselorId);
}

/**
 * 取消档期（心理师请假时使用）。
 */
export async function cancelSchedule(
  scheduleId: string,
  reason?: string | null,
) {
  await updateCounselorScheduleStatus(scheduleId, "CANCELLED", reason ?? null);
}

/**
 * 管理员查询心理师申请列表。
 */
export async function getCounselorApplications(
  status?: CounselorApplicationStatus,
) {
  return listCounselorApplications(status);
}

/**
 * 管理员审核心理师申请。
 */
export async function reviewCounselorApplication(
  applicationId: string,
  status: CounselorApplicationStatus,
  reviewerId: string,
  reviewReason?: string | null,
) {
  await updateCounselorApplicationStatus(
    applicationId,
    status,
    reviewerId,
    reviewReason ?? null,
  );
  if (status === "APPROVED") {
    const record = await findCounselorApplicationById(applicationId);
    if (record) {
      await updateUserRole(record.userId, "COUNSELOR");
      await upsertCounselorProfile(record.userId, {});
      await notifyInApp(
        record.userId,
        "心理师申请已通过",
        "你的心理师资质申请已通过审核，可以开始设置档期。",
        "/counselor/schedules",
      );
    }
  }
}
