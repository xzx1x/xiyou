import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import {
  createFriendRequest,
  listFriendRequests,
  listFriends,
  respondFriendRequestAction,
  searchFriends,
} from "../controllers/friendController";

/**
 * 好友相关路由。
 */
const friendRouter = new Router({ prefix: "/api/friends" });

friendRouter.post("/requests", authenticate, createFriendRequest);
friendRouter.get("/requests", authenticate, listFriendRequests);
friendRouter.post("/requests/:id/respond", authenticate, respondFriendRequestAction);
friendRouter.get("/", authenticate, listFriends);
friendRouter.get("/search", authenticate, searchFriends);

export default friendRouter;
