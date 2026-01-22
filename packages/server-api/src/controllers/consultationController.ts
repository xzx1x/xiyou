import type { Context } from "koa";
import {
  consultationCreateSchema,
  consultationUpdateSchema,
} from "../schemas/consultationSchema";
import {
  createRecord,
  getRecord,
  listRecords,
  updateRecord,
} from "../services/consultationService";
import { BadRequestError } from "../utils/errors";

/**
 * 心理师创建咨询记录。
 */
export async function createConsultationRecord(ctx: Context) {
  // 当前登录心理师，用于创建记录归属。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = consultationCreateSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("咨询记录信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await createRecord(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

/**
 * 心理师更新咨询记录内容。
 */
export async function updateConsultationRecord(ctx: Context) {
  // 当前登录心理师，用于权限校验。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const recordId = ctx.params.id;
  if (!recordId) {
    throw new BadRequestError("记录编号不能为空");
  }
  const parsed = consultationUpdateSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("咨询记录信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const record = await updateRecord(recordId, authUser.sub, parsed.data);
  ctx.status = 200;
  ctx.body = { record };
}

/**
 * 查询咨询记录列表（用户或心理师）。
 */
export async function listConsultationRecords(ctx: Context) {
  // 当前登录用户与角色，用于过滤记录列表。
  const authUser = ctx.state.user as { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" } | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "未授权");
  }
  const records =
    authUser.role === "USER"
      ? await listRecords({ userId: authUser.sub })
      : authUser.role === "COUNSELOR"
        ? await listRecords({ counselorId: authUser.sub })
        : await listRecords({});
  ctx.status = 200;
  ctx.body = { records };
}

/**
 * 查看咨询记录详情。
 */
export async function getConsultationRecord(ctx: Context) {
  // 当前登录用户与角色，用于权限校验。
  const authUser = ctx.state.user as { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" } | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "未授权");
  }
  const recordId = ctx.params.id;
  if (!recordId) {
    throw new BadRequestError("记录编号不能为空");
  }
  const record = await getRecord(recordId, authUser.sub, authUser.role);
  ctx.status = 200;
  ctx.body = { record };
}
