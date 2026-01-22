import type { Context } from "koa";
import { listRequestLogs } from "../repositories/logRepository";
import { BadRequestError } from "../utils/errors";

/**
 * 查询最近请求日志（管理员）。
 */
export async function listLogs(ctx: Context) {
  // 读取可选的日志条数参数，用于限制返回数量。
  const limitRaw = ctx.query.limit;
  const limit =
    typeof limitRaw === "string" && limitRaw.trim().length > 0
      ? Number(limitRaw)
      : undefined;
  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    throw new BadRequestError("日志数量参数不合法");
  }
  const logs = await listRequestLogs(limit ?? 200);
  ctx.status = 200;
  ctx.body = { logs };
}
