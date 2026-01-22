import type { Context } from "koa";
import { evidenceQuerySchema } from "../schemas/evidenceSchema";
import { getEvidenceById, getEvidenceByTarget } from "../services/evidenceService";
import { BadRequestError } from "../utils/errors";

/**
 * 查询存证记录详情。
 */
export async function getEvidenceRecord(ctx: Context) {
  const evidenceId = ctx.params.id;
  if (!evidenceId) {
    throw new BadRequestError("存证编号不能为空");
  }
  const evidence = await getEvidenceById(evidenceId);
  ctx.status = 200;
  ctx.body = { evidence };
}

/**
 * 按业务对象查询存证占位记录。
 */
export async function getEvidenceRecordByTarget(ctx: Context) {
  const targetType = typeof ctx.query.targetType === "string" ? ctx.query.targetType : "";
  const targetId = typeof ctx.query.targetId === "string" ? ctx.query.targetId : "";
  const parsed = evidenceQuerySchema.safeParse({ targetType, targetId });
  if (!parsed.success) {
    throw new BadRequestError("存证查询参数不合法", {
      issues: parsed.error.flatten(),
    });
  }
  const evidence = await getEvidenceByTarget(parsed.data.targetType, parsed.data.targetId);
  ctx.status = 200;
  ctx.body = { evidence };
}
