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

export const GetOffsiteTasksQuerySchema = t.Object({
  page: t.Optional(
    t.Numeric({ default: 1, description: "หน้าที่ต้องการ (เริ่มต้น 1)" })
  ),
  limit: t.Optional(
    t.Numeric({ default: 10, description: "จำนวนรายการต่อหน้า" })
  ),
  sortBy: t.Optional(
    t.Union([t.Literal("workDate"), t.Literal("createdAt")], {
      default: "workDate",
      description: "ฟิลด์ที่ต้องการจัดเรียง: workDate หรือ createdAt",
    })
  ),
  sortOrder: t.Optional(
    t.Union([t.Literal("asc"), t.Literal("desc")], {
      default: "desc",
      description: "ลำดับการจัดเรียง: asc (เก่าไปใหม่), desc (ใหม่ไปเก่า)",
    })
  ),
  targetMentorId: t.Optional(
    t.String({
      description:
        "ระบุ User ID ของพี่เลี้ยงในแผนกเดียวกันที่ต้องการดู (ถ้าไม่ระบุ ระบบจะดึงเฉพาะข้อมูลของคุณเอง)",
    })
  ),
  month: t.Optional(
    t.Numeric({
      description: "เดือนที่ต้องการค้นหา (1-12)",
    })
  ),
  year: t.Optional(
    t.Numeric({
      description: "ปี ค.ศ. ที่ต้องการค้นหา",
    })
  ),
});

export type GetOffsiteTasksQueryDto = typeof GetOffsiteTasksQuerySchema.static;
