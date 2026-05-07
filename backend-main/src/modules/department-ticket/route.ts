import Elysia from "elysia";
import * as model from "./model";
import { DepartmentTicketService } from "./service";

const service = new DepartmentTicketService();

export const departmentTicketRoutes = new Elysia({
  prefix: "/department_ticket",
  tags: ["Departments(กองงาน/หน่วยงาน)"],
}).get(
  "/:id",
  ({ params, set }) => {
    set.headers["Cache-Control"] = "public, max-age=300";
    return service.findById(params.id);
  },
  {
    params: model.params,
    detail: {
      summary: "ค้นหา และ query ชื่อหน่วยงานอย่างรวดเร็วด้วย ticket",
      description:
        "ใช้สำหรับค้นหาข้อมูลหน่วยงานจาก dept_sap โดยตรง เพื่อลดเวลารอในการแสดงข้อมูล department ของ user",
    },
  }
);
