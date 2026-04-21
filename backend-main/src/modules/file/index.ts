import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import { FileService } from "./service";

const fileService = new FileService();

export const file = new Elysia({
  prefix: "/files",
  tags: ["Files"],
})
  .use(isAuthenticated)
  .get(
    "/:key",
    async ({ params, set }) => {
      const { key } = params;
      const result = await fileService.getFile(key);

      set.headers["Content-Type"] = result.contentType;
      return result.buffer;
    },
    {
      auth: true,
      detail: {
        summary: "ดาวน์โหลดไฟล์จากระบบ (Download file)",
        description: "รับพารามิเตอร์ key เพื่อระบุไฟล์ที่ต้องการดาวน์โหลดจาก MinIO",
      },
    }
  );
