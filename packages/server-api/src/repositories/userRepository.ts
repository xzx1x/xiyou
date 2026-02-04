import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type UserRole = "USER" | "COUNSELOR" | "ADMIN";

export interface UserRecord {
  id: string;
  email: string;
  password: string;
  identityCode: string;
  nickname: string | null;
  gender: string | null;
  major: string | null;
  grade: string | null;
  avatarUrl: string | null;
  isDisabled: boolean;
  disabledReason: string | null;
  lastLoginAt: Date | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 将数据库行数据转换成领域对象，封装命名与时间类型。
 */
function mapRow(row: RowDataPacket): UserRecord {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    identityCode: row.identity_code,
    nickname: row.nickname,
    gender: row.gender,
    major: row.major,
    grade: row.grade,
    avatarUrl: row.avatar_url,
    isDisabled: Boolean(row.is_disabled),
    disabledReason: row.disabled_reason,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * 根据邮箱查找用户，内部强制统一为小写，防止大小写差异导致重复注册。
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email.toLowerCase()],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRow(rows[0]!);
}

/**
 * 按昵称查找用户，用于注册/资料更新时避免重复昵称。
 */
export async function findUserByNickname(
  nickname: string,
): Promise<UserRecord | null> {
  const trimmed = nickname.trim();
  if (!trimmed) {
    return null;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE nickname = ? LIMIT 1",
    [trimmed],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRow(rows[0]!);
}

/**
 * 直接以主键读取完整用户信息，常用于写入后回查。
 */
export async function findUserById(id: string): Promise<UserRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRow(rows[0]!);
}

export interface CreateUserInput {
  email: string;
  password: string;
  identityCode: string;
  nickname?: string;
  gender?: string;
  major?: string;
  grade?: string;
  avatarUrl?: string;
  role?: UserRole;
}

/**
 * 写入新用户：生成 UUID，规范化邮箱与学号，插入后再读一次确保返回最新快照。
 */
export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const id = crypto.randomUUID();
  const now = new Date();
  const identityCode = input.identityCode.toUpperCase();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO users (id, email, password, identity_code, nickname, gender, major, grade, avatar_url, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      input.email.toLowerCase(),
      input.password,
      identityCode,
      input.nickname ?? null,
      input.gender ?? null,
      input.major ?? null,
      input.grade ?? null,
      input.avatarUrl ?? null,
      input.role ?? "USER",
      now,
      now,
    ],
  );
  const user = await findUserById(id);
  if (!user) {
    throw new Error("用户创建失败");
  }
  return user;
}

/**
 * 通过学号/工号查询用户。若传入空字符串直接返回 null，以便上层判定“尚未注册”。
 */
export async function findUserByIdentityCode(identityCode: string): Promise<UserRecord | null> {
  const normalized = identityCode.trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE identity_code = ? LIMIT 1",
    [normalized],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRow(rows[0]!);
}

export interface UpdateUserProfileInput {
  nickname?: string | null;
  gender?: string | null;
  major?: string | null;
  grade?: string | null;
  avatarUrl?: string | null;
}

/**
 * 允许更新用户基础资料字段，字段按需拼接，避免无效写入。
 */
export async function updateUserProfile(
  userId: string,
  payload: UpdateUserProfileInput,
): Promise<UserRecord> {
  const assignments: string[] = [];
  const values: Array<string | Date | null> = [];

  if (payload.nickname !== undefined) {
    assignments.push("nickname = ?");
    values.push(payload.nickname);
  }
  if (payload.gender !== undefined) {
    assignments.push("gender = ?");
    values.push(payload.gender);
  }
  if (payload.major !== undefined) {
    assignments.push("major = ?");
    values.push(payload.major);
  }
  if (payload.grade !== undefined) {
    assignments.push("grade = ?");
    values.push(payload.grade);
  }
  if (payload.avatarUrl !== undefined) {
    assignments.push("avatar_url = ?");
    values.push(payload.avatarUrl);
  }

  if (assignments.length > 0) {
    values.push(new Date());
    values.push(userId);
    const query = `UPDATE users SET ${assignments.join(", ")}, updated_at = ? WHERE id = ?`;
    await pool.execute<ResultSetHeader>(query, values);
  }

  const updated = await findUserById(userId);
  if (!updated) {
    throw new Error("用户不存在");
  }
  return updated;
}

/**
 * 修改用户密码并同步更新时间。
 */
export async function updateUserPassword(
  userId: string,
  hashedPassword: string,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
    [hashedPassword, now, userId],
  );
}

/**
 * 更新用户角色（管理员审核心理师或降级时使用）。
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE users SET role = ?, updated_at = ? WHERE id = ?",
    [role, now, userId],
  );
}

/**
 * 更新账号禁用状态与原因。
 */
export async function updateUserStatus(
  userId: string,
  isDisabled: boolean,
  reason?: string | null,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE users SET is_disabled = ?, disabled_reason = ?, updated_at = ? WHERE id = ?",
    [isDisabled ? 1 : 0, reason ?? null, now, userId],
  );
}

/**
 * 更新最近登录时间，便于审计与数据统计。
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?",
    [now, now, userId],
  );
}

/**
 * 查询用户列表（管理员使用），支持关键字检索。
 */
export async function listUsers(keyword?: string): Promise<UserRecord[]> {
  const search = keyword ? `%${keyword.toLowerCase()}%` : null;
  const [rows] = await pool.execute<RowDataPacket[]>(
    search
      ? "SELECT * FROM users WHERE LOWER(email) LIKE ? OR LOWER(identity_code) LIKE ? ORDER BY created_at DESC"
      : "SELECT * FROM users ORDER BY created_at DESC",
    search ? [search, search] : [],
  );
  return rows.map(mapRow);
}

/**
 * 按关键词搜索公开用户（昵称/学号），用于好友查找。
 */
export async function searchUsersByKeyword(
  keyword: string,
): Promise<UserRecord[]> {
  const search = `%${keyword.toLowerCase()}%`;
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE (LOWER(nickname) LIKE ? OR LOWER(identity_code) LIKE ?) AND is_disabled = 0 ORDER BY created_at DESC LIMIT 20",
    [search, search],
  );
  return rows.map(mapRow);
}

/**
 * 根据角色列出用户列表，常用于通知或审批。
 */
export async function listUsersByRole(
  role: UserRole,
): Promise<UserRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM users WHERE role = ? ORDER BY created_at DESC",
    [role],
  );
  return rows.map(mapRow);
}

/**
 * 根据用户编号批量读取用户信息。
 */
export async function listUsersByIds(ids: string[]): Promise<UserRecord[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }
  const placeholders = uniqueIds.map(() => "?").join(", ");
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM users WHERE id IN (${placeholders})`,
    uniqueIds,
  );
  return rows.map(mapRow);
}

/**
 * 读取用户的禁用状态与角色，供鉴权中间件使用。
 */
export async function findUserAccessInfo(
  userId: string,
): Promise<Pick<UserRecord, "id" | "role" | "isDisabled"> | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id, role, is_disabled FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  if (rows.length === 0) {
    return null;
  }
  return {
    id: rows[0]!.id,
    role: rows[0]!.role,
    isDisabled: Boolean(rows[0]!.is_disabled),
  };
}
