"use client";

import { useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import {
  createReport,
  resolveAvatarUrl,
  searchFriendCandidates,
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
 * 举报提交页面。
 */
export default function ReportsPage() {
  // 举报对象选择。
  const [targetType, setTargetType] = useState<"USER" | "COUNSELOR">("USER");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [targetCandidates, setTargetCandidates] = useState<PublicUserProfile[]>([]);
  const [targetSearchLoading, setTargetSearchLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<PublicUserProfile | null>(null);
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
  const toast = reportError
    ? { type: "error" as const, message: reportError, onClose: () => setReportError(null) }
    : error
      ? { type: "error" as const, message: error, onClose: () => setError(null) }
      : message
        ? { type: "success" as const, message, onClose: () => setMessage(null) }
        : null;

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

  useEffect(() => {
    if (!reportModalOpen) {
      return;
    }
    const keyword = targetKeyword.trim();
    if (!keyword) {
      setTargetCandidates([]);
      setTargetSearchLoading(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setTargetSearchLoading(true);
      searchFriendCandidates(keyword)
        .then((list) => {
          if (cancelled) {
            return;
          }
          const filtered =
            targetType === "COUNSELOR"
              ? list.filter((item) => item.role === "COUNSELOR")
              : list.filter((item) => item.role === "USER");
          setTargetCandidates(filtered);
        })
        .catch((err) => {
          if (!cancelled) {
            setReportError(err instanceof Error ? err.message : "搜索用户失败");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setTargetSearchLoading(false);
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reportModalOpen, targetKeyword, targetType]);

  const openReportModal = () => {
    setReportReason("");
    setReportAttachment(null);
    setReportError(null);
    setTargetKeyword("");
    setTargetCandidates([]);
    setTargetSearchLoading(false);
    setSelectedTarget(null);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportReason("");
    setReportAttachment(null);
    setReportError(null);
    setTargetKeyword("");
    setTargetCandidates([]);
    setTargetSearchLoading(false);
    setSelectedTarget(null);
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
    if (!selectedTarget) {
      setReportError("请选择举报对象");
      return;
    }
    setMessage(null);
    setError(null);
    setReportError(null);
    setReportSubmitting(true);
    try {
      const result = await createReport({
        targetType,
        targetId: selectedTarget.id,
        reason: reportReason,
        attachmentDataUrl: reportAttachment?.dataUrl,
      });
      setMessage("举报已提交，等待管理员审核");
      setSelectedTarget(null);
      setTargetKeyword("");
      setTargetCandidates([]);
      closeReportModal();
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "举报提交失败");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <AppShell title="举报中心">
      {toast && <CenterToast type={toast.type} message={toast.message} onClose={toast.onClose} />}
      <div className="card-block">
        <h3>提交举报</h3>
        <p className="muted">
          可选上传举报图片，并填写文字说明，提交后管理员将统一审核。帖子/评论请在详情页直接举报。
        </p>
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
            <div className="form-stack">
              <label className="inline-field">
                <span>举报对象类型</span>
                <select
                  value={targetType}
                  onChange={(event) => {
                    const nextType = event.target.value as "USER" | "COUNSELOR";
                    setTargetType(nextType);
                    setSelectedTarget(null);
                    setTargetKeyword("");
                    setTargetCandidates([]);
                  }}
                >
                  <option value="USER">用户</option>
                  <option value="COUNSELOR">心理师</option>
                </select>
              </label>
              <label className="inline-field">
                <span>举报对象</span>
                <input
                  value={targetKeyword}
                  onChange={(event) => setTargetKeyword(event.target.value)}
                  placeholder="输入姓名搜索"
                />
              </label>
              <div className="friend-search-block">
                {targetKeyword.trim() ? (
                  targetSearchLoading ? (
                    <p className="muted">搜索中...</p>
                  ) : targetCandidates.length === 0 ? (
                    <p className="muted">未找到匹配的用户。</p>
                  ) : (
                    <div className="friend-candidate-grid">
                      {targetCandidates.map((candidate) => {
                        const avatar =
                          resolveAvatarUrl(candidate.avatarUrl) || "/default-avatar.svg";
                        const displayName = candidate.nickname || "用户";
                        const isSelected = selectedTarget?.id === candidate.id;
                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            className="friend-candidate"
                            onClick={() => setSelectedTarget(candidate)}
                            aria-pressed={isSelected}
                          >
                            <img
                              className="friend-candidate-avatar"
                              src={avatar}
                              alt={`${displayName}头像`}
                              onError={(event) => {
                                const target = event.currentTarget;
                                if (!target.src.endsWith("/default-avatar.svg")) {
                                  target.src = "/default-avatar.svg";
                                }
                              }}
                            />
                            <span className="friend-candidate-name">{displayName}</span>
                            {isSelected && <span className="friend-candidate-tip">已选择</span>}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <p className="muted">输入姓名后显示头像，点击头像选择举报对象。</p>
                )}
              </div>
              {selectedTarget ? (
                <div className="report-target">
                  <span>已选择</span>
                  <strong>{selectedTarget.nickname || "用户"}</strong>
                </div>
              ) : null}
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
