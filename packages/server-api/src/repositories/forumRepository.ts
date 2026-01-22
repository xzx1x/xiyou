import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type ForumPostStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ForumPostRecord = {
  id: string;
  authorId: string | null;
  title: string;
  content: string;
  status: ForumPostStatus;
  isAnonymous: boolean;
  reviewReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ForumCommentRecord = {
  id: string;
  postId: string;
  authorId: string | null;
  content: string;
  createdAt: Date;
};

/**
 * 创建论坛帖子。
 */
export async function createForumPost(
  payload: ForumPostRecord,
): Promise<ForumPostRecord> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO forum_posts (id, author_id, title, content, status, is_anonymous, review_reason, reviewed_by, reviewed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.id,
      payload.authorId ?? null,
      payload.title,
      payload.content,
      payload.status,
      payload.isAnonymous ? 1 : 0,
      payload.reviewReason ?? null,
      payload.reviewedBy ?? null,
      payload.reviewedAt ?? null,
      payload.createdAt,
      payload.updatedAt,
    ],
  );
  return payload;
}

/**
 * 更新帖子审核状态。
 */
export async function updateForumPostStatus(
  id: string,
  status: ForumPostStatus,
  reviewedBy: string,
  reviewReason?: string | null,
): Promise<void> {
  const now = new Date();
  await pool.execute<ResultSetHeader>(
    "UPDATE forum_posts SET status = ?, review_reason = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?",
    [status, reviewReason ?? null, reviewedBy, now, now, id],
  );
}

/**
 * 查询帖子详情。
 */
export async function findForumPostById(
  id: string,
): Promise<ForumPostRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM forum_posts WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapForumPost(rows[0]!);
}

/**
 * 查询帖子列表。
 */
export async function listForumPosts(
  options: { status?: ForumPostStatus },
): Promise<ForumPostRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    options.status
      ? "SELECT * FROM forum_posts WHERE status = ? ORDER BY created_at DESC"
      : "SELECT * FROM forum_posts ORDER BY created_at DESC",
    options.status ? [options.status] : [],
  );
  return rows.map(mapForumPost);
}

/**
 * 创建评论。
 */
export async function createForumComment(
  payload: ForumCommentRecord,
): Promise<ForumCommentRecord> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO forum_comments (id, post_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
    [
      payload.id,
      payload.postId,
      payload.authorId ?? null,
      payload.content,
      payload.createdAt,
    ],
  );
  return payload;
}

/**
 * 查询帖子评论列表。
 */
export async function listForumComments(
  postId: string,
): Promise<ForumCommentRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM forum_comments WHERE post_id = ? ORDER BY created_at ASC",
    [postId],
  );
  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: new Date(row.created_at),
  }));
}

/**
 * 点赞帖子（重复点赞会抛出数据库主键错误）。
 */
export async function likeForumPost(
  postId: string,
  userId: string,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "INSERT INTO forum_likes (post_id, user_id, created_at) VALUES (?, ?, ?)",
    [postId, userId, new Date()],
  );
}

/**
 * 取消点赞。
 */
export async function unlikeForumPost(
  postId: string,
  userId: string,
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "DELETE FROM forum_likes WHERE post_id = ? AND user_id = ?",
    [postId, userId],
  );
}

/**
 * 统计帖子点赞数。
 */
export async function countForumLikes(postId: string): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM forum_likes WHERE post_id = ?",
    [postId],
  );
  if (rows.length === 0) {
    return 0;
  }
  return Number(rows[0]!.total ?? 0);
}

function mapForumPost(row: RowDataPacket): ForumPostRecord {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    content: row.content,
    status: row.status,
    isAnonymous: Boolean(row.is_anonymous),
    reviewReason: row.review_reason,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
