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

const MOOD_TEMPLATE: AssessmentTemplate = {
  type: "MOOD",
  title: "情绪状态评估",
  description: "根据最近两周的感受选择频率，0=没有，3=几乎每天。",
  questions: [
    { id: 1, text: "心情低落或提不起精神" },
    { id: 2, text: "对平时喜欢的事情缺乏兴趣" },
    { id: 3, text: "情绪容易突然变差" },
    { id: 4, text: "感到内心空荡或无意义" },
    { id: 5, text: "对未来感到悲观" },
    { id: 6, text: "自责或对自己不满意" },
    { id: 7, text: "容易因为小事难过" },
    { id: 8, text: "感到动力不足" },
    { id: 9, text: "做事拖延或难以开始" },
    { id: 10, text: "觉得自己没有价值" },
    { id: 11, text: "容易哭或情绪激动" },
    { id: 12, text: "一天中大部分时间心情不佳" },
    { id: 13, text: "与人交往时情绪低落" },
    { id: 14, text: "觉得生活没有乐趣" },
    { id: 15, text: "感到心里沉重" },
    { id: 16, text: "情绪问题影响学习或工作" },
    { id: 17, text: "注意力被情绪影响" },
    { id: 18, text: "对积极的反馈也难以开心" },
    { id: 19, text: "情绪起伏影响睡眠" },
    { id: 20, text: "对他人表现冷淡或疏远" },
  ],
};

const ANXIETY_TEMPLATE: AssessmentTemplate = {
  type: "ANXIETY",
  title: "焦虑与紧张评估",
  description: "根据最近两周的感受选择频率，0=没有，3=几乎每天。",
  questions: [
    { id: 1, text: "感到紧张或坐立不安" },
    { id: 2, text: "对未来事情感到担心" },
    { id: 3, text: "难以控制自己的担忧" },
    { id: 4, text: "容易被小事吓到" },
    { id: 5, text: "总是想着最坏的结果" },
    { id: 6, text: "心跳加快或胸闷" },
    { id: 7, text: "手心出汗或发抖" },
    { id: 8, text: "难以放松" },
    { id: 9, text: "担心自己做不好" },
    { id: 10, text: "害怕在人前出错" },
    { id: 11, text: "担心别人评价" },
    { id: 12, text: "容易被突发情况打乱" },
    { id: 13, text: "感觉脑子停不下来" },
    { id: 14, text: "睡前总是胡思乱想" },
    { id: 15, text: "对日常任务也会焦虑" },
    { id: 16, text: "因为担心而拖延" },
    { id: 17, text: "感到胃部不适或紧绷" },
    { id: 18, text: "难以专注当前事情" },
    { id: 19, text: "需要不断确认才安心" },
    { id: 20, text: "对身体小变化也很敏感" },
  ],
};

const STRESS_TEMPLATE: AssessmentTemplate = {
  type: "STRESS",
  title: "压力负荷评估",
  description: "根据最近两周的感受选择频率，0=没有，3=几乎每天。",
  questions: [
    { id: 1, text: "感到时间不够用" },
    { id: 2, text: "任务堆积让你喘不过气" },
    { id: 3, text: "难以兼顾学习或工作与生活" },
    { id: 4, text: "感到身体紧绷" },
    { id: 5, text: "易因压力而发脾气" },
    { id: 6, text: "感到精力被透支" },
    { id: 7, text: "压力影响饮食" },
    { id: 8, text: "压力影响睡眠" },
    { id: 9, text: "觉得自己被要求过多" },
    { id: 10, text: "很难真正放松" },
    { id: 11, text: "脑子一直在想要做的事" },
    { id: 12, text: "经常感到疲惫" },
    { id: 13, text: "面对问题容易逃避" },
    { id: 14, text: "对小挫折反应很大" },
    { id: 15, text: "觉得自己一直在赶" },
    { id: 16, text: "难以集中注意力" },
    { id: 17, text: "担心无法完成目标" },
    { id: 18, text: "感到被比较或竞争" },
    { id: 19, text: "对未来感到焦虑" },
    { id: 20, text: "压力导致头痛或胃不适" },
  ],
};

const SLEEP_TEMPLATE: AssessmentTemplate = {
  type: "SLEEP",
  title: "睡眠质量评估",
  description: "根据最近两周的感受选择频率，0=没有，3=几乎每天。",
  questions: [
    { id: 1, text: "入睡需要很长时间" },
    { id: 2, text: "夜里容易醒" },
    { id: 3, text: "凌晨醒来难再入睡" },
    { id: 4, text: "做梦频繁影响睡眠" },
    { id: 5, text: "睡醒后仍感到疲惫" },
    { id: 6, text: "白天嗜睡" },
    { id: 7, text: "睡眠时间不足" },
    { id: 8, text: "睡眠时间过长却不精神" },
    { id: 9, text: "睡前使用手机影响入睡" },
    { id: 10, text: "睡前思绪过多" },
    { id: 11, text: "睡眠质量不稳定" },
    { id: 12, text: "因压力影响睡眠" },
    { id: 13, text: "噪音或光线影响睡眠" },
    { id: 14, text: "睡眠影响学习或工作效率" },
    { id: 15, text: "睡眠不足影响情绪" },
    { id: 16, text: "需要午睡补觉" },
    { id: 17, text: "睡前容易焦虑" },
    { id: 18, text: "起床困难" },
    { id: 19, text: "睡眠规律被打乱" },
    { id: 20, text: "经常熬夜" },
  ],
};

const SOCIAL_TEMPLATE: AssessmentTemplate = {
  type: "SOCIAL",
  title: "社交支持评估",
  description: "根据最近两周的感受选择频率，0=没有，3=几乎每天。",
  questions: [
    { id: 1, text: "觉得身边缺少可以倾诉的人" },
    { id: 2, text: "与朋友交流减少" },
    { id: 3, text: "害怕被他人评价" },
    { id: 4, text: "在人群中感到不自在" },
    { id: 5, text: "避免参加社交活动" },
    { id: 6, text: "与家人沟通不顺畅" },
    { id: 7, text: "觉得自己被忽视" },
    { id: 8, text: "与同学或同事关系紧张" },
    { id: 9, text: "难以表达真实想法" },
    { id: 10, text: "担心自己给别人添麻烦" },
    { id: 11, text: "在社交场合紧张" },
    { id: 12, text: "容易误解他人意思" },
    { id: 13, text: "为逃避社交而长时间独处" },
    { id: 14, text: "很难建立新的关系" },
    { id: 15, text: "害怕发生冲突" },
    { id: 16, text: "不敢寻求帮助" },
    { id: 17, text: "觉得自己不被理解" },
    { id: 18, text: "社交后感到疲惫" },
    { id: 19, text: "担心被拒绝" },
    { id: 20, text: "在人际中缺乏安全感" },
  ],
};

const ASSESSMENT_TEMPLATES: Record<AssessmentType, AssessmentTemplate> = {
  MOOD: MOOD_TEMPLATE,
  ANXIETY: ANXIETY_TEMPLATE,
  STRESS: STRESS_TEMPLATE,
  SLEEP: SLEEP_TEMPLATE,
  SOCIAL: SOCIAL_TEMPLATE,
};

/**
 * 获取测评模板列表。
 */
export function getAssessmentTemplates() {
  return Object.values(ASSESSMENT_TEMPLATES);
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
  const template = ASSESSMENT_TEMPLATES[payload.type];
  if (!template) {
    throw new BadRequestError("测评类型无效");
  }
  if (payload.answers.length !== template.questions.length) {
    throw new BadRequestError("测评答案数量不匹配");
  }
  const score = payload.answers.reduce((total, value) => {
    if (value < 0 || value > 3) {
      throw new BadRequestError("测评分值必须在 0-3 之间");
    }
    return total + value;
  }, 0);
  const level = getAssessmentLevel(score, template.questions.length * 3);
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

function getAssessmentLevel(score: number, maxScore: number) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio <= 0.2) {
    return "无/轻度";
  }
  if (ratio <= 0.4) {
    return "轻度";
  }
  if (ratio <= 0.6) {
    return "中度";
  }
  if (ratio <= 0.8) {
    return "中重度";
  }
  return "重度";
}
