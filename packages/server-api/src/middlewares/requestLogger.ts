import type { Context, Next } from "koa";
import { createRequestLog } from "../repositories/logRepository";

/**
 * 记录每次请求的基础信息，包含耗时与状态码。
 */
export async function requestLogger(ctx: Context, next: Next): Promise<void> {
  const startTime = Date.now();
  try {
    await next();
  } finally {
    const durationMs = Date.now() - startTime;
    const authUser = ctx.state.user as { sub?: string } | undefined;
    const userAgentRaw = ctx.headers["user-agent"] as string | string[] | undefined;
    const userAgent =
      typeof userAgentRaw === "string"
        ? userAgentRaw
        : Array.isArray(userAgentRaw)
          ? userAgentRaw.join(", ")
          : null;
    await createRequestLog({
      userId: authUser?.sub ?? null,
      method: ctx.method,
      path: ctx.path,
      status: ctx.status,
      durationMs,
      ip: ctx.ip,
      userAgent,
    });
  }
}
