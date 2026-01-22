"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import {
  applyCounselor,
  createAppointment,
  getMyCounselorApplication,
  listAvailableSchedules,
  listCounselors,
  type CounselorApplication,
  type CounselorListItem,
  type CounselorSchedule,
} from "../../lib/api";

/**
 * 用户端心理咨询师列表与预约页面。
 */
export default function CounselorsPage() {
  // 心理师列表数据。
  const [counselors, setCounselors] = useState<CounselorListItem[]>([]);
  // 当前选中的心理师编号。
  const [activeCounselorId, setActiveCounselorId] = useState<string | null>(null);
  // 当前选中心理师的可预约档期。
  const [schedules, setSchedules] = useState<CounselorSchedule[]>([]);
  // 预约备注。
  const [userNote, setUserNote] = useState("");
  // 心理师申请记录。
  const [application, setApplication] = useState<CounselorApplication | null>(null);
  // 申请表单输入。
  const [applyForm, setApplyForm] = useState({
    qualifications: "",
    motivation: "",
    attachmentUrls: "",
  });
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈信息。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化加载心理师列表与申请信息。
   */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [counselorList, applicationData] = await Promise.all([
          listCounselors(),
          getMyCounselorApplication(),
        ]);
        setCounselors(counselorList);
        setApplication(applicationData.application ?? null);
        if (counselorList.length > 0) {
          setActiveCounselorId(counselorList[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载心理师失败");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  /**
   * 选中心理师后加载档期列表。
   */
  useEffect(() => {
    async function loadSchedules() {
      if (!activeCounselorId) {
        return;
      }
      try {
        const list = await listAvailableSchedules(activeCounselorId);
        setSchedules(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载档期失败");
      }
    }
    loadSchedules();
  }, [activeCounselorId]);

  // 当前选中的心理师对象，便于渲染详情。
  const activeCounselor = useMemo(
    () => counselors.find((item) => item.id === activeCounselorId) ?? null,
    [counselors, activeCounselorId],
  );

  /**
   * 预约指定档期。
   */
  const handleBook = async (scheduleId: string) => {
    if (!activeCounselorId) {
      return;
    }
    setMessage(null);
    setError(null);
    try {
      const result = await createAppointment({
        counselorId: activeCounselorId,
        scheduleId,
        userNote: userNote || undefined,
      });
      setMessage(`预约成功，存证编号：${result.evidence.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "预约失败");
    }
  };

  /**
   * 提交心理师申请。
   */
  const handleApply = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await applyCounselor({
        qualifications: applyForm.qualifications || undefined,
        motivation: applyForm.motivation || undefined,
        attachmentUrls: applyForm.attachmentUrls || undefined,
      });
      setApplication(result.application ?? null);
      setMessage(`申请已提交，存证编号：${result.evidence?.id ?? "-"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "申请失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="心理咨询师">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="心理咨询师">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="split-grid">
        <div className="card-block">
          <h3>心理师列表</h3>
          <ul className="list">
            {counselors.map((counselor) => (
              <li key={counselor.id}>
                <button
                  type="button"
                  className={activeCounselorId === counselor.id ? "pill active" : "pill"}
                  onClick={() => setActiveCounselorId(counselor.id)}
                >
                  {counselor.nickname ?? counselor.email}
                </button>
                <div className="muted">{counselor.specialties ?? "暂无特长描述"}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-block">
          <h3>预约档期</h3>
          {activeCounselor ? (
            <>
              <p className="muted">
                当前心理师：{activeCounselor.nickname ?? activeCounselor.email} · {activeCounselor.serviceMode}
              </p>
              <label className="inline-field">
                <span>预约备注</span>
                <input
                  value={userNote}
                  onChange={(event) => setUserNote(event.target.value)}
                  placeholder="简要描述需求（可选）"
                />
              </label>
              {schedules.length === 0 ? (
                <p className="muted">暂无可预约档期。</p>
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
                          {schedule.mode} · {schedule.location ?? "线上"}
                        </div>
                      </div>
                      <button className="btn btn-secondary" onClick={() => handleBook(schedule.id)}>
                        预约
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="muted">请选择心理师查看档期。</p>
          )}
        </div>
      </div>
      <div className="card-block">
        <h3>心理师申请</h3>
        <p className="muted">
          当前申请状态：{application?.status ?? "未申请"}
        </p>
        {application?.status === "APPROVED" ? (
          <p>你已通过审核，可以前往心理师端管理档期。</p>
        ) : (
          <div className="form-stack">
            <label className="inline-field">
              <span>资质说明</span>
              <textarea
                value={applyForm.qualifications}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, qualifications: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>申请动机</span>
              <textarea
                value={applyForm.motivation}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, motivation: event.target.value }))
                }
              />
            </label>
            <label className="inline-field">
              <span>附件链接</span>
              <input
                value={applyForm.attachmentUrls}
                onChange={(event) =>
                  setApplyForm((prev) => ({ ...prev, attachmentUrls: event.target.value }))
                }
                placeholder="证书/资质链接"
              />
            </label>
            <button className="btn btn-primary" type="button" onClick={handleApply}>
              提交申请
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
