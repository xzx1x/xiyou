import Router from "@koa/router";
import { login, register } from "../controllers/authController";

const authRouter = new Router({ prefix: "/api/auth" });

authRouter.post("/register", register);
authRouter.post("/login", login);

export default authRouter;
