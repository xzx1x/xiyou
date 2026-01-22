import {
  createContentItem,
  findContentItemById,
  listContentItems,
  updateContentItem,
  type ContentStatus,
  type ContentType,
  type ContentItemRecord,
} from "../repositories/contentRepository";
import { BadRequestError } from "../utils/errors";
import { createEvidencePlaceholder } from "./evidenceService";

// 创建内容所需的输入结构。
export type ContentCreateInput = {
  type: ContentType;
  title: string;
  summary?: string | null;
  content?: string | null;
  coverUrl?: string | null;
  status?: ContentStatus;
};

// 更新内容所需的输入结构，字段可选便于部分更新。
export type ContentUpdateInput = {
  type?: ContentType;
  title?: string;
  summary?: string | null;
  content?: string | null;
  coverUrl?: string | null;
  status?: ContentStatus;
};

/**
 * 创建内容条目，同时生成存证占位记录。
 */
export async function createContent(
  authorId: string,
  payload: ContentCreateInput,
) {
  const now = new Date();
  const status: ContentStatus = payload.status ?? "DRAFT";
  // 若直接发布则记录发布时间，后续用于前台排序。
  const publishedAt = status === "PUBLISHED" ? now : null;
  const record: ContentItemRecord = {
    id: crypto.randomUUID(),
    type: payload.type,
    title: payload.title,
    summary: payload.summary ?? null,
    content: payload.content ?? null,
    coverUrl: payload.coverUrl ?? null,
    status,
    createdBy: authorId,
    updatedBy: authorId,
    createdAt: now,
    updatedAt: now,
    publishedAt,
  };
  await createContentItem(record);
  // 生成内容存证占位，后续链上可复用。
  const evidence = await createEvidencePlaceholder({
    targetType: "CONTENT",
    targetId: record.id,
    summary: `${record.type}:${record.title}`,
  });
  return { item: record, evidence };
}

/**
 * 更新内容条目，并在需要时补充发布时间。
 */
export async function updateContent(
  contentId: string,
  editorId: string,
  payload: ContentUpdateInput,
) {
  const existing = await findContentItemById(contentId);
  if (!existing) {
    throw new BadRequestError("内容不存在");
  }
  // 判断是否从草稿切换为首次发布。
  const shouldPublish =
    payload.status === "PUBLISHED" && !existing.publishedAt;
  // 当首次发布时写入发布时间。
  const publishedAt = shouldPublish ? new Date() : undefined;
  await updateContentItem(contentId, {
    ...payload,
    publishedAt,
    updatedBy: editorId,
  });
  const updated = await findContentItemById(contentId);
  if (!updated) {
    throw new BadRequestError("内容更新失败");
  }
  return updated;
}

/**
 * 查询内容列表，支持按状态过滤。
 */
export async function getContentList(status?: ContentStatus) {
  return listContentItems(status);
}

/**
 * 读取单条内容条目。
 */
export async function getContentDetail(id: string) {
  const record = await findContentItemById(id);
  if (!record) {
    throw new BadRequestError("内容不存在");
  }
  return record;
}
