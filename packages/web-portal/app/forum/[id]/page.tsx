"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  createForumComment,
  createReport,
  getProfile,
  getForumPostDetail,
  likePost,
  listForumComments,
  listFriends,
  unlikePost,
  requestFriend,
  resolveAvatarUrl,
  type FriendRecord,
  type ForumComment,
  type ForumPost,
  type PublicUserProfile,
} from "../../../lib/api";

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
  // 好友列表数据。
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  // 评论输入内容。
  const [commentText, setCommentText] = useState("");
  // 回复输入内容。
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  // 评论区展开状态。
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  // 二级评论展开状态。
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 评论提交提示（自动消失）。
  const [commentMessage, setCommentMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);
  // 举报弹窗。
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "POST" | "COMMENT" | "USER" | "COUNSELOR";
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
  // 举报弹窗错误提示。
  const [reportError, setReportError] = useState<string | null>(null);
  // 发帖人信息弹窗。
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [activeAuthor, setActiveAuthor] = useState<PublicUserProfile | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const commentTimerRef = useRef<number | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  const friendMessageTimerRef = useRef<number | null>(null);
  const friendErrorTimerRef = useRef<number | null>(null);
  // 举报弹窗错误提示自动清除计时器。
  const reportErrorTimerRef = useRef<number | null>(null);

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
        const [postDetail, commentList, friendList, profile] = await Promise.all([
          getForumPostDetail(postId),
          listForumComments(postId),
          listFriends(),
          getProfile(),
        ]);
        setPost(postDetail);
        setComments(commentList);
        setFriends(friendList);
        setCurrentUserId(profile.id);
      } catch (err) {
        showError(err instanceof Error ? err.message : "加载帖子失败");
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [postId]);

  useEffect(() => {
    return () => {
      if (commentTimerRef.current !== null) {
        window.clearTimeout(commentTimerRef.current);
      }
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

  const showCommentMessage = (text: string) => {
    setCommentMessage(text);
    if (commentTimerRef.current !== null) {
      window.clearTimeout(commentTimerRef.current);
    }
    commentTimerRef.current = window.setTimeout(() => {
      setCommentMessage(null);
    }, 3000);
  };

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

  // 举报弹窗错误提示，3 秒后自动清除。
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

  const openReportModal = (target: {
    type: "POST" | "COMMENT" | "USER" | "COUNSELOR";
    id: string;
    label: string;
    displayName: string;
  }) => {
    setReportTarget(target);
    setReportReason("");
    setReportAttachment(null);
    clearReportError();
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportTarget(null);
    setReportReason("");
    setReportAttachment(null);
    clearReportError();
  };

  const handleReportModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeReportModal();
    }
  };

  const handleReportAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    clearReportError();
    if (!REPORT_ALLOWED_TYPES.has(file.type)) {
      showReportError("仅支持 PNG/JPEG/WEBP 图片");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_REPORT_BYTES) {
      showReportError("图片大小不能超过 2MB");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReportAttachment({ name: file.name, dataUrl });
    } catch (err) {
      showReportError(err instanceof Error ? err.message : "读取图片失败");
      event.target.value = "";
    }
  };

  const handleReportSubmit = async () => {
    if (!reportTarget) {
      return;
    }
    if (!reportReason.trim()) {
      showReportError("请输入文字说明");
      return;
    }
    setError(null);
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

  /**
   * 发布评论。
   */
  const handleComment = async () => {
    if (!commentText) {
      showError("请输入评论内容");
      return;
    }
    setError(null);
    try {
      const comment = await createForumComment({ postId, content: commentText });
      setComments((prev) => [...prev, comment]);
      setCommentText("");
      showCommentMessage("评论已发布");
    } catch (err) {
      showError(err instanceof Error ? err.message : "评论失败");
    }
  };

  const toggleCommentsExpanded = () => {
    setCommentsExpanded((prev) => !prev);
  };

  const toggleRepliesExpanded = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const toggleReplyForm = (commentId: string) => {
    setReplyTargetId((prev) => (prev === commentId ? null : commentId));
    setReplyText("");
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText) {
      showError("请输入回复内容");
      return;
    }
    setError(null);
    try {
      const reply = await createForumComment({
        postId,
        content: replyText,
        parentId,
      });
      setComments((prev) => [...prev, reply]);
      setReplyText("");
      setReplyTargetId(null);
      setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
      showCommentMessage("回复已发布");
    } catch (err) {
      showError(err instanceof Error ? err.message : "回复失败");
    }
  };

  /**
   * 点赞帖子。
   */
  const handleLike = async () => {
    if (!post) {
      return;
    }
    setError(null);
    try {
      const currentLiked = post.liked ?? false;
      const nextLiked = !currentLiked;
      const result = nextLiked ? await likePost(postId) : await unlikePost(postId);
      setPost((prev) => {
        if (!prev) {
          return prev;
        }
        const likeCount = prev.likeCount ?? 0;
        const nextLikeCount = nextLiked
          ? likeCount + 1
          : Math.max(0, likeCount - 1);
        return { ...prev, liked: nextLiked, likeCount: nextLikeCount };
      });
      showMessage(result);
    } catch (err) {
      showError(err instanceof Error ? err.message : "操作失败");
    }
  };

  /**
   * 举报帖子。
   */
  const handleReport = async () => {
    if (!postId) {
      return;
    }
    openReportModal({
      type: "POST",
      id: postId,
      label: "帖子",
      displayName: post?.title || "帖子",
    });
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

  const handleAuthorModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeAuthorModal();
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

  const handleReportAuthor = async () => {
    if (!activeAuthor) {
      return;
    }
    if (activeAuthor.id === currentUserId) {
      return;
    }
    const targetType = activeAuthor.role === "COUNSELOR" ? "COUNSELOR" : "USER";
    const displayName = activeAuthor.nickname || "用户";
    closeAuthorModal();
    openReportModal({
      type: targetType,
      id: activeAuthor.id,
      label: "用户",
      displayName,
    });
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

  const getAuthorName = (author: PublicUserProfile | null | undefined) => {
    if (!author) {
      return "匿名用户";
    }
    if (author.nickname) {
      return author.nickname;
    }
    return "未设置昵称";
  };

  const getAuthorAvatar = (author: PublicUserProfile | null | undefined) =>
    resolveAvatarUrl(author?.avatarUrl) || "/default-avatar.svg";

  const { topLevelComments, repliesByParent, totalComments } = useMemo(() => {
    const topLevel: ForumComment[] = [];
    const replies = new Map<string, ForumComment[]>();
    comments.forEach((comment) => {
      if (comment.parentId) {
        const list = replies.get(comment.parentId) ?? [];
        list.push(comment);
        replies.set(comment.parentId, list);
      } else {
        topLevel.push(comment);
      }
    });
    return { topLevelComments: topLevel, repliesByParent: replies, totalComments: comments.length };
  }, [comments]);

  if (loading) {
    return (
      <AppShell title="帖子详情">
        <div>加载中...</div>
      </AppShell>
    );
  }

  const author = post?.author ?? null;
  const isAnonymous = !author || post?.isAnonymous;
  const authorName = isAnonymous ? "匿名用户" : author?.nickname || "未设置昵称";
  const authorMeta = isAnonymous
    ? "匿名发布"
    : [author?.major, author?.grade].filter(Boolean).join(" · ") || "校园用户";
  const postPublishedAt = post ? formatDateTime(post.createdAt) : "";
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
          : commentMessage
            ? { type: "success" as const, message: commentMessage, onClose: () => setCommentMessage(null) }
            : message
              ? { type: "success" as const, message, onClose: () => setMessage(null) }
              : null;

  return (
    <AppShell title="帖子详情">
      {toast && <CenterToast type={toast.type} message={toast.message} onClose={toast.onClose} />}
      {post ? (
        <div className="card-block">
          <div className="post-detail-header">
            <button
              className="avatar-button"
              type="button"
              onClick={() => openAuthorModal(author)}
              disabled={isAnonymous}
              aria-label={isAnonymous ? "匿名用户" : "查看发帖人信息"}
            >
              <img
                src={resolveAvatarUrl(author?.avatarUrl) || "/default-avatar.svg"}
                alt={`${authorName}头像`}
                onError={(event) => {
                  const target = event.currentTarget;
                  if (!target.src.endsWith("/default-avatar.svg")) {
                    target.src = "/default-avatar.svg";
                  }
                }}
              />
            </button>
            <div className="post-detail-meta">
              <h3>{post.title}</h3>
              <div className="muted">
                作者：{authorName} · {authorMeta}
                {postPublishedAt ? ` · 发布于 ${postPublishedAt}` : ""}
              </div>
            </div>
          </div>
          <p className="post-content">{post.content}</p>
          <div className="button-row">
            <button className="btn btn-secondary" onClick={handleLike}>
              {post.liked ? "👍 已点赞" : "👍 点赞"}
              {post.likeCount ? ` (${post.likeCount})` : ""}
            </button>
            <button className="btn btn-secondary" onClick={handleReport}>
              🚩 举报
            </button>
          </div>
          <div className="comment-section">
            <div className="comment-section-header">
              <h4>评论区</h4>
              <button
                className="btn btn-secondary small"
                type="button"
                onClick={toggleCommentsExpanded}
                aria-expanded={commentsExpanded}
              >
                {commentsExpanded ? "⬆️ 收起评论" : "⬇️ 展开评论"}
                {totalComments ? ` (${totalComments})` : ""}
              </button>
            </div>
            {commentsExpanded && (
              <>
                {topLevelComments.length === 0 ? (
                  <p className="muted">暂无评论。</p>
                ) : (
                  <ul className="comment-list">
                    {topLevelComments.map((comment) => {
                      const replies = repliesByParent.get(comment.id) ?? [];
                      const repliesExpanded = !!expandedReplies[comment.id];
                      const isReplying = replyTargetId === comment.id;
                      const commentAuthorName = getAuthorName(comment.author);
                      const commentAvatarUrl = getAuthorAvatar(comment.author);
                      return (
                        <li key={comment.id} className="comment-item">
                          <div className="comment-main">
                            <button
                              className="comment-avatar"
                              type="button"
                              onClick={() => openAuthorModal(comment.author)}
                              disabled={!comment.author}
                              aria-label={comment.author ? "查看评论人信息" : "匿名用户"}
                            >
                              <img
                                src={commentAvatarUrl}
                                alt={`${commentAuthorName}头像`}
                                onError={(event) => {
                                  const target = event.currentTarget;
                                  if (!target.src.endsWith("/default-avatar.svg")) {
                                    target.src = "/default-avatar.svg";
                                  }
                                }}
                              />
                            </button>
                            <div className="comment-body">
                              <div className="comment-meta">
                                <strong>{commentAuthorName}</strong>
                                <span className="muted">{formatDateTime(comment.createdAt)}</span>
                              </div>
                              <p className="comment-content">{comment.content}</p>
                              <div className="comment-actions">
                                <button
                                  className="ghost-btn small"
                                  type="button"
                                  onClick={() => toggleReplyForm(comment.id)}
                                >
                                  💬 回复
                                </button>
                                <button
                                  className="ghost-btn small"
                                  type="button"
                                  onClick={() => toggleRepliesExpanded(comment.id)}
                                  aria-expanded={repliesExpanded}
                                  disabled={replies.length === 0}
                                >
                                  {repliesExpanded ? "⬆️ 收起回复" : "⬇️ 展开回复"} ({replies.length})
                                </button>
                              </div>
                              {isReplying && (
                                <div className="reply-form">
                                  <textarea
                                    value={replyText}
                                    onChange={(event) => setReplyText(event.target.value)}
                                    placeholder={`回复 ${commentAuthorName}`}
                                  />
                                  <div className="button-row">
                                    <button
                                      className="btn btn-primary small"
                                      type="button"
                                      onClick={() => handleReplySubmit(comment.id)}
                                    >
                                      发送回复
                                    </button>
                                    <button
                                      className="btn btn-secondary small"
                                      type="button"
                                      onClick={() => setReplyTargetId(null)}
                                    >
                                      取消
                                    </button>
                                  </div>
                                </div>
                              )}
                              {repliesExpanded && replies.length > 0 && (
                                <ul className="reply-list">
                                  {replies.map((reply) => {
                                    const replyAuthorName = getAuthorName(reply.author);
                                    const replyAvatarUrl = getAuthorAvatar(reply.author);
                                    return (
                                      <li key={reply.id} className="reply-item">
                                        <div className="comment-main">
                                          <button
                                            className="comment-avatar reply-avatar"
                                            type="button"
                                            onClick={() => openAuthorModal(reply.author)}
                                            disabled={!reply.author}
                                            aria-label={reply.author ? "查看评论人信息" : "匿名用户"}
                                          >
                                            <img
                                              src={replyAvatarUrl}
                                              alt={`${replyAuthorName}头像`}
                                              onError={(event) => {
                                                const target = event.currentTarget;
                                                if (!target.src.endsWith("/default-avatar.svg")) {
                                                  target.src = "/default-avatar.svg";
                                                }
                                              }}
                                            />
                                          </button>
                                          <div className="comment-body">
                                            <div className="comment-meta">
                                              <strong>{replyAuthorName}</strong>
                                              <span className="muted">{formatDateTime(reply.createdAt)}</span>
                                              <span className="muted">回复 {commentAuthorName}</span>
                                            </div>
                                            <p className="comment-content">{reply.content}</p>
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="form-stack">
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="写下你的评论"
                  />
                  <button className="btn btn-primary small" type="button" onClick={handleComment}>
                    💬 发布评论
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <p className="muted">未找到帖子。</p>
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
              <h3 id="author-modal-title">用户信息</h3>
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
    </AppShell>
  );
}
