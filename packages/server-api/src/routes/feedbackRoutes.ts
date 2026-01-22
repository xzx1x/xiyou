import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import { createFeedback, listFeedback } from "../controllers/feedbackController";

/**
 * 咨询反馈相关路由。
 */
const feedbackRouter = new Router({ prefix: "/api/feedback" });

feedbackRouter.post("/", authenticate, authorizeRoles(["USER"]), createFeedback);
feedbackRouter.get("/", authenticate, listFeedback);

export default feedbackRouter;
