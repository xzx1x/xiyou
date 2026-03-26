import type { Context } from "koa";
import {
  assessmentConfirmSchema,
  assessmentPrepareSchema,
  assessmentSubmitSchema,
} from "../schemas/assessmentSchema";
import {
  confirmAssessmentSubmission,
  getAssessmentHistory,
  getAssessmentTemplates,
  prepareAssessmentEvidenceSubmission,
  prepareAssessmentSubmission,
  syncAssessmentSubmission,
  submitAssessment,
} from "../services/assessmentService";
import { BadRequestError } from "../utils/errors";

export async function listAssessmentTemplates(ctx: Context) {
  const templates = getAssessmentTemplates();
  ctx.status = 200;
  ctx.body = { templates };
}

export async function prepareAssessmentResult(ctx: Context) {
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }

  const parsed = assessmentPrepareSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("测评答案不合法", {
      issues: parsed.error.flatten(),
    });
  }

  const result = await prepareAssessmentSubmission(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

export async function confirmAssessmentResult(ctx: Context) {
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }

  const parsed = assessmentConfirmSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("链上确认参数不合法", {
      issues: parsed.error.flatten(),
    });
  }

  const result = await confirmAssessmentSubmission(authUser.sub, parsed.data);
  ctx.status = 200;
  ctx.body = result;
}

export async function prepareAssessmentEvidenceRecord(ctx: Context) {
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "鏈巿鏉?");
  }

  const assessmentId = ctx.params.id;
  if (!assessmentId) {
    throw new BadRequestError("娴嬭瘎缂栧彿涓嶈兘涓虹┖");
  }

  const result = await prepareAssessmentEvidenceSubmission(authUser.sub, assessmentId);
  ctx.status = 200;
  ctx.body = result;
}

export async function submitAssessmentResult(ctx: Context) {
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

export async function syncAssessmentEvidenceRecord(ctx: Context) {
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "鏈巿鏉?");
  }

  const assessmentId = ctx.params.id;
  if (!assessmentId) {
    throw new BadRequestError("娴嬭瘎缂栧彿涓嶈兘涓虹┖");
  }

  const result = await syncAssessmentSubmission(authUser.sub, assessmentId);
  ctx.status = 200;
  ctx.body = result;
}

export async function listAssessmentHistory(ctx: Context) {
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }

  const records = await getAssessmentHistory(authUser.sub);
  ctx.status = 200;
  ctx.body = { records };
}
