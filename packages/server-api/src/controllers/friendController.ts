import type { Context } from "koa";
import { friendRequestSchema, friendResponseSchema } from "../schemas/friendSchema";
import {
  getFriendRequests,
  getFriends,
  requestFriend,
  respondFriendRequest,
} from "../services/friendService";
import { BadRequestError } from "../utils/errors";

/**
 * 发起好友申请。
 */
export async function createFriendRequest(ctx: Context) {
  // 当前登录用户，用于发起好友申请。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = friendRequestSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("好友申请信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const request = await requestFriend(authUser.sub, parsed.data.targetId);
  ctx.status = 201;
  ctx.body = { request };
}

/**
 * 查询当前用户收到的好友申请列表。
 */
export async function listFriendRequests(ctx: Context) {
  // 当前登录用户，用于查询申请列表。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const requests = await getFriendRequests(authUser.sub);
  ctx.status = 200;
  ctx.body = { requests };
}

/**
 * 处理好友申请（接受或拒绝）。
 */
export async function respondFriendRequestAction(ctx: Context) {
  // 当前登录用户，用于处理自身收到的申请。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const requestId = ctx.params.id;
  if (!requestId) {
    throw new BadRequestError("申请编号不能为空");
  }
  const parsed = friendResponseSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("处理信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  await respondFriendRequest(requestId, authUser.sub, parsed.data.accept);
  ctx.status = 200;
  ctx.body = { message: "处理成功" };
}

/**
 * 查询好友列表。
 */
export async function listFriends(ctx: Context) {
  // 当前登录用户，用于查询好友列表。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const friends = await getFriends(authUser.sub);
  ctx.status = 200;
  ctx.body = { friends };
}
