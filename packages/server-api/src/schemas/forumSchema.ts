import { z } from "zod";

// 论坛帖子创建校验。
export const forumPostSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200),
  content: z.string().min(1, "内容不能为空").max(10000),
  isAnonymous: z.boolean().optional(),
});

// 评论提交校验。
export const forumCommentSchema = z.object({
  postId: z.string().min(1, "帖子编号不能为空"),
  content: z.string().min(1, "评论不能为空").max(2000),
});

// 管理员审核帖子校验。
export const forumReviewSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  reviewReason: z.string().max(1000).optional(),
});
