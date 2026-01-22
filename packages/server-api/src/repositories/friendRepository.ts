import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type FriendRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type FriendRequestRecord = {
  id: string;
  requesterId: string;
  targetId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type FriendRecord = {
  userId: string;
  friendId: string;
  createdAt: Date;
};

/**
 * 创建好友申请。
 */
export async function createFriendRequest(
  requesterId: string,
  targetId: string,
): Promise<FriendRequestRecord> {
  const id = crypto.randomUUID();
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO friend_requests (id, requester_id, target_id, status, created_at, updated_at) VALUES (?, ?, ?, 'PENDING', ?, ?)",
    [id, requesterId, targetId, now, now],
  );
  return {
    id,
    requesterId,
    targetId,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 查询用户收到的好友申请。
 */
export async function listFriendRequests(
  userId: string,
): Promise<FriendRequestRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM friend_requests WHERE target_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map(mapFriendRequest);
}

/**
 * 读取单条好友申请。
 */
export async function findFriendRequestById(
  id: string,
): Promise<FriendRequestRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM friend_requests WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapFriendRequest(rows[0]!);
}

/**
 * 更新好友申请状态。
 */
export async function updateFriendRequestStatus(
  id: string,
  status: FriendRequestStatus,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE friend_requests SET status = ?, updated_at = ? WHERE id = ?",
    [status, now, id],
  );
}

/**
 * 写入好友关系（双向）。
 */
export async function createFriendRelation(
  userId: string,
  friendId: string,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)",
    [userId, friendId, now],
  );
  await pool.execute<ResultSetHeader>(
    "INSERT INTO friends (user_id, friend_id, created_at) VALUES (?, ?, ?)",
    [friendId, userId, now],
  );
}

/**
 * 查询用户好友列表。
 */
export async function listFriends(userId: string): Promise<FriendRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM friends WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map((row) => ({
    userId: row.user_id,
    friendId: row.friend_id,
    createdAt: new Date(row.created_at),
  }));
}

function mapFriendRequest(row: RowDataPacket): FriendRequestRecord {
  return {
    id: row.id,
    requesterId: row.requester_id,
    targetId: row.target_id,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
