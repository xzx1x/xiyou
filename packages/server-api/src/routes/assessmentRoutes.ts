import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import {
  confirmAssessmentResult,
  listAssessmentHistory,
  listAssessmentTemplates,
  prepareAssessmentEvidenceRecord,
  prepareAssessmentResult,
  syncAssessmentEvidenceRecord,
  submitAssessmentResult,
} from "../controllers/assessmentController";

const assessmentRouter = new Router({ prefix: "/api/assessments" });

assessmentRouter.get("/templates", authenticate, listAssessmentTemplates);
assessmentRouter.post("/prepare", authenticate, prepareAssessmentResult);
assessmentRouter.post("/confirm", authenticate, confirmAssessmentResult);
assessmentRouter.post("/:id/evidence/prepare", authenticate, prepareAssessmentEvidenceRecord);
assessmentRouter.post("/:id/evidence/sync", authenticate, syncAssessmentEvidenceRecord);
assessmentRouter.post("/", authenticate, submitAssessmentResult);
assessmentRouter.get("/", authenticate, listAssessmentHistory);

export default assessmentRouter;
