import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, extname, join, resolve } from "path";

type CollectOptions = {
  // Root directory to scan for text files.
  rootDir: string;
  // Destination path for the combined dump file.
  outputPath: string;
};

// Extensions treated as text files for collection.
// This list intentionally excludes images/binaries to keep output readable.
const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".txt",
  ".sql",
  ".prisma",
  ".yml",
  ".yaml",
  ".css",
  ".scss",
  ".less",
  ".html",
  ".xml",
  ".csv",
  ".toml",
  ".ini",
  ".env",
  ".lock",
]);

// Filenames without extensions that should still be collected.
// Examples: README, LICENSE, Dockerfile, Makefile, etc.
const allowedFilenames = new Set([
  "README",
  "LICENSE",
  "NOTICE",
  "Dockerfile",
  "Makefile",
]);

// Directories to skip during traversal to avoid noise and binaries.
// This avoids vendor/build outputs and user upload artifacts.
const ignoredDirs = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  "tmp",
  "temp",
  "uploads",
]);

// Best-effort binary detection: skip buffers containing null bytes.
// This prevents unreadable output for binary-like files with text extensions.
function isBinaryBuffer(buffer: Uint8Array) {
  const len = Math.min(buffer.length, 8000);
  for (let i = 0; i < len; i += 1) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

// Determine if a file should be included based on name/extension.
// Returns true for whitelisted filenames or extensions.
function shouldIncludeFile(filePath: string) {
  const base = basename(filePath);
  if (allowedFilenames.has(base)) {
    return true;
  }
  const extension = extname(filePath).toLowerCase();
  return allowedExtensions.has(extension);
}

// Traverse the directory tree and collect eligible text files.
// Returns absolute file paths sorted for stable output ordering.
function collectFiles(rootDir: string) {
  const files: string[] = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    const stat = statSync(current);
    if (stat.isDirectory()) {
      const base = basename(current);
      if (ignoredDirs.has(base)) {
        continue;
      }
      const entries = readdirSync(current);
      for (const entry of entries) {
        stack.push(join(current, entry));
      }
    } else if (stat.isFile() && shouldIncludeFile(current)) {
      files.push(current);
    }
  }
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

// Read a file as UTF-8 text unless it looks binary.
// Returns null when binary-like content is detected.
function safeReadFile(filePath: string) {
  const buffer = readFileSync(filePath);
  if (isBinaryBuffer(buffer)) {
    return null;
  }
  return buffer.toString("utf-8");
}

// Build a combined text dump with a file list and per-file content sections.
// The output is a single file for easy review and searching.
function writeOutput({ rootDir, outputPath }: CollectOptions) {
  const files = collectFiles(rootDir);
  const outputDir = resolve(outputPath, "..");
  mkdirSync(outputDir, { recursive: true });
  const parts: string[] = [];
  parts.push(`# 文本收集输出`);
  parts.push(`根目录: ${rootDir}`);
  parts.push(`总文件数: ${files.length}`);
  parts.push("");
  parts.push("## 文件列表");
  for (const file of files) {
    parts.push(file);
  }
  parts.push("");

  for (const file of files) {
    const content = safeReadFile(file);
    parts.push("=".repeat(80));
    parts.push(file);
    parts.push("=".repeat(80));
    if (content === null) {
      parts.push("[跳过: 可能为二进制文件]");
    } else {
      parts.push(content.replace(/\r\n/g, "\n"));
    }
    parts.push("");
  }

  writeFileSync(outputPath, parts.join("\n"), "utf-8");
  console.log(`已输出 ${files.length} 个文件 -> ${outputPath}`);
}

// CLI entry: bun scripts/collect-text.ts [rootDir] [outputPath]
// Defaults to current directory and scripts/outputs/project-text-dump.txt.
function main() {
  const [rootArg, outputArg] = process.argv.slice(2);
  const rootDir = resolve(rootArg ?? ".");
  const outputPath = resolve(
    outputArg ?? join("scripts", "outputs", "project-text-dump.txt"),
  );
  writeOutput({ rootDir, outputPath });
}

main();
