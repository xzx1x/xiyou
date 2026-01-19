import { createApp } from "./app";
import { env } from "./config/env";
import { ensureDatabase, testConnection } from "./config/database";

async function bootstrap() {
  try {
    await ensureDatabase();
    await testConnection();
    const app = createApp();
    app.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("服务启动失败:", error);
    process.exit(1);
  }
}

bootstrap();
