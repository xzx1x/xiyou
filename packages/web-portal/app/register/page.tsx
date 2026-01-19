"use client";

import Link from "next/link";
import { AuthForm } from "../../components/auth/AuthForm";

/**
 * 注册页：强调白名单机制，并提供演示用学号列表。
 */
export default function RegisterPage() {
  return (
    <main className="page-shell">
      <section className="card">
        <h1>注册新账号</h1>
        <p>
          填入 QQ 邮箱、密码与学号/工号。系统会根据后台白名单判定角色（默认普通用户，指定学号映射管理员），
          登录后可申请升级为心理咨询师。
        </p>
        <AuthForm mode="register" />
        <p className="hint">
          已有账号？<Link href="/login">直接登录</Link>
        </p>
        <p className="hint">
          当前演示白名单：普通用户学号 202202102 / 202202103 / 202202104；管理员学号 123456。
        </p>
      </section>
    </main>
  );
}
