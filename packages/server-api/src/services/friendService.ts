import {
  createFriendRelation,
  createFriendRequest,
  findFriendRequestById,
  listFriendRequests,
  listFriends,
  updateFriendRequestStatus,
} from "../repositories/friendRepository";
import { BadRequestError } from "../utils/errors";
import { notifyInApp } from "./notificationService";

/**
 * 发起好友申请。
 */
export async function requestFriend(
  requesterId: string,
  targetId: string,
) {
  if (requesterId === targetId) {
    throw new BadRequestError("不能添加自己为好友");
  }
  const request = await createFriendRequest(requesterId, targetId);
  await notifyInApp(
    targetId,
    "新的好友申请",
    "有人向你发送了好友申请，请在好友申请中处理。",
    "/chat",
  );
  return request;
}

/**
 * 获取好友申请列表。
 */
export async function getFriendRequests(userId: string) {
  return listFriendRequests(userId);
}

/**
 * 处理好友申请（接受或拒绝）。
 */
export async function respondFriendRequest(
  requestId: string,
  targetId: string,
  accept: boolean,
) {
  const request = await findFriendRequestById(requestId);
  if (!request || request.targetId !== targetId) {
    throw new BadRequestError("好友申请不存在");
  }
  await updateFriendRequestStatus(requestId, accept ? "ACCEPTED" : "REJECTED");
  if (accept) {
    await createFriendRelation(request.requesterId, request.targetId);
    await notifyInApp(
      request.requesterId,
      "好友申请已通过",
      "对方已接受你的好友申请，现在可以开始聊天了。",
      "/chat",
    );
  }
}

/**
 * 获取好友列表。
 */
export async function getFriends(userId: string) {
  return listFriends(userId);
}
