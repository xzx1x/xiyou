import { writeFileSync } from "fs";
import { basename, resolve } from "path";

function decodeXmlEntities(input: string) {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function extractParagraphText(xml: string) {
  const paragraphs: string[] = [];
  const paragraphRegex = /<w:p[\s\S]*?<\/w:p>/g;
  let match: RegExpExecArray | null;
  while ((match = paragraphRegex.exec(xml)) !== null) {
    const paragraphXml = match[0];
    const textParts: string[] = [];
    const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = textRegex.exec(paragraphXml)) !== null) {
      textParts.push(decodeXmlEntities(textMatch[1]));
    }
    paragraphs.push(textParts.join(""));
  }
  return paragraphs;
}

function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath) {
    console.error("用法: bun scripts/docx-extract.ts <input.docx> [output.txt]");
    process.exit(1);
  }
  const resolvedInput = resolve(inputPath);
  const output =
    outputPath ??
    resolve("scripts", "outputs", `${basename(inputPath, ".docx")}.txt`);

  const result = Bun.spawnSync(["unzip", "-p", resolvedInput, "word/document.xml"]);
  if (result.exitCode !== 0) {
    console.error("无法读取 docx 文档:", result.stderr.toString());
    process.exit(1);
  }
  const xml = new TextDecoder().decode(result.stdout);
  const paragraphs = extractParagraphText(xml);
  const lines = paragraphs.map((text, index) => `${index + 1}\t${text}`);
  writeFileSync(output, lines.join("\n"), "utf-8");
  console.log(`已输出 ${paragraphs.length} 行 -> ${output}`);
}

main();
