"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode, useEffect } from "react";
import { getProfile, resolveAvatarUrl, type User, type UserRole } from "../../lib/api";

// 侧边导航项结构，统一渲染菜单。
type NavItem = {
  label: string;
  href: string;
};

// 页面外壳组件的输入参数结构。
type AppShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  requiredRoles?: UserRole[];
  withPanel?: boolean;
};

// 通用导航项，所有角色均可访问。
const COMMON_NAV: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "心理测评", href: "/assessments" },
  { label: "消息", href: "/notifications" },
  { label: "论坛社区", href: "/forum" },
  { label: "个人主页", href: "/profile" },
];

// 普通用户导航项，覆盖预约、咨询与反馈流程。
const USER_NAV: NavItem[] = [
  { label: "心理咨询师", href: "/counselors" },
  { label: "预约管理", href: "/appointments" },
  { label: "咨询记录", href: "/consultations" },
  { label: "咨询反馈", href: "/feedback" },
];

// 心理咨询师导航项，用于档期、预约与统计。
const COUNSELOR_NAV: NavItem[] = [
  { label: "档期管理", href: "/counselor/schedules" },
  { label: "预约查看", href: "/counselor/appointments" },
  { label: "咨询记录", href: "/counselor/records" },
  { label: "满意度反馈", href: "/counselor/feedback" },
  { label: "服务统计", href: "/counselor/stats" },
];

// 管理员导航项，用于审核与数据治理。
const ADMIN_NAV: NavItem[] = [
  { label: "账号管理", href: "/admin/users" },
  { label: "心理师审批", href: "/admin/counselor-applications" },
  { label: "论坛审核", href: "/admin/forum-review" },
  { label: "举报处理", href: "/admin/reports" },
  { label: "统计报表", href: "/admin/stats" },
  { label: "访问日志", href: "/admin/logs" },
];

/**
 * 通用应用外壳，封装导航、权限提示与标题区域。
 */
export function AppShell({
  title,
  description,
  children,
  requiredRoles,
  // 是否使用默认面板布局包裹内容。
  withPanel = true,
}: AppShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载当前登录用户，用于渲染权限菜单。
   */
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await getProfile();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "请先登录");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // 根据用户角色拼接可见导航菜单。
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

  // 判断是否满足页面所需角色。
  const roleDenied =
    !!requiredRoles && !!user && !requiredRoles.includes(user.role);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="card">
          <h1>正在加载</h1>
          <p>正在读取账号信息，请稍候…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="card">
          <h1>需要登录</h1>
          <p>{error}</p>
          <Link className="btn btn-primary" href="/login">
            前往登录
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
          <div>
            <strong>校心连线</strong>
            <p>心理咨询 · 站内存证 · 角色协作</p>
          </div>
        </div>
        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <div className="search-pill">
            <input type="text" placeholder="搜索预约/咨询师" />
            <span>搜索</span>
          </div>
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
              <button className="ghost-btn small" type="button" onClick={() => router.back()}>
                返回
              </button>
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
