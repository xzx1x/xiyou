"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
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

  /**
   * 处理举报。
   */
  const handleResolve = async (reportId: string) => {
    setMessage(null);
    setError(null);
    try {
      const actionTaken = window.prompt("请输入处理意见") ?? "";
      const disableTarget = window.confirm("是否封禁该举报对象？");
      const result = await resolveReport(reportId, {
        actionTaken: actionTaken || undefined,
        disableTarget,
      });
      setMessage(result);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
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
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
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
                  <div className="muted">对象编号：{report.targetId}</div>
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
                <button className="btn btn-secondary" onClick={() => handleResolve(report.id)}>
                  处理举报
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
