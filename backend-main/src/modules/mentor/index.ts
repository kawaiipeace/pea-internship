import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import * as model from "./model";
import { MentorService } from "./service";

const mentorService = new MentorService();

export const mentor = new Elysia({
  prefix: "/mentor",
  tags: ["Mentor Dashboard"],
})
  .use(isAuthenticated)
  .get(
    "/students",
    async ({ query, set, user }) => {
      const response = await mentorService.getStudents(user.id, query);

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      query: model.GetStudentsUnderCareQuery,
      detail: {
        summary: "รายชื่อนักศึกษาในความดูแล (Students Under Care)",
        description:
          "ดึงรายชื่อ สถิติ และสถานะวันนี้ของนักศึกษาสำหรับแสดงในหน้าแดชบอร์ดพี่เลี้ยง รองรับการดูแบบ MINE (ของฉัน) และ DEPT (ทั้งหมดในแผนก)",
      },
    }
  )
  .get(
    "/students/:studentId",
    async ({ params, query, set, user }) => {
      const response = await mentorService.getStudentDetail(
        user.id,
        params.studentId,
        query
      );

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      params: model.GetStudentDetailParams,
      query: model.GetStudentDetailQuery,
      detail: {
        summary: "รายละเอียดนักศึกษา (Student Details)",
        description: "ดูประวัติและสถิติการเข้างานของนักศึกษาแบบละเอียด",
      },
    }
  );
