import type { Context } from "koa";
import {
  consultationEvidenceConfirmSchema,
  consultationCreateSchema,
  consultationUpdateSchema,
} from "../schemas/consultationSchema";
import {
  confirmRecordEvidence,
  createRecord,
  getRecord,
  listRecords,
  prepareRecordEvidence,
  syncRecordEvidence,
  updateRecord,
} from "../services/consultationService";
import { BadRequestError } from "../utils/errors";

export async function createConsultationRecord(ctx: Context) {
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

export async function updateConsultationRecord(ctx: Context) {
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
  const result = await updateRecord(recordId, authUser.sub, parsed.data);
  ctx.status = 200;
  ctx.body = result;
}

export async function listConsultationRecords(ctx: Context) {
  const authUser = ctx.state.user as
    | { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" }
    | undefined;
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

export async function getConsultationRecord(ctx: Context) {
  const authUser = ctx.state.user as
    | { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" }
    | undefined;
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

export async function syncConsultationEvidenceRecord(ctx: Context) {
  const authUser = ctx.state.user as
    | { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" }
    | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "未授权");
  }
  const recordId = ctx.params.id;
  if (!recordId) {
    throw new BadRequestError("记录编号不能为空");
  }
  const result = await syncRecordEvidence(recordId, authUser.sub, authUser.role);
  ctx.status = 200;
  ctx.body = result;
}

export async function prepareConsultationEvidenceRecord(ctx: Context) {
  const authUser = ctx.state.user as
    | { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" }
    | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "Unauthorized");
  }
  const recordId = ctx.params.id;
  if (!recordId) {
    throw new BadRequestError("Record id is required");
  }
  const result = await prepareRecordEvidence(recordId, authUser.sub, authUser.role);
  ctx.status = 200;
  ctx.body = result;
}

export async function confirmConsultationEvidenceRecord(ctx: Context) {
  const authUser = ctx.state.user as
    | { sub?: string; role?: "USER" | "COUNSELOR" | "ADMIN" }
    | undefined;
  if (!authUser?.sub || !authUser.role) {
    ctx.throw(401, "Unauthorized");
  }
  const recordId = ctx.params.id;
  if (!recordId) {
    throw new BadRequestError("Record id is required");
  }

  const parsed = consultationEvidenceConfirmSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    throw new BadRequestError("Consultation evidence confirm payload is invalid", {
      issues: parsed.error.flatten(),
    });
  }

  const result = await confirmRecordEvidence(
    recordId,
    authUser.sub,
    authUser.role,
    parsed.data.txHash,
  );
  ctx.status = 200;
  ctx.body = result;
}
