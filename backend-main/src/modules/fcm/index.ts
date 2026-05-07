import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import * as model from "./model";
import { FCMService } from "./service";

const service = new FCMService();

export const fcm = new Elysia({
  prefix: "/fcm",
  tags: ["Firebase Cloud Messaging(การแจ้งเตือน)"],
})
  .use(isAuthenticated)
  .post(
    "/notifications/register-token",
    async ({ body, user }) => {
      const userId = user?.id;
      const { token } = body;
      await service.registerToken(userId, token);
      return { success: true };
    },
    {
      role: [1, 2, 3],
      body: model.RegisterTokenRequest,
      detail: {
        summary: "ลงทะเบียน FCM token สำหรับผู้ใช้",
        description:
          "ใช้สำหรับลงทะเบียน FCM token ของผู้ใช้เพื่อให้สามารถส่งการแจ้งเตือนได้",
      },
    }
  );
