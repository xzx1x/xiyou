"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  getConsultationDetail,
  getEvidenceByTarget,
  type ConsultationRecord,
  type EvidenceRecord,
  type EvidenceVerification,
} from "../../../lib/api";

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("zh-CN") : "-";

function getEvidenceStatusLabel(evidence: EvidenceRecord | null) {
  if (!evidence) {
    return "暂无存证记录";
  }
  return evidence.status === "RECORDED" ? "已上链" : "待同步";
}

function getVerificationLabel(verification: EvidenceVerification | null) {
  if (!verification) {
    return "当前对象暂不支持链上核验";
  }
  if (verification.isVerified === true) {
    return "链上哈希校验通过";
  }
  if (verification.isVerified === false) {
    return "链上哈希校验失败";
  }
  return verification.reason ?? "暂无法完成链上核验";
}

export default function ConsultationDetailPage() {
  const params = useParams();
  const recordId = String(params?.id ?? "");
  const [record, setRecord] = useState<ConsultationRecord | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord | null>(null);
  const [verification, setVerification] = useState<EvidenceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      if (!recordId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [detail, evidenceResult] = await Promise.all([
          getConsultationDetail(recordId),
          getEvidenceByTarget({
            targetType: "CONSULTATION",
            targetId: recordId,
          }),
        ]);
        setRecord(detail);
        setEvidence(evidenceResult.evidence);
        setVerification(evidenceResult.verification);
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
        <div className="consultation-detail-layout">
          <section className="card-block consultation-section">
            <div className="consultation-section-header">
              <h3>记录概览</h3>
              <span className="consultation-time">
                {formatDateTime(record.createdAt)}
              </span>
            </div>

            <div className="consultation-meta-grid">
              <div className="consultation-meta-item">
                <span>问题分类</span>
                <strong>{record.issueCategory ?? "未填写"}</strong>
              </div>
              <div className="consultation-meta-item">
                <span>危机标记</span>
                <strong>{record.isCrisis ? "是" : "否"}</strong>
              </div>
              <div className="consultation-meta-item">
                <span>创建时间</span>
                <strong>{formatDateTime(record.createdAt)}</strong>
              </div>
              <div className="consultation-meta-item">
                <span>更新时间</span>
                <strong>{formatDateTime(record.updatedAt)}</strong>
              </div>
            </div>
          </section>

          <section className="card-block consultation-section">
            <div className="consultation-section-header">
              <h3>咨询内容</h3>
            </div>

            <div className="consultation-text-block">
              <span className="consultation-label">咨询摘要</span>
              <p>{record.summary ?? "暂无摘要"}</p>
            </div>

            <div className="consultation-text-block">
              <span className="consultation-label">心理师反馈</span>
              <p>{record.counselorFeedback ?? "暂无反馈"}</p>
            </div>

            <div className="consultation-inline-grid">
              <div className="consultation-text-block">
                <span className="consultation-label">作业布置</span>
                <p>{record.homework ?? "暂无作业"}</p>
              </div>
              <div className="consultation-text-block">
                <span className="consultation-label">跟进计划</span>
                <p>{record.followUpPlan ?? "暂无跟进计划"}</p>
              </div>
            </div>

            <div className="consultation-text-block">
              <span className="consultation-label">测评总结</span>
              <p>{record.assessmentSummary ?? "暂无"}</p>
            </div>
          </section>

          <section className="card-block consultation-section">
            <div className="consultation-section-header">
              <h3>链上存证</h3>
            </div>

            <div className="consultation-proof-grid">
              <div className="consultation-proof-item">
                <span>存证状态</span>
                <strong>{getEvidenceStatusLabel(evidence)}</strong>
              </div>
              <div className="consultation-proof-item">
                <span>核验结果</span>
                <strong>{getVerificationLabel(verification)}</strong>
              </div>
            </div>

            {evidence?.recordHash && (
              <div className="consultation-text-block">
                <span className="consultation-label">存证哈希</span>
                <p>{evidence.recordHash}</p>
              </div>
            )}

            {verification?.localRecordHash && (
              <div className="consultation-text-block">
                <span className="consultation-label">本地哈希</span>
                <p>{verification.localRecordHash}</p>
              </div>
            )}

            {verification?.chainRecordHash && (
              <div className="consultation-text-block">
                <span className="consultation-label">链上哈希</span>
                <p>{verification.chainRecordHash}</p>
              </div>
            )}

            {(evidence?.txHash ||
              evidence?.contractAddress ||
              verification?.chainRevision !== undefined ||
              verification?.chainRecordedAt ||
              verification?.chainOperator) && (
              <div className="consultation-inline-grid">
                {evidence?.txHash && (
                  <div className="consultation-text-block">
                    <span className="consultation-label">交易哈希</span>
                    <p>{evidence.txHash}</p>
                  </div>
                )}

                {evidence?.contractAddress && (
                  <div className="consultation-text-block">
                    <span className="consultation-label">合约地址</span>
                    <p>{evidence.contractAddress}</p>
                  </div>
                )}

                {verification?.chainRevision !== undefined &&
                  verification?.chainRevision !== null && (
                    <div className="consultation-text-block">
                      <span className="consultation-label">链上版本</span>
                      <p>第 {verification.chainRevision} 次</p>
                    </div>
                  )}

                {verification?.chainRecordedAt && (
                  <div className="consultation-text-block">
                    <span className="consultation-label">链上时间</span>
                    <p>{formatDateTime(verification.chainRecordedAt)}</p>
                  </div>
                )}

                {verification?.chainOperator && (
                  <div className="consultation-text-block">
                    <span className="consultation-label">链上操作账户</span>
                    <p>{verification.chainOperator}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      ) : (
        <p className="muted">未找到咨询记录。</p>
      )}
    </AppShell>
  );
}
