import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import {
  listAssessmentHistory,
  listAssessmentTemplates,
  submitAssessmentResult,
} from "../controllers/assessmentController";

/**
 * 心理测评相关路由。
 */
const assessmentRouter = new Router({ prefix: "/api/assessments" });

assessmentRouter.get("/templates", authenticate, listAssessmentTemplates);
assessmentRouter.post("/", authenticate, submitAssessmentResult);
assessmentRouter.get("/", authenticate, listAssessmentHistory);

export default assessmentRouter;
