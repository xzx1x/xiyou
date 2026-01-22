import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  cancelCounselorSchedule,
  createCounselorSchedule,
  getCounselorProfileDetail,
  getMyApplication,
  listAvailableCounselorSchedules,
  listCounselorApplications,
  listCounselorSchedules,
  listCounselors,
  patchCounselorProfile,
  reviewCounselorApplicationRecord,
  submitCounselorApplication,
} from "../controllers/counselorController";

/**
 * 心理师与档期相关路由。
 */
const counselorRouter = new Router({ prefix: "/api/counselors" });

counselorRouter.post(
  "/apply",
  authenticate,
  authorizeRoles(["USER"]),
  submitCounselorApplication,
);
counselorRouter.get("/apply", authenticate, getMyApplication);

counselorRouter.get("/schedules", authenticate, authorizeRoles(["COUNSELOR"]), listCounselorSchedules);
counselorRouter.post("/schedules", authenticate, authorizeRoles(["COUNSELOR"]), createCounselorSchedule);
counselorRouter.patch(
  "/schedules/:id/cancel",
  authenticate,
  authorizeRoles(["COUNSELOR"]),
  cancelCounselorSchedule,
);
counselorRouter.patch(
  "/profile",
  authenticate,
  authorizeRoles(["COUNSELOR"]),
  patchCounselorProfile,
);

counselorRouter.get(
  "/applications",
  authenticate,
  authorizeRoles(["ADMIN"]),
  listCounselorApplications,
);
counselorRouter.post(
  "/applications/:id/review",
  authenticate,
  authorizeRoles(["ADMIN"]),
  reviewCounselorApplicationRecord,
);

counselorRouter.get("/", listCounselors);
counselorRouter.get("/:id/schedules", listAvailableCounselorSchedules);
counselorRouter.get("/:id", getCounselorProfileDetail);

export default counselorRouter;
