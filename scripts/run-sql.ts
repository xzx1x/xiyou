import { readFile } from "fs/promises";
import { resolve } from "path";
import { createRequire } from "module";

type Args = {
  sql?: string;
  file?: string;
  databaseUrl?: string;
  env?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key) {
      continue;
    }
    if (key === "--sql") {
      args.sql = value;
      i += 1;
    } else if (key === "--file") {
      args.file = value;
      i += 1;
    } else if (key === "--database-url") {
      args.databaseUrl = value;
      i += 1;
    } else if (key === "--env") {
      args.env = value;
      i += 1;
    }
  }
  return args;
}

function parseEnvValue(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

async function loadDatabaseUrl(envPath: string) {
  const content = await readFile(envPath, "utf8").catch(() => "");
  if (!content) {
    return "";
  }
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
    if (match) {
      return parseEnvValue(match[1] ?? "");
    }
  }
  return "";
}

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const envPath = args.env ?? resolve(process.cwd(), "packages", "server-api", ".env");
  const databaseUrl =
    args.databaseUrl || process.env.DATABASE_URL || (await loadDatabaseUrl(envPath));

  if (!databaseUrl) {
    throw new Error("DATABASE_URL not found. Use --database-url or set it in .env.");
  }

  const sql = args.sql ?? (args.file ? await readFile(args.file, "utf8") : "");
  if (!sql.trim()) {
    throw new Error("SQL is empty. Use --sql or --file.");
  }

  const require = createRequire(resolve(process.cwd(), "packages", "server-api", "package.json"));
  const mysql = require("mysql2/promise") as typeof import("mysql2/promise");
  const config = parseDatabaseUrl(databaseUrl);
  const connection = await mysql.createConnection({
    ...config,
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
  } finally {
    await connection.end();
  }

  console.log(`SQL executed against ${config.host}/${config.database}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
