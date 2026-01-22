"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/layouts/AppShell";
import { createForumPost, listForumPosts, type ForumPost } from "../../lib/api";

/**
 * 论坛首页：展示帖子与发布入口。
 */
export default function ForumPage() {
  // 帖子列表数据。
  const [posts, setPosts] = useState<ForumPost[]>([]);
  // 新帖子表单数据。
  const [form, setForm] = useState({
    title: "",
    content: "",
    isAnonymous: true,
  });
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载帖子列表。
   */
  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      setError(null);
      try {
        const list = await listForumPosts();
        setPosts(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载帖子失败");
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  /**
   * 发布帖子。
   */
  const handleCreate = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await createForumPost({
        title: form.title,
        content: form.content,
        isAnonymous: form.isAnonymous,
      });
      setPosts((prev) => [result.post, ...prev]);
      setMessage(`帖子已提交，存证编号：${result.evidence.id}`);
      setForm({ title: "", content: "", isAnonymous: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="论坛社区">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="论坛社区" description="匿名倾诉与主题讨论需先审核后发布。">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="split-grid">
        <div className="card-block">
          <h3>发布帖子</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>标题</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>内容</span>
              <textarea
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>匿名发布</span>
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(event) => setForm((prev) => ({ ...prev, isAnonymous: event.target.checked }))}
              />
            </label>
            <button className="btn btn-primary" type="button" onClick={handleCreate}>
              提交审核
            </button>
          </div>
        </div>
        <div className="card-block">
          <h3>最新帖子</h3>
          {posts.length === 0 ? (
            <p className="muted">暂无帖子。</p>
          ) : (
            <ul className="list">
              {posts.map((post) => (
                <li key={post.id}>
                  <div>
                    <strong>{post.title}</strong>
                    <div className="muted">状态：{post.status}</div>
                  </div>
                  <Link className="btn btn-secondary" href={`/forum/${post.id}`}>
                    查看详情
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
