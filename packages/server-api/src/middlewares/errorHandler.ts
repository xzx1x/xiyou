import type { Context, Next } from "koa";
import { AppError } from "../utils/errors";

export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (error) {
    const err = error as AppError;
    const status = err.statusCode ?? 500;
    // 标记当前是否为生产环境，用于控制调试信息输出。
    const isProduction = process.env.NODE_ENV === "production";
    // 记录请求信息，便于服务端日志排查。
    const requestLabel = `${ctx.method} ${ctx.path}`;
    // 统一响应结构，避免不同异常导致返回格式不一致。
    const responseBody: {
      message: string;
      details?: Record<string, unknown>;
      debug?: {
        name?: string;
        message?: string;
        stack?: string;
        details?: Record<string, unknown>;
      };
    } = {
      message: err.message ?? "服务器内部错误",
      details: err.details,
    };

    if (!isProduction) {
      responseBody.debug = {
        name: err.name,
        message: err.message,
        stack: err.stack,
        details: err.details,
      };
    }

    ctx.status = status;
    ctx.body = responseBody;
    if (status >= 500) {
      console.error(`[${requestLabel}] Internal error:`, error);
    } else if (!isProduction) {
      if (err.details) {
        console.warn(`[${requestLabel}] Request error:`, err.message, err.details);
      } else {
        console.warn(`[${requestLabel}] Request error:`, err.message);
      }
    }
  }
}
