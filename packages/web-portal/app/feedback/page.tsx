"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { listFeedback, submitFeedback, type FeedbackRecord } from "../../lib/api";

/**
 * 咨询反馈页面：用户提交满意度与查看历史。
 */
export default function FeedbackPage() {
  // 历史反馈列表。
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  // 反馈表单数据。
  const [form, setForm] = useState({
    appointmentId: "",
    rating: 5,
    comment: "",
    liked: false,
  });
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载历史反馈列表。
   */
  useEffect(() => {
    async function loadFeedback() {
      setLoading(true);
      setError(null);
      try {
        const list = await listFeedback();
        setFeedbackList(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载反馈失败");
      } finally {
        setLoading(false);
      }
    }
    loadFeedback();
  }, []);

  /**
   * 提交反馈。
   */
  const handleSubmit = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await submitFeedback({
        appointmentId: form.appointmentId,
        rating: form.rating,
        comment: form.comment || undefined,
        liked: form.liked,
      });
      setFeedbackList((prev) => [result.feedback, ...prev]);
      setMessage(`反馈已提交，存证编号：${result.evidence.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="咨询反馈" requiredRoles={["USER"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="咨询反馈" requiredRoles={["USER"]}>
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="split-grid">
        <div className="card-block">
          <h3>提交反馈</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>预约编号</span>
              <input
                value={form.appointmentId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, appointmentId: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>评分</span>
              <select
                value={form.rating}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, rating: Number(event.target.value) }))
                }
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} 分
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-field">
              <span>反馈意见</span>
              <textarea
                value={form.comment}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, comment: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>点赞心理师</span>
              <input
                type="checkbox"
                checked={form.liked}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, liked: event.target.checked }))
                }
              />
            </label>
            <button className="btn btn-primary" type="button" onClick={handleSubmit}>
              提交反馈
            </button>
          </div>
        </div>
        <div className="card-block">
          <h3>历史反馈</h3>
          {feedbackList.length === 0 ? (
            <p className="muted">暂无反馈记录。</p>
          ) : (
            <ul className="list">
              {feedbackList.map((item) => (
                <li key={item.id}>
                  <strong>预约：{item.appointmentId}</strong>
                  <div>评分：{item.rating} 分</div>
                  <div className="muted">{item.comment ?? "无文字反馈"}</div>
                  <small>{new Date(item.createdAt).toLocaleString("zh-CN")}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
