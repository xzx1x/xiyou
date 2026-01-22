import type { Context } from "koa";
import { contentCreateSchema, contentUpdateSchema } from "../schemas/contentSchema";
import {
  createContent,
  getContentDetail,
  getContentList,
  updateContent,
} from "../services/contentService";
import { BadRequestError, UnauthorizedError } from "../utils/errors";

/**
 * 创建内容条目（管理员）。
 */
export async function createContentItem(ctx: Context) {
  // 当前登录管理员，用于绑定创建者。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const parsed = contentCreateSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("内容信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await createContent(authUser.sub, parsed.data);
  ctx.status = 201;
  ctx.body = result;
}

/**
 * 更新内容条目（管理员）。
 */
export async function patchContentItem(ctx: Context) {
  // 当前登录管理员，用于记录更新者。
  const authUser = ctx.state.user as { sub?: string } | undefined;
  if (!authUser?.sub) {
    ctx.throw(401, "未授权");
  }
  const contentId = ctx.params.id;
  if (!contentId) {
    throw new BadRequestError("内容编号不能为空");
  }
  const parsed = contentUpdateSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("内容信息不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const item = await updateContent(contentId, authUser.sub, parsed.data);
  ctx.status = 200;
  ctx.body = { item };
}

/**
 * 获取内容列表（管理员可筛选状态，用户仅看已发布）。
 */
export async function listContentItems(ctx: Context) {
  const authUser = ctx.state.user as { role?: string } | undefined;
  // 可选的内容状态筛选参数。
  const statusRaw = ctx.query.status;
  const status =
    typeof statusRaw === "string" ? statusRaw : undefined;
  if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
    throw new BadRequestError("内容状态不合法");
  }
  const effectiveStatus =
    authUser?.role === "ADMIN" ? (status as "DRAFT" | "PUBLISHED" | undefined) : "PUBLISHED";
  const items = await getContentList(effectiveStatus);
  ctx.status = 200;
  ctx.body = { items };
}

/**
 * 获取内容详情，未发布内容仅管理员可见。
 */
export async function getContentItemDetail(ctx: Context) {
  const authUser = ctx.state.user as { role?: string } | undefined;
  const contentId = ctx.params.id;
  if (!contentId) {
    throw new BadRequestError("内容编号不能为空");
  }
  const item = await getContentDetail(contentId);
  if (item.status !== "PUBLISHED" && authUser?.role !== "ADMIN") {
    throw new UnauthorizedError("内容未发布，暂无权限查看");
  }
  ctx.status = 200;
  ctx.body = { item };
}
