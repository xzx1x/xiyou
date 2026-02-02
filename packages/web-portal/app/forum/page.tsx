"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { AppShell } from "../../components/layouts/AppShell";
import {
  createForumPost,
  listForumPosts,
  requestFriend,
  resolveAvatarUrl,
  type ForumPost,
  type PublicUserProfile,
} from "../../lib/api";

/**
 * 论坛首页：展示帖子与发布入口。
 */
export default function ForumPage() {
  // 帖子列表数据。
  const [posts, setPosts] = useState<ForumPost[]>([]);
  // 新帖子表单数据。
  const [form, setForm] = useState({
    title: "",
    content: "",
  });
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);
  // 发布帖子弹窗。
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // 发帖人信息弹窗。
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [activeAuthor, setActiveAuthor] = useState<PublicUserProfile | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [friendError, setFriendError] = useState<string | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const friendMessageTimerRef = useRef<number | null>(null);
  const friendErrorTimerRef = useRef<number | null>(null);

  /**
   * 加载帖子列表。
   */
  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      setError(null);
      try {
        const list = await listForumPosts();
        setPosts(list);
      } catch (err) {
        showError(err instanceof Error ? err.message : "加载帖子失败");
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current !== null) {
        window.clearTimeout(messageTimerRef.current);
      }
      if (errorTimerRef.current !== null) {
        window.clearTimeout(errorTimerRef.current);
      }
      if (friendMessageTimerRef.current !== null) {
        window.clearTimeout(friendMessageTimerRef.current);
      }
      if (friendErrorTimerRef.current !== null) {
        window.clearTimeout(friendErrorTimerRef.current);
      }
    };
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const showError = (text: string) => {
    setError(text);
    if (errorTimerRef.current !== null) {
      window.clearTimeout(errorTimerRef.current);
    }
    errorTimerRef.current = window.setTimeout(() => {
      setError(null);
    }, 3000);
  };

  const showFriendMessage = (text: string) => {
    setFriendMessage(text);
    if (friendMessageTimerRef.current !== null) {
      window.clearTimeout(friendMessageTimerRef.current);
    }
    friendMessageTimerRef.current = window.setTimeout(() => {
      setFriendMessage(null);
    }, 3000);
  };

  const showFriendError = (text: string) => {
    setFriendError(text);
    if (friendErrorTimerRef.current !== null) {
      window.clearTimeout(friendErrorTimerRef.current);
    }
    friendErrorTimerRef.current = window.setTimeout(() => {
      setFriendError(null);
    }, 3000);
  };

  const openCreateModal = () => {
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
  };

  /**
   * 发布帖子。
   */
  const handleCreate = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await createForumPost({
        title: form.title,
        content: form.content,
      });
      setPosts((prev) => [result.post, ...prev]);
      showMessage(`帖子已提交，存证编号：${result.evidence.id}`);
      setForm({ title: "", content: "" });
      closeCreateModal();
    } catch (err) {
      showError(err instanceof Error ? err.message : "发布失败");
    }
  };

  const openAuthorModal = (author: PublicUserProfile | null | undefined) => {
    if (!author) {
      return;
    }
    setActiveAuthor(author);
    setFriendMessage(null);
    setFriendError(null);
    setAuthorModalOpen(true);
  };

  const closeAuthorModal = () => {
    setAuthorModalOpen(false);
  };

  const handleCreateModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeCreateModal();
    }
  };

  const handleAuthorModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeAuthorModal();
    }
  };

  const handleRequestFriend = async () => {
    if (!activeAuthor) {
      return;
    }
    setFriendLoading(true);
    setFriendMessage(null);
    setFriendError(null);
    try {
      await requestFriend({ targetId: activeAuthor.id });
      showFriendMessage("好友申请已发送");
    } catch (err) {
      showFriendError(err instanceof Error ? err.message : "好友申请发送失败");
    } finally {
      setFriendLoading(false);
    }
  };

  const formatRole = (role: PublicUserProfile["role"]) => {
    if (role === "ADMIN") {
      return "管理员";
    }
    if (role === "COUNSELOR") {
      return "心理咨询师";
    }
    return "学生";
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <AppShell title="论坛社区">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="论坛社区" description="发帖需要先审核后发布。">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="forum-toolbar">
        <button className="btn btn-secondary" type="button" onClick={openCreateModal}>
          📝 发布帖子
        </button>
      </div>
      <div className="card-block">
        <h3>最新帖子</h3>
        {posts.length === 0 ? (
          <p className="muted">暂无帖子。</p>
        ) : (
          <div className="post-list">
            {posts.map((post) => {
              const author = post.author ?? null;
              const isAnonymous = post.isAnonymous || !author;
              const authorName = isAnonymous
                ? "匿名用户"
                : author?.nickname || "未设置昵称";
              const authorMeta = isAnonymous
                ? "匿名发布"
                : [author?.major, author?.grade].filter(Boolean).join(" · ") || "校园用户";
              const avatarUrl = resolveAvatarUrl(author?.avatarUrl) || "/default-avatar.svg";
              const publishedAt = formatDateTime(post.createdAt);
              return (
                <article key={post.id} className="post-card">
                  <div className="post-card-header">
                    <button
                      className="avatar-button"
                      type="button"
                      onClick={() => openAuthorModal(author)}
                      disabled={isAnonymous}
                      aria-label={isAnonymous ? "匿名用户" : "查看发帖人信息"}
                    >
                      <img
                        src={avatarUrl}
                        alt={`${authorName}头像`}
                        onError={(event) => {
                          const target = event.currentTarget;
                          if (!target.src.endsWith("/default-avatar.svg")) {
                            target.src = "/default-avatar.svg";
                          }
                        }}
                      />
                    </button>
                    <div className="post-card-body">
                      <div className="post-author-line">
                        <strong>{authorName}</strong>
                        <span className="muted">{authorMeta}</span>
                      </div>
                      <div className="post-title">{post.title}</div>
                      {publishedAt && <div className="muted">发布时间：{publishedAt}</div>}
                      <p className="post-excerpt">{post.content}</p>
                    </div>
                  </div>
                  <div className="post-card-actions">
                    <Link className="btn btn-secondary" href={`/forum/${post.id}`}>
                      🔍 查看详情
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {createModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-post-title"
          onClick={handleCreateModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="create-post-title">发布帖子</h3>
              <button className="btn btn-secondary" type="button" onClick={closeCreateModal}>
                关闭
              </button>
            </div>
            <div className="form-stack">
              <label className="inline-field">
                <span>标题</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label className="inline-field">
                <span>内容</span>
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </label>
              <div className="button-row">
                <button className="btn btn-primary" type="button" onClick={handleCreate}>
                  📝 提交审核
                </button>
                <button className="btn btn-secondary" type="button" onClick={closeCreateModal}>
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {authorModalOpen && activeAuthor && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="author-modal-title"
          onClick={handleAuthorModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="author-modal-title">发帖人信息</h3>
              <button className="btn btn-secondary" type="button" onClick={closeAuthorModal}>
                关闭
              </button>
            </div>
            <div className="author-summary">
              <div className="author-avatar">
                <img
                  src={resolveAvatarUrl(activeAuthor.avatarUrl) || "/default-avatar.svg"}
                  alt={`${activeAuthor.nickname ?? "发帖人"}头像`}
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (!target.src.endsWith("/default-avatar.svg")) {
                      target.src = "/default-avatar.svg";
                    }
                  }}
                />
              </div>
              <div className="author-summary-meta">
                <strong>{activeAuthor.nickname ?? "未设置昵称"}</strong>
                <span className="muted">{formatRole(activeAuthor.role)}</span>
              </div>
            </div>
            <div className="account-meta">
              <div>
                <span>性别</span>
                <strong>{activeAuthor.gender ?? "未填写"}</strong>
              </div>
              <div>
                <span>专业</span>
                <strong>{activeAuthor.major ?? "未填写"}</strong>
              </div>
              <div>
                <span>年级</span>
                <strong>{activeAuthor.grade ?? "未填写"}</strong>
              </div>
              <div>
                <span>身份</span>
                <strong>{formatRole(activeAuthor.role)}</strong>
              </div>
            </div>
            <div className="button-row">
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleRequestFriend}
                disabled={friendLoading}
              >
                ➕ 添加好友
              </button>
              {friendMessage && <div className="notice">{friendMessage}</div>}
              {friendError && <div className="status error">{friendError}</div>}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
