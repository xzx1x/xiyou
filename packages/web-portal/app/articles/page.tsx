"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import { listContentItems, type ContentItem } from "../../lib/api";

/**
 * 文章阅读页面。
 */
export default function ArticlesPage() {
  // 文章内容列表。
  const [items, setItems] = useState<ContentItem[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载已发布内容并过滤文章类型。
   */
  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setError(null);
      try {
        const list = await listContentItems("PUBLISHED");
        setItems(list.filter((item) => item.type === "ARTICLE"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载文章失败");
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
      <AppShell title="文章阅读">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="文章阅读" description="浏览管理员发布的心理文章。">
      {error && (
        <CenterToast type="error" message={error} onClose={() => setError(null)} />
      )}
      <div className="card-block">
        {items.length === 0 ? (
          <p className="muted">暂无文章。</p>
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
