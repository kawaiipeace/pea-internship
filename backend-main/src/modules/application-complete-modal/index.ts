import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import * as model from "./model";
import { ApplicationCompleteModalService } from "./service";

const service = new ApplicationCompleteModalService();

export const applicationCompleteModal = new Elysia({
  prefix: "/student/application-complete-modal",
  tags: ["Applications"],
})
  .use(isAuthenticated)
  .get(
    "/",
    async ({ session, set }) => {
      const res = await service.getModalStatus(session.userId);
      set.status = 200;
      return res;
    },
    {
      role: [3],
      response: model.ApplicationCompleteModalResponse,
      detail: {
        summary: "ตรวจสอบ Acknowledge ของ student",
        description: "ใช้สำหรับเช็คว่า student ต้องเห็น modal รับทราบการจบฝึกงานหรือไม่",
      },
    }
  )
  .post(
    "/acknowledge",
    async ({ session, set }) => {
      const res = await service.acknowledgeModal(session.userId);
      set.status = 200;
      return res;
    },
    {
      role: [3],
      response: model.AcknowledgeApplicationCompleteModalResponse,
      detail: {
        summary: "บันทึกการ Acknowledge ของ student",
        description:
          "ใช้สำหรับบันทึกว่า student กดรับทราบ modal แล้ว เพื่อไม่ให้ modal นี้แสดงอีก",
      },
    }
  );
