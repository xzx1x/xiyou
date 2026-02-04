import type { Context } from "koa";
import { chatMessageSchema, chatThreadSchema } from "../schemas/chatSchema";
import { isChatParticipant } from "../repositories/chatRepository";
import {
  deleteMessageForUser,
  getMessages,
  getOrCreateThread,
  getThreads,
  getUnreadChatCount,
  markThreadRead,
  revokeMessage,
  sendMessage,
} from "../services/chatService";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

/**
 * 获取当前用户的聊天线程列表。
 */
export async function listChatThreads(ctx: Context) {
  // 当前登录用户，用于查询所属线程。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const threads = await getThreads(authUser.sub);
  ctx.status = 200;
  ctx.body = { threads };
}

/**
 * 创建或获取与指定用户的私聊线程。
 */
export async function createChatThread(ctx: Context) {
  // 当前登录用户，用于创建私聊线程。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = chatThreadSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("聊天对象不合法", {
      issues: parsed.error.flatten(),
    });
  }
  if (parsed.data.peerId === authUser.sub) {
    throw new BadRequestError("不能与自己创建聊天");
  }
  const thread = await getOrCreateThread(authUser.sub, parsed.data.peerId);
  ctx.status = 201;
  ctx.body = { thread };
}

/**
 * 查询线程消息列表。
 */
export async function listChatMessages(ctx: Context) {
  // 当前登录用户，用于校验线程权限。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const threadId = ctx.params.id;
  if (!threadId) {
    throw new BadRequestError("线程编号不能为空");
  }
  const allowed = await isChatParticipant(threadId, authUser.sub);
  if (!allowed) {
    throw new UnauthorizedError("无权查看该聊天");
  }
  const limit =
    typeof ctx.query.limit === "string" ? Number.parseInt(ctx.query.limit, 10) : undefined;
  const beforeRaw = typeof ctx.query.before === "string" ? ctx.query.before : "";
  const before =
    beforeRaw && !Number.isNaN(Date.parse(beforeRaw)) ? new Date(beforeRaw) : undefined;
  const messages = await getMessages(threadId, authUser.sub, {
    limit: limit && Number.isFinite(limit) ? limit : undefined,
    before,
  });
  ctx.status = 200;
  ctx.body = { messages };
}

/**
 * 发送聊天消息。
 */
export async function sendChatMessage(ctx: Context) {
  // 当前登录用户，用于确认消息发送者。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const threadId = ctx.params.id;
  if (!threadId) {
    throw new BadRequestError("线程编号不能为空");
  }
  const parsed = chatMessageSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("消息内容不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const senderAllowed = await isChatParticipant(threadId, authUser.sub);
  const receiverAllowed = await isChatParticipant(
    threadId,
    parsed.data.receiverId,
  );
  if (!senderAllowed || !receiverAllowed) {
    throw new UnauthorizedError("聊天参与者不合法");
  }
  const message = await sendMessage(
    threadId,
    authUser.sub,
    parsed.data.receiverId,
    parsed.data.content,
  );
  ctx.status = 201;
  ctx.body = { message };
}

/**
 * 标记线程消息为已读。
 */
export async function markChatThreadRead(ctx: Context) {
  // 当前登录用户，用于标记读取状态。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const threadId = ctx.params.id;
  if (!threadId) {
    throw new BadRequestError("线程编号不能为空");
  }
  const allowed = await isChatParticipant(threadId, authUser.sub);
  if (!allowed) {
    throw new UnauthorizedError("无权操作该聊天");
  }
  await markThreadRead(threadId, authUser.sub);
  ctx.status = 200;
  ctx.body = { message: "已标记为已读" };
}

/**
 * 获取未读消息数量。
 */
export async function getChatUnreadCount(ctx: Context) {
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const count = await getUnreadChatCount(authUser.sub);
  ctx.status = 200;
  ctx.body = { count };
}

/**
 * 删除聊天消息（仅当前用户不可见）。
 */
export async function deleteChatMessage(ctx: Context) {
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const messageId = ctx.params.id;
  if (!messageId) {
    throw new BadRequestError("消息编号不能为空");
  }
  await deleteMessageForUser(messageId, authUser.sub);
  ctx.status = 200;
  ctx.body = { message: "已删除" };
}

/**
 * 撤回聊天消息。
 */
export async function revokeChatMessage(ctx: Context) {
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const messageId = ctx.params.id;
  if (!messageId) {
    throw new BadRequestError("消息编号不能为空");
  }
  const message = await revokeMessage(messageId, authUser.sub);
  ctx.status = 200;
  ctx.body = { message };
}
