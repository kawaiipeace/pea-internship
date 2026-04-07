import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import { FileService } from "./service";

const fileService = new FileService();

export const file = new Elysia({
  prefix: "/files",
  tags: ["files"],
})
  .use(isAuthenticated)
  .get(
    "/:key",
    async ({ params, set }) => {
      const { key } = params;
      const result = await fileService.getFile(key);

      set.status = 200;
      return result;
    },
    {
      auth: true,
      detail: {
        summary: "ดาวน์โหลดไฟล์จากระบบ",
        description: "รับพารามิเตอร์ key เพื่อระบุไฟล์ที่ต้องการดาวน์โหลดจาก MinIO",
      },
    }
  );
