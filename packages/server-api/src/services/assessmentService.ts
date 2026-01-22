import {
  createAssessmentResult,
  listAssessmentResults,
  type AssessmentType,
} from "../repositories/assessmentRepository";
import { BadRequestError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";

type AssessmentQuestion = {
  id: number;
  text: string;
};

type AssessmentTemplate = {
  type: AssessmentType;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
};

// PHQ-9 题库（最小闭环内置）。
const PHQ9_TEMPLATE: AssessmentTemplate = {
  type: "PHQ9",
  title: "PHQ-9 抑郁自评量表",
  description: "根据最近两周的感受选择频率，0=没有，3=几乎每天。",
  questions: [
    { id: 1, text: "做事时提不起劲或没有兴趣" },
    { id: 2, text: "感到情绪低落、沮丧或绝望" },
    { id: 3, text: "入睡困难、睡不安稳或睡得过多" },
    { id: 4, text: "感到疲倦或没有活力" },
    { id: 5, text: "食欲不振或吃得过多" },
    { id: 6, text: "觉得自己很糟或让家人失望" },
    { id: 7, text: "注意力不集中，如阅读或看电视" },
    { id: 8, text: "说话行动缓慢或坐立不安" },
    { id: 9, text: "觉得不如死了或有伤害自己的念头" },
  ],
};

// GAD-7 题库（最小闭环内置）。
const GAD7_TEMPLATE: AssessmentTemplate = {
  type: "GAD7",
  title: "GAD-7 焦虑自评量表",
  description: "根据最近两周的感受选择频率，0=没有，3=几乎每天。",
  questions: [
    { id: 1, text: "感到紧张、焦虑或坐立不安" },
    { id: 2, text: "无法停止或控制担心" },
    { id: 3, text: "对各种事情过度担心" },
    { id: 4, text: "难以放松" },
    { id: 5, text: "坐立不安以至于很难静坐" },
    { id: 6, text: "容易烦躁或易怒" },
    { id: 7, text: "感到害怕，好像要发生可怕的事情" },
  ],
};

/**
 * 获取测评模板列表。
 */
export function getAssessmentTemplates() {
  return [PHQ9_TEMPLATE, GAD7_TEMPLATE];
}

/**
 * 提交测评并计算结果。
 */
export async function submitAssessment(
  userId: string,
  payload: {
    type: AssessmentType;
    answers: number[];
  },
) {
  const template =
    payload.type === "PHQ9" ? PHQ9_TEMPLATE : GAD7_TEMPLATE;
  if (payload.answers.length !== template.questions.length) {
    throw new BadRequestError("测评答案数量不匹配");
  }
  const score = payload.answers.reduce((total, value) => {
    if (value < 0 || value > 3) {
      throw new BadRequestError("测评分值必须在 0-3 之间");
    }
    return total + value;
  }, 0);
  const level = getAssessmentLevel(payload.type, score);
  const record = await createAssessmentResult({
    id: crypto.randomUUID(),
    userId,
    type: payload.type,
    score,
    level,
    answers: JSON.stringify(payload.answers),
    createdAt: new Date(),
  });
  // 保存测评结果的存证占位记录。
  const evidence = await createEvidencePlaceholder({
    targetType: "ASSESSMENT",
    targetId: record.id,
    summary: `${payload.type} 测评结果`,
  });
  return { record, evidence };
}

/**
 * 查询用户的历史测评结果。
 */
export async function getAssessmentHistory(userId: string) {
  return listAssessmentResults(userId);
}

function getAssessmentLevel(type: AssessmentType, score: number) {
  if (type === "PHQ9") {
    if (score <= 4) {
      return "无/轻度";
    }
    if (score <= 9) {
      return "轻度";
    }
    if (score <= 14) {
      return "中度";
    }
    if (score <= 19) {
      return "中重度";
    }
    return "重度";
  }
  if (score <= 4) {
    return "无/轻度";
  }
  if (score <= 9) {
    return "轻度";
  }
  if (score <= 14) {
    return "中度";
  }
  return "重度";
}
