"use client";

import { useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { createReport } from "../../lib/api";

/**
 * 举报提交页面。
 */
export default function ReportsPage() {
  // 举报表单数据。
  const [form, setForm] = useState({
    targetType: "POST",
    targetId: "",
    reason: "",
  });
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 提交举报。
   */
  const handleSubmit = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await createReport({
        targetType: form.targetType as "POST" | "COMMENT" | "USER" | "COUNSELOR",
        targetId: form.targetId,
        reason: form.reason,
      });
      setMessage(`举报已提交，存证编号：${result.evidence.id}`);
      setForm({ targetType: "POST", targetId: "", reason: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "举报提交失败");
    }
  };

  return (
    <AppShell title="举报中心">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="card-block">
        <h3>提交举报</h3>
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
            <span>举报原因</span>
            <textarea
              value={form.reason}
              onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
            />
          </label>
          <button className="btn btn-primary" type="button" onClick={handleSubmit}>
            提交举报
          </button>
        </div>
      </div>
    </AppShell>
  );
}
