"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import { getCounselorStats, type CounselorStats } from "../../../lib/api";

type PieSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type PieSegmentWithPercent = PieSegment & {
  percent: number;
  offset: number;
};

function buildPieSegments(segments: PieSegment[]) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const withPercent: PieSegmentWithPercent[] = segments.map((item) => {
    const percent = total ? (item.value / total) * 100 : 0;
    const segment = { ...item, percent, offset };
    offset += percent;
    return segment;
  });
  return { total, segments: withPercent };
}

/**
 * 心理师个人统计页面。
 */
export default function CounselorStatsPage() {
  // 统计数据。
  const [stats, setStats] = useState<CounselorStats | null>(null);
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
        const data = await getCounselorStats();
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

  const appointmentSegments: PieSegment[] = stats
    ? [
        {
          key: "completed",
          label: "已完成",
          value: stats.appointments.completed,
          color: "#22c55e",
        },
        {
          key: "cancelled",
          label: "已取消",
          value: stats.appointments.cancelled,
          color: "#f97316",
        },
        {
          key: "pending",
          label: "待完成",
          value: Math.max(
            stats.appointments.total -
              stats.appointments.completed -
              stats.appointments.cancelled,
            0,
          ),
          color: "#38bdf8",
        },
      ]
    : [];

  const appointmentPie = buildPieSegments(appointmentSegments);

  const completionRate = appointmentPie.total
    ? Math.round(
        ((stats?.appointments.completed ?? 0) / appointmentPie.total) * 100,
      )
    : 0;

  const hasFeedback =
    !!stats &&
    stats.feedback.total > 0 &&
    stats.feedback.averageRating !== null;

  const ratingValue = hasFeedback
    ? Math.min(Math.max(stats.feedback.averageRating ?? 0, 0), 5)
    : 0;

  const ratingSegments: PieSegment[] = hasFeedback
    ? [
        {
          key: "rating",
          label: "平均评分",
          value: ratingValue,
          color: "#facc15",
        },
        {
          key: "remaining",
          label: "满分剩余",
          value: Math.max(5 - ratingValue, 0),
          color: "#334155",
        },
      ]
    : [];

  const ratingPie = buildPieSegments(ratingSegments);

  const issuePalette = [
    "#60a5fa",
    "#f472b6",
    "#facc15",
    "#34d399",
    "#a78bfa",
    "#f97316",
    "#38bdf8",
  ];
  const issueSource = stats ? stats.issueCategories : [];
  const sortedIssueCategories = [...issueSource].sort(
    (a, b) => b.total - a.total,
  );
  const topIssueCategories = sortedIssueCategories.slice(0, 5);
  const remainingIssueTotal = sortedIssueCategories
    .slice(5)
    .reduce((sum, item) => sum + item.total, 0);
  const issueSegments: PieSegment[] = topIssueCategories.map((item, index) => ({
    key: item.category || `issue-${index}`,
    label: item.category || "未分类",
    value: item.total,
    color: issuePalette[index] ?? "#94a3b8",
  }));
  if (remainingIssueTotal > 0) {
    issueSegments.push({
      key: "others",
      label: "其他",
      value: remainingIssueTotal,
      color: issuePalette[issueSegments.length] ?? "#94a3b8",
    });
  }
  const issuePie = buildPieSegments(issueSegments);
  const issueCategoryCount = issueSource.length;

  if (loading) {
    return (
      <AppShell title="服务统计" requiredRoles={["COUNSELOR"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="服务统计" requiredRoles={["COUNSELOR"]}>
      {error && (
        <CenterToast
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {stats ? (
        <div className="stats-stack">
          <div className="split-grid">
            <div className="card-block stats-pie-card">
              <div className="stats-pie-header">
                <div>
                  <h3>预约数据</h3>
                  <p className="muted">当前预约状态占比</p>
                </div>
                <div className="stats-pie-total">
                  <span>总预约</span>
                  <strong>{stats.appointments.total}</strong>
                </div>
              </div>
              {appointmentPie.total === 0 ? (
                <p className="muted">暂无预约数据。</p>
              ) : (
                <div className="stats-pie-body">
                  <div className="stats-pie-chart" aria-label="预约状态饼图">
                    <svg viewBox="0 0 36 36">
                      <circle
                        className="stats-pie-bg"
                        cx="18"
                        cy="18"
                        r="14"
                      />
                      {appointmentPie.segments.map((item, index) =>
                        item.value > 0 ? (
                          <circle
                            key={item.key}
                            className="stats-pie-segment"
                            cx="18"
                            cy="18"
                            r="14"
                            stroke={item.color}
                            style={
                              {
                                "--segment-array": `${item.percent} ${100 - item.percent}`,
                                "--segment-offset": `${100 - item.offset}`,
                                "--segment-delay": `${index * 0.12}s`,
                              } as CSSProperties
                            }
                          />
                        ) : null,
                      )}
                    </svg>
                    <div className="stats-pie-center">
                      <strong>{completionRate}%</strong>
                      <span>完成率</span>
                    </div>
                  </div>
                  <ul className="stats-pie-legend">
                    {appointmentPie.segments.map((item) => (
                      <li key={item.key}>
                        <span
                          className="stats-pie-dot"
                          style={{ background: item.color }}
                        />
                        <div className="stats-pie-label">
                          <strong>{item.label}</strong>
                          <span>
                            {item.value} · {item.percent.toFixed(1)}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="card-block stats-pie-card">
              <div className="stats-pie-header">
                <div>
                  <h3>满意度</h3>
                  <p className="muted">平均评分与反馈数量</p>
                </div>
                <div className="stats-pie-total">
                  <span>反馈数量</span>
                  <strong>{stats.feedback.total}</strong>
                </div>
              </div>
              {!hasFeedback ? (
                <p className="muted">暂无满意度数据。</p>
              ) : (
                <div className="stats-pie-body">
                  <div className="stats-pie-chart" aria-label="满意度饼图">
                    <svg viewBox="0 0 36 36">
                      <circle
                        className="stats-pie-bg"
                        cx="18"
                        cy="18"
                        r="14"
                      />
                      {ratingPie.segments.map((item, index) =>
                        item.value > 0 ? (
                          <circle
                            key={item.key}
                            className="stats-pie-segment"
                            cx="18"
                            cy="18"
                            r="14"
                            stroke={item.color}
                            style={
                              {
                                "--segment-array": `${item.percent} ${100 - item.percent}`,
                                "--segment-offset": `${100 - item.offset}`,
                                "--segment-delay": `${index * 0.12}s`,
                              } as CSSProperties
                            }
                          />
                        ) : null,
                      )}
                    </svg>
                    <div className="stats-pie-center">
                      <strong>{ratingValue.toFixed(1)}</strong>
                      <span>平均评分</span>
                    </div>
                  </div>
                  <ul className="stats-pie-legend">
                    {ratingPie.segments.map((item) => (
                      <li key={item.key}>
                        <span
                          className="stats-pie-dot"
                          style={{ background: item.color }}
                        />
                        <div className="stats-pie-label">
                          <strong>{item.label}</strong>
                          <span>{item.value.toFixed(1)} / 5</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="card-block stats-pie-card">
              <div className="stats-pie-header">
                <div>
                  <h3>常见问题</h3>
                  <p className="muted">问题分类占比</p>
                </div>
                <div className="stats-pie-total">
                  <span>记录总数</span>
                  <strong>{issuePie.total}</strong>
                </div>
              </div>
              {issuePie.total === 0 ? (
                <p className="muted">暂无常见问题数据。</p>
              ) : (
                <div className="stats-pie-body">
                  <div className="stats-pie-chart" aria-label="常见问题饼图">
                    <svg viewBox="0 0 36 36">
                      <circle
                        className="stats-pie-bg"
                        cx="18"
                        cy="18"
                        r="14"
                      />
                      {issuePie.segments.map((item, index) =>
                        item.value > 0 ? (
                          <circle
                            key={item.key}
                            className="stats-pie-segment"
                            cx="18"
                            cy="18"
                            r="14"
                            stroke={item.color}
                            style={
                              {
                                "--segment-array": `${item.percent} ${100 - item.percent}`,
                                "--segment-offset": `${100 - item.offset}`,
                                "--segment-delay": `${index * 0.12}s`,
                              } as CSSProperties
                            }
                          />
                        ) : null,
                      )}
                    </svg>
                    <div className="stats-pie-center">
                      <strong>{issueCategoryCount}</strong>
                      <span>问题类型</span>
                    </div>
                  </div>
                  <ul className="stats-pie-legend">
                    {issuePie.segments.map((item) => (
                      <li key={item.key}>
                        <span
                          className="stats-pie-dot"
                          style={{ background: item.color }}
                        />
                        <div className="stats-pie-label">
                          <strong>{item.label}</strong>
                          <span>
                            {item.value} · {item.percent.toFixed(1)}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="split-grid">
            <div className="card-block">
              <h3>预约数据</h3>
              <p>总预约：{stats.appointments.total}</p>
              <p>已完成：{stats.appointments.completed}</p>
              <p>已取消：{stats.appointments.cancelled}</p>
            </div>
            <div className="card-block">
              <h3>满意度</h3>
              <p>平均评分：{stats.feedback.averageRating ?? "-"}</p>
              <p>反馈数量：{stats.feedback.total}</p>
              <p>危机事件：{stats.crisisCount}</p>
            </div>
            <div className="card-block">
              <h3>常见问题</h3>
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
          </div>
        </div>
      ) : (
        <p className="muted">暂无统计数据。</p>
      )}
    </AppShell>
  );
}
