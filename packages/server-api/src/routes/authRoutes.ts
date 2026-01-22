import Router from "@koa/router";
import {
  confirmResetPassword,
  login,
  register,
  requestResetPassword,
} from "../controllers/authController";

const authRouter = new Router({ prefix: "/api/auth" });

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/password/reset/request", requestResetPassword);
authRouter.post("/password/reset/confirm", confirmResetPassword);

export default authRouter;
