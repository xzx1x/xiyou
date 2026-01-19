import Koa from "koa";
import bodyParser from "koa-bodyparser";
import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

export function createApp() {
  const app = new Koa();

  app.use(errorHandler);
  app.use(
    bodyParser({
      enableTypes: ["json"],
    }),
  );

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
