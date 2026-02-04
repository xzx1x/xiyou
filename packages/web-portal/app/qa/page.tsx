"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import { listContentItems, type ContentItem } from "../../lib/api";

/**
 * 公告/问答页面（使用公告内容）。
 */
export default function QaPage() {
  // 公告内容列表。
  const [items, setItems] = useState<ContentItem[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载已发布内容并过滤公告类型。
   */
  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setError(null);
      try {
        const list = await listContentItems("PUBLISHED");
        setItems(list.filter((item) => item.type === "NOTICE"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载公告失败");
      } finally {
        setLoading(false);
      }
    }
    loadItems();
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
      <AppShell title="问答公告">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="问答公告" description="查看心理中心最新公告与常见问题。">
      {error && (
        <CenterToast type="error" message={error} onClose={() => setError(null)} />
      )}
      <div className="card-block">
        {items.length === 0 ? (
          <p className="muted">暂无公告。</p>
        ) : (
          <ul className="list">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <div className="muted">{item.summary ?? "暂无摘要"}</div>
                <small>{new Date(item.publishedAt ?? item.createdAt).toLocaleString("zh-CN")}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
