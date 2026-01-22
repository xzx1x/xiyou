import type { Context } from "koa";
import { reportCreateSchema, reportResolveSchema } from "../schemas/reportSchema";
import {
  getReports,
  resolveReportAction,
  submitReport,
} from "../services/reportService";
import { BadRequestError } from "../utils/errors";

/**
 * 提交举报。
 */
export async function createReportRecord(ctx: Context) {
  // 当前登录用户，用于绑定举报人。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = reportCreateSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("举报信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await submitReport(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

/**
 * 管理员查询举报列表。
 */
export async function listReportRecords(ctx: Context) {
  // 可选的举报状态筛选参数。
  const statusRaw = ctx.query.status;
  const status =
    typeof statusRaw === "string" ? statusRaw : undefined;
  if (status && !["PENDING", "RESOLVED"].includes(status)) {
    throw new BadRequestError("举报状态不合法");
  }
  const reports = await getReports(status as "PENDING" | "RESOLVED" | undefined);
  ctx.status = 200;
  ctx.body = { reports };
}

/**
 * 管理员处理举报。
 */
export async function resolveReportRecord(ctx: Context) {
  // 当前登录管理员，用于记录处理人。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const reportId = ctx.params.id;
  if (!reportId) {
    throw new BadRequestError("举报编号不能为空");
  }
  const parsed = reportResolveSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("处理信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  await resolveReportAction(reportId, authUser.sub, parsed.data);
  ctx.status = 200;
  ctx.body = { message: "举报已处理" };
}
