"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import {
  listAssessmentHistory,
  listAssessmentTemplates,
  submitAssessmentResult,
  type AssessmentResult,
  type AssessmentTemplate,
} from "../../lib/api";

const TEMPLATE_ORDER: AssessmentTemplate["type"][] = ["MOOD", "ANXIETY", "STRESS", "SLEEP", "SOCIAL"];
const TEMPLATE_LABELS: Record<AssessmentTemplate["type"], string> = {
  MOOD: "情绪",
  ANXIETY: "焦虑",
  STRESS: "压力",
  SLEEP: "睡眠",
  SOCIAL: "社交",
};

/**
 * 心理测评页面：展示模板并支持提交。
 */
export default function AssessmentsPage() {
  const QUESTION_PAGE_SIZE = 8;
  const QUESTION_SCROLL_THRESHOLD = 24;
  // 可用测评模板列表。
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  // 当前选择的测评模板类型。
  const [activeType, setActiveType] = useState<AssessmentTemplate["type"] | null>(null);
  // 题目答案缓存，按模板类型保存。
  const [answersMap, setAnswersMap] = useState<Record<string, Array<number | undefined>>>({});
  // 当前展示的题目数量。
  const [visibleCount, setVisibleCount] = useState(QUESTION_PAGE_SIZE);
  const questionListRef = useRef<HTMLDivElement | null>(null);
  // 测评历史记录。
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 提交状态控制。
  const [submitting, setSubmitting] = useState(false);
  // 错误提示。
  const [error, setError] = useState<string | null>(null);
  // 成功提示。
  const [message, setMessage] = useState<string | null>(null);

  /**
   * 加载测评模板与历史记录。
   */
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
        if (templateList.length > 0) {
          setActiveType(templateList[0].type);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载测评失败");
      } finally {
        setLoading(false);
      }
    }
    loadData();
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

  const activeTemplate = useMemo(
    () => templates.find((item) => item.type === activeType) ?? null,
    [templates, activeType],
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
  const visibleQuestions = useMemo(() => {
    if (!activeTemplate) {
      return [];
    }
    return activeTemplate.questions.slice(0, visibleCount);
  }, [activeTemplate, visibleCount]);

  useEffect(() => {
    if (!activeTemplate) {
      return;
    }
    setVisibleCount(Math.min(QUESTION_PAGE_SIZE, activeTemplate.questions.length));
  }, [activeTemplate?.type]);

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

  /**
   * 更新单个题目的答案。
   */
  const handleAnswerChange = (index: number, value: number | undefined) => {
    if (!activeTemplate) {
      return;
    }
    setAnswersMap((prev) => {
      const current =
        prev[activeTemplate.type] ??
        Array(activeTemplate.questions.length).fill(undefined);
      const next = [...current];
      next[index] = value;
      return { ...prev, [activeTemplate.type]: next };
    });
  };

  /**
   * 提交测评答案。
   */
  const handleSubmit = async () => {
    if (!activeTemplate) {
      return;
    }
    const currentAnswers = answersMap[activeTemplate.type] ?? [];
    const answers = Array.from(
      { length: activeTemplate.questions.length },
      (_, index) => currentAnswers[index],
    );
    if (answers.some((answer) => typeof answer !== "number")) {
      setError("请先完成全部题目");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await submitAssessmentResult({
        type: activeTemplate.type,
        answers: answers as number[],
      });
      setHistory((prev) => [result.record, ...prev]);
      setMessage(`测评完成，得分：${result.record.score}，等级：${result.record.level}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
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
    <AppShell title="心理测评" description="在线完成情绪/压力/睡眠等测评，并即时查看评分与建议。">
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
          {activeTemplate && (
            <div className="form-stack">
              <div className="role-tabs" aria-label="测评类型">
                {orderedTemplates.map((template) => (
                  <button
                    key={template.type}
                    className={`tab${template.type === activeTemplate.type ? " active" : ""}`}
                    type="button"
                    onClick={() => setActiveType(template.type)}
                  >
                    {TEMPLATE_LABELS[template.type] ?? template.title}
                  </button>
                ))}
              </div>
              <p className="muted assessment-hint">{activeTemplate.description}</p>
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
              <button className="btn btn-primary" disabled={submitting} type="button" onClick={handleSubmit}>
                {submitting ? "提交中..." : "提交测评"}
              </button>
            </div>
          )}
        </div>
        <div className="card-block">
          <h3>历史结果</h3>
          {history.length === 0 ? (
            <p className="muted">暂无测评记录。</p>
          ) : (
            <ul className="list">
              {history.map((record) => (
                <li key={record.id}>
                  <strong>{templateTitleMap.get(record.type) ?? record.type}</strong>
                  <div>得分：{record.score} · 等级：{record.level}</div>
                  <small>{new Date(record.createdAt).toLocaleString("zh-CN")}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
