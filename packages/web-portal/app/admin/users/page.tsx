"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
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
  // 操作弹窗类型。
  const [modalMode, setModalMode] = useState<"DISABLE" | "RESET_PASSWORD" | null>(null);
  // 当前正在处理的用户。
  const [activeUser, setActiveUser] = useState<User | null>(null);
  // 弹窗输入内容（禁用原因/新密码）。
  const [modalInput, setModalInput] = useState("");
  // 弹窗提交状态。
  const [modalSubmitting, setModalSubmitting] = useState(false);

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
   * 打开禁用或重置密码弹窗。
   */
  const openModal = (mode: "DISABLE" | "RESET_PASSWORD", user: User) => {
    setModalMode(mode);
    setActiveUser(user);
    setModalInput("");
    setModalSubmitting(false);
  };

  /**
   * 关闭弹窗并清理状态。
   */
  const closeModal = () => {
    setModalMode(null);
    setActiveUser(null);
    setModalInput("");
    setModalSubmitting(false);
  };

  /**
   * 点击遮罩层关闭弹窗。
   */
  const handleModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  /**
   * 启用用户账号。
   */
  const handleEnable = async (userId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await updateUserStatus(userId, { isDisabled: false });
      setMessage(result);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新状态失败");
    }
  };

  /**
   * 提交弹窗操作。
   */
  const handleModalSubmit = async () => {
    if (!modalMode || !activeUser) {
      return;
    }
    setMessage(null);
    setError(null);
    setModalSubmitting(true);
    try {
      if (modalMode === "DISABLE") {
        const result = await updateUserStatus(activeUser.id, {
          isDisabled: true,
          reason: modalInput.trim() || undefined,
        });
        setMessage(result);
        await loadUsers();
        closeModal();
        return;
      }
      const newPassword = modalInput.trim();
      if (!newPassword) {
        setError("请输入新密码");
        return;
      }
      const result = await resetUserPassword(activeUser.id, newPassword);
      setMessage(result);
      closeModal();
    } catch (err) {
      const fallbackMessage = modalMode === "DISABLE" ? "更新状态失败" : "重置密码失败";
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setModalSubmitting(false);
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
      {(error || message) && (
        <CenterToast
          type={error ? "error" : "success"}
          message={error ?? message ?? ""}
          onClose={() => {
            setError(null);
            setMessage(null);
          }}
        />
      )}
      <div className="card-block">
        <div className="form-stack">
          <label className="inline-field">
            <span>搜索关键词</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="邮箱或昵称"
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
                  <div className="muted">昵称：{user.nickname ?? "-"}</div>
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
                    <button className="btn btn-secondary" onClick={() => openModal("DISABLE", user)}>
                      禁用
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleEnable(user.id)}>
                      启用
                    </button>
                    <button className="btn btn-secondary" onClick={() => openModal("RESET_PASSWORD", user)}>
                      重置密码
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {modalMode && activeUser && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
          onClick={handleModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="user-modal-title">{modalMode === "DISABLE" ? "禁用账号" : "重置密码"}</h3>
              <button className="btn btn-secondary" type="button" onClick={closeModal}>
                关闭
              </button>
            </div>
            <div className="form-stack">
              <div className="report-target">
                <span>账号</span>
                <strong>{activeUser.email}</strong>
              </div>
              {modalMode === "DISABLE" ? (
                <label className="inline-field">
                  <span>禁用原因</span>
                  <textarea
                    value={modalInput}
                    onChange={(event) => setModalInput(event.target.value)}
                    placeholder="请输入禁用原因（可选）"
                  />
                </label>
              ) : (
                <label className="inline-field">
                  <span>新密码</span>
                  <input
                    type="password"
                    value={modalInput}
                    onChange={(event) => setModalInput(event.target.value)}
                    placeholder="请输入新密码（至少8位）"
                  />
                </label>
              )}
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleModalSubmit}
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "提交中..." : "确认"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={closeModal}>
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
