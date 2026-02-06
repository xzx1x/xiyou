"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  listAppointments,
  listFeedback,
  resolveAvatarUrl,
  type Appointment,
  type FeedbackRecord,
} from "../../../lib/api";

/**
 * 心理师查看满意度反馈页面。
 */
export default function CounselorFeedbackPage() {
  // 反馈列表数据。
  const [feedbackList, setFeedbackList] = useState<FeedbackRecord[]>([]);
  // 预约列表数据。
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载反馈列表。
   */
  useEffect(() => {
    async function loadFeedback() {
      setLoading(true);
      setError(null);
      try {
        const [list, appointmentList] = await Promise.all([
          listFeedback(),
          listAppointments(),
        ]);
        setFeedbackList(list);
        setAppointments(appointmentList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载反馈失败");
      } finally {
        setLoading(false);
      }
    }
    loadFeedback();
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const appointmentMap = new Map(
    appointments.map((appointment) => [appointment.id, appointment]),
  );

  const getModeLabel = (mode?: "ONLINE" | "OFFLINE" | null) =>
    mode === "ONLINE" ? "线上" : mode === "OFFLINE" ? "线下" : "未知";

  if (loading) {
    return (
      <AppShell title="满意度反馈" requiredRoles={["COUNSELOR"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="满意度反馈" requiredRoles={["COUNSELOR"]}>
      {error && (
        <CenterToast
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      <div className="card-block">
        <h3>反馈列表</h3>
        {feedbackList.length === 0 ? (
          <p className="muted">暂无反馈。</p>
        ) : (
          <ul className="list feedback-list">
            {feedbackList.map((item) => {
              const appointment = appointmentMap.get(item.appointmentId);
              const userProfile = appointment?.userProfile;
              const avatarUrl =
                resolveAvatarUrl(userProfile?.avatarUrl) || "/default-avatar.svg";
              const name = userProfile?.nickname ?? "来访者";
              const modeLabel = getModeLabel(appointment?.schedule?.mode);
              const timeLabel = appointment?.schedule
                ? `${new Date(appointment.schedule.startTime).toLocaleString("zh-CN")} - ${new Date(
                    appointment.schedule.endTime,
                  ).toLocaleTimeString("zh-CN")}`
                : appointment
                  ? new Date(appointment.createdAt).toLocaleString("zh-CN")
                  : "-";
              return (
                <li key={item.id}>
                  <div className="appointment-summary">
                    <div className="avatar-button appointment-avatar" aria-hidden="true">
                      <img
                        src={avatarUrl}
                        alt={`${name}头像`}
                        onError={(event) => {
                          const target = event.currentTarget;
                          if (!target.src.endsWith("/default-avatar.svg")) {
                            target.src = "/default-avatar.svg";
                          }
                        }}
                      />
                    </div>
                    <div className="appointment-summary-meta">
                      <strong>来访者：{name}</strong>
                      <span className="muted">咨询方式：{modeLabel}</span>
                      <span className="muted">预约时间：{timeLabel}</span>
                    </div>
                  </div>
                  <div className="muted">预约状态：{appointment?.status ?? "-"}</div>
                  <div className="muted">
                    反馈时间：{new Date(item.createdAt).toLocaleString("zh-CN")}
                  </div>
                  <div>评分：{item.rating} 分</div>
                  <div className="muted">{item.comment ?? "无文字反馈"}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
