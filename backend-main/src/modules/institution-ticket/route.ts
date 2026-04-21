import Elysia from "elysia";
import * as model from "./model";
import { InstitutionTicketService } from "./service";

const service = new InstitutionTicketService();

export const institutionTicketRoutes = new Elysia({
  prefix: "/institution_ticket",
  tags: ["Institutions(สถาบันการศึกษา)"],
}).get(
  "/:id",
  ({ params, set }) => {
    set.headers["Cache-Control"] = "public, max-age=300";
    return service.findById(params.id);
  },
  { params: model.params ,
    detail: {
      summary: "ค้นหา และ query ชื่อสถาบันอย่างรวดเร็วด้วย ticket",
      description:
        "เนื่องจากระบบเก็บข้อมูลสถาบันเป็นจำนวนมาก จึงใช้เวลามากในการ query จึงต้องแก้ปัญหาด้วยการ query แบบ ticket เพื่อลดเวลาที่ต้องใช้รอในการแสดงข้อมูลของ user",
    },
  }
);
