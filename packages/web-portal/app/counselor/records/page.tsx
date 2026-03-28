"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  confirmConsultationEvidence,
  createConsultation,
  getEvidenceByTarget,
  listAppointments,
  listConsultations,
  prepareConsultationEvidence,
  syncConsultationEvidence,
  updateConsultation,
  type Appointment,
  type ConsultationRecord,
  type EvidenceRecord,
  type EvidenceVerification,
} from "../../../lib/api";
import { submitConsultationEvidenceWithWallet } from "../../../lib/consultationWallet";
import { useWalletState } from "../../../lib/useWalletState";
import { TARGET_CHAIN } from "../../../lib/wallet";
import styles from "./page.module.css";

const ISSUE_CATEGORY_OPTIONS = [
  "简单心理问题",
  "情绪波动",
  "学业压力",
  "人际关系",
  "家庭关系",
  "恋爱情感",
  "自我认同",
  "睡眠困扰",
  "焦虑抑郁",
  "危机干预",
  "其他",
];

const EMPTY_CREATE_FORM = {
  appointmentId: "",
  summary: "",
  counselorFeedback: "",
  homework: "",
  followUpPlan: "",
  assessmentSummary: "",
  issueCategory: "",
  isCrisis: false,
};

const EMPTY_UPDATE_FORM = {
  recordId: "",
  summary: "",
  counselorFeedback: "",
  homework: "",
  followUpPlan: "",
  assessmentSummary: "",
  issueCategory: "",
  isCrisis: false,
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("zh-CN") : "-";

const formatModeLabel = (mode?: "ONLINE" | "OFFLINE" | null) =>
  mode === "ONLINE" ? "线上" : mode === "OFFLINE" ? "线下" : "未知";

const formatAppointmentStatus = (status: Appointment["status"]) => {
  switch (status) {
    case "BOOKED":
      return "已预约";
    case "CANCELLED_BY_USER":
      return "已取消（来访者）";
    case "CANCELLED_BY_COUNSELOR":
      return "已取消（心理师）";
    case "COMPLETED":
      return "已完成";
    default:
      return status;
  }
};

function getEvidenceStatusLabel(evidence: EvidenceRecord | null) {
  if (!evidence) {
    return "暂无存证记录";
  }
  return evidence.status === "RECORDED" ? "已上链" : "待同步";
}

function getVerificationLabel(verification: EvidenceVerification | null) {
  if (!verification) {
    return "当前记录暂不支持链上核验";
  }
  if (verification.isVerified === true) {
    return "链上哈希校验通过";
  }
  if (verification.isVerified === false) {
    return "链上哈希校验失败";
  }
  return verification.reason ?? "暂时无法完成链上核验";
}

function previewText(value?: string | null) {
  const text = value?.trim();
  return text && text.length > 0 ? text : "暂无摘要";
}

type ConsultationChainSubmission = Awaited<
  ReturnType<typeof prepareConsultationEvidence>
>["chainSubmission"];

export default function CounselorRecordsPage() {
  const wallet = useWalletState();
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [updateForm, setUpdateForm] = useState(EMPTY_UPDATE_FORM);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceRecord | null>(null);
  const [activeVerification, setActiveVerification] = useState<EvidenceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingEvidence, setSyncingEvidence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRecord = records.find((record) => record.id === updateForm.recordId) ?? null;
  const activeAppointment = activeRecord
    ? appointments.find((appointment) => appointment.id === activeRecord.appointmentId) ?? null
    : null;

  const appointmentOptions = useMemo(
    () =>
      appointments.map((appointment) => ({
        value: appointment.id,
        label: `${formatDateTime(appointment.schedule?.startTime ?? appointment.createdAt)} · ${formatAppointmentStatus(appointment.status)}`,
      })),
    [appointments],
  );

  const canUseWalletSubmission =
    wallet.available && wallet.connected && wallet.isCorrectChain;

  const refreshEvidence = async (recordId: string) => {
    try {
      const result = await getEvidenceByTarget({
        targetType: "CONSULTATION",
        targetId: recordId,
      });
      setActiveEvidence(result.evidence);
      setActiveVerification(result.verification);
    } catch {
      setActiveEvidence(null);
      setActiveVerification(null);
    }
  };

  const submitEvidenceWithWallet = async (
    chainSubmission: ConsultationChainSubmission,
  ) => {
    if (!chainSubmission.contractAddress) {
      throw new Error("咨询存证合约地址未配置，暂时无法使用 MetaMask 上链。");
    }
    if (!chainSubmission.authorizationSignature) {
      throw new Error(
        "当前后端未返回钱包上链授权。请重新部署最新咨询存证合约，并更新后端区块链配置。",
      );
    }

    const tx = await submitConsultationEvidenceWithWallet({
      consultationId: chainSubmission.consultationId,
      appointmentId: chainSubmission.appointmentId,
      recordHash: chainSubmission.recordHash,
      contractAddress: chainSubmission.contractAddress,
      authorizationSignature: chainSubmission.authorizationSignature,
    });

    return confirmConsultationEvidence(chainSubmission.consultationId, {
      txHash: tx.txHash,
    });
  };

  useEffect(() => {
    async function loadPageData() {
      setLoading(true);
      setError(null);
      try {
        const [consultationList, appointmentList] = await Promise.all([
          listConsultations(),
          listAppointments(),
        ]);
        setRecords(consultationList);
        setAppointments(appointmentList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载咨询记录失败");
      } finally {
        setLoading(false);
      }
    }

    void loadPageData();
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

  useEffect(() => {
    async function loadEvidence() {
      if (!updateForm.recordId) {
        setActiveEvidence(null);
        setActiveVerification(null);
        return;
      }

      await refreshEvidence(updateForm.recordId);
    }

    void loadEvidence();
  }, [updateForm.recordId]);

  const resetSelection = () => {
    setUpdateForm(EMPTY_UPDATE_FORM);
    setActiveEvidence(null);
    setActiveVerification(null);
  };

  const handleCreate = async () => {
    if (!createForm.appointmentId) {
      setError("请选择预约记录");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

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
      setCreateForm(EMPTY_CREATE_FORM);
      setMessage(
        result.evidence.status === "RECORDED"
          ? "咨询记录已创建并完成存证"
          : "咨询记录已创建，当前存证状态为待同步",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建咨询记录失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectRecord = (record: ConsultationRecord) => {
    setUpdateForm({
      recordId: record.id,
      summary: record.summary ?? "",
      counselorFeedback: record.counselorFeedback ?? "",
      homework: record.homework ?? "",
      followUpPlan: record.followUpPlan ?? "",
      assessmentSummary: record.assessmentSummary ?? "",
      issueCategory: record.issueCategory ?? "",
      isCrisis: record.isCrisis,
    });
  };

  const handleUpdate = async () => {
    if (!updateForm.recordId) {
      setError("请先从右侧选择一条咨询记录");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const result = await updateConsultation(updateForm.recordId, {
        summary: updateForm.summary || undefined,
        counselorFeedback: updateForm.counselorFeedback || undefined,
        homework: updateForm.homework || undefined,
        followUpPlan: updateForm.followUpPlan || undefined,
        assessmentSummary: updateForm.assessmentSummary || undefined,
        issueCategory: updateForm.issueCategory || undefined,
        isCrisis: updateForm.isCrisis,
      });

      setRecords((prev) =>
        prev.map((item) => (item.id === result.record.id ? result.record : item)),
      );
      setActiveEvidence(result.evidence);
      setActiveVerification(null);
      setMessage(
        result.evidence.status === "RECORDED"
          ? "咨询记录已更新并重新完成存证"
          : "咨询记录已更新，当前存证状态为待同步",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新咨询记录失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncEvidence = async () => {
    if (!updateForm.recordId) {
      setError("请先从右侧选择一条咨询记录");
      return;
    }

    setSyncingEvidence(true);
    setMessage(null);
    setError(null);

    try {
      if (canUseWalletSubmission) {
        const prepared = await prepareConsultationEvidence(updateForm.recordId);
        const result = await submitEvidenceWithWallet(prepared.chainSubmission);
        setActiveEvidence(result.evidence);
        await refreshEvidence(updateForm.recordId);
        setMessage(
          result.evidence.status === "RECORDED"
            ? "已通过 MetaMask 完成咨询记录补录上链"
            : "MetaMask 交易已提交，但当前仍未完成存证确认",
        );
      } else {
        const result = await syncConsultationEvidence(updateForm.recordId);
        setActiveEvidence(result.evidence);
        await refreshEvidence(updateForm.recordId);
        setMessage(
          result.evidence.status === "RECORDED"
            ? "咨询记录存证已同步到链上"
            : "已发起重试，但当前仍未完成存证",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "重试链上同步失败");
    } finally {
      setSyncingEvidence(false);
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
    <AppShell
      title="咨询记录"
      requiredRoles={["COUNSELOR"]}
      description="在这里创建、编辑咨询记录，并查看当前链上存证状态。"
      withPanel={false}
    >
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

      <div className={styles.pageShell}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Consultation Workspace</p>
            <h1 className={styles.heroTitle}>咨询记录工作台</h1>
            <p className={styles.heroText}>
              左侧处理记录正文与存证状态，右侧只负责切换个案，避免信息挤在一起。
            </p>
          </div>
        </section>

        <div className={styles.pageGrid}>
        <section className={styles.mainPanel}>
          {!activeRecord ? (
            <div className={styles.panelScroll}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>新建咨询记录</h3>
                  <p>先选择一个预约，再补充摘要、反馈、作业和后续计划。</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>预约记录</span>
                  <select
                    className={styles.select}
                    value={createForm.appointmentId}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        appointmentId: event.target.value,
                      }))
                    }
                  >
                    <option value="">请选择预约记录</option>
                    {appointmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>问题分类</span>
                  <select
                    className={styles.select}
                    value={createForm.issueCategory}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        issueCategory: event.target.value,
                      }))
                    }
                  >
                    <option value="">请选择问题分类</option>
                    {ISSUE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={`${styles.fieldBlock} ${styles.fullWidth}`}>
                  <span className={styles.fieldLabel}>咨询摘要</span>
                  <textarea
                    className={styles.textareaLarge}
                    value={createForm.summary}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, summary: event.target.value }))
                    }
                    placeholder="记录来访者当前问题、情绪状态和本次会谈重点。"
                  />
                </label>

                <label className={`${styles.fieldBlock} ${styles.fullWidth}`}>
                  <span className={styles.fieldLabel}>心理师反馈</span>
                  <textarea
                    className={styles.textarea}
                    value={createForm.counselorFeedback}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        counselorFeedback: event.target.value,
                      }))
                    }
                    placeholder="写下本次回应、支持方式或专业判断。"
                  />
                </label>

                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>作业布置</span>
                  <input
                    className={styles.input}
                    value={createForm.homework}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, homework: event.target.value }))
                    }
                    placeholder="例如：情绪日记、呼吸练习"
                  />
                </label>

                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>跟进计划</span>
                  <input
                    className={styles.input}
                    value={createForm.followUpPlan}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        followUpPlan: event.target.value,
                      }))
                    }
                    placeholder="例如：一周后复盘、下次会谈重点"
                  />
                </label>

                <label className={`${styles.fieldBlock} ${styles.fullWidth}`}>
                  <span className={styles.fieldLabel}>测评总结</span>
                  <textarea
                    className={styles.textarea}
                    value={createForm.assessmentSummary}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        assessmentSummary: event.target.value,
                      }))
                    }
                    placeholder="记录测评结论、风险点或后续建议。"
                  />
                </label>

                <label className={`${styles.checkboxBlock} ${styles.fullWidth}`}>
                  <input
                    type="checkbox"
                    checked={createForm.isCrisis}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        isCrisis: event.target.checked,
                      }))
                    }
                  />
                  <span>标记为危机个案</span>
                </label>
              </div>

              <div className={styles.actionBar}>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleCreate}
                  disabled={saving}
                >
                  {saving ? "创建中..." : "创建咨询记录"}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.panelScroll}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>编辑咨询记录</h3>
                  <p>修改正文内容后可以直接更新，并在下方查看存证状态。</p>
                </div>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={resetSelection}
                >
                  返回新建
                </button>
              </div>

              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                  <span>来访者</span>
                  <strong>{activeAppointment?.userProfile?.nickname ?? "用户"}</strong>
                </div>
                <div className={styles.overviewCard}>
                  <span>咨询方式</span>
                  <strong>{formatModeLabel(activeAppointment?.schedule?.mode)}</strong>
                </div>
                <div className={styles.overviewCard}>
                  <span>预约时间</span>
                  <strong>
                    {formatDateTime(
                      activeAppointment?.schedule?.startTime ?? activeAppointment?.createdAt,
                    )}
                  </strong>
                </div>
                <div className={styles.overviewCard}>
                  <span>记录时间</span>
                  <strong>{formatDateTime(activeRecord.createdAt)}</strong>
                </div>
                <div className={styles.overviewCard}>
                  <span>最后更新</span>
                  <strong>{formatDateTime(activeRecord.updatedAt)}</strong>
                </div>
                <div className={styles.overviewCard}>
                  <span>问题分类</span>
                  <strong>{updateForm.issueCategory || "未填写"}</strong>
                </div>
                <div className={styles.overviewCard}>
                  <span>危机标记</span>
                  <strong>{updateForm.isCrisis ? "是" : "否"}</strong>
                </div>
                <div className={styles.overviewCard}>
                  <span>存证状态</span>
                  <strong>{getEvidenceStatusLabel(activeEvidence)}</strong>
                </div>
                <div className={styles.overviewCard}>
                  <span>核验结果</span>
                  <strong>{getVerificationLabel(activeVerification)}</strong>
                </div>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>问题分类</span>
                  <select
                    className={styles.select}
                    value={updateForm.issueCategory}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        issueCategory: event.target.value,
                      }))
                    }
                  >
                    <option value="">请选择问题分类</option>
                    {ISSUE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={`${styles.checkboxBlock} ${styles.checkboxTopAlign}`}>
                  <input
                    type="checkbox"
                    checked={updateForm.isCrisis}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        isCrisis: event.target.checked,
                      }))
                    }
                  />
                  <span>危机个案</span>
                </label>

                <label className={`${styles.fieldBlock} ${styles.fullWidth}`}>
                  <span className={styles.fieldLabel}>咨询摘要</span>
                  <textarea
                    className={styles.textareaLarge}
                    value={updateForm.summary}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({ ...prev, summary: event.target.value }))
                    }
                  />
                </label>

                <label className={`${styles.fieldBlock} ${styles.fullWidth}`}>
                  <span className={styles.fieldLabel}>心理师反馈</span>
                  <textarea
                    className={styles.textarea}
                    value={updateForm.counselorFeedback}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        counselorFeedback: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>作业布置</span>
                  <input
                    className={styles.input}
                    value={updateForm.homework}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({ ...prev, homework: event.target.value }))
                    }
                  />
                </label>

                <label className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>跟进计划</span>
                  <input
                    className={styles.input}
                    value={updateForm.followUpPlan}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        followUpPlan: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className={`${styles.fieldBlock} ${styles.fullWidth}`}>
                  <span className={styles.fieldLabel}>测评总结</span>
                  <textarea
                    className={styles.textarea}
                    value={updateForm.assessmentSummary}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        assessmentSummary: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className={styles.sectionTitle}>
                <h4>链上存证详情</h4>
              </div>

              <div className={styles.walletPanel}>
                <div className={styles.walletActions}>
                  {wallet.available && !wallet.connected && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={wallet.connect}
                      disabled={wallet.busy || syncingEvidence || saving}
                    >
                      {wallet.busy ? "连接中..." : "连接 MetaMask"}
                    </button>
                  )}
                  {wallet.available && wallet.connected && !wallet.isCorrectChain && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={wallet.switchChain}
                      disabled={wallet.busy || syncingEvidence || saving}
                    >
                      {wallet.busy ? "切换中..." : `切换到 ${TARGET_CHAIN.chainName}`}
                    </button>
                  )}
                </div>
                {wallet.message && <p className={styles.walletError}>{wallet.message}</p>}
              </div>

              <div className={styles.evidenceGrid}>
                {activeEvidence?.recordHash && (
                  <div className={styles.evidenceCard}>
                    <span>记录哈希</span>
                    <p>{activeEvidence.recordHash}</p>
                  </div>
                )}
                {activeEvidence?.txHash && (
                  <div className={styles.evidenceCard}>
                    <span>交易哈希</span>
                    <p>{activeEvidence.txHash}</p>
                  </div>
                )}
                {activeEvidence?.contractAddress && (
                  <div className={styles.evidenceCard}>
                    <span>合约地址</span>
                    <p>{activeEvidence.contractAddress}</p>
                  </div>
                )}
                {activeEvidence?.revision !== undefined && activeEvidence.revision !== null && (
                  <div className={styles.evidenceCard}>
                    <span>上链版本</span>
                    <p>第 {activeEvidence.revision} 次</p>
                  </div>
                )}
                {activeEvidence?.syncError && (
                  <div className={styles.evidenceCard}>
                    <span>同步说明</span>
                    <p>{activeEvidence.syncError}</p>
                  </div>
                )}
                {activeVerification?.localRecordHash && (
                  <div className={styles.evidenceCard}>
                    <span>本地哈希</span>
                    <p>{activeVerification.localRecordHash}</p>
                  </div>
                )}
                {activeVerification?.chainRecordHash && (
                  <div className={styles.evidenceCard}>
                    <span>链上哈希</span>
                    <p>{activeVerification.chainRecordHash}</p>
                  </div>
                )}
              </div>

              <div className={styles.actionBar}>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleUpdate}
                  disabled={saving}
                >
                  {saving ? "保存中..." : "保存修改"}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={handleSyncEvidence}
                  disabled={syncingEvidence || wallet.busy}
                >
                  {syncingEvidence
                    ? "同步中..."
                    : canUseWalletSubmission
                      ? "使用 MetaMask 补录上链"
                      : "重试上链"}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.sideHeader}>
            <div>
              <h3>记录列表</h3>
              <p>点击右侧任意记录，左侧会切换到对应的编辑和存证视图。</p>
            </div>
          </div>

          <div className={styles.recordList}>
            {records.length === 0 ? (
              <div className={styles.emptyState}>暂无咨询记录</div>
            ) : (
              records.map((record) => {
                const isActive = updateForm.recordId === record.id;
                return (
                  <button
                    key={record.id}
                    type="button"
                    className={`${styles.recordCard}${isActive ? ` ${styles.recordCardActive}` : ""}`}
                    onClick={() => handleSelectRecord(record)}
                  >
                    <div className={styles.recordCardHeader}>
                      <strong>{formatDateTime(record.createdAt)}</strong>
                      <span className={styles.recordBadge}>
                        {record.isCrisis ? "危机" : "常规"}
                      </span>
                    </div>
                    <div className={styles.recordMeta}>
                      问题分类：{record.issueCategory ?? "未填写"}
                    </div>
                    <p className={styles.recordPreview}>{previewText(record.summary)}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>
        </div>
      </div>
    </AppShell>
  );
}
