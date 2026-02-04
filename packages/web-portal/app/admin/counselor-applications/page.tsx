"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
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
  // 拒绝申请弹窗状态。
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  // 当前正在处理的申请。
  const [activeApplication, setActiveApplication] = useState<CounselorApplication | null>(null);
  // 拒绝原因输入。
  const [rejectReason, setRejectReason] = useState("");
  // 拒绝提交状态。
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

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
        <h3>待审核申请</h3>
        {applications.length === 0 ? (
          <p className="muted">暂无待审核申请。</p>
        ) : (
          <ul className="list">
            {applications.map((application) => (
              <li key={application.id}>
                <div>
                  <strong>申请人：用户</strong>
                  <div className="muted">
                    申请时间：{new Date(application.createdAt).toLocaleString("zh-CN")}
                  </div>
                  <div className="muted">资质：{application.qualifications ?? "未填写"}</div>
                  <div className="muted">动机：{application.motivation ?? "未填写"}</div>
                </div>
                <div className="button-row">
                  <button className="btn btn-secondary" onClick={() => handleApprove(application.id)}>
                    通过
                  </button>
                  <button className="btn btn-secondary" onClick={() => openRejectModal(application)}>
                    拒绝
                  </button>
                </div>
              </li>
            ))}
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
                <strong>用户</strong>
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
