import {
  addChatParticipant,
  countUnreadMessages,
  createChatMessageDeletion,
  createChatMessage,
  createChatThread,
  findDirectThreadBetweenUsers,
  findChatMessageById,
  isChatParticipant,
  listChatMessagesForUser,
  listChatThreads,
  markChatMessageRevoked,
  markThreadMessagesRead,
} from "../repositories/chatRepository";
import { notifyInApp } from "./notificationService";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

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
export async function getMessages(
  threadId: string,
  userId: string,
  options?: { before?: Date; limit?: number },
) {
  return listChatMessagesForUser(threadId, userId, options);
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

/**
 * 获取用户未读聊天数量。
 */
export async function getUnreadChatCount(userId: string) {
  return countUnreadMessages(userId);
}

/**
 * 删除消息（仅当前用户可见）。
 */
export async function deleteMessageForUser(
  messageId: string,
  userId: string,
) {
  const message = await findChatMessageById(messageId);
  if (!message) {
    throw new BadRequestError("消息不存在");
  }
  const allowed = await isChatParticipant(message.threadId, userId);
  if (!allowed) {
    throw new UnauthorizedError("无权操作该聊天");
  }
  await createChatMessageDeletion(messageId, userId);
  return message;
}

/**
 * 撤回消息（双方不可见）。
 */
export async function revokeMessage(
  messageId: string,
  userId: string,
) {
  const message = await findChatMessageById(messageId);
  if (!message) {
    throw new BadRequestError("消息不存在");
  }
  if (message.senderId !== userId) {
    throw new BadRequestError("只能撤回自己消息");
  }
  const allowed = await isChatParticipant(message.threadId, userId);
  if (!allowed) {
    throw new UnauthorizedError("无权操作该聊天");
  }
  if (message.revokedAt) {
    throw new BadRequestError("消息已撤回");
  }
  const elapsed = Date.now() - message.createdAt.getTime();
  if (elapsed > 5 * 60 * 1000) {
    throw new BadRequestError("五分钟后的消息无法撤销");
  }
  const revoked = await markChatMessageRevoked(messageId, userId);
  if (!revoked) {
    throw new BadRequestError("撤回失败");
  }
  return revoked;
}
