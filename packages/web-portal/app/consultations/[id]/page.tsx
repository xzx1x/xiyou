"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import { getConsultationDetail, type ConsultationRecord } from "../../../lib/api";

/**
 * 咨询记录详情页面。
 */
export default function ConsultationDetailPage() {
  const params = useParams();
  // 路由参数中的记录编号。
  const recordId = String(params?.id ?? "");
  // 咨询记录详情。
  const [record, setRecord] = useState<ConsultationRecord | null>(null);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载咨询记录详情。
   */
  useEffect(() => {
    async function loadRecord() {
      if (!recordId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const detail = await getConsultationDetail(recordId);
        setRecord(detail);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载记录失败");
      } finally {
        setLoading(false);
      }
    }
    loadRecord();
  }, [recordId]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (loading) {
    return (
      <AppShell title="记录详情" requiredRoles={["USER"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="记录详情" requiredRoles={["USER"]}>
      {error && (
        <CenterToast type="error" message={error} onClose={() => setError(null)} />
      )}
      {record ? (
        <div className="card-block">
          <h3>咨询摘要</h3>
          <p>{record.summary ?? "暂无摘要"}</p>
          <h3>心理师反馈</h3>
          <p>{record.counselorFeedback ?? "暂无反馈"}</p>
          <h3>作业与跟进</h3>
          <p>{record.homework ?? "暂无作业"} · {record.followUpPlan ?? "暂无跟进计划"}</p>
          <h3>测评与危机</h3>
          <p>测评总结：{record.assessmentSummary ?? "暂无"}</p>
          <p>危机标记：{record.isCrisis ? "是" : "否"}</p>
        </div>
      ) : (
        <p className="muted">未找到咨询记录。</p>
      )}
    </AppShell>
  );
}
