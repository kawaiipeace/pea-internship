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

export type CheckTimeDto = Static<typeof CheckTimeSchema>;
