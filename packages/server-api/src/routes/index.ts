import Router from "@koa/router";
import authRouter from "./authRoutes";

const router = new Router();

router.use(authRouter.routes(), authRouter.allowedMethods());

export default router;
