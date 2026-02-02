"use client";

import { useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { createReport } from "../../lib/api";

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
 * 举报提交页面。
 */
export default function ReportsPage() {
  // 举报表单数据。
  const [form, setForm] = useState({
    targetType: "POST",
    targetId: "",
  });
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);
  // 举报弹窗。
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportAttachment, setReportAttachment] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  // 举报弹窗错误提示。
  const [reportError, setReportError] = useState<string | null>(null);

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
    if (!reportError) {
      return;
    }
    const timer = window.setTimeout(() => setReportError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [reportError]);

  const openReportModal = () => {
    setReportReason("");
    setReportAttachment(null);
    setReportError(null);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportReason("");
    setReportAttachment(null);
    setReportError(null);
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
    setReportError(null);
    if (!REPORT_ALLOWED_TYPES.has(file.type)) {
      setReportError("仅支持 PNG/JPEG/WEBP 图片");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_REPORT_BYTES) {
      setReportError("图片大小不能超过 2MB");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReportAttachment({ name: file.name, dataUrl });
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "读取图片失败");
      event.target.value = "";
    }
  };

  /**
   * 提交举报。
   */
  const handleSubmit = async () => {
    if (!reportReason.trim()) {
      setReportError("请输入文字说明");
      return;
    }
    if (!form.targetId.trim()) {
      setReportError("请输入举报对象编号");
      return;
    }
    setMessage(null);
    setError(null);
    setReportError(null);
    setReportSubmitting(true);
    try {
      const result = await createReport({
        targetType: form.targetType as "POST" | "COMMENT" | "USER" | "COUNSELOR",
        targetId: form.targetId,
        reason: reportReason,
        attachmentDataUrl: reportAttachment?.dataUrl,
      });
      setMessage(`举报已提交，存证编号：${result.evidence.id}`);
      setForm({ targetType: "POST", targetId: "" });
      closeReportModal();
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "举报提交失败");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <AppShell title="举报中心">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="card-block">
        <h3>提交举报</h3>
        <p className="muted">可选上传举报图片，并填写文字说明，提交后管理员将统一审核。</p>
        <button className="btn btn-primary" type="button" onClick={openReportModal}>
          🚩 新建举报
        </button>
      </div>
      {reportModalOpen && (
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
            {reportError && <div className="status error">{reportError}</div>}
            <div className="form-stack">
              <label className="inline-field">
                <span>举报类型</span>
                <select
                  value={form.targetType}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, targetType: event.target.value }))
                  }
                >
                  <option value="POST">帖子</option>
                  <option value="COMMENT">评论</option>
                  <option value="USER">用户</option>
                  <option value="COUNSELOR">心理师</option>
                </select>
              </label>
              <label className="inline-field">
                <span>对象编号</span>
                <input
                  value={form.targetId}
                  onChange={(event) => setForm((prev) => ({ ...prev, targetId: event.target.value }))}
                  placeholder="请输入帖子/用户等编号"
                />
              </label>
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
                  onClick={handleSubmit}
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
