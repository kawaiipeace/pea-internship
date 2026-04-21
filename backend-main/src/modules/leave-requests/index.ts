// backend/src/leave/index.ts
import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import * as model from "./model";
import { LeaveService } from "./service";

const leaveService = new LeaveService();

export const leave = new Elysia({
  prefix: "/leave",
  tags: ["Leave Requests"],
})
  .use(isAuthenticated)
  .post(
    "/",
    async ({ body, set, user }) => {
      const response = await leaveService.submitLeaveRequest(user.id, body);

      set.status = 201;
      return response;
    },
    {
      role: [3],
      body: model.SubmitLeaveBody,
      detail: {
        summary: "ส่งคำขอลา (Submit Leave Request)",
        description:
          "ส่งคำขอลาพักของนักศึกษา รองรับการส่งไฟล์แนบ (multipart/form-data)",
      },
    }
  )

  .post(
    "/:id/approve",
    async ({ params: { id }, set, user }) => {
      const response = await leaveService.approveLeaveRequest(user.id, id);

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      params: model.params,
      detail: {
        summary: "อนุมัติคำขอลา (Approve Leave Request)",
        description: "ยืนยันการอนุมัติคำขอลา และแจกเวลาทำงานให้ 7 ชั่วโมงอัตโนมัติ",
      },
    }
  )

  .post(
    "/bulk-approve",
    async ({ body, set, user }) => {
      const response = await leaveService.bulkApproveLeaveRequests(
        user.id,
        body.ids
      );

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      body: model.BulkApproveBody,
      detail: {
        summary: "อนุมัติคำขอลาแบบกลุ่ม (Bulk Approve Leave Requests)",
        description: "อนุมัติรายการลาของนักศึกษาหลายรายการพร้อมกัน",
      },
    }
  )

  .delete(
    "/:id",
    async ({ params: { id }, set, user }) => {
      const response = await leaveService.deleteLeaveRequest(user.id, id);

      set.status = 200;
      return response;
    },
    {
      role: [3],
      params: model.params,
      detail: {
        summary: "ยกเลิกคำขอลา (Cancel/Delete Leave Request)",
        description:
          "ลบรายการลาที่ส่งไปแล้ว (ลบได้เฉพาะสถานะ PENDING และต้องเป็นเจ้าของเท่านั้น)",
      },
    }
  )
  .post(
    "/bulk-delete",
    async ({ body, set, user }) => {
      const response = await leaveService.bulkDeleteLeaveRequests(
        user.id,
        body.ids
      );

      set.status = 200;
      return response;
    },
    {
      role: [3],
      body: model.BulkDeleteBody,
      detail: {
        summary: "ยกเลิกคำขอลาเแบบกลุ่ม (Bulk Cancel Leave Requests)",
        description: "ลบกลุ่มรายการลาที่ส่งไปแล้ว",
      },
    }
  )

  .get(
    "/history",
    async ({ query, set, user }) => {
      const response = await leaveService.getLeaveHistory(user.id, query);

      set.status = 200;
      return response;
    },
    {
      role: [3],
      query: model.GetLeaveHistoryQuery,
      detail: {
        summary: "ประวัติการลา (Leave History)",
        description:
          "ดึงประวัติการลาของนักศึกษาประจำเดือน พร้อมข้อมูลสรุป (Summary) และการแบ่งหน้า (Pagination)",
      },
    }
  )

  .post(
    "/:id/reject",
    async ({ params: { id }, body, set, user }) => {
      const response = await leaveService.rejectLeaveRequest(
        user.id,
        id,
        body.reason
      );

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      params: model.params,
      body: model.RejectLeaveBody,
      detail: {
        summary: "ไม่อนุมัติคำขอลา (Reject Leave Request)",
        description: "ปฏิเสธคำขอลา พร้อมระบุเหตุผล",
      },
    }
  )

  .post(
    "/bulk-reject",
    async ({ body, set, user }) => {
      const response = await leaveService.bulkRejectLeaveRequests(
        user.id,
        body.ids,
        body.reason
      );

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      body: model.BulkRejectBody,
      detail: {
        summary: "ไม่อนุมัติคำขอลาแบบกลุ่ม (Bulk Reject Leave Requests)",
        description: "ไม่อนุมัติรายการลาของนักศึกษาหลายรายการพร้อมกัน",
      },
    }
  )

  .get(
    "/mentor/requests",
    async ({ query, set, user }) => {
      const response = await leaveService.getMentorLeaveRequests(
        user.id,
        query
      );

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      query: model.GetMentorLeaveRequestsQuery,
      detail: {
        summary: "รายการคำขอลาสำหรับ Mentor (Mentor Leave Requests)",
        description:
          "ดึงรายการคำขอลาของนักศึกษา รองรับการกรองด้วย status (เช่น PENDING) และ viewType (MINE/ALL)",
      },
    }
  )
  .post(
    "/resubmit",
    async ({ body, set, user }) => {
      const response = await leaveService.resubmitLeaveRequests(
        user.id,
        body.ids
      );

      set.status = 200;
      return response;
    },
    {
      role: [3],
      body: model.ResubmitLeaveBody,
      detail: {
        summary: "ส่งคำขอลาซ้ำ (Resubmit Rejected Leave Request)",
        description: "เปลี่ยนสถานะจาก REJECTED กลับเป็น PENDING เพื่อส่งคำขอเดิมซ้ำ",
      },
    }
  );
