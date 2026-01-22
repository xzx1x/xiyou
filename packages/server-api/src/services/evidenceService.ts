import {
  createEvidenceRecord,
  findEvidenceById,
  findEvidenceByTarget,
  type EvidenceRecord,
  type EvidenceTargetType,
} from "../repositories/evidenceRepository";
import { BadRequestError } from "../utils/errors";

// 存证占位创建输入结构，统一对外暴露。
export type EvidencePlaceholderInput = {
  targetType: EvidenceTargetType;
  targetId: string;
  summary?: string | null;
};

/**
 * 创建存证占位记录，后续可由链上服务更新状态。
 */
export async function createEvidencePlaceholder(
  input: EvidencePlaceholderInput,
): Promise<EvidenceRecord> {
  return createEvidenceRecord({
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary ?? null,
  });
}

/**
 * 根据存证编号读取详情。
 */
export async function getEvidenceById(id: string): Promise<EvidenceRecord> {
  const record = await findEvidenceById(id);
  if (!record) {
    throw new BadRequestError("存证记录不存在");
  }
  return record;
}

/**
 * 按业务对象查询存证占位记录。
 */
export async function getEvidenceByTarget(
  targetType: EvidenceTargetType,
  targetId: string,
): Promise<EvidenceRecord | null> {
  return findEvidenceByTarget(targetType, targetId);
}
