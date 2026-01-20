"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const quickActions = [
  {
    title: "预约管理",
    description: "浏览咨询师档期、提交申请、查看预约详情、取消或改期。",
    badge: "预约",
    icon: "🗓️",
    accent: "#fb923c",
  },
  {
    title: "心理测评",
    description: "PHQ-9、GAD-7 等心理量表，分数与建议即刻可见。",
    badge: "测评",
    icon: "📊",
    accent: "#c084fc",
  },
  {
    title: "咨询记录",
    description: "查看会话摘要、心理师备忘、作业与跟进计划。",
    badge: "记录",
    icon: "📝",
    accent: "#38bdf8",
  },
  {
    title: "咨询结果问卷",
    description: "满意度、意见与感受反馈，并可对心理师打分。",
    badge: "反馈",
    icon: "💌",
    accent: "#f472b6",
  },
  {
    title: "消息中心",
    description: "预约提醒、心理师回复、系统公告多渠道统一呈现。",
    badge: "通知",
    icon: "✉️",
    accent: "#4ade80",
  },
  {
    title: "匿名倾诉/论坛",
    description: "发布心事、参与主题讨论、点赞与回复。",
    badge: "社区",
    icon: "🗣️",
    accent: "#facc15",
  },
  {
    title: "聊天功能",
    description: "与心理师或好友私聊/群聊，实时支持语音/文字。",
    badge: "聊天",
    icon: "💬",
    accent: "#a5b4fc",
  },
  {
    title: "举报与监管",
    description: "对恶意内容发起举报，管理员同步审核与反馈。",
    badge: "安全",
    icon: "🚨",
    accent: "#f87171",
  },
];

const counselorTools = [
  {
    title: "日程与档期管理",
    description: "设置可预约时段、地点（线上/线下），及时同步普通用户。",
  },
  {
    title: "预约查看与审批",
    description: "理解来访者背景、标注准备事项，支持请假与撤销。",
  },
  {
    title: "咨询记录与笔记",
    description: "记录会话干预、心理测评、作业与跟进建议。",
  },
  {
    title: "统计视图与满意度",
    description: "可视化服务次数、满意度、常见问题分类。",
  },
];

const notifications = [
  {
    title: "预约确认：心理师李老师已通过",
    time: "3 分钟前",
    message: "您的 2026/02/14 15:00 咨询已被确认，地点：线上。",
  },
  {
    title: "测评报告生成",
    time: "上午 09:12",
    message: "PHQ-9 分数 8 分，当前属于轻度抑郁，可根据建议调整作息。",
  },
  {
    title: "论坛热帖：初心人的夜晚",
    time: "昨天",
    message: "匿名社区>来自杭州市的「愿望」发布了新的情绪管理分享。",
  },
];

const evaluationHighlights = [
  {
    label: "PHQ-9",
    value: "8 分 · 轻度抑郁",
    description: "建议继续保持作息规律，并记录每日情绪。",
  },
  {
    label: "GAD-7",
    value: "6 分 · 轻度焦虑",
    description: "可尝试呼吸练习与正念，心理师将在下一次会话中推进。",
  },
  {
    label: "满意度问卷",
    value: "92% 好评",
    description: "92% 来访者反馈帮扶有效，管理员可查阅详情。",
  },
];

export default function HomePage() {
  const [userRole, setUserRole] = useState<"USER" | "COUNSELOR">("USER");
  const [loggedIn, setLoggedIn] = useState(true);
  const heroStatus = useMemo(
    () => ({
      badge: loggedIn ? "已登录" : "未登录",
      action: loggedIn ? "登出" : "模拟登录",
    }),
    [loggedIn],
  );

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="logo-icon">Ψ</span>
          <div>
            <strong>校心连线</strong>
            <p>区块链存证 | 心理咨询 | 隐私保护</p>
          </div>
        </div>
        <nav className="dashboard-nav">
          <Link href="/" className="nav-link">
            首页
          </Link>
          <Link href="/articles" className="nav-link">
            阅读
          </Link>
          <Link href="/qa" className="nav-link">
            问答
          </Link>
          <Link href="/courses" className="nav-link">
            学堂
          </Link>
          <Link href="/counselors" className="nav-link">
            心理咨询
          </Link>
          <Link href="/forum" className="nav-link">
            倾诉社区
          </Link>
        </nav>
        <div className="header-actions">
          <div className="search-pill">
            <input
              type="text"
              placeholder="输入关键词搜索预约/内容"
              aria-label="搜索"
            />
            <span>搜索</span>
          </div>
          <Link href="/login" className="ghost-btn small">
            重新登录
          </Link>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="hero-card">
          <div>
            <p className="eyebrow">
              <span>{heroStatus.badge}</span> · {userRole === "USER" ? "普通用户" : "心理师"}
            </p>
            <h1>
              校园心理咨询 · <span className="gradient-text">安全信任</span> 与“记录即存证”
            </h1>
            <p>
              使用链上存证与本地隐私强化策略，预约/测评/咨询记录在后台统一归档，心理师身份需由管理员审核。
            </p>
            <div className="hero-actions">
              <button
                className="btn btn-primary"
                onClick={() => setLoggedIn((prev) => !prev)}
              >
                {heroStatus.action}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  setUserRole((prev) => (prev === "USER" ? "COUNSELOR" : "USER"))
                }
              >
                {userRole === "USER" ? "申请心理师身份" : "切换回用户视角"}
              </button>
            </div>
          </div>
          <div className="status-panel">
            <div>
              <small>本周预约</small>
              <strong>3 / 5 次</strong>
            </div>
            <div>
              <small>最新消息</small>
              <strong>收到 8 条面谈反馈</strong>
            </div>
            <div>
              <small>链上存证</small>
              <strong>42 条记录已上链</strong>
            </div>
          </div>
        </section>

        <section className="panel quick-actions">
          <div className="panel-heading">
            <div>
              <h2>一键跳转 · 功能概览</h2>
              <p>参考壹心理排版，快速进入预约、测评、心理社区等关键模块</p>
            </div>
            <Link href="/register" className="ghost-btn small">
              完善资料
            </Link>
          </div>
          <div className="action-grid">
            {quickActions.map((action) => (
              <article key={action.title} className="action-card">
                <div className="action-badge" style={{ background: action.accent }}>
                  {action.icon}
                </div>
                <div>
                  <p className="action-label">{action.badge}</p>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel evaluation-panel">
          <div className="panel-heading">
            <div>
              <h2>近期测评·反馈</h2>
              <p>你的心理状态与满意度统计一目了然</p>
            </div>
            <button className="ghost-btn small">查看全部报告</button>
          </div>
          <div className="evaluation-grid">
            {evaluationHighlights.map((item) => (
              <article key={item.label} className="evaluation-card">
                <p className="eyebrow">{item.label}</p>
                <strong>{item.value}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel notifications-panel">
          <div className="panel-heading">
            <div>
              <h2>通知与动态</h2>
              <p>重要咨询、论坛热帖、举报反馈</p>
            </div>
            <button className="ghost-btn small">通知设置</button>
          </div>
          <div className="notifications-list">
            {notifications.map((note) => (
              <article key={note.title}>
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.message}</p>
                </div>
                <span>{note.time}</span>
              </article>
            ))}
          </div>
        </section>

        {userRole === "COUNSELOR" && (
          <section className="panel counselor-panel">
            <div className="panel-heading">
              <div>
                <h2>心理师工具箱</h2>
                <p>心理师身份成功审批后自动开放以下功能</p>
              </div>
              <Link href="/counselor/appointments" className="ghost-btn small">
                查看审批列表
              </Link>
            </div>
            <div className="counselor-grid">
              {counselorTools.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="dashboard-footer">
        <div>
          <strong>校心连线</strong>
          <p>使命：用区块链把咨询记录安全锁住，用 AI 为心理师赋能。</p>
        </div>
        <div>
          <p>联系与支持</p>
          <small>心理健康中心 · 校内服务 · 24h 咨询</small>
        </div>
        <div>
          <p>版本</p>
          <small>v0.2 · 包含登录/注册、白名单、测评、论坛、存证</small>
        </div>
      </footer>
    </div>
  );
}
