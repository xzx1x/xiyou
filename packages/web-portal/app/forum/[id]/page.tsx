"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../components/layouts/AppShell";
import {
  createForumComment,
  getForumPostDetail,
  likePost,
  listForumComments,
  unlikePost,
  type ForumComment,
  type ForumPost,
} from "../../../lib/api";

/**
 * 论坛帖子详情页面。
 */
export default function ForumDetailPage() {
  const params = useParams();
  // 路由参数中的帖子编号。
  const postId = String(params?.id ?? "");
  // 帖子详情数据。
  const [post, setPost] = useState<ForumPost | null>(null);
  // 评论列表数据。
  const [comments, setComments] = useState<ForumComment[]>([]);
  // 评论输入内容。
  const [commentText, setCommentText] = useState("");
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载帖子详情与评论列表。
   */
  useEffect(() => {
    async function loadDetail() {
      if (!postId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [postDetail, commentList] = await Promise.all([
          getForumPostDetail(postId),
          listForumComments(postId),
        ]);
        setPost(postDetail);
        setComments(commentList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载帖子失败");
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [postId]);

  /**
   * 发布评论。
   */
  const handleComment = async () => {
    if (!commentText) {
      setError("请输入评论内容");
      return;
    }
    setError(null);
    try {
      const comment = await createForumComment({ postId, content: commentText });
      setComments((prev) => [...prev, comment]);
      setCommentText("");
      setMessage("评论已发布");
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论失败");
    }
  };

  /**
   * 点赞或取消点赞。
   */
  const handleLike = async (liked: boolean) => {
    setError(null);
    try {
      const result = liked ? await unlikePost(postId) : await likePost(postId);
      setMessage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="帖子详情">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="帖子详情">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      {post ? (
        <div className="card-block">
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <div className="button-row">
            <button className="btn btn-secondary" onClick={() => handleLike(false)}>
              点赞
            </button>
            <button className="btn btn-secondary" onClick={() => handleLike(true)}>
              取消点赞
            </button>
          </div>
          <h4>评论区</h4>
          {comments.length === 0 ? (
            <p className="muted">暂无评论。</p>
          ) : (
            <ul className="list">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <strong>{comment.authorId ?? "匿名用户"}</strong>：{comment.content}
                </li>
              ))}
            </ul>
          )}
          <div className="form-stack">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="写下你的评论"
            />
            <button className="btn btn-primary" onClick={handleComment}>
              发布评论
            </button>
          </div>
        </div>
      ) : (
        <p className="muted">未找到帖子。</p>
      )}
    </AppShell>
  );
}
