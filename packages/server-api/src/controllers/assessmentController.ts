import type { Context } from "koa";
import { assessmentSubmitSchema } from "../schemas/assessmentSchema";
import {
  getAssessmentHistory,
  getAssessmentTemplates,
  submitAssessment,
} from "../services/assessmentService";
import { BadRequestError } from "../utils/errors";

/**
 * 返回可用的心理测评模板。
 */
export async function listAssessmentTemplates(ctx: Context) {
  const templates = getAssessmentTemplates();
  ctx.status = 200;
  ctx.body = { templates };
}

/**
 * 提交测评并生成结果。
 */
export async function submitAssessmentResult(ctx: Context) {
  // 当前登录用户，用于绑定测评结果。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = assessmentSubmitSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("测评答案不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await submitAssessment(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

/**
 * 查询用户的测评历史记录。
 */
export async function listAssessmentHistory(ctx: Context) {
  // 当前登录用户，用于筛选个人历史。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const records = await getAssessmentHistory(authUser.sub);
  ctx.status = 200;
  ctx.body = { records };
}
