"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import { cancelAppointment, getAppointmentDetail, type Appointment } from "../../../lib/api";

/**
 * 预约详情页面。
 */
export default function AppointmentDetailPage() {
  const params = useParams();
  // 路由参数中的预约编号。
  const appointmentId = String(params?.id ?? "");
  // 预约详情数据。
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈信息。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载预约详情。
   */
  useEffect(() => {
    async function loadDetail() {
      if (!appointmentId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const detail = await getAppointmentDetail(appointmentId);
        setAppointment(detail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载预约失败");
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [appointmentId]);

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
   * 取消当前预约。
   */
  const handleCancel = async () => {
    if (!appointmentId) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const result = await cancelAppointment(appointmentId);
      setMessage(result);
      setAppointment((prev) =>
        prev ? { ...prev, status: "CANCELLED_BY_USER" } : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="预约详情" requiredRoles={["USER"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="预约详情" requiredRoles={["USER"]}>
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
      {appointment ? (
        <div className="card-block">
          <h3>预约信息</h3>
          <p>状态：{appointment.status}</p>
          <p>备注：{appointment.userNote ?? "-"}</p>
          <p>创建时间：{new Date(appointment.createdAt).toLocaleString("zh-CN")}</p>
          {appointment.status === "BOOKED" && (
            <button className="btn btn-secondary" type="button" onClick={handleCancel}>
              取消预约
            </button>
          )}
        </div>
      ) : (
        <p className="muted">未找到预约详情。</p>
      )}
    </AppShell>
  );
}
