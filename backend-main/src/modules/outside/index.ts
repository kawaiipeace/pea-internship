import { Elysia } from "elysia";
import { isAuthenticated, ROLE_IDS } from "@/middlewares/auth.middleware";
import * as offsiteModel from "./model";
import { OffsiteTaskService } from "./service";

const offsiteTaskService = new OffsiteTaskService();

export const offsiteTasks = new Elysia({
  prefix: "/offsite-tasks",
  tags: ["offsite-tasks"],
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
      role: [ROLE_IDS.MENTOR],
      body: offsiteModel.CreateOffsiteTaskSchema,
      detail: {
        summary: "มอบหมายงานนอกสถานที่",
        description: "Mentor ทำการมอบหมายงานนอกสถานที่ให้นักศึกษา (เลือกได้หลายคน)",
      },
    }
  )

  // ดูงานที่ Mentor คนนี้เป็นคนสั่งทั้งหมด
  .get(
    "/mentor",
    async ({ user }) => {
      return await offsiteTaskService.getTasksByMentor(user.id);
    },
    {
      role: [ROLE_IDS.MENTOR],
      detail: {
        summary: "ดูประวัติการมอบหมายงาน (มุมมอง Mentor)",
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
      role: [ROLE_IDS.STUDENT],
      detail: {
        summary: "ดูตารางงานนอกสถานที่ (มุมมอง Student)",
      },
    }
  );
