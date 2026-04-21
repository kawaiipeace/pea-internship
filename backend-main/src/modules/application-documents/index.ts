import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import * as model from "./model";
import { ApplicationDocumentsService } from "./service";

const service = new ApplicationDocumentsService();

export const ApplicationDocuments = new Elysia({
  prefix: "/application-documents",
  tags: ["Documents"],
})
  .use(isAuthenticated)

  .get(
    "/",
    async ({ session, query, set }) => {
      const rows = await service.findAllDocuments(session.userId, query);

      set.status = 200;
      return rows;
    },
    {
      role: [1],
      query: model.AdminListDocsQuery,
      detail: {
        summary: "แสดงเอกสารทั้งหมดในระบบ Internships (Get Documents)",
        description:
          "แสดงเอกสารทั้งหมดในระบบ โดยสามารถ filter/search ได้ด้วย applicationStatusId, departmentId, userId, docTypeId, validationStatus, q, page, limit",
      },
    }
  )

  .get(
    "/file",
    async ({ query, session, set }) => {
      const { body, contentType, contentDisposition } =
        await service.streamDocument(session.userId, query.key);

      set.headers["content-type"] = contentType;
      set.headers["content-disposition"] = contentDisposition;
      set.headers["cache-control"] = "no-store";

      return body;
    },
    {
      auth: true,
      query: model.AdminGetFileQuery,
      detail: {
        summary: "เปิดดูไฟล์เอกสาร PDF (Stream file from Object Storage)",
        description:
          "เปิดดูไฟล์เอกสารโดยผ่านการ Stream ผ่าน Object Storage (minio s3)",
      },
    }
  );
