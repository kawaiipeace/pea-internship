import { Elysia, t } from "elysia";
import { isAuthenticated, ROLE_IDS } from "@/middlewares/auth.middleware";
import * as offsiteModel from "./model";
import { OffsiteTaskService } from "./service";

const offsiteTaskService = new OffsiteTaskService();

export const offsiteTasks = new Elysia({
  prefix: "/offsite-tasks",
  tags: ["Offsite-tasks(มอบหมายงานนอกสถานที่)"],
})
  .use(isAuthenticated)

  // สร้างงานนอกสถานที่ (เฉพาะ Mentor เท่านั้น)
  .post(
    "/",
    async ({ user, body, set }) => {
      const mentorId = user.id;
      const result = await offsiteTaskService.createTask(mentorId, body);

      set.status = 201;
      return result;
    },
    {
      role: [ROLE_IDS.MENTOR, ROLE_IDS.ADMIN],
      body: offsiteModel.CreateOffsiteTaskSchema,
      detail: {
        summary: "มอบหมายงานนอกสถานที่",
        description: "Mentor ทำการมอบหมายงานนอกสถานที่ให้นักศึกษา (เลือกได้หลายคน)",
      },
    }
  )
  // 2. แก้ไขงานนอกสถานที่ (เฉพาะ Mentor)
  .patch(
    "/:id",
    async ({ params, body, user }) => {
      const taskId = Number(params.id);
      return await offsiteTaskService.updateTask(taskId, user.id, body);
    },
    {
      role: [ROLE_IDS.MENTOR, ROLE_IDS.ADMIN],
      params: t.Object({ id: t.Numeric() }),
      body: offsiteModel.UpdateOffsiteTaskSchema,
      detail: {
        summary: "แก้ไขงานนอกสถานที่",
        description: "แก้ไขรายละเอียดงานหรือรายชื่อนักศึกษา (เฉพาะเจ้าของงาน)",
      },
    }
  )

  // 3. ลบงานนอกสถานที่ (เฉพาะ Mentor)
  .delete(
    "/:id",
    async ({ params, user }) => {
      const taskId = Number(params.id);
      return await offsiteTaskService.deleteTask(taskId, user.id);
    },
    {
      role: [ROLE_IDS.MENTOR, ROLE_IDS.ADMIN],
      params: t.Object({ id: t.Numeric() }),
      detail: {
        summary: "ลบงานนอกสถานที่",
        description: "ลบรายการงานนอกสถานที่ (เฉพาะเจ้าของงาน)",
      },
    }
  )

  // ดูงานที่ Mentor คนนี้เป็นคนสั่งทั้งหมด
  .get(
    "/mentor",
    async ({ user, query }) => {
      return await offsiteTaskService.getTasksForDept(user.id, query);
    },
    {
      role: [ROLE_IDS.MENTOR, ROLE_IDS.ADMIN],
      query: offsiteModel.GetOffsiteTasksQuerySchema,
      detail: {
        summary: "ดูประวัติการมอบหมายงาน (มุมมองของ Mentor/แผนก)",
        description:
          "แสดงงานนอกสถานที่ทั้งหมดของคนในแผนก รองรับ Pagination, กรองรายเดือน/ปี และผู้มอบหมาย",
      },
    }
  )

  .get(
    "/:id",
    async ({ params, user }) => {
      const taskId = Number(params.id);

      return await offsiteTaskService.getTaskById(taskId, user.id, user.roleId);
    },
    {
      role: [ROLE_IDS.ADMIN, ROLE_IDS.MENTOR, ROLE_IDS.STUDENT],
      params: t.Object({ id: t.Numeric() }),
      detail: {
        summary: "ดูรายละเอียดงานนอกสถานที่ (ราย ID)",
        description:
          "ดูข้อมูล 1 รายการ (Student ดูได้เฉพาะงานตัวเอง, Mentor ดูได้เฉพาะงานในแผนก)",
      },
    }
  )

  // ดูงานนอกสถานที่ของนักศึกษาคนนี้
  .get(
    "/student",
    async ({ user }) => {
      return await offsiteTaskService.getTasksForStudent(user.id);
    },
    {
      role: [ROLE_IDS.STUDENT, ROLE_IDS.ADMIN],
      detail: {
        summary: "ดูตารางงานนอกสถานที่ (มุมมอง Student)",
      },
    }
  );
