"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  cancelAppointment,
  completeAppointment,
  listAppointments,
  updateAppointmentNote,
  type Appointment,
} from "../../../lib/api";

/**
 * 心理师预约管理页面。
 */
export default function CounselorAppointmentsPage() {
  // 预约列表数据。
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // 预约备注输入缓存。
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载预约列表。
   */
  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);
      try {
        const list = await listAppointments();
        setAppointments(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载预约失败");
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
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
   * 更新预约备注。
   */
  const handleNoteUpdate = async (appointmentId: string) => {
    setMessage(null);
    setError(null);
    try {
      const note = noteMap[appointmentId] ?? "";
      const result = await updateAppointmentNote(appointmentId, note);
      setMessage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    }
  };

  /**
   * 标记预约完成。
   */
  const handleComplete = async (appointmentId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await completeAppointment(appointmentId);
      setMessage(result);
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId ? { ...item, status: "COMPLETED" } : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };

  /**
   * 心理师请假取消预约。
   */
  const handleCancel = async (appointmentId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await cancelAppointment(appointmentId, "心理师请假取消");
      setMessage(result);
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? { ...item, status: "CANCELLED_BY_COUNSELOR" }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="预约查看" requiredRoles={["COUNSELOR"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="预约查看" requiredRoles={["COUNSELOR"]}>
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
      <div className="card-block">
        <h3>预约列表</h3>
        {appointments.length === 0 ? (
          <p className="muted">暂无预约。</p>
        ) : (
          <ul className="list">
            {appointments.map((appointment) => (
              <li key={appointment.id}>
                <div>
                  <strong>预约时间：{new Date(appointment.createdAt).toLocaleString("zh-CN")}</strong>
                  <div className="muted">状态：{appointment.status}</div>
                </div>
                <div className="form-stack">
                  <label className="inline-field">
                    <span>准备备注</span>
                    <input
                      value={noteMap[appointment.id] ?? appointment.counselorNote ?? ""}
                      onChange={(event) =>
                        setNoteMap((prev) => ({ ...prev, [appointment.id]: event.target.value }))
                      }
                    />
                  </label>
                  <div className="button-row">
                    <button className="btn btn-secondary" onClick={() => handleNoteUpdate(appointment.id)}>
                      保存备注
                    </button>
                    {appointment.status === "BOOKED" && (
                      <>
                        <button className="btn btn-secondary" onClick={() => handleComplete(appointment.id)}>
                          标记完成
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleCancel(appointment.id)}>
                          请假取消
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
