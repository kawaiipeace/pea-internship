import { Elysia } from "elysia";
import * as model from "./model";
import { AuthService } from "./service";

const authService = new AuthService();

export const auth = new Elysia({
  prefix: "/auth",
  tags: ["Authentication(การยืนยันตัวตน)"],
})
  .post(
    "/sign-up/intern",
    async ({ body, set }) => {
      const response = authService.registerIntern(body);

      set.status = 201;
      return response;
    },
    {
      body: model.RegisterInternBody,
      detail: {
        summary: "สร้างบัญชีผู้ใช้ของนักศึกษา (Register)",
      },
    }
  )

  .post(
    "/sign-in/intern",
    async ({ body, set }) => {
      const response = authService.login(body);

      set.status = 200;
      return response;
    },
    {
      body: model.LoginInternBody,
      detail: {
        summary: "Log-in เข้าสู่ระบบ internships",
      },
    }
  )

  .post(
    "/sign-in/intern/itt",
    async ({ body, set }) => {
      const response = await authService.login_itt(body);

      set.status = 200;
      return response;
    },
    {
      body: model.LoginInternBody,
      detail: {
        summary: "Log-in เข้าสู่ระบบ iTT",
        description:
          "นักศึกษาต้องมีกองงานรับเข้าฝึกงาน และมี internships status อยู่ในสถานะ ACTIVE ก่อน",
      },
    }
  )

  .get(
    "/sign-in/keycloak",
    async ({ request }) => {
      const authResponse = await authService.loginWithKeycloak(request.headers);
      const body = await authResponse
        .clone()
        .json()
        .catch(() => null);
      if (body?.url) {
        const headers = new Headers(authResponse.headers);
        headers.set("Location", body.url);
        return new Response(null, { status: 302, headers });
      }
      return authResponse;
    },
    {
      detail: {
        summary: "Redirect ไป Login ผ่าน Keycloak สำหรับ Internships",
        description:
          "ใช้สำหรับเข้าสู่ระบบผ่าน Keycloak SSO โดยระบบจะ redirect ไปยังหน้า login ของ Keycloak และหลังจาก login สำเร็จจะ redirect กลับมายังระบบ",
      },
    }
  )

  .get(
    "/sign-in/keycloak/itt",
    async ({ request }) => {
      const authResponse = await authService.loginWithKeycloakiTT(
        request.headers
      );
      const body = await authResponse
        .clone()
        .json()
        .catch(() => null);
      if (body?.url) {
        const headers = new Headers(authResponse.headers);
        headers.set("Location", body.url);
        return new Response(null, { status: 302, headers });
      }
      return authResponse;
    },
    {
      detail: {
        summary: "Redirect ไป Login Keycloak สำหรับ iTT",
        description:
          "ใช้สำหรับเข้าสู่ระบบผ่าน Keycloak SSO โดยระบบจะ redirect ไปยังหน้า login ของ Keycloak และหลังจาก login สำเร็จจะ redirect กลับมายังระบบ",
      },
    }
  )

  .post(
    "/sign-out",
    async ({ request, set }) => {
      const response = await authService.logout(request.headers);
      set.status = 200;
      return response;
    },
    {
      detail: {
        summary: "Logout ออกจากระบบ",
        description:
          "ใช้สำหรับออกจากระบบ โดยจะทำการลบ session และ revoke token ที่เกี่ยวข้องกับผู้ใช้งาน",
      },
    }
  )

  .post(
    "/request-reset-password",
    async ({ body, set }) => {
      const response = await authService.requestResetPassword(body);

    set.status = 200;
    return response;
  },
  {
    body: model.RequestResetPasswordBody,
    detail: {
        summary: "ส่งคำขอรีเซ็ตรหัสผ่าน",
        description:
          "ส่งอีเมลที่มี code สำหรับรีเซ็ตรหัสผ่าน ไปยังที่อยู่อีเมลที่ผู้ใช้สมัคร",
      },
  }
)

  .post(
    "/verify-reset-code",
    async ({ body, set }) => {
      const response = await authService.verifyResetCode(body);

    set.status = 200;
    return response;
  },
  {
    body: model.VerifyResetCodeBody,
    detail: {
        summary: "ยืนยันโค้ดสำหรับรีเซ็ตรหัสผ่าน",
        description:
          "นำโค้ดที่ได้จากอีเมลมายืนยันเพื่อรับ reset-password token",
      },
  }
)

  .post(
    "/reset-password",
    async ({ body, set }) => {
      const response = await authService.resetPassword(body);

    set.status = 200;
    return response;
  },
  {
    body: model.ResetPasswordBody,
    detail: {
        summary: "เปลี่ยนรหัสผ่าน",
        description:
          "กรอกรหัสผ่านใหม่ที่ต้องการจะเปลี่ยน พร้อมทั้งส่ง reset-password token เพื่อยืนยันตัวตน",
      },
  }
);

  
