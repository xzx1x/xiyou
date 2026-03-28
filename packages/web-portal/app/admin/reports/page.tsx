"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  getReportTargetDetail,
  listReports,
  resolveAvatarUrl,
  resolveReport,
  type ReportRecord,
  type ReportTargetDetail,
  type ReportTargetUserSummary,
  type UserRole,
} from "../../../lib/api";

function formatReportTargetType(targetType: ReportRecord["targetType"]) {
  switch (targetType) {
    case "POST":
      return "论坛帖子";
    case "COMMENT":
      return "论坛评论";
    case "USER":
      return "用户";
    case "COUNSELOR":
      return "心理师";
    default:
      return targetType;
  }
}

function getResolveTargetActionHint(targetType: ReportRecord["targetType"]) {
  switch (targetType) {
    case "POST":
      return "勾选后将下架帖子，普通用户不可再查看。";
    case "COMMENT":
      return "勾选后将删除评论内容，普通用户将看到已删除状态。";
    case "USER":
      return "勾选后将封禁该用户账号。";
    case "COUNSELOR":
      return "勾选后将封禁该心理师账号。";
    default:
      return null;
  }
}

function formatRoleLabel(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "管理员";
    case "COUNSELOR":
      return "心理师";
    case "USER":
      return "普通用户";
    default:
      return role;
  }
}

function formatServiceMode(serviceMode: "ONLINE" | "OFFLINE" | "BOTH") {
  switch (serviceMode) {
    case "ONLINE":
      return "线上";
    case "OFFLINE":
      return "线下";
    case "BOTH":
      return "线上 + 线下";
    default:
      return serviceMode;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN");
}

function formatUserName(user?: ReportTargetUserSummary | null) {
  if (!user) {
    return "未知";
  }
  return user.nickname?.trim() || user.email;
}

function renderDetailBlock(label: string, content: ReactNode) {
  return (
    <label className="inline-field">
      <span>{label}</span>
      <div className="muted">{content}</div>
    </label>
  );
}

function renderUserDetail(user: ReportTargetUserSummary) {
  return (
    <>
      {renderDetailBlock("账号", user.email)}
      {renderDetailBlock("昵称", user.nickname || "-")}
      {renderDetailBlock("身份码", user.identityCode)}
      {renderDetailBlock("角色", formatRoleLabel(user.role))}
      {renderDetailBlock("性别", user.gender || "-")}
      {renderDetailBlock("专业", user.major || "-")}
      {renderDetailBlock("年级", user.grade || "-")}
      {renderDetailBlock(
        "状态",
        user.isDisabled ? `已禁用${user.disabledReason ? `：${user.disabledReason}` : ""}` : "正常",
      )}
      {renderDetailBlock("注册时间", formatDateTime(user.createdAt))}
      {user.avatarUrl &&
        renderDetailBlock(
          "头像",
          <img
            src={resolveAvatarUrl(user.avatarUrl)}
            alt={`${formatUserName(user)}头像`}
            style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12 }}
          />,
        )}
    </>
  );
}

function renderTargetDetail(detail: ReportTargetDetail | null) {
  if (!detail) {
    return null;
  }
  if (!detail.found) {
    return <p className="muted">举报对象已不存在，或已无法读取详细信息。</p>;
  }
  if (detail.type === "POST" && detail.post) {
    return (
      <div className="form-stack">
        {renderDetailBlock("对象类型", "论坛帖子")}
        {renderDetailBlock("标题", detail.post.title)}
        {renderDetailBlock("作者", formatUserName(detail.post.author))}
        {renderDetailBlock("状态", detail.post.status)}
        {renderDetailBlock("发布时间", formatDateTime(detail.post.createdAt))}
        {renderDetailBlock(
          "内容",
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{detail.post.content}</div>,
        )}
      </div>
    );
  }
  if (detail.type === "COMMENT" && detail.comment) {
    return (
      <div className="form-stack">
        {renderDetailBlock("对象类型", "论坛评论")}
        {renderDetailBlock("所属帖子", detail.comment.postTitle || detail.comment.postId)}
        {renderDetailBlock("评论作者", formatUserName(detail.comment.author))}
        {renderDetailBlock(
          "评论层级",
          detail.comment.parentId ? `回复评论 ${detail.comment.parentId}` : "一级评论",
        )}
        {renderDetailBlock("发布时间", formatDateTime(detail.comment.createdAt))}
        {renderDetailBlock(
          "内容",
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{detail.comment.content}</div>,
        )}
      </div>
    );
  }
  if (detail.type === "USER" && detail.user) {
    return <div className="form-stack">{renderUserDetail(detail.user)}</div>;
  }
  if (detail.type === "COUNSELOR") {
    return (
      <div className="form-stack">
        {detail.user && renderUserDetail(detail.user)}
        {detail.counselor && (
          <>
            {renderDetailBlock("服务方式", formatServiceMode(detail.counselor.serviceMode))}
            {renderDetailBlock("擅长方向", detail.counselor.specialties || "-")}
            {renderDetailBlock("简介", detail.counselor.bio || "-")}
            {renderDetailBlock("办公地点", detail.counselor.officeLocation || "-")}
            {renderDetailBlock("接单状态", detail.counselor.isActive ? "启用" : "停用")}
          </>
        )}
      </div>
    );
  }
  return <p className="muted">暂不支持显示该举报对象的详细信息。</p>;
}

/**
 * 管理员举报处理页面。
 */
export default function AdminReportsPage() {
  // 举报列表数据。
  const [reports, setReports] = useState<ReportRecord[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);
  // 处理举报弹窗。
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportRecord | null>(null);
  const [resolveActionTaken, setResolveActionTaken] = useState("");
  const [resolveDisableTarget, setResolveDisableTarget] = useState(false);
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailReport, setDetailReport] = useState<ReportRecord | null>(null);
  const [targetDetail, setTargetDetail] = useState<ReportTargetDetail | null>(null);

  /**
   * 加载举报列表。
   */
  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listReports("PENDING");
      setReports(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载举报失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
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

  useEffect(() => {
    if (!resolveError) {
      return;
    }
    const timer = window.setTimeout(() => setResolveError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [resolveError]);

  const openResolveModal = (report: ReportRecord) => {
    setActiveReport(report);
    setResolveActionTaken("");
    setResolveDisableTarget(false);
    setResolveError(null);
    setResolveModalOpen(true);
  };

  const closeResolveModal = () => {
    setResolveModalOpen(false);
    setActiveReport(null);
    setResolveActionTaken("");
    setResolveDisableTarget(false);
    setResolveError(null);
  };

  const openDetailModal = async (report: ReportRecord) => {
    setDetailModalOpen(true);
    setDetailReport(report);
    setTargetDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const detail = await getReportTargetDetail(report.id);
      setTargetDetail(detail);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "加载对象详情失败");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setDetailLoading(false);
    setDetailError(null);
    setDetailReport(null);
    setTargetDetail(null);
  };

  const handleResolveModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeResolveModal();
    }
  };

  const handleDetailModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeDetailModal();
    }
  };

  /**
   * 处理举报。
   */
  const handleResolveSubmit = async () => {
    if (!activeReport) {
      return;
    }
    setMessage(null);
    setError(null);
    setResolveError(null);
    setResolveSubmitting(true);
    try {
      const result = await resolveReport(activeReport.id, {
        actionTaken: resolveActionTaken.trim() || undefined,
        disableTarget: resolveDisableTarget,
      });
      setMessage(result);
      closeResolveModal();
      await loadReports();
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "处理失败");
    } finally {
      setResolveSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="举报处理" requiredRoles={["ADMIN"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="举报处理" requiredRoles={["ADMIN"]}>
      {(resolveError || error || message) && (
        <CenterToast
          type={resolveError || error ? "error" : "success"}
          message={resolveError ?? error ?? message ?? ""}
          onClose={() => {
            setResolveError(null);
            setError(null);
            setMessage(null);
          }}
        />
      )}
      <div className="card-block">
        <h3>待处理举报</h3>
        {reports.length === 0 ? (
          <p className="muted">暂无待处理举报。</p>
        ) : (
          <ul className="list">
            {reports.map((report) => (
              <li key={report.id}>
                <div>
                  <button
                    className="ghost-btn small"
                    type="button"
                    onClick={() => void openDetailModal(report)}
                  >
                    查看对象：{formatReportTargetType(report.targetType)}
                  </button>
                  <div className="muted">原因：{report.reason}</div>
                  <div className="muted">对象编号：{report.targetId}</div>
                  {report.attachmentUrl && (
                    <div className="report-attachment">
                      <a
                        href={resolveAvatarUrl(report.attachmentUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        查看附件
                      </a>
                      <img
                        src={resolveAvatarUrl(report.attachmentUrl)}
                        alt="举报附件"
                      />
                    </div>
                  )}
                </div>
                <button className="btn btn-secondary" onClick={() => openResolveModal(report)}>
                  处理举报
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {resolveModalOpen && activeReport && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolve-modal-title"
          onClick={handleResolveModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="resolve-modal-title">处理举报</h3>
              <button className="btn btn-secondary" type="button" onClick={closeResolveModal}>
                关闭
              </button>
            </div>
            <div className="form-stack">
              <div className="report-target">
                <span>举报对象</span>
                <strong>{formatReportTargetType(activeReport.targetType)}</strong>
                <button
                  className="ghost-btn small"
                  type="button"
                  onClick={() => void openDetailModal(activeReport)}
                >
                  查看对象详情
                </button>
              </div>
              <label className="inline-field">
                <span>处理意见</span>
                <textarea
                  value={resolveActionTaken}
                  onChange={(event) => setResolveActionTaken(event.target.value)}
                  placeholder="请输入处理意见"
                />
              </label>
              <label className="inline-field">
                <span>封禁对象</span>
                <input
                  type="checkbox"
                  checked={resolveDisableTarget}
                  onChange={(event) => setResolveDisableTarget(event.target.checked)}
                />
              </label>
              {getResolveTargetActionHint(activeReport.targetType) && (
                <span className="muted">{getResolveTargetActionHint(activeReport.targetType)}</span>
              )}
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleResolveSubmit}
                  disabled={resolveSubmitting}
                >
                  {resolveSubmitting ? "提交中..." : "提交处理"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={closeResolveModal}>
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {detailModalOpen && detailReport && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
          onClick={handleDetailModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="detail-modal-title">举报对象详情</h3>
              <button className="btn btn-secondary" type="button" onClick={closeDetailModal}>
                关闭
              </button>
            </div>
            <div className="form-stack">
              <div className="report-target">
                <span>举报对象</span>
                <strong>{formatReportTargetType(detailReport.targetType)}</strong>
                <span className="muted">对象编号：{detailReport.targetId}</span>
              </div>
              {detailLoading ? (
                <p className="muted">正在加载对象详情...</p>
              ) : detailError ? (
                <p className="muted">{detailError}</p>
              ) : (
                renderTargetDetail(targetDetail)
              )}
              <div className="button-row">
                <button className="btn btn-secondary" type="button" onClick={closeDetailModal}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
