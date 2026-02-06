import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import {
  getAccountProfile,
  requestAccountPasswordVerification,
  patchAccountPassword,
  patchAccountProfile,
  uploadAccountAvatar,
} from "../controllers/accountController";

/**
 * 账户资料相关路由，全部通过 JWT 认证后才能访问。
 */
const accountRouter = new Router({ prefix: "/api/account" });

accountRouter.get("/profile", authenticate, getAccountProfile);
accountRouter.patch("/profile", authenticate, patchAccountProfile);
accountRouter.post("/password/verification", authenticate, requestAccountPasswordVerification);
accountRouter.patch("/password", authenticate, patchAccountPassword);
accountRouter.post("/avatar", authenticate, uploadAccountAvatar);

export default accountRouter;
