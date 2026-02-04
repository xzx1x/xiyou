"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  createConsultation,
  listAppointments,
  listConsultations,
  updateConsultation,
  type Appointment,
  type ConsultationRecord,
} from "../../../lib/api";

/**
 * 心理师咨询记录管理页面。
 */
export default function CounselorRecordsPage() {
  // 咨询记录列表数据。
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  // 预约列表数据。
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // 新建咨询记录表单。
  const [createForm, setCreateForm] = useState({
    appointmentId: "",
    summary: "",
    counselorFeedback: "",
    homework: "",
    followUpPlan: "",
    assessmentSummary: "",
    issueCategory: "",
    isCrisis: false,
  });
  // 更新咨询记录表单。
  const [updateForm, setUpdateForm] = useState({
    recordId: "",
    summary: "",
    counselorFeedback: "",
    homework: "",
    followUpPlan: "",
    assessmentSummary: "",
    issueCategory: "",
    isCrisis: false,
  });
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载咨询记录列表。
   */
  useEffect(() => {
    async function loadRecords() {
      setLoading(true);
      setError(null);
      try {
        const [list, appointmentList] = await Promise.all([
          listConsultations(),
          listAppointments(),
        ]);
        setRecords(list);
        setAppointments(appointmentList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载记录失败");
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
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
   * 创建咨询记录。
   */
  const handleCreate = async () => {
    setMessage(null);
    setError(null);
    if (!createForm.appointmentId) {
      setError("请选择预约记录");
      return;
    }
    try {
      const result = await createConsultation({
        appointmentId: createForm.appointmentId,
        summary: createForm.summary || undefined,
        counselorFeedback: createForm.counselorFeedback || undefined,
        homework: createForm.homework || undefined,
        followUpPlan: createForm.followUpPlan || undefined,
        assessmentSummary: createForm.assessmentSummary || undefined,
        issueCategory: createForm.issueCategory || undefined,
        isCrisis: createForm.isCrisis,
      });
      setRecords((prev) => [result.record, ...prev]);
      setMessage("记录已创建，已存证");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    }
  };

  /**
   * 更新咨询记录。
   */
  const handleUpdate = async () => {
    if (!updateForm.recordId) {
      setError("请选择记录");
      return;
    }
    setMessage(null);
    setError(null);
    try {
      const record = await updateConsultation(updateForm.recordId, {
        summary: updateForm.summary || undefined,
        counselorFeedback: updateForm.counselorFeedback || undefined,
        homework: updateForm.homework || undefined,
        followUpPlan: updateForm.followUpPlan || undefined,
        assessmentSummary: updateForm.assessmentSummary || undefined,
        issueCategory: updateForm.issueCategory || undefined,
        isCrisis: updateForm.isCrisis,
      });
      setRecords((prev) =>
        prev.map((item) => (item.id === record.id ? record : item)),
      );
      setMessage("记录已更新");
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="咨询记录" requiredRoles={["COUNSELOR"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="咨询记录" requiredRoles={["COUNSELOR"]}>
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
          <h3>创建记录</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>预约记录</span>
              <select
                value={createForm.appointmentId}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, appointmentId: event.target.value }))
                }
              >
                <option value="">请选择预约记录</option>
                {appointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {`${new Date(appointment.createdAt).toLocaleString("zh-CN")} · ${appointment.status}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-field">
              <span>会话摘要</span>
              <textarea
                value={createForm.summary}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, summary: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>心理师反馈</span>
              <textarea
                value={createForm.counselorFeedback}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, counselorFeedback: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>作业布置</span>
              <input
                value={createForm.homework}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, homework: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>跟进计划</span>
              <input
                value={createForm.followUpPlan}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, followUpPlan: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>问题分类</span>
              <input
                value={createForm.issueCategory}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, issueCategory: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>危机标记</span>
              <input
                type="checkbox"
                checked={createForm.isCrisis}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, isCrisis: event.target.checked }))
                }
              />
            </label>
            <button className="btn btn-primary" type="button" onClick={handleCreate}>
              创建记录
            </button>
          </div>
        </div>
        <div className="card-block">
          <h3>更新记录</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>咨询记录</span>
              <select
                value={updateForm.recordId}
                onChange={(event) =>
                  setUpdateForm((prev) => ({ ...prev, recordId: event.target.value }))
                }
              >
                <option value="">请选择咨询记录</option>
                {records.map((record) => (
                  <option key={record.id} value={record.id}>
                    {`${new Date(record.createdAt).toLocaleString("zh-CN")} · ${record.issueCategory ?? "未分类"}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-field">
              <span>会话摘要</span>
              <textarea
                value={updateForm.summary}
                onChange={(event) =>
                  setUpdateForm((prev) => ({ ...prev, summary: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>心理师反馈</span>
              <textarea
                value={updateForm.counselorFeedback}
                onChange={(event) =>
                  setUpdateForm((prev) => ({ ...prev, counselorFeedback: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>作业布置</span>
              <input
                value={updateForm.homework}
                onChange={(event) =>
                  setUpdateForm((prev) => ({ ...prev, homework: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>跟进计划</span>
              <input
                value={updateForm.followUpPlan}
                onChange={(event) =>
                  setUpdateForm((prev) => ({ ...prev, followUpPlan: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>问题分类</span>
              <input
                value={updateForm.issueCategory}
                onChange={(event) =>
                  setUpdateForm((prev) => ({ ...prev, issueCategory: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>危机标记</span>
              <input
                type="checkbox"
                checked={updateForm.isCrisis}
                onChange={(event) =>
                  setUpdateForm((prev) => ({ ...prev, isCrisis: event.target.checked }))
                }
              />
            </label>
            <button className="btn btn-secondary" type="button" onClick={handleUpdate}>
              更新记录
            </button>
          </div>
        </div>
      </div>
      <div className="card-block">
        <h3>记录列表</h3>
        {records.length === 0 ? (
          <p className="muted">暂无记录。</p>
        ) : (
          <ul className="list">
            {records.map((record) => (
              <li key={record.id}>
                <strong>记录时间：{new Date(record.createdAt).toLocaleString("zh-CN")}</strong>
                <div className="muted">问题分类：{record.issueCategory ?? "-"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
