import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type ContentType = "ARTICLE" | "VIDEO" | "NOTICE";
export type ContentStatus = "DRAFT" | "PUBLISHED";

export type ContentItemRecord = {
  id: string;
  type: ContentType;
  title: string;
  summary: string | null;
  content: string | null;
  coverUrl: string | null;
  status: ContentStatus;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

/**
 * 创建内容条目。
 */
export async function createContentItem(
  payload: ContentItemRecord,
): Promise<ContentItemRecord> {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO content_items (id, type, title, summary, content, cover_url, status, created_by, updated_by, created_at, updated_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.id,
      payload.type,
      payload.title,
      payload.summary ?? null,
      payload.content ?? null,
      payload.coverUrl ?? null,
      payload.status,
      payload.createdBy,
      payload.updatedBy ?? null,
      payload.createdAt,
      payload.updatedAt,
      payload.publishedAt ?? null,
    ],
  );
  return payload;
}

/**
 * 更新内容条目。
 */
export async function updateContentItem(
  id: string,
  payload: Partial<Omit<ContentItemRecord, "id" | "createdBy" | "createdAt">> & {
    updatedBy: string;
  },
): Promise<void> {
  const assignments: string[] = [];
  const values: Array<string | Date | null> = [];

  if (payload.type !== undefined) {
    assignments.push("type = ?");
    values.push(payload.type);
  }
  if (payload.title !== undefined) {
    assignments.push("title = ?");
    values.push(payload.title);
  }
  if (payload.summary !== undefined) {
    assignments.push("summary = ?");
    values.push(payload.summary);
  }
  if (payload.content !== undefined) {
    assignments.push("content = ?");
    values.push(payload.content);
  }
  if (payload.coverUrl !== undefined) {
    assignments.push("cover_url = ?");
    values.push(payload.coverUrl);
  }
  if (payload.status !== undefined) {
    assignments.push("status = ?");
    values.push(payload.status);
  }
  if (payload.publishedAt !== undefined) {
    assignments.push("published_at = ?");
    values.push(payload.publishedAt);
  }

  if (assignments.length > 0) {
    values.push(payload.updatedBy);
    values.push(new Date());
    values.push(id);
    const query = `UPDATE content_items SET ${assignments.join(", ")}, updated_by = ?, updated_at = ? WHERE id = ?`;
    await pool.execute<ResultSetHeader>(query, values);
  }
}

/**
 * 查询内容列表。
 */
export async function listContentItems(
  status?: ContentStatus,
): Promise<ContentItemRecord[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    status
      ? "SELECT * FROM content_items WHERE status = ? ORDER BY created_at DESC"
      : "SELECT * FROM content_items ORDER BY created_at DESC",
    status ? [status] : [],
  );
  return rows.map(mapContentItem);
}

/**
 * 查询单条内容。
 */
export async function findContentItemById(
  id: string,
): Promise<ContentItemRecord | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM content_items WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapContentItem(rows[0]!);
}

function mapContentItem(row: RowDataPacket): ContentItemRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    summary: row.summary,
    content: row.content,
    coverUrl: row.cover_url,
    status: row.status,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : null,
  };
}
