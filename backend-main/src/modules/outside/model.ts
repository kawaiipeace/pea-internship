import { t } from "elysia";

export const CreateOffsiteTaskSchema = t.Object({
  workDate: t.String({
    description: "วันที่ไปปฏิบัติงาน รูปแบบ YYYY-MM-DD",
  }),
  locationName: t.String({
    description: "ชื่อสถานที่ เช่น การไฟฟ้าส่วนภูมิภาค สำนักงานใหญ่",
  }),
  taskDetail: t.String({
    description: "รายละเอียดงาน",
  }),
  note: t.Optional(
    t.String({
      description: "หมายเหตุเพิ่มเติม (ถ้ามี)",
    })
  ),
  studentIds: t.Array(t.String(), {
    description: "อาร์เรย์ของรหัสนักศึกษา (User ID) ที่ต้องไปทำงานนี้",
    minItems: 1,
  }),
});

export type CreateOffsiteTaskDto = typeof CreateOffsiteTaskSchema.static;

export const UpdateOffsiteTaskSchema = t.Partial(CreateOffsiteTaskSchema);

export type UpdateOffsiteTaskDto = typeof UpdateOffsiteTaskSchema.static;
