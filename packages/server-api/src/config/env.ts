import { config } from "dotenv";

config();

const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const port = Number(process.env.PORT ?? 3001);

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置");
}

if (!jwtSecret) {
  throw new Error("JWT_SECRET 未配置");
}

export const env = {
  databaseUrl,
  jwtSecret,
  port,
};
