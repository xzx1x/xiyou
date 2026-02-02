"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { getAdminStats, type AdminStats } from "../../../lib/api";

/**
 * 管理员统计页面。
 */
export default function AdminStatsPage() {
  // 统计数据。
  const [stats, setStats] = useState<AdminStats | null>(null);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载统计数据。
   */
  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载统计失败");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
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
      <AppShell title="统计报表" requiredRoles={["ADMIN"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="统计报表" requiredRoles={["ADMIN"]}>
      {error && <div className="status error">{error}</div>}
      {stats ? (
        <div className="split-grid">
          <div className="card-block">
            <h3>预约统计</h3>
            <p>总预约：{stats.appointments.total}</p>
            <p>完成率：{stats.appointments.completionRate}</p>
            <p>已完成：{stats.appointments.completed}</p>
            <p>已取消：{stats.appointments.cancelled}</p>
          </div>
          <div className="card-block">
            <h3>满意度统计</h3>
            <p>平均评分：{stats.feedback.averageRating ?? "-"}</p>
            <p>反馈数量：{stats.feedback.total}</p>
            <p>危机事件：{stats.crisisCount}</p>
          </div>
          <div className="card-block">
            <h3>问题分类</h3>
            {stats.issueCategories.length === 0 ? (
              <p className="muted">暂无数据。</p>
            ) : (
              <ul className="list">
                {stats.issueCategories.map((item) => (
                  <li key={item.category}>
                    {item.category} · {item.total} 次
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card-block">
            <h3>测评分布</h3>
            {stats.assessmentDistribution.length === 0 ? (
              <p className="muted">暂无数据。</p>
            ) : (
              <ul className="list">
                {stats.assessmentDistribution.map((item, index) => (
                  <li key={`${item.type}-${item.level}-${index}`}>
                    {item.type} · {item.level} · {item.total} 次
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="muted">暂无统计数据。</p>
      )}
    </AppShell>
  );
}
