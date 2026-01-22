import Router from "@koa/router";
import { authenticate } from "../middlewares/authenticate";
import { authorizeRoles } from "../middlewares/authorize";
import {
  cancelAppointmentRecord,
  completeAppointmentRecord,
  createAppointment,
  getAppointmentRecord,
  listAppointmentRecords,
  updateAppointmentCounselorNote,
} from "../controllers/appointmentController";

/**
 * 预约相关路由。
 */
const appointmentRouter = new Router({ prefix: "/api/appointments" });

appointmentRouter.post("/", authenticate, authorizeRoles(["USER"]), createAppointment);
appointmentRouter.get("/", authenticate, listAppointmentRecords);
appointmentRouter.get("/:id", authenticate, getAppointmentRecord);
appointmentRouter.post(
  "/:id/cancel",
  authenticate,
  authorizeRoles(["USER", "COUNSELOR", "ADMIN"]),
  cancelAppointmentRecord,
);
appointmentRouter.patch(
  "/:id/note",
  authenticate,
  authorizeRoles(["COUNSELOR"]),
  updateAppointmentCounselorNote,
);
appointmentRouter.post(
  "/:id/complete",
  authenticate,
  authorizeRoles(["COUNSELOR"]),
  completeAppointmentRecord,
);

export default appointmentRouter;
