"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import {
  listUsers,
  resetUserPassword,
  updateUserRole,
  updateUserStatus,
  type User,
} from "../../../lib/api";

/**
 * 管理员账号管理页面。
 */
export default function AdminUsersPage() {
  // 用户列表数据。
  const [users, setUsers] = useState<User[]>([]);
  // 搜索关键词。
  const [keyword, setKeyword] = useState("");
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载用户列表。
   */
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listUsers(keyword || undefined);
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载用户失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  /**
   * 更新用户角色。
   */
  const handleRoleUpdate = async (userId: string, role: User["role"]) => {
    setMessage(null);
    setError(null);
    try {
      const result = await updateUserRole(userId, role);
      setMessage(result);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新角色失败");
    }
  };

  /**
   * 更新用户启用状态。
   */
  const handleStatusToggle = async (userId: string, isDisabled: boolean) => {
    setMessage(null);
    setError(null);
    try {
      const reason = isDisabled ? window.prompt("请输入禁用原因") ?? "" : "";
      const result = await updateUserStatus(userId, { isDisabled, reason: reason || undefined });
      setMessage(result);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新状态失败");
    }
  };

  /**
   * 重置用户密码。
   */
  const handleResetPassword = async (userId: string) => {
    setMessage(null);
    setError(null);
    try {
      const newPassword = window.prompt("请输入新密码（至少8位）") ?? "";
      if (!newPassword) {
        return;
      }
      const result = await resetUserPassword(userId, newPassword);
      setMessage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置密码失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="账号管理" requiredRoles={["ADMIN"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="账号管理" requiredRoles={["ADMIN"]}>
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="card-block">
        <div className="form-stack">
          <label className="inline-field">
            <span>搜索关键词</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="邮箱或学号"
            />
          </label>
          <button className="btn btn-secondary" onClick={loadUsers}>
            搜索
          </button>
        </div>
        <h3>用户列表</h3>
        {users.length === 0 ? (
          <p className="muted">暂无用户。</p>
        ) : (
          <ul className="list">
            {users.map((user) => (
              <li key={user.id}>
                <div>
                  <strong>{user.email}</strong>
                  <div className="muted">学号：{user.identityCode}</div>
                  <div className="muted">角色：{user.role}</div>
                  <div className="muted">
                    状态：{user.isDisabled ? `禁用（${user.disabledReason ?? "无原因"}）` : "正常"}
                  </div>
                </div>
                <div className="form-stack">
                  <label className="inline-field">
                    <span>角色</span>
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleUpdate(user.id, event.target.value as User["role"])}
                    >
                      <option value="USER">USER</option>
                      <option value="COUNSELOR">COUNSELOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </label>
                  <div className="button-row">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleStatusToggle(user.id, true)}
                    >
                      禁用
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleStatusToggle(user.id, false)}
                    >
                      启用
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleResetPassword(user.id)}
                    >
                      重置密码
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
