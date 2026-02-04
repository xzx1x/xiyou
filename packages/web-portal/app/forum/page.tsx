"use client";

import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import Link from "next/link";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import {
  createForumPost,
  createReport,
  getProfile,
  listForumPosts,
  listFriends,
  requestFriend,
  resolveAvatarUrl,
  type FriendRecord,
  type ForumPost,
  type PublicUserProfile,
} from "../../lib/api";

const REPORT_ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_REPORT_BYTES = 2 * 1024 * 1024;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("读取文件失败"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });

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
  // 好友列表数据。
  const [friends, setFriends] = useState<FriendRecord[]>([]);
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
  // 举报弹窗。
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "USER" | "COUNSELOR";
    id: string;
    label: string;
    displayName: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportAttachment, setReportAttachment] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  // 当前用户编号。
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const friendMessageTimerRef = useRef<number | null>(null);
  const friendErrorTimerRef = useRef<number | null>(null);
  const reportErrorTimerRef = useRef<number | null>(null);

  /**
   * 加载帖子列表。
   */
  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      setError(null);
      try {
        const [list, friendList, profile] = await Promise.all([
          listForumPosts(),
          listFriends(),
          getProfile(),
        ]);
        setPosts(list);
        setFriends(friendList);
        setCurrentUserId(profile.id);
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
      if (reportErrorTimerRef.current !== null) {
        window.clearTimeout(reportErrorTimerRef.current);
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

  const clearReportError = () => {
    setReportError(null);
    if (reportErrorTimerRef.current !== null) {
      window.clearTimeout(reportErrorTimerRef.current);
      reportErrorTimerRef.current = null;
    }
  };

  const showReportError = (text: string) => {
    setReportError(text);
    if (reportErrorTimerRef.current !== null) {
      window.clearTimeout(reportErrorTimerRef.current);
    }
    reportErrorTimerRef.current = window.setTimeout(() => {
      setReportError(null);
      reportErrorTimerRef.current = null;
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
      showMessage("帖子已提交，已存证");
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

  const openReportModal = (author: PublicUserProfile) => {
    const targetType = author.role === "COUNSELOR" ? "COUNSELOR" : "USER";
    const displayName = author.nickname || "用户";
    setReportTarget({
      type: targetType,
      id: author.id,
      label: "用户",
      displayName,
    });
    setReportReason("");
    setReportAttachment(null);
    clearReportError();
    setReportModalOpen(true);
  };

  const closeAuthorModal = () => {
    setAuthorModalOpen(false);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportTarget(null);
    setReportReason("");
    setReportAttachment(null);
    clearReportError();
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

  const handleReportModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeReportModal();
    }
  };

  const handleReportAttachmentChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setReportAttachment(null);
      return;
    }
    clearReportError();
    if (!REPORT_ALLOWED_TYPES.has(file.type)) {
      showReportError("仅支持 PNG/JPEG/WEBP 图片");
      return;
    }
    if (file.size > MAX_REPORT_BYTES) {
      showReportError("图片大小不能超过 2MB");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReportAttachment({ name: file.name, dataUrl });
    } catch (err) {
      showReportError(err instanceof Error ? err.message : "读取图片失败");
    }
  };

  const handleReportSubmit = async () => {
    if (!reportTarget) {
      showReportError("未找到举报对象");
      return;
    }
    if (!reportReason.trim()) {
      showReportError("请输入文字说明");
      return;
    }
    clearReportError();
    setReportSubmitting(true);
    try {
      const result = await createReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
        attachmentDataUrl: reportAttachment?.dataUrl,
      });
      showMessage("举报已提交，等待管理员审核");
      closeReportModal();
    } catch (err) {
      showReportError(err instanceof Error ? err.message : "举报提交失败");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleRequestFriend = async () => {
    if (!activeAuthor) {
      return;
    }
    if (friends.some((friend) => friend.friendId === activeAuthor.id)) {
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

  const handleReportAuthor = () => {
    if (!activeAuthor) {
      return;
    }
    closeAuthorModal();
    openReportModal(activeAuthor);
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

  const isSelf = !!activeAuthor && activeAuthor.id === currentUserId;
  const isFriend =
    !!activeAuthor && friends.some((friend) => friend.friendId === activeAuthor.id);
  const toast = reportError
    ? { type: "error" as const, message: reportError, onClose: () => setReportError(null) }
    : friendError
      ? { type: "error" as const, message: friendError, onClose: () => setFriendError(null) }
      : error
        ? { type: "error" as const, message: error, onClose: () => setError(null) }
        : friendMessage
          ? { type: "success" as const, message: friendMessage, onClose: () => setFriendMessage(null) }
          : message
            ? { type: "success" as const, message, onClose: () => setMessage(null) }
            : null;

  return (
    <AppShell title="论坛社区" description="发帖需要先审核后发布。">
      {toast && <CenterToast type={toast.type} message={toast.message} onClose={toast.onClose} />}
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
            {!isSelf && (
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleRequestFriend}
                  disabled={friendLoading || isFriend}
                >
                  {isFriend ? "已是好友" : "➕ 添加好友"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={handleReportAuthor}>
                  🚩 举报
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {reportModalOpen && reportTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onClick={handleReportModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="report-modal-title">提交举报</h3>
              <button className="btn btn-secondary" type="button" onClick={closeReportModal}>
                关闭
              </button>
            </div>
            <div className="form-stack">
              <div className="report-target">
                <span>举报对象</span>
                <strong>{reportTarget.label}</strong>
                <span className="muted">{reportTarget.displayName}</span>
              </div>
              <label className="inline-field">
                <span>提交图片（可选）</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleReportAttachmentChange}
                />
              </label>
              <span className="muted report-modal-note">可选，仅支持 PNG/JPEG/WEBP，且大小不超过 2MB。</span>
              {reportAttachment && (
                <div className="report-attachment-preview">
                  <img src={reportAttachment.dataUrl} alt="举报图片预览" />
                  <span className="muted">{reportAttachment.name}</span>
                </div>
              )}
              <label className="inline-field">
                <span>文字说明</span>
                <textarea
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="请描述举报原因"
                />
              </label>
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleReportSubmit}
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? "提交中..." : "提交举报"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={closeReportModal}>
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
