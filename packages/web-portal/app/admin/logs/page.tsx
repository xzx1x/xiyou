"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { listRequestLogs } from "../../../lib/api";

/**
 * 管理员访问日志页面。
 */
export default function AdminLogsPage() {
  // 日志列表数据。
  const [logs, setLogs] = useState<Array<{
    id: string;
    userId?: string | null;
    method: string;
    path: string;
    status: number;
    durationMs: number;
    createdAt: string;
  }>>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载日志列表。
   */
  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError(null);
      try {
        const list = await listRequestLogs(200);
        setLogs(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载日志失败");
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  if (loading) {
    return (
      <AppShell title="访问日志" requiredRoles={["ADMIN"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="访问日志" requiredRoles={["ADMIN"]}>
      {error && <div className="status error">{error}</div>}
      <div className="card-block">
        <h3>最近请求</h3>
        {logs.length === 0 ? (
          <p className="muted">暂无日志。</p>
        ) : (
          <ul className="list">
            {logs.map((log) => (
              <li key={log.id}>
                <strong>
                  {log.method} {log.path}
                </strong>
                <div className="muted">
                  状态：{log.status} · 耗时：{log.durationMs}ms · 用户：{log.userId ?? "匿名"}
                </div>
                <small>{new Date(log.createdAt).toLocaleString("zh-CN")}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
