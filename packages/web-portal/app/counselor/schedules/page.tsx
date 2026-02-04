"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  cancelCounselorSchedule,
  createCounselorSchedule,
  listCounselorSchedules,
  type CounselorSchedule,
} from "../../../lib/api";

/**
 * 心理师档期管理页面。
 */
export default function CounselorSchedulesPage() {
  // 档期列表数据。
  const [schedules, setSchedules] = useState<CounselorSchedule[]>([]);
  // 新建档期表单数据。
  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    mode: "ONLINE",
    location: "",
  });
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载档期列表。
   */
  useEffect(() => {
    async function loadSchedules() {
      setLoading(true);
      setError(null);
      try {
        const list = await listCounselorSchedules();
        setSchedules(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载档期失败");
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  /**
   * 创建新档期。
   */
  const handleCreate = async () => {
    setMessage(null);
    setError(null);
    try {
      const schedule = await createCounselorSchedule({
        startTime: form.startTime,
        endTime: form.endTime,
        mode: form.mode as "ONLINE" | "OFFLINE",
        location: form.location || undefined,
      });
      setSchedules((prev) => [...prev, schedule]);
      setMessage("档期已创建");
      setForm({ startTime: "", endTime: "", mode: "ONLINE", location: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    }
  };

  /**
   * 取消档期。
   */
  const handleCancel = async (scheduleId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await cancelCounselorSchedule(scheduleId);
      setMessage(result);
      setSchedules((prev) =>
        prev.map((item) =>
          item.id === scheduleId ? { ...item, status: "CANCELLED" } : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="档期管理" requiredRoles={["COUNSELOR"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="档期管理" requiredRoles={["COUNSELOR"]}>
      {(error || message) && (
        <CenterToast
          type={error ? "error" : "success"}
          message={error ?? message ?? ""}
          onClose={() => {
            setError(null);
            setMessage(null);
          }}
        />
      )}
      <div className="split-grid">
        <div className="card-block">
          <h3>创建档期</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>开始时间</span>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>结束时间</span>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
              />
            </label>
            <label className="inline-field">
              <span>咨询方式</span>
              <select
                value={form.mode}
                onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}
              >
                <option value="ONLINE">线上</option>
                <option value="OFFLINE">线下</option>
              </select>
            </label>
            <label className="inline-field">
              <span>地点</span>
              <input
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="线上可留空"
              />
            </label>
            <button className="btn btn-primary" type="button" onClick={handleCreate}>
              新增档期
            </button>
          </div>
        </div>
        <div className="card-block">
          <h3>我的档期</h3>
          {schedules.length === 0 ? (
            <p className="muted">暂无档期。</p>
          ) : (
            <ul className="list">
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <div>
                    <strong>
                      {new Date(schedule.startTime).toLocaleString("zh-CN")} -{" "}
                      {new Date(schedule.endTime).toLocaleTimeString("zh-CN")}
                    </strong>
                    <div className="muted">
                      {schedule.mode} · {schedule.location ?? "线上"} · {schedule.status}
                    </div>
                  </div>
                  {schedule.status === "AVAILABLE" && (
                    <button className="btn btn-secondary" onClick={() => handleCancel(schedule.id)}>
                      取消档期
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
