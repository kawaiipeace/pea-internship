import { Elysia } from "elysia";
import { isAuthenticated, ROLE_IDS } from "@/middlewares/auth.middleware";
import * as checkSchema from "./model";
import { CheckTimeService } from "./service";

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
      const ipHeader =
        headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";
      const ipAddress = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader;

      const result = await checkTimeService.in(userId, ipAddress, body);

      set.status = 201;
      return result;
    },
    {
      role: [ROLE_IDS.STUDENT],
      body: checkSchema.CheckTimeSchema,
      detail: {
        summary: "บันทึกเวลาเข้างาน (Check-in)",
        description:
          "รับพิกัด Latitude, Longitude เพื่อบันทึกเวลาเข้างาน และคำนวณระยะทาง",
      },
    }
  )
  .post(
    "/out",
    async ({ set, headers, user, body }) => {
      const userId = user.id;
      const ipHeader =
        headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";
      const ipAddress = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader;

      const result = await checkTimeService.out(userId, ipAddress, body);

      set.status = 201;
      return result;
    },
    {
      role: [ROLE_IDS.STUDENT],
      body: checkSchema.CheckTimeSchema,
      detail: {
        summary: "บันทึกเวลาออกงาน (Check-out)",
        description:
          "รับพิกัดเพื่อบันทึกเวลาออกงาน ตรวจสอบระยะทาง และคำนวณชั่วโมงการทำงาน",
      },
    }
  )
  .get(
    "/history",
    async ({ user, query }) => {
      const year = query.year ? parseInt(query.year, 10) : undefined;
      const month = query.month ? parseInt(query.month, 10) : undefined;

      return await checkTimeService.history(user.id, year, month);
    },
    {
      role: [ROLE_IDS.STUDENT],
      body: checkSchema.QueryDate,
      detail: {
        summary: "ประวัติการลงเวลา (รายเดือน)",
        description:
          "ดึงข้อมูลสรุปการลงเวลาและรายการรายวันตามเดือนที่ระบุ เพื่อแสดงในหน้าประวัติ",
      },
    }
  );
