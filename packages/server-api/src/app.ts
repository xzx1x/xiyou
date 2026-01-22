import Koa from "koa";
import bodyParser from "koa-bodyparser";
import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";

/**
 * 创建并配置 Koa 应用实例，统一装配中间件与路由。
 */
export function createApp() {
  // 应用主实例，负责承载中间件与路由配置。
  const app = new Koa();

  app.use(errorHandler);
  app.use(requestLogger);
  // CORS 允许来源，默认用于本地前端开发。
  const allowOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  // 允许的 HTTP 方法，用于处理浏览器预检请求。
  const allowMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
  // 允许的请求头，覆盖 JSON 请求与鉴权头。
  const allowHeaders = "Content-Type, Authorization";

  /**
   * 注入跨域响应头，并处理预检请求，避免浏览器拦截前端调用。
   */
  app.use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", allowOrigin);
    ctx.set("Access-Control-Allow-Methods", allowMethods);
    ctx.set("Access-Control-Allow-Headers", allowHeaders);

    if (ctx.method === "OPTIONS") {
      ctx.status = 204;
      return;
    }

    await next();
  });
  app.use(
    bodyParser({
      // 仅允许 JSON 解析，避免误处理 multipart；头像上传走 Base64 JSON。
      enableTypes: ["json"],
      // 放宽 JSON 体积上限，兼容头像 Base64 上传。
      jsonLimit: "3mb",
    }),
  );

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
