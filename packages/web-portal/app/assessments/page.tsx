"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import {
  listAssessmentHistory,
  listAssessmentTemplates,
  submitAssessmentResult,
  type AssessmentResult,
  type AssessmentTemplate,
} from "../../lib/api";

/**
 * 心理测评页面：展示模板并支持提交。
 */
export default function AssessmentsPage() {
  // 可用测评模板列表。
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  // 当前选择的测评模板类型。
  const [activeType, setActiveType] = useState<AssessmentTemplate["type"] | null>(null);
  // 题目答案缓存，按模板类型保存。
  const [answersMap, setAnswersMap] = useState<Record<string, number[]>>({});
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

  const activeTemplate = useMemo(
    () => templates.find((item) => item.type === activeType) ?? null,
    [templates, activeType],
  );

  /**
   * 更新单个题目的答案。
   */
  const handleAnswerChange = (index: number, value: number) => {
    if (!activeTemplate) {
      return;
    }
    setAnswersMap((prev) => {
      const current = prev[activeTemplate.type] ?? Array(activeTemplate.questions.length).fill(0);
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
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const answers = answersMap[activeTemplate.type] ?? Array(activeTemplate.questions.length).fill(0);
      const result = await submitAssessmentResult({
        type: activeTemplate.type,
        answers,
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
    <AppShell title="心理测评" description="在线完成 PHQ-9 / GAD-7，并即时查看评分与建议。">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="split-grid">
        <div className="card-block">
          <h3>测评模板</h3>
          <div className="pill-list">
            {templates.map((template) => (
              <button
                key={template.type}
                type="button"
                className={activeType === template.type ? "pill active" : "pill"}
                onClick={() => setActiveType(template.type)}
              >
                {template.title}
              </button>
            ))}
          </div>
          {activeTemplate && (
            <div className="form-stack">
              <p className="muted">{activeTemplate.description}</p>
              {activeTemplate.questions.map((question, index) => (
                <label key={question.id} className="inline-field">
                  <span>{question.text}</span>
                  <select
                    value={(answersMap[activeTemplate.type] ?? [])[index] ?? 0}
                    onChange={(event) => handleAnswerChange(index, Number(event.target.value))}
                  >
                    <option value={0}>0 - 没有</option>
                    <option value={1}>1 - 偶尔</option>
                    <option value={2}>2 - 经常</option>
                    <option value={3}>3 - 几乎每天</option>
                  </select>
                </label>
              ))}
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
                  <strong>{record.type}</strong>
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
