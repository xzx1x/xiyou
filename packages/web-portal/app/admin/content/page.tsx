"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import {
  createContentItem,
  listContentItems,
  updateContentItem,
  type ContentItem,
} from "../../../lib/api";

/**
 * 管理员内容管理页面。
 */
export default function AdminContentPage() {
  // 内容列表数据。
  const [items, setItems] = useState<ContentItem[]>([]);
  // 新建内容表单。
  const [createForm, setCreateForm] = useState({
    type: "ARTICLE",
    title: "",
    summary: "",
    content: "",
    status: "DRAFT",
  });
  // 更新内容表单。
  const [updateForm, setUpdateForm] = useState({
    id: "",
    title: "",
    summary: "",
    content: "",
    status: "DRAFT",
  });
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载内容列表。
   */
  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listContentItems();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载内容失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  /**
   * 创建新内容。
   */
  const handleCreate = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await createContentItem({
        type: createForm.type as "ARTICLE" | "VIDEO" | "NOTICE",
        title: createForm.title,
        summary: createForm.summary || undefined,
        content: createForm.content || undefined,
        status: createForm.status as "DRAFT" | "PUBLISHED",
      });
      setMessage(`内容已创建，存证编号：${result.evidence.id}`);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    }
  };

  /**
   * 更新内容条目。
   */
  const handleUpdate = async () => {
    if (!updateForm.id) {
      setError("请输入内容编号");
      return;
    }
    setMessage(null);
    setError(null);
    try {
      const item = await updateContentItem(updateForm.id, {
        title: updateForm.title || undefined,
        summary: updateForm.summary || undefined,
        content: updateForm.content || undefined,
        status: updateForm.status as "DRAFT" | "PUBLISHED",
      });
      setMessage(`内容已更新：${item.title}`);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="内容管理" requiredRoles={["ADMIN"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="内容管理" requiredRoles={["ADMIN"]}>
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="split-grid">
        <div className="card-block">
          <h3>发布内容</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>类型</span>
              <select
                value={createForm.type}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value="ARTICLE">文章</option>
                <option value="VIDEO">视频</option>
                <option value="NOTICE">公告</option>
              </select>
            </label>
            <label className="inline-field">
              <span>标题</span>
              <input
                value={createForm.title}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>摘要</span>
              <input
                value={createForm.summary}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, summary: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>内容</span>
              <textarea
                value={createForm.content}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, content: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>状态</span>
              <select
                value={createForm.status}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">发布</option>
              </select>
            </label>
            <button className="btn btn-primary" type="button" onClick={handleCreate}>
              创建内容
            </button>
          </div>
        </div>
        <div className="card-block">
          <h3>更新内容</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>内容编号</span>
              <input
                value={updateForm.id}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, id: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>标题</span>
              <input
                value={updateForm.title}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>摘要</span>
              <input
                value={updateForm.summary}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, summary: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>内容</span>
              <textarea
                value={updateForm.content}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, content: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>状态</span>
              <select
                value={updateForm.status}
                onChange={(event) => setUpdateForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">发布</option>
              </select>
            </label>
            <button className="btn btn-secondary" type="button" onClick={handleUpdate}>
              更新内容
            </button>
          </div>
        </div>
      </div>
      <div className="card-block">
        <h3>内容列表</h3>
        {items.length === 0 ? (
          <p className="muted">暂无内容。</p>
        ) : (
          <ul className="list">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <div className="muted">
                  {item.type} · {item.status}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
