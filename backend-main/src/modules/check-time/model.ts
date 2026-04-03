import { type Static, t } from "elysia";

export const CheckTimeSchema = t.Object({
  latitude: t.Optional(
    t.Numeric({
      error: "Latitude ต้องเป็นตัวเลขเท่านั้น",
      description: "ละติจูด (Latitude) ของตำแหน่งปัจจุบัน",
    })
  ),
  longitude: t.Optional(
    t.Numeric({
      error: "Longitude ต้องเป็นตัวเลขเท่านั้น",
      description: "ลองจิจูด (Longitude) ของตำแหน่งปัจจุบัน",
    })
  ),
  location_note: t.Optional(
    t.String({
      description: "หมายเหตุสถานที่ เช่น ทำงานที่บ้าน, กฟภ. สำนักงานใหญ่",
    })
  ),
});

export const QueryHistorySchema = t.Object({
  year: t.Optional(t.String()),
  month: t.Optional(t.String()),
  page: t.Optional(t.String({ description: "หน้าที่ต้องการแสดง (ค่าเริ่มต้น: 1)" })),
  limit: t.Optional(
    t.String({ description: "จำนวนรายการต่อหน้า (ค่าเริ่มต้น: 10)" })
  ),
});

export type CheckTimeDto = Static<typeof CheckTimeSchema>;

export const EditCheckTimeSchema = t.Object({
  attendanceLogId: t.Number({
    error: "ต้องระบุ ID ของรายการลงเวลา",
    description: "ID ของ attendanceLogs ที่ต้องการแก้ไข",
  }),
  checkInTime: t.String({
    error: "เวลาเข้างานไม่ถูกต้อง",
    description: "เวลาเข้างานใหม่ รูปแบบ HH:mm เช่น 08:30",
  }),
  checkOutTime: t.String({
    error: "เวลาออกงานไม่ถูกต้อง",
    description: "เวลาออกงานใหม่ รูปแบบ HH:mm เช่น 16:30",
  }),
  reason: t.String({
    error: "กรุณาระบุเหตุผลในการแก้ไข",
    description: "เหตุผลการแก้ไขเวลา เช่น ลืมกดลงเวลาออก",
  }),
  attachmentUrl: t.Optional(
    t.String({
      description: "URL ของไฟล์แนบ (ถ้ามีการอัปโหลดเข้า Storage แล้ว)",
    })
  ),
});

export type EditCheckTimeDto = Static<typeof EditCheckTimeSchema>;
