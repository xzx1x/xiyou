"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import {
  listCounselorApplications,
  reviewCounselorApplication,
  type CounselorApplication,
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

  /**
   * 加载申请列表。
   */
  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCounselorApplications("PENDING");
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
   * 审核申请。
   */
  const handleReview = async (applicationId: string, status: "APPROVED" | "REJECTED") => {
    setMessage(null);
    setError(null);
    try {
      const reviewReason = status === "REJECTED" ? window.prompt("请输入拒绝原因") ?? "" : "";
      const result = await reviewCounselorApplication(applicationId, {
        status,
        reviewReason: reviewReason || undefined,
      });
      setMessage(result);
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "审核失败");
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
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="card-block">
        <h3>待审核申请</h3>
        {applications.length === 0 ? (
          <p className="muted">暂无待审核申请。</p>
        ) : (
          <ul className="list">
            {applications.map((application) => (
              <li key={application.id}>
                <div>
                  <strong>申请人：{application.userId}</strong>
                  <div className="muted">资质：{application.qualifications ?? "未填写"}</div>
                  <div className="muted">动机：{application.motivation ?? "未填写"}</div>
                </div>
                <div className="button-row">
                  <button className="btn btn-secondary" onClick={() => handleReview(application.id, "APPROVED")}>
                    通过
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleReview(application.id, "REJECTED")}>
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
