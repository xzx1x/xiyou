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
export async function listChatMessages(
  threadId: string,
): Promise<ChatMessageRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC",
    [threadId],
  );
  return rows.map(mapChatMessage);
}

/**
 * 写入一条聊天消息，并同步线程最后活跃时间。
 */
export async function createChatMessage(
  payload: Omit<ChatMessageRecord, "createdAt" | "readAt">,
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
  };
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
  };
}
