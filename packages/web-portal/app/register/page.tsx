"use client";

import Link from "next/link";
import { AuthForm } from "../../components/auth/AuthForm";

/**
 * 注册页：强调白名单机制，并提供演示用学号列表。
 */
export default function RegisterPage() {
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
        <section className="card register-card">
          <h1>注册新账号</h1>
          <AuthForm mode="register" />
          <p className="hint">
            已有账号？<Link href="/login">直接登录</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
