"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getProfile, resolveAvatarUrl, type User, type UserRole } from "../../lib/api";
import { MetaMaskWallet } from "../wallet/MetaMaskWallet";

type NavItem = {
  label: string;
  href: string;
};

type AppShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  requiredRoles?: UserRole[];
  withPanel?: boolean;
  panelAction?: ReactNode;
};

const COMMON_NAV: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "心理测评", href: "/assessments" },
  { label: "消息", href: "/notifications" },
  { label: "论坛社区", href: "/forum" },
  { label: "个人主页", href: "/profile" },
];

const USER_NAV: NavItem[] = [
  { label: "心理咨询师", href: "/counselors" },
  { label: "预约管理", href: "/appointments" },
  { label: "咨询记录", href: "/consultations" },
  { label: "咨询反馈", href: "/feedback" },
];

const COUNSELOR_NAV: NavItem[] = [
  { label: "档期管理", href: "/counselor/schedules" },
  { label: "预约查看", href: "/counselor/appointments" },
  { label: "咨询记录", href: "/counselor/records" },
  { label: "满意度反馈", href: "/counselor/feedback" },
  { label: "服务统计", href: "/counselor/stats" },
];

const ADMIN_NAV: NavItem[] = [
  { label: "账号管理", href: "/admin/users" },
  { label: "心理师审核", href: "/admin/counselor-applications" },
  { label: "论坛审核", href: "/admin/forum-review" },
  { label: "发布公告", href: "/admin/announcements" },
  { label: "举报处理", href: "/admin/reports" },
  { label: "统计报表", href: "/admin/stats" },
  { label: "访问日志", href: "/admin/logs" },
];

export function AppShell({
  title,
  description,
  children,
  requiredRoles,
  withPanel = true,
  panelAction,
}: AppShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("campus_auth_token");
      if (!token) {
        setRedirecting(true);
        setLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const data = await getProfile();
        setUser(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "请先登录";
        if (
          message.includes("Token 无效或已过期") ||
          message.includes("缺少访问令牌") ||
          message.includes("未授权") ||
          message.includes("Unauthorized") ||
          message.includes("401") ||
          message.includes("请先登录") ||
          message.includes("需要登录")
        ) {
          localStorage.removeItem("campus_auth_token");
          setRedirecting(true);
          router.replace("/login");
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const navItems = useMemo(() => {
    if (!user) {
      return COMMON_NAV;
    }
    if (user.role === "ADMIN") {
      return [...COMMON_NAV, ...ADMIN_NAV];
    }
    if (user.role === "COUNSELOR") {
      return [...COMMON_NAV, ...COUNSELOR_NAV];
    }
    return [...COMMON_NAV, ...USER_NAV];
  }, [user]);

  const avatarUrl = useMemo(
    () => resolveAvatarUrl(user?.avatarUrl) || "/default-avatar.svg",
    [user?.avatarUrl],
  );

  const avatarAlt = user?.nickname ?? user?.email ?? "用户";
  const roleDenied =
    Boolean(requiredRoles) && Boolean(user) && !requiredRoles!.includes(user!.role);

  if (loading || redirecting) {
    return (
      <div className="page-shell">
        <div className="card">
          <h1>正在加载</h1>
          <p>正在读取账号信息，请稍候。</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="card">
          <h1>页面加载失败</h1>
          <p>{error}</p>
          <Link className="btn btn-secondary" href="/">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (roleDenied) {
    return (
      <div className="page-shell">
        <div className="card">
          <h1>权限不足</h1>
          <p>当前账号无权访问该页面。</p>
          <Link className="btn btn-secondary" href="/">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <img
            className="logo-avatar"
            src={avatarUrl}
            alt={`${avatarAlt}头像`}
            onError={(event) => {
              const target = event.currentTarget;
              if (!target.src.endsWith("/default-avatar.svg")) {
                target.src = "/default-avatar.svg";
              }
            }}
          />
        </div>

        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <MetaMaskWallet />
          <Link href="/login" className="ghost-btn small">
            切换账号
          </Link>
        </div>
      </header>

      <main className="dashboard-main">
        {withPanel ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{title}</h2>
                <p>{description ?? `当前身份：${user?.role ?? "未知"}`}</p>
              </div>
              {panelAction ?? (
                <button
                  className="ghost-btn small"
                  type="button"
                  onClick={() => router.back()}
                >
                  返回
                </button>
              )}
            </div>
            <div className="panel-body">{children}</div>
          </section>
        ) : (
          <div className="panel-body">{children}</div>
        )}
      </main>
    </div>
  );
}
