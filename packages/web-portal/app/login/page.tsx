"use client";

import Link from "next/link";
import { AuthForm } from "../../components/auth/AuthForm";

/**
 * 登录页：提供入口说明 + 登录表单 + 白名单提示。
 */
export default function LoginPage() {
  return (
    <main className="page-shell auth-shell">
      <div className="auth-layout">
        <header className="auth-header">
          <div className="auth-brand">
            <span className="auth-brand-title">校心连线</span>
            <span className="auth-brand-subtitle">
              校园心理咨询记录隐私保护与存证系统
            </span>
          </div>
        </header>
        <section className="card login-card">
          <h1>登录系统</h1>
          <AuthForm mode="login" />
          <p className="hint spaced">
            还没有账号？<Link href="/register">前往注册</Link>
          </p>
          <p className="hint">
            忘记密码？<Link href="/reset-password">找回密码</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
