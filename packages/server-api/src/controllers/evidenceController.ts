import type { Context } from "koa";
import { evidenceQuerySchema } from "../schemas/evidenceSchema";
import { getEvidenceById, getEvidenceByTarget } from "../services/evidenceService";
import { BadRequestError } from "../utils/errors";

type AuthUser = {
  sub?: string;
  role?: "USER" | "COUNSELOR" | "ADMIN";
};

function getEvidenceAuthUser(ctx: Context) {
  const authUser = ctx.state.user as AuthUser | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "未授权");
  }
  return {
    sub: authUser.sub,
    role: authUser.role,
  };
}

/**
 * 鏌ヨ瀛樿瘉璁板綍璇︽儏銆? */
export async function getEvidenceRecord(ctx: Context) {
  const authUser = getEvidenceAuthUser(ctx);
  const evidenceId = ctx.params.id;
  if (!evidenceId) {
    throw new BadRequestError("存证编号不能为空");
  }
  const result = await getEvidenceById(evidenceId, authUser);
  ctx.status = 200;
  ctx.body = result;
}

/**
 * 鎸変笟鍔″璞℃煡璇㈠瓨璇佸崰浣嶈褰曘€? */
export async function getEvidenceRecordByTarget(ctx: Context) {
  const authUser = getEvidenceAuthUser(ctx);
  const targetType = typeof ctx.query.targetType === "string" ? ctx.query.targetType : "";
  const targetId = typeof ctx.query.targetId === "string" ? ctx.query.targetId : "";
  const parsed = evidenceQuerySchema.safeParse({ targetType, targetId });
  if (!parsed.success) {
    throw new BadRequestError("存证查询参数不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const result = await getEvidenceByTarget(
    parsed.data.targetType,
    parsed.data.targetId,
    authUser,
  );
  ctx.status = 200;
  ctx.body = result;
}
