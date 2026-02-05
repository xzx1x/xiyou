"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  cancelCounselorSchedule,
  createCounselorSchedule,
  listCounselorSchedules,
  type CounselorSchedule,
} from "../../../lib/api";

const WEEK_OPTIONS = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 7, label: "周日" },
];

/**
 * 心理师档期管理页面。
 */
export default function CounselorSchedulesPage() {
  // 档期列表数据。
  const [schedules, setSchedules] = useState<CounselorSchedule[]>([]);
  const [scheduleType, setScheduleType] = useState<"SHORT" | "LONG">("SHORT");
  // 短期档期表单数据。
  const [shortForm, setShortForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    mode: "ONLINE",
    location: "",
  });
  // 长期档期表单数据。
  const [longForm, setLongForm] = useState({
    startTime: "",
    endTime: "",
    mode: "ONLINE",
    location: "",
    repeat: "ALL",
    daysOfWeek: [] as number[],
  });
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);
  const weekLabels = ["", "一", "二", "三", "四", "五", "六", "日"];

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
      const payload =
        scheduleType === "SHORT"
          ? {
              type: "SHORT" as const,
              date: shortForm.date,
              startTime: shortForm.startTime,
              endTime: shortForm.endTime,
              mode: shortForm.mode as "ONLINE" | "OFFLINE",
              location: shortForm.location || undefined,
            }
          : {
              type: "LONG" as const,
              startTime: longForm.startTime,
              endTime: longForm.endTime,
              repeat: longForm.repeat as "ALL" | "WEEKDAY" | "CUSTOM",
              daysOfWeek: longForm.repeat === "CUSTOM" ? longForm.daysOfWeek : undefined,
              mode: longForm.mode as "ONLINE" | "OFFLINE",
              location: longForm.location || undefined,
            };
      const created = await createCounselorSchedule(payload);
      setSchedules((prev) =>
        [...prev, ...created].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
      );
      setMessage(
        scheduleType === "LONG" ? `已生成 ${created.length} 个档期` : "档期已创建",
      );
      if (scheduleType === "SHORT") {
        setShortForm({ date: "", startTime: "", endTime: "", mode: "ONLINE", location: "" });
      } else {
        setLongForm({
          startTime: "",
          endTime: "",
          mode: "ONLINE",
          location: "",
          repeat: "ALL",
          daysOfWeek: [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    }
  };

  const handleToggleWeekDay = (value: number) => {
    setLongForm((prev) => {
      const nextDays = prev.daysOfWeek.includes(value)
        ? prev.daysOfWeek.filter((day) => day !== value)
        : [...prev.daysOfWeek, value];
      return { ...prev, daysOfWeek: nextDays };
    });
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

  const scheduleGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        mode: string;
        locationLabel: string;
        status: CounselorSchedule["status"];
        startTimeLabel: string;
        endTimeLabel: string;
        weekdays: Set<number>;
        items: CounselorSchedule[];
        earliest: number;
      }
    >();
    const formatTime = (value: Date) =>
      value.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    schedules.forEach((schedule) => {
      const start = new Date(schedule.startTime);
      const end = new Date(schedule.endTime);
      const startTimeLabel = formatTime(start);
      const endTimeLabel = formatTime(end);
      const locationLabel = schedule.location ?? "线上";
      const key = `${schedule.status}|${schedule.mode}|${locationLabel}|${startTimeLabel}|${endTimeLabel}`;
      const weekDay = start.getDay() === 0 ? 7 : start.getDay();
      const earliest = start.getTime();
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(schedule);
        existing.weekdays.add(weekDay);
        if (earliest < existing.earliest) {
          existing.earliest = earliest;
        }
      } else {
        groups.set(key, {
          key,
          mode: schedule.mode,
          locationLabel,
          status: schedule.status,
          startTimeLabel,
          endTimeLabel,
          weekdays: new Set([weekDay]),
          items: [schedule],
          earliest,
        });
      }
    });
    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: group.items.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
      }))
      .sort((a, b) => a.earliest - b.earliest);
  }, [schedules]);
  const formatScheduleDate = (value: string) =>
    new Date(value).toLocaleDateString("zh-CN");
  const formatScheduleTime = (value: string) =>
    new Date(value).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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
          <div className="button-row">
            <button
              className={`btn ${scheduleType === "SHORT" ? "btn-primary" : "btn-secondary"} small`}
              type="button"
              onClick={() => setScheduleType("SHORT")}
            >
              短期档期
            </button>
            <button
              className={`btn ${scheduleType === "LONG" ? "btn-primary" : "btn-secondary"} small`}
              type="button"
              onClick={() => setScheduleType("LONG")}
            >
              长期档期
            </button>
          </div>
          <div className="form-stack">
            {scheduleType === "SHORT" ? (
              <>
                <p className="muted">短期档期仅当天有效，过期后自动清理。</p>
                <label className="inline-field">
                  <span>日期</span>
                  <input
                    type="date"
                    value={shortForm.date}
                    onChange={(event) =>
                      setShortForm((prev) => ({ ...prev, date: event.target.value }))
                    }
                  />
                </label>
                <label className="inline-field">
                  <span>开始时间</span>
                  <input
                    type="time"
                    value={shortForm.startTime}
                    onChange={(event) =>
                      setShortForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                  />
                </label>
                <label className="inline-field">
                  <span>结束时间</span>
                  <input
                    type="time"
                    value={shortForm.endTime}
                    onChange={(event) =>
                      setShortForm((prev) => ({ ...prev, endTime: event.target.value }))
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <p className="muted">长期档期会自动生成未来 60 天的可预约时间。</p>
                <label className="inline-field">
                  <span>每日开始时间</span>
                  <input
                    type="time"
                    value={longForm.startTime}
                    onChange={(event) =>
                      setLongForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                  />
                </label>
                <label className="inline-field">
                  <span>每日结束时间</span>
                  <input
                    type="time"
                    value={longForm.endTime}
                    onChange={(event) =>
                      setLongForm((prev) => ({ ...prev, endTime: event.target.value }))
                    }
                  />
                </label>
                <label className="inline-field">
                  <span>重复星期</span>
                  <select
                    value={longForm.repeat}
                    onChange={(event) =>
                      setLongForm((prev) => ({
                        ...prev,
                        repeat: event.target.value as "ALL" | "WEEKDAY" | "CUSTOM",
                      }))
                    }
                  >
                    <option value="ALL">全周</option>
                    <option value="WEEKDAY">工作日</option>
                    <option value="CUSTOM">自由选择</option>
                  </select>
                </label>
                {longForm.repeat === "CUSTOM" && (
                  <div className="inline-field">
                    <span>自选星期</span>
                    <div className="weekday-options">
                      {WEEK_OPTIONS.map((option) => (
                        <label key={option.value}>
                          <input
                            type="checkbox"
                            checked={longForm.daysOfWeek.includes(option.value)}
                            onChange={() => handleToggleWeekDay(option.value)}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <label className="inline-field">
              <span>咨询方式</span>
              <select
                value={scheduleType === "SHORT" ? shortForm.mode : longForm.mode}
                onChange={(event) =>
                  scheduleType === "SHORT"
                    ? setShortForm((prev) => ({ ...prev, mode: event.target.value }))
                    : setLongForm((prev) => ({ ...prev, mode: event.target.value }))
                }
              >
                <option value="ONLINE">线上</option>
                <option value="OFFLINE">线下</option>
              </select>
            </label>
            <label className="inline-field">
              <span>地点</span>
              <input
                value={scheduleType === "SHORT" ? shortForm.location : longForm.location}
                onChange={(event) =>
                  scheduleType === "SHORT"
                    ? setShortForm((prev) => ({ ...prev, location: event.target.value }))
                    : setLongForm((prev) => ({ ...prev, location: event.target.value }))
                }
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
            <div className="schedule-group-list">
              {scheduleGroups.map((group) => {
                const weekdayText = Array.from(group.weekdays)
                  .sort((a, b) => a - b)
                  .map((day) => `周${weekLabels[day]}`)
                  .join(" ");
                const summaryTitle = `${weekdayText} ${group.startTimeLabel}-${group.endTimeLabel}`;
                if (group.items.length <= 1) {
                  const schedule = group.items[0]!;
                  return (
                    <ul key={group.key} className="list">
                      <li>
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
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleCancel(schedule.id)}
                          >
                            取消档期
                          </button>
                        )}
                      </li>
                    </ul>
                  );
                }
                return (
                  <details key={group.key} className="schedule-group">
                    <summary>
                      <div>
                        <strong>{summaryTitle}</strong>
                        <div className="muted">
                          {group.mode} · {group.locationLabel} · {group.status}
                        </div>
                      </div>
                      <span className="schedule-group-count">{group.items.length} 条</span>
                    </summary>
                    <ul className="list schedule-sublist">
                      {group.items.map((schedule) => (
                        <li key={schedule.id}>
                          <div>
                            <strong>{formatScheduleDate(schedule.startTime)}</strong>
                            <div className="muted">
                              {formatScheduleTime(schedule.startTime)} -{" "}
                              {formatScheduleTime(schedule.endTime)}
                            </div>
                          </div>
                          {schedule.status === "AVAILABLE" && (
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleCancel(schedule.id)}
                            >
                              取消档期
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
