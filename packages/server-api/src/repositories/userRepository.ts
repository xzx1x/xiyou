import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type UserRole = "USER" | "COUNSELOR" | "ADMIN";

export interface UserRecord {
  id: string;
  email: string;
  password: string;
  identityCode: string;
  nickname: string | null;
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
    "INSERT INTO users (id, email, password, identity_code, nickname, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      input.email.toLowerCase(),
      input.password,
      identityCode,
      input.nickname ?? null,
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
