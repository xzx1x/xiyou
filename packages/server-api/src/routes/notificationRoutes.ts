import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import {
  listNotifications,
  readAllNotifications,
  readNotification,
} from "../controllers/notificationController";

const notificationRouter = new Router({ prefix: "/api/notifications" });

notificationRouter.get("/", authenticate, listNotifications);
notificationRouter.patch("/:id/read", authenticate, readNotification);
notificationRouter.patch("/read-all", authenticate, readAllNotifications);

export default notificationRouter;
