import type { Context } from "koa";
import { feedbackSubmitSchema } from "../schemas/feedbackSchema";
import { getFeedbackList, submitFeedback } from "../services/feedbackService";
import { BadRequestError } from "../utils/errors";

/**
 * 提交咨询反馈。
 */
export async function createFeedback(ctx: Context) {
  // 当前登录用户，用于确认反馈归属。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = feedbackSubmitSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("反馈信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await submitFeedback(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

/**
 * 查询反馈列表（用户或心理师）。
 */
export async function listFeedback(ctx: Context) {
  // 当前登录用户与角色，用于筛选反馈数据。
  const authUser = ctx.state.user as { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" } | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "未授权");
  }
  const feedback =
    authUser.role === "USER"
      ? await getFeedbackList({ userId: authUser.sub })
      : authUser.role === "COUNSELOR"
        ? await getFeedbackList({ counselorId: authUser.sub })
        : await getFeedbackList({});
  ctx.status = 200;
  ctx.body = { feedback };
}
