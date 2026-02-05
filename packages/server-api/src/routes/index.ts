import Router from "@koa/router";
import accountRouter from "./accountRoutes";
import adminRouter from "./adminRoutes";
import appointmentRouter from "./appointmentRoutes";
import assessmentRouter from "./assessmentRoutes";
import authRouter from "./authRoutes";
import chatRouter from "./chatRoutes";
import consultationRouter from "./consultationRoutes";
import counselorRouter from "./counselorRoutes";
import evidenceRouter from "./evidenceRoutes";
import feedbackRouter from "./feedbackRoutes";
import forumRouter from "./forumRoutes";
import friendRouter from "./friendRoutes";
import notificationRouter from "./notificationRoutes";
import reportRouter from "./reportRoutes";
import statisticsRouter from "./statisticsRoutes";
import staticRouter from "./staticRoutes";

const router = new Router();

router.use(authRouter.routes(), authRouter.allowedMethods());
router.use(accountRouter.routes(), accountRouter.allowedMethods());
router.use(counselorRouter.routes(), counselorRouter.allowedMethods());
router.use(appointmentRouter.routes(), appointmentRouter.allowedMethods());
router.use(consultationRouter.routes(), consultationRouter.allowedMethods());
router.use(assessmentRouter.routes(), assessmentRouter.allowedMethods());
router.use(feedbackRouter.routes(), feedbackRouter.allowedMethods());
router.use(chatRouter.routes(), chatRouter.allowedMethods());
router.use(friendRouter.routes(), friendRouter.allowedMethods());
router.use(forumRouter.routes(), forumRouter.allowedMethods());
router.use(reportRouter.routes(), reportRouter.allowedMethods());
router.use(statisticsRouter.routes(), statisticsRouter.allowedMethods());
router.use(evidenceRouter.routes(), evidenceRouter.allowedMethods());
router.use(adminRouter.routes(), adminRouter.allowedMethods());
router.use(notificationRouter.routes(), notificationRouter.allowedMethods());
router.use(staticRouter.routes(), staticRouter.allowedMethods());

export default router;
