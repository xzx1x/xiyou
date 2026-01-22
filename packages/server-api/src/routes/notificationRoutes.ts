import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { listNotifications, readNotification } from "../controllers/notificationController";

const notificationRouter = new Router({ prefix: "/api/notifications" });

notificationRouter.get("/", authenticate, listNotifications);
notificationRouter.patch("/:id/read", authenticate, readNotification);

export default notificationRouter;
