import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  listUsers,
  publishAnnouncement,
  resetUserPassword,
  updateUserRole,
  updateUserStatus,
} from "../controllers/adminController";
import { listLogs } from "../controllers/logController";

/**
 * 管理员相关路由。
 */
const adminRouter = new Router({ prefix: "/api/admin" });

adminRouter.get("/users", authenticate, authorizeRoles(["ADMIN"]), listUsers);
adminRouter.patch(
  "/users/:id/role",
  authenticate,
  authorizeRoles(["ADMIN"]),
  updateUserRole,
);
adminRouter.patch(
  "/users/:id/status",
  authenticate,
  authorizeRoles(["ADMIN"]),
  updateUserStatus,
);
adminRouter.post(
  "/users/:id/reset-password",
  authenticate,
  authorizeRoles(["ADMIN"]),
  resetUserPassword,
);
adminRouter.post(
  "/announcements",
  authenticate,
  authorizeRoles(["ADMIN"]),
  publishAnnouncement,
);
adminRouter.get("/logs", authenticate, authorizeRoles(["ADMIN"]), listLogs);

export default adminRouter;
