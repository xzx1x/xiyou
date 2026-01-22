"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { listForumPosts, reviewForumPost, type ForumPost } from "../../../lib/api";

/**
 * 管理员论坛审核页面。
 */
export default function AdminForumReviewPage() {
  // 待审核帖子列表。
  const [posts, setPosts] = useState<ForumPost[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载待审核帖子。
   */
  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listForumPosts("PENDING");
      setPosts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载帖子失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  /**
   * 审核帖子。
   */
  const handleReview = async (postId: string, status: "APPROVED" | "REJECTED") => {
    setMessage(null);
    setError(null);
    try {
      const reviewReason = status === "REJECTED" ? window.prompt("请输入拒绝原因") ?? "" : "";
      const result = await reviewForumPost(postId, {
        status,
        reviewReason: reviewReason || undefined,
      });
      setMessage(result);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "审核失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="论坛审核" requiredRoles={["ADMIN"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="论坛审核" requiredRoles={["ADMIN"]}>
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="card-block">
        <h3>待审核帖子</h3>
        {posts.length === 0 ? (
          <p className="muted">暂无待审核帖子。</p>
        ) : (
          <ul className="list">
            {posts.map((post) => (
              <li key={post.id}>
                <div>
                  <strong>{post.title}</strong>
                  <div className="muted">作者：{post.authorId ?? "匿名"}</div>
                </div>
                <div className="button-row">
                  <button className="btn btn-secondary" onClick={() => handleReview(post.id, "APPROVED")}>
                    通过
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleReview(post.id, "REJECTED")}>
                    拒绝
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
