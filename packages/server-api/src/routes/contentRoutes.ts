import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  createContentItem,
  getContentItemDetail,
  listContentItems,
  patchContentItem,
} from "../controllers/contentController";

/**
 * 内容资源相关路由。
 */
const contentRouter = new Router({ prefix: "/api/content" });

contentRouter.get("/", authenticate, listContentItems);
contentRouter.get("/:id", authenticate, getContentItemDetail);
contentRouter.post(
  "/",
  authenticate,
  authorizeRoles(["ADMIN"]),
  createContentItem,
);
contentRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles(["ADMIN"]),
  patchContentItem,
);

export default contentRouter;
