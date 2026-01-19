"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="card">
        <h1>校园心理咨询入口</h1>
        <p>
          区块链隐私保护与存证系统的统一前端。请先完成注册或登录，后续可扩展普通用户、心理师、管理员三端能力。
        </p>
        <div className="actions">
          <Link className="btn btn-secondary" href="/register">
            我要注册
          </Link>
          <Link className="btn btn-primary" href="/login">
            直接登录
          </Link>
        </div>
      </section>
    </main>
  );
}
