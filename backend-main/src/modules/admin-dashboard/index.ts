import { Elysia, t } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import { AdminDashboardService } from "./service";

const adminDashboardService = new AdminDashboardService();

export const adminDashboard = new Elysia({
  prefix: "/admin-dashboard",
  tags: ["Admin Dashboard(แดชบอร์ดผู้ดูแลระบบ)"],
})
  .use(isAuthenticated)
  .get(
    "/stats",
    async ({ query, set }) => {
      const now = new Date();
      const month = query.month ?? now.getMonth() + 1;
      const year = query.year ?? now.getFullYear();

      const response = await adminDashboardService.getDashboardStats(
        month,
        year
      );
      set.status = 200;
      return response;
    },
    {
      role: [1],
      query: t.Object({
        month: t.Optional(
          t.Numeric({
            minimum: 1,
            maximum: 12,
            description: "เดือน (1-12)",
          })
        ),
        year: t.Optional(
          t.Numeric({
            description: "ปี ค.ศ. เช่น 2025",
          })
        ),
      }),
      detail: {
        summary: "สถิติภาพรวม Admin Dashboard",
        description:
          "ดึงจำนวนนักศึกษาที่กำลังฝึกงาน และอัตราการลา / มาสาย / ขาด ของเดือนที่เลือก",
      },
    }
  )
  .get(
    "/top-units",
    async ({ query, set }) => {
      const now = new Date();
      const month = query.month ?? now.getMonth() + 1;
      const year = query.year ?? now.getFullYear();

      const response = await adminDashboardService.getTopUnits(month, year);
      set.status = 200;
      return response;
    },
    {
      role: [1],
      query: t.Object({
        month: t.Optional(
          t.Numeric({
            minimum: 1,
            maximum: 12,
            description: "เดือน (1-12)",
          })
        ),
        year: t.Optional(
          t.Numeric({
            description: "ปี ค.ศ. เช่น 2025",
          })
        ),
      }),
      detail: {
        summary: "Top 5 หน่วยงานที่มีนักศึกษาลา / มาสาย / ขาด สูงสุด",
        description:
          "ดึง Top 5 หน่วยงานแยกตาม 3 ประเภท (ลา, สาย, ขาด) สำหรับแสดง bar chart ในหน้า Admin Dashboard",
      },
    }
  );
