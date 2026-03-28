import {
  createReport,
  findReportById,
  listReports,
  resolveReport,
  type ReportStatus,
  type ReportTargetType,
} from "../repositories/reportRepository";
import { findCounselorProfile } from "../repositories/counselorRepository";
import {
  findForumCommentById,
  findForumPostById,
  redactForumCommentByReport,
  rejectForumPostByReport,
} from "../repositories/forumRepository";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import {
  findUserById,
  listUsersByRole,
  updateUserStatus,
  type UserRecord,
} from "../repositories/userRepository";
import { BadRequestError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";
import { notifyInApp } from "./notificationService";

// 举报提交时的输入结构，兼顾后续审核动作。
export type ReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  attachmentDataUrl?: string | null;
};

// 举报处理时的输入结构，可选包含封禁目标的开关。
export type ReportResolveInput = {
  actionTaken?: string | null;
  disableTarget?: boolean;
};

const DEFAULT_POST_REPORT_ACTION = "举报属实，帖子已下架处理";
const DEFAULT_COMMENT_REPORT_ACTION = "举报属实，评论内容已删除";
const DEFAULT_USER_REPORT_ACTION = "举报属实，账号已封禁处理";

type ReportAttachmentParseResult = {
  buffer: Buffer;
  extension: string;
};

type ReportTargetUserSummary = {
  id: string;
  email: string;
  identityCode: string;
  nickname: string | null;
  gender: string | null;
  major: string | null;
  grade: string | null;
  avatarUrl: string | null;
  role: UserRecord["role"];
  isDisabled: boolean;
  disabledReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReportTargetDetail =
  | {
      type: "POST";
      targetId: string;
      found: boolean;
      post: {
        id: string;
        title: string;
        content: string;
        status: string;
        isAnonymous: boolean;
        createdAt: Date;
        updatedAt: Date;
        author: ReportTargetUserSummary | null;
      } | null;
    }
  | {
      type: "COMMENT";
      targetId: string;
      found: boolean;
      comment: {
        id: string;
        postId: string;
        postTitle: string | null;
        parentId: string | null;
        content: string;
        createdAt: Date;
        author: ReportTargetUserSummary | null;
      } | null;
    }
  | {
      type: "USER";
      targetId: string;
      found: boolean;
      user: ReportTargetUserSummary | null;
    }
  | {
      type: "COUNSELOR";
      targetId: string;
      found: boolean;
      user: ReportTargetUserSummary | null;
      counselor: {
        userId: string;
        bio: string | null;
        specialties: string | null;
        serviceMode: string;
        officeLocation: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    };

const REPORT_ATTACHMENT_STORAGE_DIR = resolve(process.cwd(), "uploads", "reports");
const MAX_REPORT_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const REPORT_ATTACHMENT_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function parseReportAttachmentDataUrl(dataUrl: string): ReportAttachmentParseResult {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new BadRequestError("附件格式不正确，仅支持 PNG/JPEG/WEBP 图片");
  }
  const mimeType = (match[1] ?? "").toLowerCase();
  const base64Payload = match[2] ?? "";
  if (!mimeType || !base64Payload) {
    throw new BadRequestError("附件格式不正确，仅支持 PNG/JPEG/WEBP 图片");
  }
  const buffer = Buffer.from(base64Payload, "base64");
  if (buffer.length === 0) {
    throw new BadRequestError("附件内容为空");
  }
  if (buffer.length > MAX_REPORT_ATTACHMENT_BYTES) {
    throw new BadRequestError("附件大小不能超过 2MB");
  }
  const extension = REPORT_ATTACHMENT_MIME_TO_EXT[mimeType];
  if (!extension) {
    throw new BadRequestError("附件格式不正确，仅支持 PNG/JPEG/WEBP 图片");
  }
  return { buffer, extension };
}

async function saveReportAttachmentFile(
  reportId: string,
  dataUrl: string,
): Promise<string> {
  const { buffer, extension } = parseReportAttachmentDataUrl(dataUrl);
  await mkdir(REPORT_ATTACHMENT_STORAGE_DIR, { recursive: true });
  const fileName = `${reportId}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = join(REPORT_ATTACHMENT_STORAGE_DIR, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/reports/${fileName}`;
}

function toReportTargetUserSummary(user: UserRecord): ReportTargetUserSummary {
  return {
    id: user.id,
    email: user.email,
    identityCode: user.identityCode,
    nickname: user.nickname,
    gender: user.gender,
    major: user.major,
    grade: user.grade,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isDisabled: user.isDisabled,
    disabledReason: user.disabledReason,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * 创建举报记录并通知管理员处理。
 */
export async function submitReport(
  reporterId: string,
  payload: ReportInput,
) {
  const reportId = crypto.randomUUID();
  const attachmentUrl = payload.attachmentDataUrl
    ? await saveReportAttachmentFile(reportId, payload.attachmentDataUrl)
    : null;
  const report = await createReport({
    id: reportId,
    reporterId,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    attachmentUrl,
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

export async function getReportTargetDetail(
  reportId: string,
): Promise<ReportTargetDetail> {
  const report = await findReportById(reportId);
  if (!report) {
    throw new BadRequestError("举报记录不存在");
  }

  if (report.targetType === "POST") {
    const post = await findForumPostById(report.targetId);
    const author =
      post?.authorId ? await findUserById(post.authorId) : null;
    return {
      type: "POST",
      targetId: report.targetId,
      found: Boolean(post),
      post: post
        ? {
            id: post.id,
            title: post.title,
            content: post.content,
            status: post.status,
            isAnonymous: post.isAnonymous,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: author ? toReportTargetUserSummary(author) : null,
          }
        : null,
    };
  }

  if (report.targetType === "COMMENT") {
    const comment = await findForumCommentById(report.targetId);
    const author =
      comment?.authorId ? await findUserById(comment.authorId) : null;
    const post = comment ? await findForumPostById(comment.postId) : null;
    return {
      type: "COMMENT",
      targetId: report.targetId,
      found: Boolean(comment),
      comment: comment
        ? {
            id: comment.id,
            postId: comment.postId,
            postTitle: post?.title ?? null,
            parentId: comment.parentId,
            content: comment.content,
            createdAt: comment.createdAt,
            author: author ? toReportTargetUserSummary(author) : null,
          }
        : null,
    };
  }

  if (report.targetType === "USER") {
    const user = await findUserById(report.targetId);
    return {
      type: "USER",
      targetId: report.targetId,
      found: Boolean(user),
      user: user ? toReportTargetUserSummary(user) : null,
    };
  }

  const user = await findUserById(report.targetId);
  const counselor = await findCounselorProfile(report.targetId);
  return {
    type: "COUNSELOR",
    targetId: report.targetId,
    found: Boolean(user || counselor),
    user: user ? toReportTargetUserSummary(user) : null,
    counselor: counselor
      ? {
          userId: counselor.userId,
          bio: counselor.bio,
          specialties: counselor.specialties,
          serviceMode: counselor.serviceMode,
          officeLocation: counselor.officeLocation,
          isActive: counselor.isActive,
          createdAt: counselor.createdAt,
          updatedAt: counselor.updatedAt,
        }
      : null,
  };
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
  const actionTaken = payload.actionTaken?.trim() || null;
  let resolvedAction = actionTaken;
  const shouldApplyTargetAction = Boolean(payload.disableTarget);
  if (shouldApplyTargetAction) {
    if (report.targetType === "POST") {
      const post = await findForumPostById(report.targetId);
      if (post) {
        const action = actionTaken || DEFAULT_POST_REPORT_ACTION;
        resolvedAction = action;
        await rejectForumPostByReport(report.targetId, resolverId, action);
        if (post.authorId) {
          await notifyInApp(
            post.authorId,
            "帖子处理通知",
            "你的帖子因举报处理已被下架，请遵守社区规范。",
            "/forum",
          );
        }
      }
    } else if (report.targetType === "COMMENT") {
      const comment = await findForumCommentById(report.targetId);
      if (comment) {
        resolvedAction = actionTaken || DEFAULT_COMMENT_REPORT_ACTION;
        await redactForumCommentByReport(report.targetId);
        if (comment.authorId) {
          await notifyInApp(
            comment.authorId,
            "评论处理通知",
            "你的评论因举报处理已被删除，请遵守社区规范。",
            `/forum/${comment.postId}`,
          );
        }
      }
    } else if (report.targetType === "USER" || report.targetType === "COUNSELOR") {
      resolvedAction = actionTaken || DEFAULT_USER_REPORT_ACTION;
      await updateUserStatus(
        report.targetId,
        true,
        resolvedAction,
      );
    }
  }
  await resolveReport(reportId, resolverId, resolvedAction);
  await notifyInApp(
    report.reporterId,
    "举报处理完成",
    "你的举报已处理完毕，感谢你的反馈。",
    "/notifications",
  );
}
