import Router from "@koa/router";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { extname, isAbsolute, join, relative, resolve } from "path";
import { BadRequestError } from "../utils/errors";

// 头像文件所在目录（绝对路径）。
const AVATAR_ROOT = resolve(process.cwd(), "uploads", "avatars");
// 允许读取的扩展名，避免暴露任意文件。
const ALLOWED_AVATAR_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/**
 * 判断请求的文件名是否为安全的文件名（仅允许字母数字与常见符号）。
 */
function isSafeFileName(fileName: string) {
  return /^[A-Za-z0-9._-]+$/.test(fileName);
}

/**
 * 检查路径是否逃逸出头像目录，防止路径穿越。
 */
function isPathWithinRoot(rootPath: string, targetPath: string) {
  if (isAbsolute(targetPath) && targetPath === rootPath) {
    return true;
  }
  const relativePath = relative(rootPath, targetPath);
  return !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

const staticRouter = new Router();

/**
 * 头像文件读取接口，前端可通过 /uploads/avatars/:fileName 访问。
 */
staticRouter.get("/uploads/avatars/:fileName", async (ctx) => {
  const fileName = ctx.params.fileName;
  if (!fileName || !isSafeFileName(fileName)) {
    throw new BadRequestError("非法文件名");
  }
  const extension = extname(fileName).toLowerCase();
  if (!ALLOWED_AVATAR_EXT.has(extension)) {
    ctx.status = 404;
    return;
  }
  const filePath = resolve(join(AVATAR_ROOT, fileName));
  if (!isPathWithinRoot(AVATAR_ROOT, filePath)) {
    throw new BadRequestError("非法文件路径");
  }
  const stats = await stat(filePath).catch(() => null);
  if (!stats || !stats.isFile()) {
    ctx.status = 404;
    return;
  }
  ctx.type = extension;
  ctx.set("Cache-Control", "public, max-age=3600");
  ctx.body = createReadStream(filePath);
});

export default staticRouter;
