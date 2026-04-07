import { Elysia, t } from "elysia";
import { isAuthenticated, ROLE_IDS } from "@/middlewares/auth.middleware";
import { createProfile } from "./model";
import { UserService } from "./service";

const userService = new UserService();

export const user = new Elysia({ prefix: "/user", tags: ["user"] })
  .use(isAuthenticated)
  .get(
    "/profile",
    async ({ set, session }) => {
      const userId = session.userId;
      const response = await userService.me(userId);

      set.status = 200;
      return response;
    },
    {
      auth: true,
    }
  )
  .get(
    "/staff",
    async ({ set, query }) => {
      const departmentId = query.departmentId
        ? Number(query.departmentId)
        : undefined;
      const response = await userService.getStaff(departmentId);

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      query: t.Object({
        departmentId: t.Optional(t.Numeric()),
      }),
    }
  )
  .get(
    "/student",
    async ({ set }) => {
      const response = await userService.getStudent();

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
    }
  )
  .put(
    "/update",
    async ({ body, set, session }) => {
      const userId = session.userId;
      const response = await userService.updateUser(userId, body);

      set.status = 200;
      return response;
    },
    {
      auth: true,
      body: t.Object({
        fname: t.Optional(t.String()),
        lname: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phoneNumber: t.Optional(t.String()),
      }),
    }
  )
  .put(
    "/staff/:staffProfileId/phone",
    async ({ body, set, params }) => {
      const staffProfileId = Number(params.staffProfileId);
      const response = await userService.updateStaffPhone(
        staffProfileId,
        body.phoneNumber
      );

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      params: t.Object({
        staffProfileId: t.String(),
      }),
      body: t.Object({
        phoneNumber: t.String(),
      }),
    }
  )
  .put(
    "/student-profile",
    async ({ body, set, session }) => {
      const userId = session.userId;
      const response = await userService.updateStudentProfile(userId, body);

      set.status = 200;
      return response;
    },
    {
      auth: true,
      body: t.Object({
        hours: t.Optional(t.Number()),
        faculty: t.Optional(t.String()),
        major: t.Optional(t.String()),
        studentNote: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/student/total-hours",
    async ({ user, set }) => {
      const result = await userService.getStudentProgress(user.id);

      set.status = 200;
      return result;
    },
    {
      role: [ROLE_IDS.STUDENT],
      detail: {
        summary: "สรุปชั่วโมงการฝึกงาน (Progress Bar)",
        description:
          "ดึงข้อมูลชั่วโมงที่ทำไปแล้ว และชั่วโมงที่ต้องทำทั้งหมด สำหรับหน้า Dashboard",
      },
    }
  )
  .put(
    "/student/itt/profile",
    async ({ set, body, user }) => {
      const result = await userService.updateProfile(user.id, body);

      set.status = 200;
      return result;
    },
    {
      role: [ROLE_IDS.STUDENT],
      body: createProfile,
      detail: {
        summary: "ตั้งค่าโปรไฟล์นักศึกษา",
        description: "อัปโหลดรูปภาพโปรไฟล์ใหม่ (รองรับไฟล์รูปภาพ) และแก้ไขชื่อเล่น",
      },
    }
  )

  .get(
    "/student/itt/profile/img",
    async ({ set, user }) => {
      const fileData = await userService.getProfileImage(user.id);
      set.headers["Content-Type"] = fileData.contentType;
      return fileData.buffer;
    },
    {
      auth: true,
      detail: {
        summary: "ดึงรูปโปรไฟล์นักศึกษา",
        description: "ดึงไฟล์รูปภาพโปรไฟล์จาก Storage เพื่อนำไปแสดงผล",
      },
    }
  );
