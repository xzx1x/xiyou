import { z } from "zod";

// 内容创建时的校验规则。
export const contentCreateSchema = z.object({
  type: z.enum(["ARTICLE", "VIDEO", "NOTICE"]),
  title: z.string().min(1, "标题不能为空").max(200),
  summary: z.string().max(1000).optional(),
  content: z.string().max(20000).optional(),
  coverUrl: z.string().max(255).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

// 内容更新时的校验规则。
export const contentUpdateSchema = z.object({
  type: z.enum(["ARTICLE", "VIDEO", "NOTICE"]).optional(),
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(1000).optional(),
  content: z.string().max(20000).optional(),
  coverUrl: z.string().max(255).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});
