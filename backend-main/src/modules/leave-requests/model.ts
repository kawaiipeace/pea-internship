import { t } from "elysia";

export const SubmitLeaveBody = t.Object({
  startDate: t.String({
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description: "วันที่เริ่มต้นการลา (YYYY-MM-DD)",
  }),
  endDate: t.String({
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description: "วันที่สิ้นสุดการลา (YYYY-MM-DD)",
  }),
  leaveType: t.Union([t.Literal("ABSENCE"), t.Literal("SICK")], {
    description: "ประเภทการลา (ABSENCE = ลากิจ, SICK = ลาป่วย)",
  }),
  reason: t.String({ minLength: 1, description: "เหตุผลการลา" }),
  attachment: t.Optional(t.File({ description: "ไฟล์แนบหลักฐานการลา (ถ้ามี)" })),
});

export const params = t.Object({
  id: t.Numeric(),
});

export type SubmitLeaveBodyType = typeof SubmitLeaveBody.static;

export const GetLeaveHistoryQuery = t.Object({
  page: t.Optional(t.Numeric({ default: 1 })),
  limit: t.Optional(t.Numeric({ default: 10 })),
  year: t.Optional(t.Numeric()),
  month: t.Optional(t.Numeric()),
  type: t.Optional(t.Union([t.Literal("ABSENCE"), t.Literal("SICK")])),
});

export type GetLeaveHistoryQueryType = typeof GetLeaveHistoryQuery.static;

export const GetMentorLeaveRequestsQuery = t.Object({
  page: t.Optional(t.Numeric({ default: 1 })),
  limit: t.Optional(t.Numeric({ default: 10 })),
  status: t.Optional(
    t.Union(
      [t.Literal("PENDING"), t.Literal("APPROVED"), t.Literal("REJECTED")],
      {
        description: "กรองตามสถานะ (เช่น ส่ง PENDING เพื่อดูเฉพาะคนที่รออนุมัติ)",
      }
    )
  ),
  viewType: t.Optional(
    t.Union([t.Literal("MINE"), t.Literal("ALL")], {
      default: "MINE",
      description: "ดูเฉพาะเด็กในแผนก (MINE) หรือ ทั้งหมด (ALL)",
    })
  ),
});

export const RejectLeaveBody = t.Object({
  reason: t.String({ description: "เหตุผลที่ไม่อนุมัติ" }),
});

export type GetMentorLeaveRequestsQueryType =
  typeof GetMentorLeaveRequestsQuery.static;
export type RejectLeaveBodyType = typeof RejectLeaveBody.static;
