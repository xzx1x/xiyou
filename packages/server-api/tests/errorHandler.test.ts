import { afterEach, describe, expect, it } from "bun:test";
import type { Context } from "koa";
import { errorHandler } from "../src/middlewares/errorHandler";
import { BadRequestError } from "../src/utils/errors";

/**
 * 构造最小可用的 Koa Context，便于测试中间件的响应行为。
 */
function createMockContext(): Context {
  return {
    status: 0,
    body: undefined,
    method: "POST",
    path: "/api/auth/register",
  } as Context;
}

describe("errorHandler", () => {
  const originalEnv = process.env.NODE_ENV;

  // 每个用例后恢复环境变量，避免互相干扰。
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("includes debug info outside production", async () => {
    process.env.NODE_ENV = "development";
    const ctx = createMockContext();

    // 触发业务错误，验证非生产环境会返回调试信息。
    await errorHandler(ctx, async () => {
      throw new BadRequestError("invalid input", { field: "email" });
    });

    const body = ctx.body as {
      message?: string;
      details?: Record<string, unknown>;
      debug?: { name?: string };
    };

    expect(ctx.status).toBe(400);
    expect(body.message).toBe("invalid input");
    expect(body.details).toEqual({ field: "email" });
    expect(body.debug?.name).toBe("BadRequestError");
  });

  it("omits debug info in production", async () => {
    process.env.NODE_ENV = "production";
    const ctx = createMockContext();

    // 触发未知错误，验证生产环境不会泄漏调试信息。
    await errorHandler(ctx, async () => {
      throw new Error("boom");
    });

    const body = ctx.body as { debug?: unknown };
    expect(ctx.status).toBe(500);
    expect(body.debug).toBeUndefined();
  });
});
