import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import {
  getEvidenceRecord,
  getEvidenceRecordByTarget,
} from "../controllers/evidenceController";

/**
 * 存证占位相关路由。
 */
const evidenceRouter = new Router({ prefix: "/api/evidence" });

evidenceRouter.get("/", authenticate, getEvidenceRecordByTarget);
evidenceRouter.get("/:id", authenticate, getEvidenceRecord);

export default evidenceRouter;
