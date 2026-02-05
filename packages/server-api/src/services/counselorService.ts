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
  type CounselorApplicationRecord,
  type CounselorApplicationStatus,
  type ServiceMode,
  type ScheduleStatus,
} from "../repositories/counselorRepository";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import {
  listUsersByIds,
  listUsersByRole,
  updateUserRole,
  type UserRecord,
  type UserRole,
} from "../repositories/userRepository";
import { BadRequestError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";
import { notifyInApp } from "./notificationService";

export type CounselorApplicationInput = {
  qualifications?: string | null;
  motivation?: string | null;
  attachmentUrls?: string | null;
  attachmentDataUrl?: string | null;
};

export type PublicApplicantProfile = {
  id: string;
  nickname: string | null;
  gender: string | null;
  major: string | null;
  grade: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

export type CounselorApplicationWithProfile = CounselorApplicationRecord & {
  applicantProfile: PublicApplicantProfile | null;
};

export type CounselorProfileInput = {
  bio?: string | null;
  specialties?: string | null;
  serviceMode?: ServiceMode;
  officeLocation?: string | null;
  isActive?: boolean;
};

export type CounselorScheduleInput =
  | {
      startTime: Date;
      endTime: Date;
      mode: "ONLINE" | "OFFLINE";
      location?: string | null;
    }
  | {
      type: "SHORT";
      date: string;
      startTime: string;
      endTime: string;
      mode: "ONLINE" | "OFFLINE";
      location?: string | null;
    }
  | {
      type: "LONG";
      startTime: string;
      endTime: string;
      repeat: "ALL" | "WEEKDAY" | "CUSTOM";
      daysOfWeek?: number[] | null;
      mode: "ONLINE" | "OFFLINE";
      location?: string | null;
    };

type CounselorAttachmentParseResult = {
  buffer: Buffer;
  extension: string;
};

const COUNSELOR_ATTACHMENT_STORAGE_DIR = resolve(
  process.cwd(),
  "uploads",
  "counselor-applications",
);
const MAX_COUNSELOR_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const COUNSELOR_ATTACHMENT_MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const LONG_TERM_SCHEDULE_DAYS = 60;

function toPublicProfile(user: UserRecord): PublicApplicantProfile {
  return {
    id: user.id,
    nickname: user.nickname,
    gender: user.gender,
    major: user.major,
    grade: user.grade,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

/**
 * 解析心理师申请附件 Data URL，校验格式与大小。
 */
function parseCounselorAttachmentDataUrl(
  dataUrl: string,
): CounselorAttachmentParseResult {
  const trimmed = dataUrl.trim();
  let mimeType = "";
  let base64Payload = trimmed;
  const buildAttachmentTypeError = (type: string) =>
    `附件格式不正确，仅支持 PDF/DOCX 文件，当前文件类型：${type || "未知"}`;
  if (trimmed.startsWith("data:")) {
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex === -1) {
      throw new BadRequestError(buildAttachmentTypeError(mimeType));
    }
    const header = trimmed.slice(5, commaIndex);
    base64Payload = trimmed.slice(commaIndex + 1);
    const headerParts = header.split(";").map((part) => part.trim());
    mimeType = (headerParts[0] ?? "").toLowerCase();
    const isBase64 = headerParts.some(
      (part) => part.toLowerCase() === "base64",
    );
    if (!isBase64) {
      const base64Like = /^[A-Za-z0-9+/_=\s-]+$/.test(base64Payload);
      if (!base64Like) {
        throw new BadRequestError(buildAttachmentTypeError(mimeType));
      }
    }
  }
  base64Payload = base64Payload.trim().replace(/\s+/g, "");
  if (!base64Payload) {
    throw new BadRequestError(buildAttachmentTypeError(mimeType));
  }
  const normalizedBase64 = base64Payload
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalizedBase64.length % 4;
  const paddedBase64 =
    padding === 0 ? normalizedBase64 : `${normalizedBase64}${"=".repeat(4 - padding)}`;
  const buffer = Buffer.from(paddedBase64, "base64");
  if (buffer.length === 0) {
    throw new BadRequestError("附件内容为空");
  }
  if (buffer.length > MAX_COUNSELOR_ATTACHMENT_BYTES) {
    throw new BadRequestError("附件大小不能超过 5MB");
  }
  let extension = COUNSELOR_ATTACHMENT_MIME_TO_EXT[mimeType];
  if (!extension) {
    const pdfSignature = buffer.subarray(0, 5).toString("ascii");
    if (pdfSignature === "%PDF-") {
      extension = "pdf";
    } else if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      extension = "docx";
    } else if (
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0 &&
      buffer[4] === 0xa1 &&
      buffer[5] === 0xb1 &&
      buffer[6] === 0x1a &&
      buffer[7] === 0xe1
    ) {
      extension = "docx";
    }
  }
  if (!extension) {
    throw new BadRequestError(buildAttachmentTypeError(mimeType));
  }
  return { buffer, extension };
}

/**
 * 保存心理师申请附件并返回可访问路径。
 */
async function saveCounselorAttachmentFile(
  userId: string,
  dataUrl: string,
): Promise<string> {
  const { buffer, extension } = parseCounselorAttachmentDataUrl(dataUrl);
  await mkdir(COUNSELOR_ATTACHMENT_STORAGE_DIR, { recursive: true });
  const fileName = `${userId}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = join(COUNSELOR_ATTACHMENT_STORAGE_DIR, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/counselor-applications/${fileName}`;
}

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
  const attachmentUrl = payload.attachmentDataUrl
    ? await saveCounselorAttachmentFile(userId, payload.attachmentDataUrl)
    : payload.attachmentUrls ?? null;
  const record = await createCounselorApplication(userId, {
    qualifications: payload.qualifications ?? null,
    motivation: payload.motivation ?? null,
    attachmentUrls: attachmentUrl,
  });
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
  const now = new Date();
  const createSingleSchedule = async (input: {
    startTime: Date;
    endTime: Date;
    mode: "ONLINE" | "OFFLINE";
    location?: string | null;
  }) => {
    if (input.endTime <= input.startTime) {
      throw new BadRequestError("结束时间必须晚于开始时间");
    }
    if (input.endTime <= now) {
      throw new BadRequestError("档期已过期");
    }
    return createCounselorSchedule(counselorId, input);
  };

  if ("type" in payload) {
    if (payload.type === "SHORT") {
      const startTime = new Date(`${payload.date}T${payload.startTime}`);
      const endTime = new Date(`${payload.date}T${payload.endTime}`);
      if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
        throw new BadRequestError("档期时间不合法");
      }
      const schedule = await createSingleSchedule({
        startTime,
        endTime,
        mode: payload.mode,
        location: payload.location ?? null,
      });
      return [schedule];
    }
    if (payload.type === "LONG") {
      const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
      const startMatch = timeRegex.exec(payload.startTime);
      const endMatch = timeRegex.exec(payload.endTime);
      if (!startMatch || !endMatch) {
        throw new BadRequestError("档期时间不合法");
      }
      const parseTimeParts = (match: RegExpExecArray) => ({
        hour: Number(match[1]),
        minute: Number(match[2]),
        second: match[3] ? Number(match[3]) : 0,
      });
      const startParts = parseTimeParts(startMatch);
      const endParts = parseTimeParts(endMatch);
      if (
        startParts.hour > 23 ||
        endParts.hour > 23 ||
        startParts.minute > 59 ||
        endParts.minute > 59 ||
        startParts.second > 59 ||
        endParts.second > 59
      ) {
        throw new BadRequestError("档期时间不合法");
      }
      const startTotal =
        startParts.hour * 3600 + startParts.minute * 60 + startParts.second;
      const endTotal =
        endParts.hour * 3600 + endParts.minute * 60 + endParts.second;
      if (endTotal <= startTotal) {
        throw new BadRequestError("结束时间必须晚于开始时间");
      }
      const normalizedDays =
        payload.repeat === "ALL"
          ? [1, 2, 3, 4, 5, 6, 7]
          : payload.repeat === "WEEKDAY"
            ? [1, 2, 3, 4, 5]
            : Array.from(new Set(payload.daysOfWeek ?? []));
      if (payload.repeat === "CUSTOM" && normalizedDays.length === 0) {
        throw new BadRequestError("请选择重复星期");
      }
      const normalizedDaySet = new Set(
        normalizedDays.filter((day) => day >= 1 && day <= 7),
      );
      if (normalizedDaySet.size === 0) {
        throw new BadRequestError("请选择重复星期");
      }
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const schedules: Array<{
        startTime: Date;
        endTime: Date;
        mode: "ONLINE" | "OFFLINE";
        location?: string | null;
      }> = [];
      for (let offset = 0; offset < LONG_TERM_SCHEDULE_DAYS; offset += 1) {
        const current = new Date(startDate);
        current.setDate(current.getDate() + offset);
        const weekDay = current.getDay() === 0 ? 7 : current.getDay();
        if (!normalizedDaySet.has(weekDay)) {
          continue;
        }
        const startTime = new Date(current);
        startTime.setHours(startParts.hour, startParts.minute, startParts.second, 0);
        const endTime = new Date(current);
        endTime.setHours(endParts.hour, endParts.minute, endParts.second, 0);
        if (endTime <= now) {
          continue;
        }
        schedules.push({
          startTime,
          endTime,
          mode: payload.mode,
          location: payload.location ?? null,
        });
      }
      if (schedules.length === 0) {
        throw new BadRequestError("未生成有效档期");
      }
      const created: Array<Awaited<ReturnType<typeof createCounselorSchedule>>> = [];
      for (const scheduleInput of schedules) {
        const schedule = await createCounselorSchedule(counselorId, scheduleInput);
        created.push(schedule);
      }
      return created;
    }
  }

  const schedule = await createSingleSchedule(payload);
  return [schedule];
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
): Promise<CounselorApplicationWithProfile[]> {
  const applications = await listCounselorApplications(status);
  if (applications.length === 0) {
    return [];
  }
  const applicantIds = Array.from(new Set(applications.map((item) => item.userId)));
  const users = await listUsersByIds(applicantIds);
  const profileMap = new Map(users.map((user) => [user.id, toPublicProfile(user)]));
  return applications.map((application) => ({
    ...application,
    applicantProfile: profileMap.get(application.userId) ?? null,
  }));
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
