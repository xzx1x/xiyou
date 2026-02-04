import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type ChatThreadRecord = {
  id: string;
  type: "DIRECT";
  createdAt: Date;
  lastMessageAt: Date | null;
};

export type ChatMessageRecord = {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  revokedAt: Date | null;
  revokedBy: string | null;
};

/**
 * 判断用户是否在指定聊天线程中。
 */
export async function isChatParticipant(
  threadId: string,
  userId: string,
): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT 1 FROM chat_participants WHERE thread_id = ? AND user_id = ? LIMIT 1",
    [threadId, userId],
  );
  return rows.length > 0;
}

/**
 * 创建聊天线程。
 */
export async function createChatThread(): Promise<ChatThreadRecord> {
  const id = crypto.randomUUID();
  const createdAt = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO chat_threads (id, type, created_at) VALUES (?, 'DIRECT', ?)",
    [id, createdAt],
  );
  return {
    id,
    type: "DIRECT",
    createdAt,
    lastMessageAt: null,
  };
}

/**
 * 为线程添加参与者。
 */
export async function addChatParticipant(
  threadId: string,
  userId: string,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO chat_participants (thread_id, user_id, created_at) VALUES (?, ?, ?)",
    [threadId, userId, new Date()],
  );
}

/**
 * 查询用户的聊天线程列表。
 */
export async function listChatThreads(
  userId: string,
): Promise<ChatThreadRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT t.*
     FROM chat_threads t
     INNER JOIN chat_participants p ON t.id = p.thread_id
     WHERE p.user_id = ?
     ORDER BY t.last_message_at DESC, t.created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    createdAt: new Date(row.created_at),
    lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : null,
  }));
}

/**
 * 查询线程消息列表。
 */
export async function listChatMessagesForUser(
  threadId: string,
  userId: string,
  options?: { before?: Date; limit?: number },
): Promise<ChatMessageRecord[]> {
  const limit =
    typeof options?.limit === "number" && Number.isFinite(options.limit) && options.limit > 0
      ? Math.min(Math.floor(options.limit), 50)
      : undefined;
  const params: Array<string | Date | number> = [userId, threadId];
  if (options?.before) {
    params.push(options.before);
  }
  const limitClause = limit ? ` LIMIT ${limit}` : "";
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT m.*
     FROM chat_messages m
     LEFT JOIN chat_message_deletions d
       ON m.id = d.message_id AND d.user_id = ?
     WHERE m.thread_id = ? AND d.message_id IS NULL${options?.before ? " AND m.created_at < ?" : ""}
     ORDER BY m.created_at DESC${limitClause}`,
    params,
  );
  const messages = rows.map(mapChatMessage);
  return messages.reverse();
}

/**
 * 统计用户未读消息数量（排除自己发送）。
 */
export async function countUnreadMessages(userId: string): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM chat_messages m
     INNER JOIN chat_participants p ON m.thread_id = p.thread_id
     LEFT JOIN chat_message_deletions d
       ON m.id = d.message_id AND d.user_id = ?
     WHERE p.user_id = ?
       AND m.sender_id <> ?
       AND m.read_at IS NULL
       AND m.revoked_at IS NULL
       AND d.message_id IS NULL`,
    [userId, userId, userId],
  );
  const countValue = rows[0]?.count ?? 0;
  return Number(countValue);
}

/**
 * 写入一条聊天消息，并同步线程最后活跃时间。
 */
export async function createChatMessage(
  payload: Omit<ChatMessageRecord, "createdAt" | "readAt" | "revokedAt" | "revokedBy">,
): Promise<ChatMessageRecord> {
  const createdAt = new Date();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO chat_messages (id, thread_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
    [payload.id, payload.threadId, payload.senderId, payload.content, createdAt],
  );
  await pool.execute<ResultSetHeader>(
    "UPDATE chat_threads SET last_message_at = ? WHERE id = ?",
    [createdAt, payload.threadId],
  );
  return {
    ...payload,
    createdAt,
    readAt: null,
    revokedAt: null,
    revokedBy: null,
  };
}

/**
 * 根据消息编号读取消息。
 */
export async function findChatMessageById(
  messageId: string,
): Promise<ChatMessageRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM chat_messages WHERE id = ? LIMIT 1",
    [messageId],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapChatMessage(rows[0]!);
}

/**
 * 标记消息为撤回。
 */
export async function markChatMessageRevoked(
  messageId: string,
  userId: string,
): Promise<ChatMessageRecord | null> {
  const revokedAt = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE chat_messages SET revoked_at = ?, revoked_by = ? WHERE id = ? AND revoked_at IS NULL",
    [revokedAt, userId, messageId],
  );
  return findChatMessageById(messageId);
}

/**
 * 记录消息删除（仅对当前用户隐藏）。
 */
export async function createChatMessageDeletion(
  messageId: string,
  userId: string,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "INSERT IGNORE INTO chat_message_deletions (message_id, user_id, created_at) VALUES (?, ?, ?)",
    [messageId, userId, new Date()],
  );
}

/**
 * 标记线程内消息已读（排除自己发送的消息）。
 */
export async function markThreadMessagesRead(
  threadId: string,
  readerId: string,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "UPDATE chat_messages SET read_at = ? WHERE thread_id = ? AND sender_id <> ? AND read_at IS NULL",
    [new Date(), threadId, readerId],
  );
}

/**
 * 查找两个用户之间已存在的私聊线程。
 */
export async function findDirectThreadBetweenUsers(
  userA: string,
  userB: string,
): Promise<ChatThreadRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT t.*
     FROM chat_threads t
     INNER JOIN chat_participants p1 ON t.id = p1.thread_id
     INNER JOIN chat_participants p2 ON t.id = p2.thread_id
     WHERE p1.user_id = ? AND p2.user_id = ?
     LIMIT 1`,
    [userA, userB],
  );
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0]!;
  return {
    id: row.id,
    type: row.type,
    createdAt: new Date(row.created_at),
    lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : null,
  };
}

/**
 * 将数据库行转换为聊天消息记录。
 */
function mapChatMessage(row: RowDataPacket): ChatMessageRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: new Date(row.created_at),
    readAt: row.read_at ? new Date(row.read_at) : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    revokedBy: row.revoked_by ?? null,
  };
}
