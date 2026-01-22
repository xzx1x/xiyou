import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import type { UserRole } from "./userRepository";

export type CounselorApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ServiceMode = "ONLINE" | "OFFLINE" | "BOTH";
export type ScheduleStatus = "AVAILABLE" | "BOOKED" | "CANCELLED";

export type CounselorApplicationRecord = {
  id: string;
  userId: string;
  status: CounselorApplicationStatus;
  qualifications: string | null;
  motivation: string | null;
  attachmentUrls: string | null;
  reviewReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CounselorProfileRecord = {
  userId: string;
  bio: string | null;
  specialties: string | null;
  serviceMode: ServiceMode;
  officeLocation: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CounselorScheduleRecord = {
  id: string;
  counselorId: string;
  startTime: Date;
  endTime: Date;
  mode: "ONLINE" | "OFFLINE";
  location: string | null;
  status: ScheduleStatus;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CounselorListItem = {
  id: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: UserRole;
  bio: string | null;
  specialties: string | null;
  serviceMode: ServiceMode;
  officeLocation: string | null;
  isActive: boolean;
};

/**
 * 创建心理师申请记录。
 */
export async function createCounselorApplication(
  userId: string,
  payload: {
    qualifications?: string | null;
    motivation?: string | null;
    attachmentUrls?: string | null;
  },
): Promise<CounselorApplicationRecord> {
  const id = crypto.randomUUID();
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO counselor_applications (id, user_id, qualifications, motivation, attachment_urls, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      userId,
      payload.qualifications ?? null,
      payload.motivation ?? null,
      payload.attachmentUrls ?? null,
      now,
      now,
    ],
  );
  const record = await findCounselorApplicationById(id);
  if (!record) {
    throw new Error("心理师申请创建失败");
  }
  return record;
}

/**
 * 根据申请编号读取心理师申请记录。
 */
export async function findCounselorApplicationById(
  id: string,
): Promise<CounselorApplicationRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM counselor_applications WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0]!;
  return mapCounselorApplication(row);
}

/**
 * 读取用户最新的申请记录。
 */
export async function findLatestApplicationByUserId(
  userId: string,
): Promise<CounselorApplicationRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM counselor_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    [userId],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapCounselorApplication(rows[0]!);
}

/**
 * 查询指定状态的申请列表（管理员使用）。
 */
export async function listCounselorApplications(
  status?: CounselorApplicationStatus,
): Promise<CounselorApplicationRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    status
      ? "SELECT * FROM counselor_applications WHERE status = ? ORDER BY created_at DESC"
      : "SELECT * FROM counselor_applications ORDER BY created_at DESC",
    status ? [status] : [],
  );
  return rows.map(mapCounselorApplication);
}

/**
 * 更新申请状态与审核信息。
 */
export async function updateCounselorApplicationStatus(
  id: string,
  status: CounselorApplicationStatus,
  reviewedBy: string,
  reviewReason?: string | null,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE counselor_applications SET status = ?, review_reason = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?",
    [status, reviewReason ?? null, reviewedBy, now, now, id],
  );
}

/**
 * 创建或更新心理师档案。
 */
export async function upsertCounselorProfile(
  userId: string,
  payload: {
    bio?: string | null;
    specialties?: string | null;
    serviceMode?: ServiceMode;
    officeLocation?: string | null;
    isActive?: boolean;
  },
): Promise<CounselorProfileRecord> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO counselor_profiles (user_id, bio, specialties, service_mode, office_location, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE bio = VALUES(bio), specialties = VALUES(specialties), service_mode = VALUES(service_mode), office_location = VALUES(office_location), is_active = VALUES(is_active), updated_at = VALUES(updated_at)`,
    [
      userId,
      payload.bio ?? null,
      payload.specialties ?? null,
      payload.serviceMode ?? "BOTH",
      payload.officeLocation ?? null,
      payload.isActive ?? true,
      now,
      now,
    ],
  );
  const profile = await findCounselorProfile(userId);
  if (!profile) {
    throw new Error("心理师档案保存失败");
  }
  return profile;
}

/**
 * 查询心理师档案。
 */
export async function findCounselorProfile(
  userId: string,
): Promise<CounselorProfileRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM counselor_profiles WHERE user_id = ? LIMIT 1",
    [userId],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapCounselorProfile(rows[0]!);
}

/**
 * 列出可预约的心理师列表（普通用户使用）。
 */
export async function listActiveCounselors(): Promise<CounselorListItem[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT u.id, u.email, u.nickname, u.avatar_url, u.role,
            p.bio, p.specialties, p.service_mode, p.office_location, p.is_active
     FROM users u
     INNER JOIN counselor_profiles p ON u.id = p.user_id
     WHERE u.role = 'COUNSELOR' AND u.is_disabled = 0 AND p.is_active = 1
     ORDER BY u.updated_at DESC`,
  );
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    role: row.role,
    bio: row.bio,
    specialties: row.specialties,
    serviceMode: row.service_mode,
    officeLocation: row.office_location,
    isActive: Boolean(row.is_active),
  }));
}

/**
 * 新增心理师档期。
 */
export async function createCounselorSchedule(
  counselorId: string,
  payload: {
    startTime: Date;
    endTime: Date;
    mode: "ONLINE" | "OFFLINE";
    location?: string | null;
  },
): Promise<CounselorScheduleRecord> {
  const id = crypto.randomUUID();
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO counselor_schedules (id, counselor_id, start_time, end_time, mode, location, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?)",
    [
      id,
      counselorId,
      payload.startTime,
      payload.endTime,
      payload.mode,
      payload.location ?? null,
      now,
      now,
    ],
  );
  const schedule = await findCounselorScheduleById(id);
  if (!schedule) {
    throw new Error("档期创建失败");
  }
  return schedule;
}

/**
 * 查询心理师档期列表。
 */
export async function listCounselorSchedules(
  counselorId: string,
  status?: ScheduleStatus,
): Promise<CounselorScheduleRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    status
      ? "SELECT * FROM counselor_schedules WHERE counselor_id = ? AND status = ? ORDER BY start_time ASC"
      : "SELECT * FROM counselor_schedules WHERE counselor_id = ? ORDER BY start_time ASC",
    status ? [counselorId, status] : [counselorId],
  );
  return rows.map(mapCounselorSchedule);
}

/**
 * 查询指定档期。
 */
export async function findCounselorScheduleById(
  id: string,
): Promise<CounselorScheduleRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM counselor_schedules WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapCounselorSchedule(rows[0]!);
}

/**
 * 更新档期状态（例如取消或标记已被预约）。
 */
export async function updateCounselorScheduleStatus(
  id: string,
  status: ScheduleStatus,
  cancelReason?: string | null,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE counselor_schedules SET status = ?, cancel_reason = ?, updated_at = ? WHERE id = ?",
    [status, cancelReason ?? null, now, id],
  );
}

/**
 * 标记档期为已预约。
 */
export async function markScheduleBooked(id: string): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE counselor_schedules SET status = 'BOOKED', updated_at = ? WHERE id = ?",
    [now, id],
  );
}

/**
 * 查询某心理师可预约档期。
 */
export async function listAvailableSchedules(
  counselorId: string,
): Promise<CounselorScheduleRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM counselor_schedules WHERE counselor_id = ? AND status = 'AVAILABLE' ORDER BY start_time ASC",
    [counselorId],
  );
  return rows.map(mapCounselorSchedule);
}

function mapCounselorApplication(row: RowDataPacket): CounselorApplicationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    qualifications: row.qualifications,
    motivation: row.motivation,
    attachmentUrls: row.attachment_urls,
    reviewReason: row.review_reason,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapCounselorProfile(row: RowDataPacket): CounselorProfileRecord {
  return {
    userId: row.user_id,
    bio: row.bio,
    specialties: row.specialties,
    serviceMode: row.service_mode,
    officeLocation: row.office_location,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapCounselorSchedule(row: RowDataPacket): CounselorScheduleRecord {
  return {
    id: row.id,
    counselorId: row.counselor_id,
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    mode: row.mode,
    location: row.location,
    status: row.status,
    cancelReason: row.cancel_reason,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
