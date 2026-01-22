import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  getAdminStatistics,
  getCounselorStatistics,
} from "../controllers/statisticsController";

/**
 * 数据统计相关路由。
 */
const statisticsRouter = new Router({ prefix: "/api/stats" });

statisticsRouter.get(
  "/counselor",
  authenticate,
  authorizeRoles(["COUNSELOR"]),
  getCounselorStatistics,
);
statisticsRouter.get(
  "/admin",
  authenticate,
  authorizeRoles(["ADMIN"]),
  getAdminStatistics,
);

export default statisticsRouter;
