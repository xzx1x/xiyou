"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import {
  confirmAssessmentResult,
  getEvidenceByTarget,
  listAssessmentHistory,
  listAssessmentTemplates,
  prepareAssessmentEvidence,
  prepareAssessmentResult,
  submitAssessmentResult,
  syncAssessmentEvidence,
  type AssessmentResult,
  type AssessmentTemplate,
  type EvidenceRecord,
  type EvidenceVerification,
} from "../../lib/api";
import { submitAssessmentEvidenceWithWallet } from "../../lib/assessmentWallet";
import { TARGET_CHAIN } from "../../lib/wallet";
import { useWalletState } from "../../lib/useWalletState";

const TEMPLATE_ORDER: AssessmentTemplate["type"][] = [
  "MOOD",
  "ANXIETY",
  "STRESS",
  "SLEEP",
  "SOCIAL",
];

const TEMPLATE_LABELS: Record<AssessmentTemplate["type"], string> = {
  MOOD: "情绪",
  ANXIETY: "焦虑",
  STRESS: "压力",
  SLEEP: "睡眠",
  SOCIAL: "社交",
};

const QUESTION_PAGE_SIZE = 8;
const QUESTION_SCROLL_THRESHOLD = 24;

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
    return "当前结果暂不支持链上校验";
  }
  if (verification.isVerified === true) {
    return "链上哈希校验通过";
  }
  if (verification.isVerified === false) {
    return "链上哈希校验失败";
  }
  return verification.reason ?? "暂时无法完成链上校验";
}

function getFirstPendingType(
  templates: AssessmentTemplate[],
  history: AssessmentResult[],
): AssessmentTemplate["type"] | null {
  for (const type of TEMPLATE_ORDER) {
    if (templates.some((item) => item.type === type) && !history.some((item) => item.type === type)) {
      return type;
    }
  }
  return templates[0]?.type ?? null;
}

function upsertHistoryRecord(records: AssessmentResult[], record: AssessmentResult) {
  return [record, ...records.filter((item) => item.id !== record.id)];
}

type AssessmentChainSubmission = Awaited<
  ReturnType<typeof prepareAssessmentResult>
>["chainSubmission"];

export default function AssessmentsPage() {
  const questionListRef = useRef<HTMLDivElement | null>(null);
  const wallet = useWalletState();

  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [activeType, setActiveType] = useState<AssessmentTemplate["type"] | null>(null);
  const [answersMap, setAnswersMap] = useState<Record<string, Array<number | undefined>>>({});
  const [visibleCount, setVisibleCount] = useState(QUESTION_PAGE_SIZE);

  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceRecord | null>(null);
  const [activeVerification, setActiveVerification] = useState<EvidenceVerification | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingEvidence, setSyncingEvidence] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  const activeTemplate = useMemo(
    () => templates.find((item) => item.type === activeType) ?? null,
    [templates, activeType],
  );

  const activeHistoryRecord = useMemo(
    () => history.find((item) => item.id === selectedHistoryId) ?? null,
    [history, selectedHistoryId],
  );

  const orderedTemplates = useMemo(
    () =>
      TEMPLATE_ORDER.map((type) => templates.find((item) => item.type === type)).filter(
        (item): item is AssessmentTemplate => Boolean(item),
      ),
    [templates],
  );

  const templateTitleMap = useMemo(
    () => new Map(templates.map((item) => [item.type, item.title])),
    [templates],
  );

  const latestHistoryByType = useMemo(() => {
    const map = new Map<AssessmentTemplate["type"], AssessmentResult>();
    for (const record of history) {
      if (!map.has(record.type)) {
        map.set(record.type, record);
      }
    }
    return map;
  }, [history]);

  const activeAnsweredCount = useMemo(() => {
    if (!activeTemplate) {
      return 0;
    }
    return (answersMap[activeTemplate.type] ?? []).filter(
      (answer): answer is number => typeof answer === "number",
    ).length;
  }, [activeTemplate, answersMap]);

  const activeLatestRecord = useMemo(() => {
    if (!activeTemplate) {
      return null;
    }
    return latestHistoryByType.get(activeTemplate.type) ?? null;
  }, [activeTemplate, latestHistoryByType]);

  const visibleQuestions = useMemo(() => {
    if (!activeTemplate) {
      return [];
    }
    return activeTemplate.questions.slice(0, visibleCount);
  }, [activeTemplate, visibleCount]);

  const canUseWalletSubmission =
    wallet.available && wallet.connected && wallet.isCorrectChain;

  const refreshEvidence = async (recordId: string) => {
    try {
      const result = await getEvidenceByTarget({
        targetType: "ASSESSMENT",
        targetId: recordId,
      });
      setActiveEvidence(result.evidence);
      setActiveVerification(result.verification);
    } catch {
      setActiveEvidence(null);
      setActiveVerification(null);
    }
  };

  const submitEvidenceWithWallet = async (chainSubmission: AssessmentChainSubmission) => {
    if (!chainSubmission.contractAddress) {
      throw new Error("测评存证合约地址未配置，暂时无法使用 MetaMask 上链。");
    }
    if (!chainSubmission.authorizationSignature) {
      throw new Error(
        "当前后端未返回钱包上链授权。请重新部署最新测评存证合约，并更新后端区块链配置。",
      );
    }

    const tx = await submitAssessmentEvidenceWithWallet({
      assessmentKey: chainSubmission.assessmentKey,
      assessmentTypeCode: chainSubmission.assessmentTypeCode,
      recordHash: chainSubmission.recordHash,
      contractAddress: chainSubmission.contractAddress,
      authorizationSignature: chainSubmission.authorizationSignature,
    });

    return confirmAssessmentResult({
      assessmentId: chainSubmission.assessmentId,
      txHash: tx.txHash,
    });
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [templateList, historyList] = await Promise.all([
          listAssessmentTemplates(),
          listAssessmentHistory(),
        ]);
        setTemplates(templateList);
        setHistory(historyList);
        setActiveType(getFirstPendingType(templateList, historyList));
        setSelectedHistoryId(historyList[0]?.id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载测评页面失败");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    if (!selectedHistoryId) {
      setActiveEvidence(null);
      setActiveVerification(null);
      setIsEvidenceModalOpen(false);
      return;
    }
    void refreshEvidence(selectedHistoryId);
  }, [selectedHistoryId]);

  useEffect(() => {
    if (!isEvidenceModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEvidenceModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEvidenceModalOpen]);

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
    if (!activeTemplate) {
      return;
    }
    setVisibleCount(Math.min(QUESTION_PAGE_SIZE, activeTemplate.questions.length));
  }, [activeTemplate]);

  useEffect(() => {
    const container = questionListRef.current;
    if (!container || !activeTemplate) {
      return;
    }
    if (visibleCount >= activeTemplate.questions.length) {
      return;
    }
    if (container.scrollHeight <= container.clientHeight + 4) {
      setVisibleCount((prev) =>
        Math.min(activeTemplate.questions.length, prev + QUESTION_PAGE_SIZE),
      );
    }
  }, [activeTemplate, visibleCount]);

  const handleQuestionScroll = () => {
    const container = questionListRef.current;
    if (!container || !activeTemplate) {
      return;
    }
    if (visibleCount >= activeTemplate.questions.length) {
      return;
    }
    if (
      container.scrollTop + container.clientHeight <
      container.scrollHeight - QUESTION_SCROLL_THRESHOLD
    ) {
      return;
    }
    setVisibleCount((prev) =>
      Math.min(activeTemplate.questions.length, prev + QUESTION_PAGE_SIZE),
    );
  };

  const handleAnswerChange = (index: number, value: number | undefined) => {
    if (!activeTemplate) {
      return;
    }
    setAnswersMap((prev) => {
      const current =
        prev[activeTemplate.type] ?? Array(activeTemplate.questions.length).fill(undefined);
      const next = [...current];
      next[index] = value;
      return { ...prev, [activeTemplate.type]: next };
    });
  };

  const clearCurrentTemplateAnswers = (template: AssessmentTemplate) => {
    setAnswersMap((prev) => ({
      ...prev,
      [template.type]: Array(template.questions.length).fill(undefined),
    }));
  };

  const applySubmissionSuccess = (
    result: { record: AssessmentResult; evidence: EvidenceRecord },
    template: AssessmentTemplate,
    successMessage?: string,
  ) => {
    setHistory((prev) => upsertHistoryRecord(prev, result.record));
    setSelectedHistoryId(result.record.id);
    setActiveEvidence(result.evidence);
    setActiveVerification(null);
    clearCurrentTemplateAnswers(template);
    setMessage(
      successMessage ??
        (result.evidence.status === "RECORDED"
          ? `测评已提交并完成存证。得分：${result.record.score}，等级：${result.record.level}`
          : `测评已提交，存证正在同步。得分：${result.record.score}，等级：${result.record.level}`),
    );
  };

  const handleSubmit = async () => {
    if (!activeTemplate) {
      return;
    }

    const template = activeTemplate;
    const currentAnswers = answersMap[template.type] ?? [];
    const answers = Array.from(
      { length: template.questions.length },
      (_, index) => currentAnswers[index],
    );

    if (answers.some((answer) => typeof answer !== "number")) {
      setError("请先完成当前测评的全部题目");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (canUseWalletSubmission) {
        const prepared = await prepareAssessmentResult({
          type: template.type,
          answers: answers as number[],
        });
        const result = await submitEvidenceWithWallet(prepared.chainSubmission);
        applySubmissionSuccess(
          result,
          template,
          `测评已提交，并已通过 MetaMask 完成链上存证。得分：${result.record.score}，等级：${result.record.level}`,
        );
        await refreshEvidence(result.record.id);
      } else {
        const result = await submitAssessmentResult({
          type: template.type,
          answers: answers as number[],
        });
        applySubmissionSuccess(result, template);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncEvidence = async () => {
    if (!activeHistoryRecord) {
      setError("请先选择一条测评记录");
      return;
    }

    setSyncingEvidence(true);
    setError(null);
    setMessage(null);

    try {
      if (canUseWalletSubmission) {
        const prepared = await prepareAssessmentEvidence(activeHistoryRecord.id);
        const result = await submitEvidenceWithWallet(prepared.chainSubmission);
        setActiveEvidence(result.evidence);
        await refreshEvidence(activeHistoryRecord.id);
        setMessage(
          result.evidence.status === "RECORDED"
            ? "已通过 MetaMask 完成测评补录上链"
            : "MetaMask 交易已提交，但当前仍未完成存证确认",
        );
      } else {
        const result = await syncAssessmentEvidence(activeHistoryRecord.id);
        setActiveEvidence(result.evidence);
        await refreshEvidence(activeHistoryRecord.id);
        setMessage(
          result.evidence.status === "RECORDED"
            ? "测评存证已同步到区块链"
            : "已发起服务端同步，但当前仍未完成上链",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "重新上链失败");
    } finally {
      setSyncingEvidence(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="心理测评">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="心理测评"
      description="在线完成情绪、焦虑、压力、睡眠、社交等测评，并查看结果与区块链存证状态。"
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

      <div className="split-grid">
        <div className="card-block">
          {activeTemplate ? (
            <div className="form-stack">
              {wallet.available && !wallet.connected && (
                <div className="button-row">
                  <button
                    className="ghost-btn small"
                    type="button"
                    onClick={wallet.connect}
                    disabled={wallet.busy || submitting || syncingEvidence}
                  >
                    {wallet.busy ? "连接中..." : "连接 MetaMask"}
                  </button>
                </div>
              )}
              {wallet.available && wallet.connected && !wallet.isCorrectChain && (
                <div className="button-row">
                  <button
                    className="ghost-btn small"
                    type="button"
                    onClick={wallet.switchChain}
                    disabled={wallet.busy || submitting || syncingEvidence}
                  >
                    {wallet.busy ? "切换中..." : `切换到 ${TARGET_CHAIN.chainName}`}
                  </button>
                </div>
              )}
              {wallet.message && <p className="muted assessment-hint">{wallet.message}</p>}
              <p className="muted assessment-hint assessment-progress">
                当前进度：{activeAnsweredCount} / {activeTemplate.questions.length}
              </p>

              <div className="role-tabs" aria-label="测评类型">
                {orderedTemplates.map((template) => (
                  <button
                    key={template.type}
                    className={`tab${template.type === activeTemplate.type ? " active" : ""}`}
                    type="button"
                    onClick={() => setActiveType(template.type)}
                  >
                    {TEMPLATE_LABELS[template.type] ?? template.title}
                    {latestHistoryByType.has(template.type) ? " · 已提交" : ""}
                  </button>
                ))}
              </div>

              <p className="muted assessment-hint">{activeTemplate.description}</p>

              {activeLatestRecord && (
                <p className="muted assessment-hint">
                  最近一次提交：{formatDateTime(activeLatestRecord.createdAt)}，得分：
                  {activeLatestRecord.score}，等级：{activeLatestRecord.level}
                </p>
              )}

              <div
                className="assessment-question-list"
                ref={questionListRef}
                onScroll={handleQuestionScroll}
              >
                {visibleQuestions.map((question, index) => (
                  <label key={question.id} className="inline-field">
                    <span>{question.text}</span>
                    <select
                      value={(answersMap[activeTemplate.type] ?? [])[index] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        handleAnswerChange(index, value === "" ? undefined : Number(value));
                      }}
                    >
                      <option value="" disabled>
                        请选择
                      </option>
                      <option value={0}>0 - 没有</option>
                      <option value={1}>1 - 偶尔</option>
                      <option value={2}>2 - 经常</option>
                      <option value={3}>3 - 几乎每天</option>
                    </select>
                  </label>
                ))}
              </div>

              <button
                className="btn btn-primary"
                disabled={submitting || syncingEvidence || wallet.busy}
                type="button"
                onClick={handleSubmit}
              >
                {submitting
                  ? "提交中..."
                  : canUseWalletSubmission
                    ? "提交当前测评并使用 MetaMask 上链"
                    : "提交当前测评"}
              </button>
            </div>
          ) : (
            <p className="muted">当前没有可用测评模板。</p>
          )}
        </div>

        <div className="card-block assessment-history-card">
          <h3>历史结果</h3>
          <div className="assessment-history-list">
            {history.length === 0 ? (
              <p className="muted">暂无测评记录。</p>
            ) : (
              <ul className="list list-button">
                {history.map((record) => {
                  const isActive = record.id === selectedHistoryId;
                  return (
                    <li key={record.id}>
                      <button
                        type="button"
                        className={`list-item-button${isActive ? " active" : ""}`}
                        onClick={() => setSelectedHistoryId(record.id)}
                      >
                        <strong>{templateTitleMap.get(record.type) ?? record.type}</strong>
                        <div className="muted">
                          得分：{record.score} / 等级：{record.level}
                        </div>
                        <small>{formatDateTime(record.createdAt)}</small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {activeHistoryRecord && (
            <>
              <hr className="divider" />
              <div className="form-stack assessment-history-footer">
                <div className="history-actions">
                  <div>
                    <div className="muted">
                      当前选中：
                      {templateTitleMap.get(activeHistoryRecord.type) ?? activeHistoryRecord.type}
                    </div>
                    <small className="muted">
                      提交时间：{formatDateTime(activeHistoryRecord.createdAt)}
                    </small>
                  </div>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setIsEvidenceModalOpen(true)}
                  >
                    查看存证详情
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isEvidenceModalOpen && activeHistoryRecord && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setIsEvidenceModalOpen(false)}
        >
          <div
            className="modal-card evidence-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-evidence-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 id="assessment-evidence-title">存证详情</h3>
                <p className="muted evidence-modal-subtitle">
                  {templateTitleMap.get(activeHistoryRecord.type) ?? activeHistoryRecord.type}
                </p>
              </div>
              <button
                className="ghost-btn small"
                type="button"
                onClick={() => setIsEvidenceModalOpen(false)}
              >
                关闭
              </button>
            </div>

            <div className="evidence-modal-body form-stack">
              <div className="inline-field">
                <span>测评类型</span>
                <div className="muted evidence-value">
                  {templateTitleMap.get(activeHistoryRecord.type) ?? activeHistoryRecord.type}
                </div>
              </div>

              <div className="inline-field">
                <span>提交时间</span>
                <div className="muted evidence-value">
                  {formatDateTime(activeHistoryRecord.createdAt)}
                </div>
              </div>

              <div className="inline-field">
                <span>存证状态</span>
                <div className="muted evidence-value">{getEvidenceStatusLabel(activeEvidence)}</div>
              </div>

              <div className="inline-field">
                <span>校验结果</span>
                <div className="muted evidence-value">{getVerificationLabel(activeVerification)}</div>
              </div>

              {activeEvidence?.recordHash && (
                <div className="inline-field">
                  <span>存证哈希</span>
                  <div className="muted evidence-value">{activeEvidence.recordHash}</div>
                </div>
              )}

              {activeVerification?.localRecordHash && (
                <div className="inline-field">
                  <span>本地哈希</span>
                  <div className="muted evidence-value">{activeVerification.localRecordHash}</div>
                </div>
              )}

              {activeVerification?.chainRecordHash && (
                <div className="inline-field">
                  <span>链上哈希</span>
                  <div className="muted evidence-value">{activeVerification.chainRecordHash}</div>
                </div>
              )}

              {activeEvidence?.txHash && (
                <div className="inline-field">
                  <span>交易哈希</span>
                  <div className="muted evidence-value">{activeEvidence.txHash}</div>
                </div>
              )}

              {activeEvidence?.contractAddress && (
                <div className="inline-field">
                  <span>合约地址</span>
                  <div className="muted evidence-value">{activeEvidence.contractAddress}</div>
                </div>
              )}

              {activeVerification?.chainRevision !== undefined &&
                activeVerification.chainRevision !== null && (
                  <div className="inline-field">
                    <span>链上版本</span>
                    <div className="muted evidence-value">
                      第 {activeVerification.chainRevision} 次
                    </div>
                  </div>
                )}

              {activeVerification?.chainRecordedAt && (
                <div className="inline-field">
                  <span>链上时间</span>
                  <div className="muted evidence-value">
                    {formatDateTime(activeVerification.chainRecordedAt)}
                  </div>
                </div>
              )}

              {activeEvidence?.syncError && (
                <div className="inline-field">
                  <span>同步说明</span>
                  <div className="muted evidence-value">{activeEvidence.syncError}</div>
                </div>
              )}
            </div>

            {(!activeEvidence || activeEvidence.status !== "RECORDED") && (
              <div className="button-row evidence-modal-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={handleSyncEvidence}
                  disabled={syncingEvidence || submitting || wallet.busy}
                >
                  {syncingEvidence
                    ? "同步中..."
                    : canUseWalletSubmission
                      ? "使用 MetaMask 补录上链"
                      : "服务端重试上链"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
