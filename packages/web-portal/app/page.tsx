"use client";

import Link from "next/link";
import { AppShell } from "../components/layouts/AppShell";

// 用户端快捷功能入口配置。
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
    description: "情绪、焦虑、压力、睡眠、社交等测评，分数与建议即刻可见。",
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
    title: "消息",
    description: "系统提醒、好友聊天、申请处理集中在这里。",
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
    description: "与心理师或好友私聊，接收即时提醒。",
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

// 心理师端功能亮点配置。
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

// 首页消息预览数据。
const notifications = [
  {
    title: "预约确认：心理师李老师已通过",
    time: "3 分钟前",
    message: "您的 2026/02/14 15:00 咨询已被确认，地点：线上。",
  },
  {
    title: "测评报告生成",
    time: "上午 09:12",
    message: "情绪测评得分 24 分，当前属于轻度波动，可根据建议调整作息。",
  },
  {
    title: "论坛热帖：初心人的夜晚",
    time: "昨天",
    message: "匿名社区>来自杭州市的「愿望」发布了新的情绪管理分享。",
  },
];

// 测评结果亮点展示。
const evaluationHighlights = [
  {
    label: "情绪状态",
    value: "24 分 · 轻度波动",
    description: "建议继续保持作息规律，并记录每日情绪。",
  },
  {
    label: "压力负荷",
    value: "28 分 · 轻度压力",
    description: "可尝试呼吸练习与正念，心理师将在下一次会话中推进。",
  },
  {
    label: "满意度问卷",
    value: "92% 好评",
    description: "92% 来访者反馈帮扶有效，管理员可查阅详情。",
  },
];

/**
 * 首页：展示功能概览与系统亮点。
 */
export default function HomePage() {
  return (
    <AppShell title="首页概览" description="快速了解系统功能与使用入口。" withPanel={false}>
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            <span>已登录</span> · 普通用户
          </p>
          <h1>
            校园心理咨询 · <span className="gradient-text">安全信任</span> 与“记录即存证”
          </h1>
          <p>
            预约/测评/咨询记录在后台统一归档，心理师身份需由管理员审核；链上存证接口已预留。
          </p>
          <div className="hero-actions">
            <Link href="/counselors" className="btn btn-primary">
              开始预约
            </Link>
            <Link href="/assessments" className="btn btn-secondary">
              立即测评
            </Link>
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
            <strong>42 条记录已占位</strong>
          </div>
        </div>
      </section>

      <section className="panel quick-actions">
        <div className="panel-heading">
          <div>
            <h2>一键跳转 · 功能概览</h2>
            <p>快速进入预约、测评、心理社区等关键模块</p>
          </div>
          <Link href="/profile" className="ghost-btn small">
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

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>心理师端 · 服务能力</h2>
            <p>面向心理咨询师的日程、记录与统计能力</p>
          </div>
          <Link href="/counselor/schedules" className="ghost-btn small">
            进入心理师端
          </Link>
        </div>
        <div className="action-grid">
          {counselorTools.map((tool) => (
            <article key={tool.title} className="action-card">
              <div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>最新消息预览</h2>
            <p>消息模块统一展示预约结果、提醒与公告</p>
          </div>
          <Link href="/notifications" className="ghost-btn small">
            查看全部
          </Link>
        </div>
        <div className="timeline">
          {notifications.map((item) => (
            <div key={item.title} className="timeline-item">
              <span>{item.time}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>测评与满意度亮点</h2>
            <p>心理测评即时生成评分与建议</p>
          </div>
          <Link href="/assessments" className="ghost-btn small">
            查看测评
          </Link>
        </div>
        <div className="action-grid">
          {evaluationHighlights.map((item) => (
            <article key={item.label} className="action-card">
              <h3>{item.label}</h3>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
