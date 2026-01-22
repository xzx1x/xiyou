"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { listNotifications, markNotificationRead, type NotificationRecord } from "../../lib/api";

/**
 * 消息中心页面。
 */
export default function NotificationsPage() {
  // 通知列表数据。
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载通知列表。
   */
  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      setError(null);
      try {
        const list = await listNotifications();
        setNotifications(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载通知失败");
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  /**
   * 标记通知已读。
   */
  const handleRead = async (notificationId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await markNotificationRead(notificationId);
      setMessage(result);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "标记失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="消息中心">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="消息中心">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="card-block">
        <h3>通知列表</h3>
        {notifications.length === 0 ? (
          <p className="muted">暂无通知。</p>
        ) : (
          <ul className="list">
            {notifications.map((notice) => (
              <li key={notice.id}>
                <div>
                  <strong>{notice.title}</strong>
                  <div className="muted">{notice.message}</div>
                  <small>{new Date(notice.createdAt).toLocaleString("zh-CN")}</small>
                </div>
                {notice.readAt ? (
                  <span className="tag">已读</span>
                ) : (
                  <button className="btn btn-secondary" onClick={() => handleRead(notice.id)}>
                    标记已读
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
