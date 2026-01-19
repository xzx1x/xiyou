import type { Context } from "koa";
import { loginSchema, registerSchema } from "../schemas/authSchema";
import { loginUser, registerUser } from "../services/authService";
import { BadRequestError } from "../utils/errors";

export async function register(ctx: Context) {
  const parsed = registerSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("注册信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const user = await registerUser(parsed.data);
  ctx.status = 201;
  ctx.body = { user };
}

export async function login(ctx: Context) {
  const parsed = loginSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("登录信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await loginUser(parsed.data);
  ctx.status = 200;
  ctx.body = result;
}
