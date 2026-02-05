"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { confirmPasswordReset, requestPasswordReset } from "../../lib/api";
import { CenterToast } from "../../components/ui/CenterToast";

/**
 * 密码重置页：支持邮箱申请与验证码确认。
 */
export default function ResetPasswordPage() {
  // 邮箱输入值，用于发起重置请求。
  const [email, setEmail] = useState("");
  // 申请阶段的反馈信息。
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  // 重置验证码输入值。
  const [token, setToken] = useState("");
  // 新密码输入值。
  const [newPassword, setNewPassword] = useState("");
  // 确认阶段的反馈信息。
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  // 请求阶段错误提示。
  const [requestError, setRequestError] = useState<string | null>(null);
  // 确认阶段错误提示。
  const [confirmError, setConfirmError] = useState<string | null>(null);
  // 申请阶段加载状态。
  const [requesting, setRequesting] = useState(false);
  // 确认阶段加载状态。
  const [confirming, setConfirming] = useState(false);
  const toast = requestError
    ? { type: "error" as const, message: requestError, onClose: () => setRequestError(null) }
    : confirmError
      ? { type: "error" as const, message: confirmError, onClose: () => setConfirmError(null) }
      : requestMessage
        ? {
            type: "success" as const,
            message: requestMessage,
            onClose: () => setRequestMessage(null),
          }
        : confirmMessage
          ? {
              type: "success" as const,
              message: confirmMessage,
              onClose: () => setConfirmMessage(null),
            }
          : null;

  /**
   * 提交邮箱申请重置验证码。
   */
  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequesting(true);
    setRequestMessage(null);
    setRequestError(null);
    try {
      const result = await requestPasswordReset(email);
      setRequestMessage(result.message);
      if (result.resetToken) {
        setToken(result.resetToken);
      }
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "请求失败，请稍后重试");
    } finally {
      setRequesting(false);
    }
  };

  /**
   * 提交验证码并确认重置密码。
   */
  const handleConfirmSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setConfirming(true);
    setConfirmMessage(null);
    setConfirmError(null);
    try {
      const result = await confirmPasswordReset({ token, newPassword });
      setConfirmMessage(result.message);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "重置失败，请稍后重试");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <main className="page-shell">
      {toast && <CenterToast type={toast.type} message={toast.message} onClose={toast.onClose} />}
      <section className="card">
        <h1>重置密码</h1>
        <p>请输入 QQ 邮箱获取验证码，再使用验证码设置新密码。</p>
        <form className="auth-form" onSubmit={handleRequestSubmit}>
          <label>
            QQ 邮箱
            <input
              name="email"
              type="email"
              required
              placeholder="example@qq.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button className="btn btn-primary" disabled={requesting} type="submit">
            {requesting ? "发送中..." : "发送验证码"}
          </button>
        </form>
        <hr className="divider" />
        <form className="auth-form" onSubmit={handleConfirmSubmit}>
          <label>
            验证码
            <input
              name="token"
              required
              placeholder="邮件中的验证码"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
          <label>
            新密码
            <input
              name="newPassword"
              type="password"
              minLength={8}
              required
              placeholder="至少 8 位字母与数字组合"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <button className="btn btn-secondary" disabled={confirming} type="submit">
            {confirming ? "重置中..." : "确认重置"}
          </button>
        </form>
        <p className="hint spaced">
          已想起密码？<Link href="/login">返回登录</Link>
        </p>
      </section>
    </main>
  );
}
