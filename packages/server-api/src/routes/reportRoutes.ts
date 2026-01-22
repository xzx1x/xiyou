import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  createReportRecord,
  listReportRecords,
  resolveReportRecord,
} from "../controllers/reportController";

/**
 * 举报相关路由。
 */
const reportRouter = new Router({ prefix: "/api/reports" });

reportRouter.post("/", authenticate, createReportRecord);
reportRouter.get("/", authenticate, authorizeRoles(["ADMIN"]), listReportRecords);
reportRouter.post(
  "/:id/resolve",
  authenticate,
  authorizeRoles(["ADMIN"]),
  resolveReportRecord,
);

export default reportRouter;
