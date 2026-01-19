import type { Context, Next } from "koa";
import { AppError } from "../utils/errors";

export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (error) {
    const err = error as AppError;
    const status = err.statusCode ?? 500;
    ctx.status = status;
    ctx.body = {
      message: err.message ?? "服务器内部错误",
      details: err.details,
    };
    if (status >= 500) {
      console.error("Internal error:", error);
    }
  }
}
