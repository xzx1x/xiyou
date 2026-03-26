import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  confirmConsultationEvidenceRecord,
  createConsultationRecord,
  getConsultationRecord,
  listConsultationRecords,
  prepareConsultationEvidenceRecord,
  syncConsultationEvidenceRecord,
  updateConsultationRecord,
} from "../controllers/consultationController";

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
consultationRouter.post(
  "/:id/evidence/prepare",
  authenticate,
  authorizeRoles(["COUNSELOR", "ADMIN"]),
  prepareConsultationEvidenceRecord,
);
consultationRouter.post(
  "/:id/evidence/confirm",
  authenticate,
  authorizeRoles(["COUNSELOR", "ADMIN"]),
  confirmConsultationEvidenceRecord,
);
consultationRouter.post(
  "/:id/evidence/sync",
  authenticate,
  authorizeRoles(["COUNSELOR", "ADMIN"]),
  syncConsultationEvidenceRecord,
);
consultationRouter.get("/", authenticate, listConsultationRecords);
consultationRouter.get("/:id", authenticate, getConsultationRecord);

export default consultationRouter;
