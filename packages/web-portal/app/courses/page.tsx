"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { listContentItems, type ContentItem } from "../../lib/api";

/**
 * 心理课程/视频页面。
 */
export default function CoursesPage() {
  // 视频内容列表。
  const [items, setItems] = useState<ContentItem[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载已发布内容并过滤视频类型。
   */
  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setError(null);
      try {
        const list = await listContentItems("PUBLISHED");
        setItems(list.filter((item) => item.type === "VIDEO"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载课程失败");
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, []);

  if (loading) {
    return (
      <AppShell title="心理课程">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="心理课程" description="观看心理课程视频与案例分享。">
      {error && <div className="status error">{error}</div>}
      <div className="card-block">
        {items.length === 0 ? (
          <p className="muted">暂无课程。</p>
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
