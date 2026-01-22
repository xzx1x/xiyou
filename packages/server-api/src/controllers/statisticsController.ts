import type { Context } from "koa";
import { getAdminStats, getCounselorStats } from "../services/statisticsService";

/**
 * 获取心理师个人统计数据。
 */
export async function getCounselorStatistics(ctx: Context) {
  // 当前登录心理师，用于查询个人统计。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const stats = await getCounselorStats(authUser.sub);
  ctx.status = 200;
  ctx.body = { stats };
}

/**
 * 获取管理员全局统计数据。
 */
export async function getAdminStatistics(ctx: Context) {
  const stats = await getAdminStats();
  ctx.status = 200;
  ctx.body = { stats };
}
