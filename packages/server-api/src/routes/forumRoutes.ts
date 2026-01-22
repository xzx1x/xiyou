import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  createForumComment,
  createForumPost,
  getForumPostDetail,
  likeForumPost,
  listForumComments,
  listForumPosts,
  reviewForumPost,
  unlikeForumPost,
} from "../controllers/forumController";

/**
 * 论坛相关路由。
 */
const forumRouter = new Router({ prefix: "/api/forum" });

forumRouter.get("/posts", authenticate, listForumPosts);
forumRouter.get("/posts/:id", authenticate, getForumPostDetail);
forumRouter.get("/posts/:id/comments", authenticate, listForumComments);

forumRouter.post("/posts", authenticate, createForumPost);
forumRouter.post(
  "/posts/:id/review",
  authenticate,
  authorizeRoles(["ADMIN"]),
  reviewForumPost,
);
forumRouter.post("/comments", authenticate, createForumComment);
forumRouter.post("/posts/:id/like", authenticate, likeForumPost);
forumRouter.post("/posts/:id/unlike", authenticate, unlikeForumPost);

export default forumRouter;
