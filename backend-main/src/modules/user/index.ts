import { Elysia, t } from "elysia";
import { isAuthenticated, ROLE_IDS } from "@/middlewares/auth.middleware";
import { createProfile } from "./model";
import { UserService } from "./service";

const userService = new UserService();

export const user = new Elysia({ prefix: "/user", tags: ["Users(ข้อมูลผู้ใช้)"] })
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
      detail: {
        summary: "ดึงข้อมูลโปรไฟล์ของผู้ใช้",
        description:
          "ใช้สำหรับดึงข้อมูลโปรไฟล์ของผู้ใช้ที่กำลัง login อยู่ โดยอ้างอิงจาก session ปัจจุบัน",
      },
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
      detail: {
        summary: "ดึงรายชื่อเจ้าหน้าที่",
        description: "ใช้สำหรับดึงรายชื่อเจ้าหน้าที่ทั้งหมด หรือกรองตาม departmentId ที่ระบุ",
      },
    }
  )
  .get(
    "/student",
    async ({ set, query }) => {
      const response = await userService.getStudent(query.departmentId);

      set.status = 200;
      return response;
    },
    {
      role: [1, 2],
      query: t.Object({
        departmentId: t.Optional(
          t.Numeric({ description: "ID ของแผนกที่ต้องการกรองดูนักศึกษา" })
        ),
      }),
      detail: {
        summary: "ดึงรายชื่อนักศึกษา",
        description: "ใช้สำหรับดึงรายชื่อนักศึกษาทั้งหมด หรือกรองตาม departmentId ที่ระบุ",
      },
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
      detail: {
        summary: "แก้ไขข้อมูลผู้ใช้",
        description:
          "ใช้สำหรับแก้ไขข้อมูลพื้นฐานของผู้ใช้ที่กำลัง login อยู่ เช่น ชื่อ นามสกุล อีเมล และเบอร์โทรศัพท์",
      },
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
      detail: {
        summary: "แก้ไขเบอร์โทรเจ้าหน้าที่",
        description:
          "ใช้สำหรับแก้ไขหมายเลขโทรศัพท์ของเจ้าหน้าที่ โดยระบุ staffProfileId ของเจ้าหน้าที่ที่ต้องการแก้ไข",
      },
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
      detail: {
        summary: "แก้ไขข้อมูลโปรไฟล์นักศึกษา",
        description:
          "ใช้สำหรับแก้ไขข้อมูลโปรไฟล์นักศึกษา เช่น ชั่วโมงฝึกงาน คณะ สาขา หมายเหตุ และช่วงวันที่ฝึกงาน",
      },
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
    "/student/itt/profile",
    async ({ set, user, query }) => {
      const targetUserId = query.userId || user.id;
      const fileData = await userService.getProfileImage(targetUserId);

      if (!fileData) {
        set.status = 204;
        return;
      }

      set.headers["Content-Type"] = fileData.contentType;
      return fileData.buffer;
    },
    {
      auth: true,
      query: t.Object({
        userId: t.Optional(
          t.String({ description: "ID ของผู้ใช้ที่ต้องการดึงรูปโปรไฟล์" })
        ),
      }),
      detail: {
        summary: "ดึงรูปโปรไฟล์นักศึกษา",
        description:
          "ดึงไฟล์รูปภาพโปรไฟล์จาก Storage เพื่อนำไปแสดงผล โดยระบุ userId ของนักศึกษาที่ต้องการ",
      },
    }
  );
