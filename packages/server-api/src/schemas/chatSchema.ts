import { z } from "zod";

// 创建或获取聊天线程时的校验。
export const chatThreadSchema = z.object({
  peerId: z.string().min(1, "对方用户编号不能为空"),
});

// 发送聊天消息时的校验。
export const chatMessageSchema = z.object({
  content: z.string().min(1, "消息内容不能为空").max(2000),
  receiverId: z.string().min(1, "接收方编号不能为空"),
});
