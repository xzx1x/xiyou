"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import { publishAnnouncement } from "../../../lib/api";

/**
 * 管理员发布公告页面。
 */
export default function AdminAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!success) {
      return;
    }
    const timer = window.setTimeout(() => setSuccess(null), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  /**
   * 发布公告。
   */
  const handlePublish = async () => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    if (!trimmedTitle || !trimmedMessage) {
      setError("请填写公告标题与内容");
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const result = await publishAnnouncement({
        title: trimmedTitle,
        message: trimmedMessage,
      });
      setSuccess(`${result.message}（覆盖 ${result.sent} 个账号）`);
      setTitle("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "公告发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="发布公告" requiredRoles={["ADMIN"]}>
      {(error || success) && (
        <CenterToast
          type={error ? "error" : "success"}
          message={error ?? success ?? ""}
          onClose={() => {
            setError(null);
            setSuccess(null);
          }}
        />
      )}
      <div className="card-block">
        <h3>发布公告</h3>
        <div className="form-stack">
          <label className="inline-field">
            <span>公告标题</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="请输入公告标题"
              maxLength={60}
            />
          </label>
          <label className="inline-field">
            <span>公告内容</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="请输入公告内容"
              rows={5}
              maxLength={1000}
            />
          </label>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handlePublish}
            disabled={submitting}
          >
            {submitting ? "发布中..." : "发布公告"}
          </button>
          <p className="muted">
            公告将发送到当前已注册的所有账号系统消息中，之后新注册的账号不会收到。
          </p>
        </div>
      </div>
    </AppShell>
  );
}
