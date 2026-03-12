import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import { CheckTimeService } from "./service";
import * as checkShcema from "./model"
const checkTimeService = new CheckTimeService();

export const checkTime = new Elysia({
  prefix: "/check-time",
  tags: ["check-time"],
})
  .use(isAuthenticated)
  .post(
    "/in",
    async ({ set, headers, user, body }) => {
      const userId = user.id;
      const ipAddress =
        headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";
      const result = checkTimeService.in(userId, ipAddress, body);

      set.status = 201;
      return result;
    },
    {
      role: [1],
      body: checkShcema.CheckTimeSchema,
      detail: {
        summary: "บันทึกเวลาเข้างาน (Check-in)",
        description: "รับพิกัด Latitude, Longitude เพื่อบันทึกเวลาเข้างาน",
      }
    }
  )

