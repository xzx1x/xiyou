import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import {
  createChatThread,
  listChatMessages,
  listChatThreads,
  markChatThreadRead,
  sendChatMessage,
} from "../controllers/chatController";

/**
 * 聊天相关路由。
 */
const chatRouter = new Router({ prefix: "/api/chat" });

chatRouter.get("/threads", authenticate, listChatThreads);
chatRouter.post("/threads", authenticate, createChatThread);
chatRouter.get("/threads/:id/messages", authenticate, listChatMessages);
chatRouter.post("/threads/:id/messages", authenticate, sendChatMessage);
chatRouter.post("/threads/:id/read", authenticate, markChatThreadRead);

export default chatRouter;
