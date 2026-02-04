"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import { cancelAppointment, listAppointments, type Appointment } from "../../lib/api";

/**
 * 用户端预约管理页面。
 */
export default function AppointmentsPage() {
  // 预约列表数据。
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作错误提示。
  const [error, setError] = useState<string | null>(null);
  // 操作成功提示。
  const [message, setMessage] = useState<string | null>(null);

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
   * 取消预约。
   */
  const handleCancel = async (appointmentId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await cancelAppointment(appointmentId);
      setMessage(result);
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? { ...item, status: "CANCELLED_BY_USER" }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="预约管理" requiredRoles={["USER"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="预约管理" requiredRoles={["USER"]}>
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
        <h3>我的预约</h3>
        {appointments.length === 0 ? (
          <p className="muted">暂无预约记录。</p>
        ) : (
          <ul className="list">
            {appointments.map((appointment) => (
              <li key={appointment.id}>
                <div>
                  <strong>预约状态：{appointment.status}</strong>
                  <small>创建时间：{new Date(appointment.createdAt).toLocaleString("zh-CN")}</small>
                </div>
                <div className="button-row">
                  <Link className="btn btn-secondary" href={`/appointments/${appointment.id}`}>
                    查看详情
                  </Link>
                  {appointment.status === "BOOKED" && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => handleCancel(appointment.id)}
                    >
                      取消预约
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
