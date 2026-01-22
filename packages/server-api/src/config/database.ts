import mysql from "mysql2/promise";
import { env } from "./env";
import { ensureDatabaseSchema } from "./schema";

/**
 * 默认字符集/排序，保证所有表都能覆盖表情与多语言字符。
 */
const COLLATION = "utf8mb4_unicode_ci";
type IdentityRole = "USER" | "COUNSELOR" | "ADMIN";

/**
 * 系统启动时自动注入的身份白名单，便于演示与快速联调。
 */
const DEFAULT_IDENTITY_WHITELIST: Array<{
  code: string;
  role: IdentityRole;
  description: string;
}> = [
  { code: "202202102", role: "USER", description: "示例普通用户账号 A" },
  { code: "202202103", role: "USER", description: "示例普通用户账号 B" },
  { code: "202202104", role: "USER", description: "示例普通用户账号 C" },
  { code: "123456", role: "ADMIN", description: "示例管理员账号" },
];

interface DatabaseConfig {
  host: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
}

/**
 * 解析 `DATABASE_URL`，拆解出连接池需要的配置项。
 */
function parseDatabaseUrl(urlString: string): DatabaseConfig {
  const url = new URL(urlString);
  const database = url.pathname.replace(/^\//, "");
  if (!database) {
    throw new Error("数据库名称缺失，请在 DATABASE_URL 中指定");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    database,
  };
}

const dbConfig = parseDatabaseUrl(env.databaseUrl);

/**
 * 复用的数据库连接池，后续仓储层直接使用。
 */
export const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * 保证数据库与核心数据表存在，同时将默认白名单插入 `identity_whitelist`。
 * 该函数在应用启动时同步执行，可在空环境里直接启动服务。
 */
export async function ensureDatabase(): Promise<void> {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE ${COLLATION}`,
  );
  await connection.query(`USE \`${dbConfig.database}\``);
  await ensureDatabaseSchema(connection, dbConfig.database, COLLATION);
  await seedIdentityWhitelist(connection);

  await connection.end();
}

/**
 * 在正式监听端口前，做一次 Ping 以确认数据库可连。
 */
export async function testConnection(): Promise<void> {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

/**
 * 以 UPSERT 方式写入白名单，避免重复启动导致冲突。
 */
async function seedIdentityWhitelist(connection: mysql.Connection): Promise<void> {
  for (const item of DEFAULT_IDENTITY_WHITELIST) {
    const normalized = item.code.trim().toUpperCase();
    await connection.query(
      `INSERT INTO identity_whitelist (identity_code, default_role, description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE default_role = VALUES(default_role), description = VALUES(description), updated_at = CURRENT_TIMESTAMP`,
      [normalized, item.role, item.description],
    );
  }
}
