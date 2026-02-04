"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
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
  // 拒绝帖子弹窗状态。
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  // 当前正在处理的帖子。
  const [activePost, setActivePost] = useState<ForumPost | null>(null);
  // 拒绝原因输入。
  const [rejectReason, setRejectReason] = useState("");
  // 拒绝提交状态。
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

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

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  /**
   * 打开拒绝原因弹窗。
   */
  const openRejectModal = (post: ForumPost) => {
    setActivePost(post);
    setRejectReason("");
    setRejectSubmitting(false);
    setRejectModalOpen(true);
  };

  /**
   * 关闭拒绝弹窗并清理状态。
   */
  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setActivePost(null);
    setRejectReason("");
    setRejectSubmitting(false);
  };

  /**
   * 点击遮罩层关闭弹窗。
   */
  const handleRejectModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeRejectModal();
    }
  };

  /**
   * 通过帖子审核。
   */
  const handleApprove = async (postId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await reviewForumPost(postId, {
        status: "APPROVED",
      });
      setMessage(result);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "审核失败");
    }
  };

  /**
   * 提交拒绝原因。
   */
  const handleRejectSubmit = async () => {
    if (!activePost) {
      return;
    }
    setMessage(null);
    setError(null);
    setRejectSubmitting(true);
    try {
      const result = await reviewForumPost(activePost.id, {
        status: "REJECTED",
        reviewReason: rejectReason.trim() || undefined,
      });
      setMessage(result);
      closeRejectModal();
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "审核失败");
    } finally {
      setRejectSubmitting(false);
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
      {(error || message) && (
        <CenterToast
          type={error ? "error" : "success"}
          message={error ?? message ?? ""}
          onClose={() => {
            setError(null);
            setMessage(null);
          }}
        />
      )}
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
                  <div className="muted">
                    作者：
                    {post.isAnonymous
                      ? "匿名用户"
                      : post.author?.nickname ?? post.authorId ?? "未知"}
                  </div>
                </div>
                <div className="button-row">
                  <button className="btn btn-secondary" onClick={() => handleApprove(post.id)}>
                    通过
                  </button>
                  <button className="btn btn-secondary" onClick={() => openRejectModal(post)}>
                    拒绝
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {rejectModalOpen && activePost && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
          onClick={handleRejectModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="reject-modal-title">拒绝帖子</h3>
              <button className="btn btn-secondary" type="button" onClick={closeRejectModal}>
                关闭
              </button>
            </div>
            <div className="form-stack">
              <div className="report-target">
                <span>帖子标题</span>
                <strong>{activePost.title}</strong>
              </div>
              <label className="inline-field">
                <span>拒绝原因</span>
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="请输入拒绝原因"
                />
              </label>
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleRejectSubmit}
                  disabled={rejectSubmitting}
                >
                  {rejectSubmitting ? "提交中..." : "提交拒绝"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={closeRejectModal}>
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
