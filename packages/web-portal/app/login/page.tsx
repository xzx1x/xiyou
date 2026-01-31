"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthForm } from "../../components/auth/AuthForm";

// 登录页角色切换选项，用于展示不同权益。
const ROLE_OPTIONS = [
  { value: "USER", label: "普通用户", description: "可预约咨询、测评与查看记录" },
  { value: "COUNSELOR", label: "心理咨询师", description: "可管理档期与咨询记录" },
  { value: "ADMIN", label: "管理员", description: "可审核内容与管理账号" },
] as const;

/**
 * 登录页：提供入口说明 + 登录表单 + 白名单提示。
 */
export default function LoginPage() {
  // 当前选中的角色标签，仅用于展示权益说明。
  const [selectedRole, setSelectedRole] = useState<typeof ROLE_OPTIONS[number]["value"]>("USER");
  // 当前角色对应的权益说明。
  const activeRole = ROLE_OPTIONS.find((role) => role.value === selectedRole);

  return (
    <main className="page-shell">
      <section className="card">
        <h1>登录系统</h1>
        <p>
          使用 QQ 邮箱和密码完成登录，系统会依据绑定的学号/工号切换普通用户或管理员界面，
          成功后会进入系统首页。
        </p>
        <div className="role-tabs">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role.value}
              className={selectedRole === role.value ? "tab active" : "tab"}
              type="button"
              onClick={() => setSelectedRole(role.value)}
            >
              {role.label}
            </button>
          ))}
        </div>
        <p className="hint">
          {activeRole?.description ?? "请选择角色查看权益说明"}
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
