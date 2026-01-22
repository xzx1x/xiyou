import type { Context } from "koa";
import { getNotifications, markNotificationAsRead } from "../services/notificationService";

/**
 * 读取当前用户的通知列表。
 */
export async function listNotifications(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const notifications = await getNotifications(authUser.sub);
  ctx.status = 200;
  ctx.body = { notifications };
}

/**
 * 将指定通知标记为已读。
 */
export async function readNotification(ctx: Context) {
  const authUser = ctx.state.user;
  if (!authUser) {
    ctx.throw(401, "未授权");
  }
  const id = ctx.params.id;
  await markNotificationAsRead(authUser.sub, id);
  ctx.status = 200;
  ctx.body = { message: "通知已读" };
}
