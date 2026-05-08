import { Elysia, t } from "elysia";
import { isAuthenticated, ROLE_IDS } from "@/middlewares/auth.middleware";
import * as checkSchema from "./model";
import { CheckTimeService } from "./service";

const checkTimeService = new CheckTimeService();

export const checkTime = new Elysia({
  prefix: "/check-time",
  tags: ["Check-time(บันทึกเวลาทำงาน)"],
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
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 10;
      const filterStatus = query.filterStatus as
        | "PRESENT"
        | "LATE"
        | "LEAVE"
        | "ABSENT"
        | "MISSING_OUT"
        | undefined;
      return await checkTimeService.history(
        user.id,
        year,
        month,
        page,
        limit,
        filterStatus
      );
    },
    {
      role: [ROLE_IDS.STUDENT],
      query: checkSchema.QueryHistorySchema,
      detail: {
        summary: "ประวัติการลงเวลา",
        description:
          "ดึงข้อมูลสรุปการลงเวลาและรายการรายวันตามเดือนที่ระบุ (รองรับ Pagination) เพื่อแสดงในหน้าประวัติ",
      },
    }
  )
  .put(
    "/edit",
    async ({ body, set, user }) => {
      const result = await checkTimeService.edit(user.id, body);
      set.status = 200;
      return result;
    },
    {
      role: [ROLE_IDS.STUDENT],
      body: checkSchema.EditCheckTimeSchema,
      detail: {
        summary: "แก้ไขเวลาลงงาน",
        description:
          "อนุญาตให้นักศึกษาสามารถแก้ไขเวลาลงงานได้ภายใน 24 ชั่วโมงหลังจากบันทึกเวลา โดยต้องระบุเหตุผลในการแก้ไข",
      },
    }
  )
  .get(
    "/edit/:id",
    async ({ params, user, set }) => {
      const result = await checkTimeService.getCorrectionDetail(
        user.id,
        params.id
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: t.Object({
        id: t.Numeric({
          description: "ID ของคำขอแก้ไขเวลา (timeCorrectionRequests.id)",
        }),
      }),
      detail: {
        summary: "ดูรายละเอียดคำขอแก้ไขเวลา",
        description:
          "ดึงข้อมูลคำขอแก้ไขเวลาเพื่อแสดงผลเปรียบเทียบเวลาเก่าและเวลาใหม่ รวมถึงสถานะและเหตุผล",
      },
    }
  )
  .get(
    "/file",
    async ({ query, set }) => {
      const fileData = await checkTimeService.getFile(query.key);

      set.headers["Content-Type"] = fileData.contentType;

      return fileData.buffer;
    },
    {
      auth: true,
      query: t.Object({
        key: t.String({
          description:
            "Path ของไฟล์ใน MinIO (S3 Key) เช่น time-corrections/1715423891-abc.pdf",
        }),
      }),
      detail: {
        summary: "ดึงไฟล์หลักฐาน",
        description: "ดึงไฟล์ที่อัปโหลดไว้ใน MinIO เพื่อนำมาแสดงผลหรือดาวน์โหลด",
      },
    }
  )
  .get(
    "/mentor/corrections",
    async ({ query, set, user }) => {
      const response = await checkTimeService.getMentorCorrections(
        user.id,
        query
      );
      set.status = 200;
      return response;
    },
    {
      role: [ROLE_IDS.MENTOR, ROLE_IDS.ADMIN],
      query: checkSchema.GetMentorCorrectionsQuery,
      detail: {
        summary: "รายการคำขอแก้ไขเวลา (Mentor)",
        description:
          "ดึงรายการคำขอแก้ไขเวลาของนักศึกษา รองรับการกรองตามสถานะ (PENDING) และดูเฉพาะคนในแผนก (MINE)",
      },
    }
  )
  .get(
    "/mentor/corrections/:id/audit",
    async ({ params, set, user }) => {
      const response = await checkTimeService.getMentorCorrectionAuditView(
        user.id,
        params.id
      );
      set.status = 200;
      return response;
    },
    {
      role: [ROLE_IDS.MENTOR, ROLE_IDS.ADMIN],
      params: t.Object({ id: t.Numeric() }),
      detail: {
        summary: "ดูประวัติคำขอแก้ไขเวลาของนักศึกษา (Mentor)",
        description: "ดึง Timeline ประวัติคำขอแก้ไขเวลาทั้งหมดของรายการลงเวลานี้",
      },
    }
  )
  .post(
    "/mentor/corrections/:id/approve",
    async ({ params, set, user }) => {
      const response = await checkTimeService.approveCorrection(
        user.id,
        params.id
      );
      set.status = 200;
      return response;
    },
    {
      role: [ROLE_IDS.MENTOR, ROLE_IDS.ADMIN],
      params: t.Object({ id: t.Numeric() }),
      detail: {
        summary: "อนุมัติแก้ไขเวลา",
        description: "พี่เลี้ยงกดยืนยันอนุมัติคำขอแก้ไขเวลา ระบบจะอัปเดตเวลาลงงานให้ใหม่",
      },
    }
  )
  .post(
    "/mentor/corrections/:id/reject",
    async ({ params, body, set, user }) => {
      const response = await checkTimeService.rejectCorrection(
        user.id,
        params.id,
        body.reason
      );
      set.status = 200;
      return response;
    },
    {
      role: [ROLE_IDS.MENTOR, ROLE_IDS.ADMIN],
      params: t.Object({ id: t.Numeric() }),
      body: checkSchema.RejectCorrectionBody,
      detail: {
        summary: "ไม่อนุมัติแก้ไขเวลา",
        description: "พี่เลี้ยงกดปฏิเสธคำขอแก้ไขเวลา พร้อมระบุเหตุผลที่ไม่อนุมัติ",
      },
    }
  );
