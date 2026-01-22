import type { Context, Next } from "koa";
import type { UserRole } from "../repositories/userRepository";
import { UnauthorizedError } from "../utils/errors";

/**
 * 角色授权中间件：限制只有指定角色可访问路由。
 */
export function authorizeRoles(allowedRoles: UserRole[]) {
  return async (ctx: Context, next: Next): Promise<void> => {
    const authUser = ctx.state.user as { role?: UserRole } | undefined;
    if (!authUser || !authUser.role) {
      throw new UnauthorizedError("未授权");
    }
    if (!allowedRoles.includes(authUser.role)) {
      throw new UnauthorizedError("权限不足");
    }
    await next();
  };
}
