import {
  addChatParticipant,
  createChatMessage,
  createChatThread,
  findDirectThreadBetweenUsers,
  listChatMessages,
  listChatThreads,
  markThreadMessagesRead,
} from "../repositories/chatRepository";
import { notifyInApp } from "./notificationService";

/**
 * 创建或获取已有的私聊线程。
 */
export async function getOrCreateThread(userId: string, peerId: string) {
  const existing = await findDirectThreadBetweenUsers(userId, peerId);
  if (existing) {
    return existing;
  }
  const thread = await createChatThread();
  await addChatParticipant(thread.id, userId);
  await addChatParticipant(thread.id, peerId);
  return thread;
}

/**
 * 获取用户的聊天线程列表。
 */
export async function getThreads(userId: string) {
  return listChatThreads(userId);
}

/**
 * 获取线程消息。
 */
export async function getMessages(threadId: string) {
  return listChatMessages(threadId);
}

/**
 * 发送消息并写入通知。
 */
export async function sendMessage(
  threadId: string,
  senderId: string,
  receiverId: string,
  content: string,
) {
  const message = await createChatMessage({
    id: crypto.randomUUID(),
    threadId,
    senderId,
    content,
  });
  await notifyInApp(
    receiverId,
    "收到新消息",
    "你有新的聊天消息，请及时查看。",
    `/chat?thread=${threadId}`,
  );
  return message;
}

/**
 * 标记线程消息已读。
 */
export async function markThreadRead(threadId: string, userId: string) {
  await markThreadMessagesRead(threadId, userId);
}
