import {
  createReport,
  findReportById,
  listReports,
  resolveReport,
  type ReportStatus,
  type ReportTargetType,
} from "../repositories/reportRepository";
import { listUsersByRole, updateUserStatus } from "../repositories/userRepository";
import { BadRequestError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";
import { notifyInApp } from "./notificationService";

// 举报提交时的输入结构，兼顾后续审核动作。
export type ReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
};

// 举报处理时的输入结构，可选包含封禁目标的开关。
export type ReportResolveInput = {
  actionTaken?: string | null;
  disableTarget?: boolean;
};

/**
 * 创建举报记录并通知管理员处理。
 */
export async function submitReport(
  reporterId: string,
  payload: ReportInput,
) {
  const report = await createReport({
    id: crypto.randomUUID(),
    reporterId,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    status: "PENDING",
    actionTaken: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: new Date(),
  });
  // 生成举报存证占位，后续可对接链上存档。
  const evidence = await createEvidencePlaceholder({
    targetType: "REPORT",
    targetId: report.id,
    summary: `举报类型：${payload.targetType}`,
  });
  const admins = await listUsersByRole("ADMIN");
  await Promise.all(
    admins.map((admin) =>
      notifyInApp(
        admin.id,
        "收到新的举报",
        "有新的举报待处理，请及时审核。",
        "/admin/reports",
      ),
    ),
  );
  return { report, evidence };
}

/**
 * 查询举报列表，支持按状态筛选。
 */
export async function getReports(status?: ReportStatus) {
  return listReports(status);
}

/**
 * 处理举报：更新状态，并按需封禁目标账号。
 */
export async function resolveReportAction(
  reportId: string,
  resolverId: string,
  payload: ReportResolveInput,
) {
  const report = await findReportById(reportId);
  if (!report) {
    throw new BadRequestError("举报记录不存在");
  }
  // 是否需要执行封禁目标账号的动作。
  const shouldDisable =
    payload.disableTarget &&
    (report.targetType === "USER" || report.targetType === "COUNSELOR");
  if (shouldDisable) {
    // 当目标为用户或心理师时支持封禁账号。
    await updateUserStatus(report.targetId, true, payload.actionTaken ?? null);
  }
  await resolveReport(reportId, resolverId, payload.actionTaken ?? null);
  await notifyInApp(
    report.reporterId,
    "举报处理完成",
    "你的举报已处理完毕，感谢你的反馈。",
    "/reports",
  );
}
