import type { Context, Next } from "koa";
import { findUserAccessInfo } from "../repositories/userRepository";
import { verifyToken } from "../services/authService";
import { UnauthorizedError } from "../utils/errors";

/**
 * 校验请求携带的 Bearer Token，并将认证用户信息注入 `ctx.state.user`。
 */
export async function authenticate(ctx: Context, next: Next): Promise<void> {
  const authHeader = ctx.headers.authorization;
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new UnauthorizedError("缺少访问令牌");
  }
  const token = authHeader.slice(7).trim();
  const payload = await verifyToken(token);
  const accessInfo = await findUserAccessInfo(payload.sub);
  if (!accessInfo) {
    throw new UnauthorizedError("账号不存在或已被删除");
  }
  if (accessInfo.isDisabled) {
    throw new UnauthorizedError("账号已被禁用");
  }
  ctx.state.user = {
    ...payload,
    role: accessInfo.role,
  };
  await next();
}
