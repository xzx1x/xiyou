import {
  createFriendRelation,
  createFriendRequest,
  findFriendRequestById,
  listFriendRequests,
  listFriends,
  updateFriendRequestStatus,
} from "../repositories/friendRepository";
import {
  listUsersByIds,
  searchUsersByKeyword,
  type UserRecord,
  type UserRole,
} from "../repositories/userRepository";
import { BadRequestError } from "../utils/errors";
import { notifyInApp } from "./notificationService";

export type PublicFriendProfile = {
  id: string;
  nickname: string | null;
  gender: string | null;
  major: string | null;
  grade: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

// 好友申请列表项，附带申请人公开信息。
export type FriendRequestWithProfile = {
  id: string;
  requesterId: string;
  targetId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  requesterProfile: PublicFriendProfile | null;
};

function toPublicProfile(user: UserRecord): PublicFriendProfile {
  return {
    id: user.id,
    nickname: user.nickname,
    gender: user.gender,
    major: user.major,
    grade: user.grade,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

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
  const requests = await listFriendRequests(userId);
  if (requests.length === 0) {
    return [];
  }
  const requesterIds = Array.from(new Set(requests.map((request) => request.requesterId)));
  const users = await listUsersByIds(requesterIds);
  const profileMap = new Map(users.map((user) => [user.id, toPublicProfile(user)]));
  return requests.map((request) => ({
    ...request,
    requesterProfile: profileMap.get(request.requesterId) ?? null,
  }));
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
  const friends = await listFriends(userId);
  if (friends.length === 0) {
    return [];
  }
  const friendIds = friends.map((friend) => friend.friendId);
  const users = await listUsersByIds(friendIds);
  const profileMap = new Map(users.map((user) => [user.id, toPublicProfile(user)]));
  return friends.map((friend) => ({
    ...friend,
    profile: profileMap.get(friend.friendId) ?? null,
  }));
}

/**
 * 根据关键词搜索可添加好友的用户。
 */
export async function searchFriendCandidates(
  userId: string,
  keyword: string,
) {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }
  const users = await searchUsersByKeyword(trimmed);
  const friends = await listFriends(userId);
  const friendIdSet = new Set(friends.map((friend) => friend.friendId));
  return users
    .filter((user) => user.id !== userId && !friendIdSet.has(user.id))
    .map(toPublicProfile);
}
