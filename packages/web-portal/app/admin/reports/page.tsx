"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import { listReports, resolveAvatarUrl, resolveReport, type ReportRecord } from "../../../lib/api";

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

  const handleResolveModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeResolveModal();
    }
  };

  /**
   * 处理举报。
   */
  const handleResolveSubmit = async () => {
    if (!activeReport) {
      return;
    }
    const canDisableTarget =
      activeReport.targetType === "USER" || activeReport.targetType === "COUNSELOR";
    setMessage(null);
    setError(null);
    setResolveError(null);
    setResolveSubmitting(true);
    try {
      const result = await resolveReport(activeReport.id, {
        actionTaken: resolveActionTaken.trim() || undefined,
        disableTarget: canDisableTarget ? resolveDisableTarget : false,
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
                  <strong>举报对象：{report.targetType}</strong>
                  <div className="muted">原因：{report.reason}</div>
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
                <strong>{activeReport.targetType}</strong>
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
                  disabled={
                    activeReport.targetType !== "USER" && activeReport.targetType !== "COUNSELOR"
                  }
                  onChange={(event) => setResolveDisableTarget(event.target.checked)}
                />
              </label>
              {activeReport.targetType !== "USER" && activeReport.targetType !== "COUNSELOR" && (
                <span className="muted">仅支持封禁用户或心理师。</span>
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
    </AppShell>
  );
}
