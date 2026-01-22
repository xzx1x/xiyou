import type { Context } from "koa";
import {
  forumCommentSchema,
  forumPostSchema,
  forumReviewSchema,
} from "../schemas/forumSchema";
import {
  addComment,
  createPost,
  getComments,
  getPostDetail,
  getPosts,
  likePost,
  reviewPost,
  unlikePost,
} from "../services/forumService";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

/**
 * 发布论坛帖子（进入待审核）。
 */
export async function createForumPost(ctx: Context) {
  // 当前登录用户，用于绑定帖子作者。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = forumPostSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("帖子信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await createPost(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

/**
 * 获取帖子列表，管理员可筛选状态。
 */
export async function listForumPosts(ctx: Context) {
  const authUser = ctx.state.user as { role?: string } | undefined;
  // 管理员可用的状态筛选参数。
  const statusRaw = ctx.query.status;
  const statusCandidate =
    typeof statusRaw === "string"
      ? statusRaw
      : undefined;
  if (statusCandidate && !["PENDING", "APPROVED", "REJECTED"].includes(statusCandidate)) {
    throw new BadRequestError("帖子状态不合法");
  }
  const status = statusCandidate as "PENDING" | "APPROVED" | "REJECTED" | undefined;
  const effectiveStatus =
    authUser?.role === "ADMIN" ? status : "APPROVED";
  const posts = await getPosts(effectiveStatus);
  ctx.status = 200;
  ctx.body = { posts };
}

/**
 * 获取帖子详情。
 */
export async function getForumPostDetail(ctx: Context) {
  // 当前登录用户，用于校验帖子可见性。
  const authUser = ctx.state.user as { role?: string } | undefined;
  if (!authUser?.role) {
    ctx.throw(401, "未授权");
  }
  const postId = ctx.params.id;
  if (!postId) {
    throw new BadRequestError("帖子编号不能为空");
  }
  const post = await getPostDetail(postId);
  if (post.status !== "APPROVED" && authUser.role !== "ADMIN") {
    throw new UnauthorizedError("帖子尚未通过审核");
  }
  ctx.status = 200;
  ctx.body = { post };
}

/**
 * 管理员审核帖子。
 */
export async function reviewForumPost(ctx: Context) {
  // 当前登录管理员，用于写入审核人。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const postId = ctx.params.id;
  if (!postId) {
    throw new BadRequestError("帖子编号不能为空");
  }
  const parsed = forumReviewSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("审核信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  await reviewPost(
    postId,
    parsed.data.status,
    authUser.sub,
    parsed.data.reviewReason ?? null,
  );
  ctx.status = 200;
  ctx.body = { message: "审核完成" };
}

/**
 * 发布评论（评论无需审核）。
 */
export async function createForumComment(ctx: Context) {
  // 当前登录用户，用于绑定评论作者。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = forumCommentSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("评论信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const comment = await addComment(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = { comment };
}

/**
 * 获取指定帖子的评论列表。
 */
export async function listForumComments(ctx: Context) {
  // 当前登录用户，用于校验帖子是否可见。
  const authUser = ctx.state.user as { role?: string } | undefined;
  if (!authUser?.role) {
    ctx.throw(401, "未授权");
  }
  const postId = ctx.params.id;
  if (!postId) {
    throw new BadRequestError("帖子编号不能为空");
  }
  const post = await getPostDetail(postId);
  if (post.status !== "APPROVED" && authUser.role !== "ADMIN") {
    throw new UnauthorizedError("帖子尚未通过审核");
  }
  const comments = await getComments(postId);
  ctx.status = 200;
  ctx.body = { comments };
}

/**
 * 点赞帖子。
 */
export async function likeForumPost(ctx: Context) {
  // 当前登录用户，用于写入点赞关系。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const postId = ctx.params.id;
  if (!postId) {
    throw new BadRequestError("帖子编号不能为空");
  }
  await likePost(postId, authUser.sub);
  ctx.status = 200;
  ctx.body = { message: "已点赞" };
}

/**
 * 取消点赞。
 */
export async function unlikeForumPost(ctx: Context) {
  // 当前登录用户，用于移除点赞关系。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const postId = ctx.params.id;
  if (!postId) {
    throw new BadRequestError("帖子编号不能为空");
  }
  await unlikePost(postId, authUser.sub);
  ctx.status = 200;
  ctx.body = { message: "已取消点赞" };
}
