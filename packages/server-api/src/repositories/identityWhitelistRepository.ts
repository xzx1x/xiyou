import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import type { UserRole } from "./userRepository";

export interface AllowedIdentity {
  identityCode: string;
  defaultRole: UserRole;
  description?: string | null;
}

/**
 * 查询是否存在于 `identity_whitelist` 白名单。
 * - 输入会被 `trim + toUpperCase`，保持与数据库一致。
 * - 若未匹配，返回 `null` 交由业务层提示“尚未开放注册”。
 */
export async function findAllowedIdentity(identityCode: string): Promise<AllowedIdentity | null> {
  const normalized = identityCode.trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT identity_code, default_role, description FROM identity_whitelist WHERE identity_code = ? LIMIT 1",
    [normalized],
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0]!;
  return {
    identityCode: row.identity_code,
    defaultRole: row.default_role,
    description: row.description,
  };
}
