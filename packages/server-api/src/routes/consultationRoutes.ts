import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  createConsultationRecord,
  getConsultationRecord,
  listConsultationRecords,
  updateConsultationRecord,
} from "../controllers/consultationController";

/**
 * 咨询记录相关路由。
 */
const consultationRouter = new Router({ prefix: "/api/consultations" });

consultationRouter.post(
  "/",
  authenticate,
  authorizeRoles(["COUNSELOR"]),
  createConsultationRecord,
);
consultationRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(["COUNSELOR"]),
  updateConsultationRecord,
);
consultationRouter.get("/", authenticate, listConsultationRecords);
consultationRouter.get("/:id", authenticate, getConsultationRecord);

export default consultationRouter;
