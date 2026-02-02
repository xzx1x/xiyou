"use client";

import Link from "next/link";
import { AuthForm } from "../../components/auth/AuthForm";

/**
 * 登录页：提供入口说明 + 登录表单 + 白名单提示。
 */
export default function LoginPage() {
  return (
    <main className="page-shell">
      <section className="card">
        <h1>登录系统</h1>
        <p>
          使用 QQ 邮箱和密码完成登录，系统会依据绑定的学号/工号切换普通用户或管理员界面，
          成功后会进入系统首页。
        </p>
        <AuthForm mode="login" />
        <p className="hint spaced">
          还没有账号？<Link href="/register">前往注册</Link>
        </p>
        <p className="hint">
          忘记密码？<Link href="/reset-password">找回密码</Link>
        </p>
        <p className="hint">
          演示白名单：202202102 / 202202103 / 202202104（普通用户），123456（管理员）。
        </p>
      </section>
    </main>
  );
}