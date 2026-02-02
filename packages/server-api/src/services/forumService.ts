import {
  createForumComment,
  createForumPost,
  findForumCommentById,
  findForumPostById,
  listForumComments,
  listForumPosts,
  updateForumPostStatus,
  likeForumPost,
  unlikeForumPost,
  countForumLikes,
  hasForumLike,
  type ForumPostStatus,
  type ForumPostRecord,
  type ForumCommentRecord,
} from "../repositories/forumRepository";
import {
  findUserById,
  listUsersByIds,
  listUsersByRole,
  type UserRecord,
  type UserRole,
} from "../repositories/userRepository";
import { BadRequestError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";
import { notifyInApp } from "./notificationService";

export type PublicUserProfile = {
  id: string;
  nickname: string | null;
  gender: string | null;
  major: string | null;
  grade: string | null;
  avatarUrl: string | null;
  role: UserRole;
};

export type ForumPostInput = {
  title: string;
  content: string;
  isAnonymous?: boolean;
};

export type ForumCommentInput = {
  postId: string;
  parentId?: string;
  content: string;
};

function toPublicProfile(user: UserRecord): PublicUserProfile {
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

async function attachAuthors(posts: ForumPostRecord[]) {
  const authorIds = Array.from(
    new Set(posts.map((post) => post.authorId).filter((id): id is string => !!id)),
  );
  const users = await listUsersByIds(authorIds);
  const authorMap = new Map(users.map((user) => [user.id, toPublicProfile(user)]));
  return posts.map((post) => ({
    ...post,
    author: post.isAnonymous || !post.authorId ? null : authorMap.get(post.authorId) ?? null,
  }));
}

async function attachCommentAuthors(comments: ForumCommentRecord[]) {
  const authorIds = Array.from(
    new Set(comments.map((comment) => comment.authorId).filter((id): id is string => !!id)),
  );
  const users = await listUsersByIds(authorIds);
  const authorMap = new Map(users.map((user) => [user.id, toPublicProfile(user)]));
  return comments.map((comment) => ({
    ...comment,
    author: comment.authorId ? authorMap.get(comment.authorId) ?? null : null,
  }));
}

/**
 * 发布帖子，默认进入待审核状态。
 */
export async function createPost(
  authorId: string,
  payload: ForumPostInput,
) {
  const record = await createForumPost({
    id: crypto.randomUUID(),
    authorId,
    title: payload.title,
    content: payload.content,
    status: "PENDING",
    isAnonymous: false,
    reviewReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  // 生成帖子存证占位，等待审核通过后可上链。
  const evidence = await createEvidencePlaceholder({
    targetType: "FORUM_POST",
    targetId: record.id,
    summary: "论坛帖子发布",
  });
  const admins = await listUsersByRole("ADMIN");
  const author = await findUserById(authorId);
  const authorProfile = author ? toPublicProfile(author) : null;
  await Promise.all(
    admins.map((admin) =>
      notifyInApp(
        admin.id,
        "新的帖子待审核",
        `有新的帖子待审核：${record.title}`,
        "/admin/forum-review",
      ),
    ),
  );
  return { post: { ...record, author: authorProfile }, evidence };
}

/**
 * 获取帖子列表。
 */
export async function getPosts(status?: ForumPostStatus) {
  const posts = await listForumPosts({ status });
  return attachAuthors(posts);
}

/**
 * 获取帖子详情并附带点赞信息。
 */
export async function getPostDetail(postId: string, userId?: string | null) {
  const post = await findForumPostById(postId);
  if (!post) {
    throw new BadRequestError("帖子不存在");
  }
  const likeCount = await countForumLikes(postId);
  const liked = userId ? await hasForumLike(postId, userId) : false;
  let authorProfile: PublicUserProfile | null = null;
  if (!post.isAnonymous && post.authorId) {
    const author = await findUserById(post.authorId);
    authorProfile = author ? toPublicProfile(author) : null;
  }
  return { ...post, likeCount, liked, author: authorProfile };
}

/**
 * 管理员审核帖子。
 */
export async function reviewPost(
  postId: string,
  status: ForumPostStatus,
  reviewerId: string,
  reviewReason?: string | null,
) {
  await updateForumPostStatus(postId, status, reviewerId, reviewReason ?? null);
  const post = await findForumPostById(postId);
  if (post && post.authorId) {
    await notifyInApp(
      post.authorId,
      "帖子审核结果",
      status === "APPROVED" ? "你的帖子已通过审核。" : "你的帖子未通过审核。",
      "/forum",
    );
  }
}

/**
 * 发布评论（评论无需审核）。
 */
export async function addComment(
  authorId: string,
  payload: ForumCommentInput,
) {
  const post = await findForumPostById(payload.postId);
  if (!post || post.status !== "APPROVED") {
    throw new BadRequestError("帖子尚未通过审核");
  }
  let parentId: string | null = null;
  if (payload.parentId) {
    const parent = await findForumCommentById(payload.parentId);
    if (!parent || parent.postId !== payload.postId) {
      throw new BadRequestError("回复的评论不存在");
    }
    if (parent.parentId) {
      throw new BadRequestError("最多只支持二级评论");
    }
    parentId = parent.id;
  }
  const record = await createForumComment({
    id: crypto.randomUUID(),
    postId: payload.postId,
    authorId,
    parentId,
    content: payload.content,
    createdAt: new Date(),
  });
  const author = await findUserById(authorId);
  return {
    ...record,
    author: author ? toPublicProfile(author) : null,
  };
}

/**
 * 获取评论列表。
 */
export async function getComments(postId: string) {
  const comments = await listForumComments(postId);
  return attachCommentAuthors(comments);
}

/**
 * 点赞帖子。
 */
export async function likePost(postId: string, userId: string) {
  await likeForumPost(postId, userId);
}

/**
 * 取消点赞。
 */
export async function unlikePost(postId: string, userId: string) {
  await unlikeForumPost(postId, userId);
}
