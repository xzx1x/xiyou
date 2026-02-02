"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { listFeedback, type FeedbackRecord } from "../../../lib/api";

/**
 * 心理师查看满意度反馈页面。
 */
export default function CounselorFeedbackPage() {
  // 反馈列表数据。
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载反馈列表。
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

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (loading) {
    return (
      <AppShell title="满意度反馈" requiredRoles={["COUNSELOR"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="满意度反馈" requiredRoles={["COUNSELOR"]}>
      {error && <div className="status error">{error}</div>}
      <div className="card-block">
        <h3>反馈列表</h3>
        {feedbackList.length === 0 ? (
          <p className="muted">暂无反馈。</p>
        ) : (
          <ul className="list">
            {feedbackList.map((item) => (
              <li key={item.id}>
                <strong>预约：{item.appointmentId}</strong>
                <div>评分：{item.rating} 分</div>
                <div className="muted">{item.comment ?? "无文字反馈"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
