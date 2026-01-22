import {
  createForumComment,
  createForumPost,
  findForumPostById,
  listForumComments,
  listForumPosts,
  updateForumPostStatus,
  likeForumPost,
  unlikeForumPost,
  countForumLikes,
  type ForumPostStatus,
} from "../repositories/forumRepository";
import { listUsersByRole } from "../repositories/userRepository";
import { BadRequestError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";
import { notifyInApp } from "./notificationService";

export type ForumPostInput = {
  title: string;
  content: string;
  isAnonymous?: boolean;
};

export type ForumCommentInput = {
  postId: string;
  content: string;
};

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
    isAnonymous: payload.isAnonymous ?? false,
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
    summary: "匿名论坛帖子发布",
  });
  const admins = await listUsersByRole("ADMIN");
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
  return { post: record, evidence };
}

/**
 * 获取帖子列表。
 */
export async function getPosts(status?: ForumPostStatus) {
  return listForumPosts({ status });
}

/**
 * 获取帖子详情并附带点赞数。
 */
export async function getPostDetail(postId: string) {
  const post = await findForumPostById(postId);
  if (!post) {
    throw new BadRequestError("帖子不存在");
  }
  const likeCount = await countForumLikes(postId);
  return { ...post, likeCount };
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
  return createForumComment({
    id: crypto.randomUUID(),
    postId: payload.postId,
    authorId,
    content: payload.content,
    createdAt: new Date(),
  });
}

/**
 * 获取评论列表。
 */
export async function getComments(postId: string) {
  return listForumComments(postId);
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
