import { existsSync } from "fs";
import { resolve } from "path";

type Args = {
  input?: string;
  output?: string;
  from?: string;
  to?: string;
  reference?: string;
  extra: string[];
};

function parseArgs(argv: string[]): Args {
  const parsed: Args = { extra: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i] ?? "";
    if (!current.startsWith("--")) {
      continue;
    }
    const [flag, inlineValue] = current.split("=");
    const value =
      inlineValue !== undefined ? inlineValue : argv[i + 1]?.startsWith("--") ? "" : argv[i + 1];
    if (inlineValue === undefined && value && value === argv[i + 1]) {
      i += 1;
    }
    switch (flag) {
      case "--input":
        parsed.input = value;
        break;
      case "--output":
        parsed.output = value;
        break;
      case "--from":
        parsed.from = value;
        break;
      case "--to":
        parsed.to = value;
        break;
      case "--reference":
        parsed.reference = value;
        break;
      case "--extra":
        if (value) {
          parsed.extra.push(value);
        }
        break;
      default:
        break;
    }
  }
  return parsed;
}

function ensure(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`Missing required argument: ${label}`);
  }
  return value;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = resolve(ensure(args.input, "--input"));
  const output = resolve(ensure(args.output, "--output"));
  const from = ensure(args.from, "--from");
  const to = ensure(args.to, "--to");

  if (!existsSync(input)) {
    throw new Error(`Input file not found: ${input}`);
  }

  const cmdArgs = ["--from", from, "--to", to, input, "-o", output];
  if (args.reference) {
    cmdArgs.push(`--reference-doc=${resolve(args.reference)}`);
  }
  if (args.extra.length > 0) {
    cmdArgs.push(...args.extra);
  }

  const proc = Bun.spawnSync({
    cmd: ["pandoc", ...cmdArgs],
    stdout: "inherit",
    stderr: "inherit",
  });
  if (proc.exitCode !== 0) {
    process.exit(proc.exitCode ?? 1);
  }
}

main();
