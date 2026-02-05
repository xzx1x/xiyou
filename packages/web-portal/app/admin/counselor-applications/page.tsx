"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  listCounselorApplications,
  reviewCounselorApplication,
  resolveAvatarUrl,
  type CounselorApplication,
  type PublicUserProfile,
} from "../../../lib/api";

/**
 * 管理员心理师审批页面。
 */
export default function AdminCounselorApplicationsPage() {
  // 申请列表数据。
  const [applications, setApplications] = useState<CounselorApplication[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);
  // 拒绝申请弹窗状态。
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  // 当前正在处理的申请。
  const [activeApplication, setActiveApplication] = useState<CounselorApplication | null>(null);
  // 用户信息弹窗状态。
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<PublicUserProfile | null>(null);
  // 拒绝原因输入。
  const [rejectReason, setRejectReason] = useState("");
  // 拒绝提交状态。
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const parseAttachmentUrls = (attachmentUrls?: string | null) => {
    if (!attachmentUrls) {
      return [];
    }
    if (attachmentUrls.startsWith("data:")) {
      return [attachmentUrls];
    }
    return attachmentUrls
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => resolveAvatarUrl(item));
  };

  /**
   * 加载申请列表。
   */
  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCounselorApplications();
      setApplications(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载申请失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
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
  const openRejectModal = (application: CounselorApplication) => {
    setActiveApplication(application);
    setRejectReason("");
    setRejectSubmitting(false);
    setRejectModalOpen(true);
  };

  /**
   * 关闭拒绝弹窗并清理状态。
   */
  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setActiveApplication(null);
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

  const openProfileModal = (profile: PublicUserProfile | null | undefined) => {
    if (!profile) {
      return;
    }
    setActiveProfile(profile);
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setActiveProfile(null);
  };

  const handleProfileModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeProfileModal();
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

  /**
   * 通过心理师申请。
   */
  const handleApprove = async (applicationId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await reviewCounselorApplication(applicationId, {
        status: "APPROVED",
      });
      setMessage(result);
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "审核失败");
    }
  };

  /**
   * 提交拒绝原因。
   */
  const handleRejectSubmit = async () => {
    if (!activeApplication) {
      return;
    }
    setMessage(null);
    setError(null);
    setRejectSubmitting(true);
    try {
      const result = await reviewCounselorApplication(activeApplication.id, {
        status: "REJECTED",
        reviewReason: rejectReason.trim() || undefined,
      });
      setMessage(result);
      closeRejectModal();
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "审核失败");
    } finally {
      setRejectSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="心理师审批" requiredRoles={["ADMIN"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="心理师审批" requiredRoles={["ADMIN"]}>
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
        <h3>申请记录</h3>
        {applications.length === 0 ? (
          <p className="muted">暂无申请记录。</p>
        ) : (
          <ul className="list">
            {applications.map((application) => {
              const isPending = application.status === "PENDING";
              const statusLabel =
                application.status === "APPROVED"
                  ? "已同意"
                  : application.status === "REJECTED"
                    ? "已拒绝"
                    : "待审核";
              return (
              <li key={application.id}>
                <div>
                  <div className="applicant-summary">
                    <img
                      className="message-avatar"
                      src={
                        resolveAvatarUrl(application.applicantProfile?.avatarUrl) ||
                        "/default-avatar.svg"
                      }
                      alt={`${application.applicantProfile?.nickname ?? "用户"}头像`}
                      onClick={() => openProfileModal(application.applicantProfile ?? null)}
                      onError={(event) => {
                        const target = event.currentTarget;
                        if (!target.src.endsWith("/default-avatar.svg")) {
                          target.src = "/default-avatar.svg";
                        }
                      }}
                    />
                    <div className="message-list-meta">
                      <strong>
                        申请人：{application.applicantProfile?.nickname ?? "未设置昵称"}
                      </strong>
                    </div>
                  </div>
                  <div className="muted">状态：{statusLabel}</div>
                  <div className="muted">
                    申请时间：{new Date(application.createdAt).toLocaleString("zh-CN")}
                  </div>
                  <div className="muted">
                    为什么要当心理师：{application.qualifications ?? "未填写"}
                  </div>
                  <div className="muted">
                    遇到危机情况应该怎么做：{application.motivation ?? "未填写"}
                  </div>
                  <div className="muted">
                    附件：
                    {parseAttachmentUrls(application.attachmentUrls).length === 0 ? (
                      "未上传"
                    ) : (
                      <div className="button-row">
                        {parseAttachmentUrls(application.attachmentUrls).map((url, index) => (
                          <a
                            key={`${application.id}-attachment-${index}`}
                            className="btn btn-secondary small"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            查看附件 {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {isPending ? (
                  <div className="button-row">
                    <button className="btn btn-secondary" onClick={() => handleApprove(application.id)}>
                      通过
                    </button>
                    <button className="btn btn-secondary" onClick={() => openRejectModal(application)}>
                      拒绝
                    </button>
                  </div>
                ) : (
                  <div className="button-row">
                    <button className="btn btn-secondary" type="button" disabled>
                      {statusLabel}
                    </button>
                  </div>
                )}
              </li>
            );
            })}
          </ul>
        )}
      </div>
      {rejectModalOpen && activeApplication && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
          onClick={handleRejectModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="reject-modal-title">拒绝申请</h3>
              <button className="btn btn-secondary" type="button" onClick={closeRejectModal}>
                关闭
              </button>
            </div>
            <div className="form-stack">
              <div className="report-target">
                <span>申请人</span>
                <strong>
                  {activeApplication?.applicantProfile?.nickname ?? "未设置昵称"}
                </strong>
              </div>
              <div className="report-target">
                <span>附件</span>
                {parseAttachmentUrls(activeApplication.attachmentUrls).length === 0 ? (
                  <strong>未上传</strong>
                ) : (
                  <div className="button-row">
                    {parseAttachmentUrls(activeApplication.attachmentUrls).map((url, index) => (
                      <a
                        key={`${activeApplication.id}-modal-attachment-${index}`}
                        className="btn btn-secondary small"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        查看附件 {index + 1}
                      </a>
                    ))}
                  </div>
                )}
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
      {profileModalOpen && activeProfile && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          onClick={handleProfileModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="profile-modal-title">用户信息</h3>
              <button className="btn btn-secondary" type="button" onClick={closeProfileModal}>
                关闭
              </button>
            </div>
            <div className="author-summary">
              <div className="author-avatar">
                <img
                  src={resolveAvatarUrl(activeProfile.avatarUrl) || "/default-avatar.svg"}
                  alt={`${activeProfile.nickname ?? "用户"}头像`}
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (!target.src.endsWith("/default-avatar.svg")) {
                      target.src = "/default-avatar.svg";
                    }
                  }}
                />
              </div>
              <div className="author-summary-meta">
                <strong>{activeProfile.nickname ?? "未设置昵称"}</strong>
                <span className="muted">{formatRole(activeProfile.role)}</span>
              </div>
            </div>
            <div className="account-meta">
              <div>
                <span>性别</span>
                <strong>{activeProfile.gender ?? "未填写"}</strong>
              </div>
              <div>
                <span>专业</span>
                <strong>{activeProfile.major ?? "未填写"}</strong>
              </div>
              <div>
                <span>年级</span>
                <strong>{activeProfile.grade ?? "未填写"}</strong>
              </div>
              <div>
                <span>身份</span>
                <strong>{formatRole(activeProfile.role)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
