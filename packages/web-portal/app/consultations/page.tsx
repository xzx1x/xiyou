"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import { listConsultations, type ConsultationRecord } from "../../lib/api";

/**
 * 用户端咨询记录列表页面。
 */
export default function ConsultationsPage() {
  // 咨询记录列表。
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载咨询记录列表。
   */
  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      setError(null);
      try {
        const list = await listConsultations();
        setRecords(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载记录失败");
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
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
      <AppShell title="咨询记录" requiredRoles={["USER"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="咨询记录" requiredRoles={["USER"]}>
      {error && (
        <CenterToast type="error" message={error} onClose={() => setError(null)} />
      )}
      <div className="card-block">
        <h3>历史记录</h3>
        {records.length === 0 ? (
          <p className="muted">暂无咨询记录。</p>
        ) : (
          <ul className="list">
            {records.map((record) => (
              <li key={record.id}>
                <div>
                  <strong>记录时间：{new Date(record.createdAt).toLocaleString("zh-CN")}</strong>
                  <div className="muted">问题分类：{record.issueCategory ?? "-"}</div>
                </div>
                <Link className="btn btn-secondary" href={`/consultations/${record.id}`}>
                  查看详情
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
