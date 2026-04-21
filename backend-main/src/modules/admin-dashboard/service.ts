import { and, count, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationStatuses,
  attendanceLogs,
  departments,
  studentProfiles,
} from "@/db/schema";

export class AdminDashboardService {
  /**
   * ดึงสถิติภาพรวมสำหรับ Admin Dashboard
   * - จำนวนนักศึกษาที่กำลังฝึกงานอยู่
   * - อัตราการลา / มาสาย / ขาด ของเดือนที่เลือก (%)
   */
  async getDashboardStats(month: number, year: number) {
    // 1. จำนวน active students ทั้งหมด
    const [activeResult] = await db
      .select({ total: count() })
      .from(applicationStatuses)
      .where(eq(applicationStatuses.isActive, true));

    const totalActive = Number(activeResult?.total ?? 0);

    // 2. ดึง attendanceLogs ของเดือนที่เลือก
    const monthStr = month.toString().padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

    const logsOfMonth = await db
      .select({
        dailyStatus: attendanceLogs.dailyStatus,
      })
      .from(attendanceLogs)
      .where(
        and(
          gte(attendanceLogs.workDate, startDate),
          lte(attendanceLogs.workDate, endDate)
        )
      );

    const totalLogs = logsOfMonth.length;

    let leaveCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    for (const log of logsOfMonth) {
      if (log.dailyStatus === "LEAVE") leaveCount++;
      else if (log.dailyStatus === "LATE") lateCount++;
      else if (log.dailyStatus === "ABSENT") absentCount++;
    }

    const calcRate = (n: number) =>
      totalLogs > 0 ? Number(((n / totalLogs) * 100).toFixed(1)) : 0;

    return {
      totalActive,
      leaveRate: calcRate(leaveCount),
      lateRate: calcRate(lateCount),
      absentRate: calcRate(absentCount),
      period: { year, month },
    };
  }

  /**
   * หา Top 5 หน่วยงานที่มีนักศึกษา ลา / มาสาย / ขาด มากที่สุด
   */
  async getTopUnits(month: number, year: number) {
    const monthStr = month.toString().padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, "0")}`;

    // ดึง active applications พร้อม departmentId
    const activeApps = await db
      .select({
        userId: applicationStatuses.userId,
        departmentId: applicationStatuses.departmentId,
      })
      .from(applicationStatuses)
      .where(eq(applicationStatuses.isActive, true));

    if (activeApps.length === 0) {
      return {
        leaveTop: [],
        lateTop: [],
        absentTop: [],
        period: { year, month },
      };
    }

    // map userId -> departmentId
    const userDeptMap = new Map<string, number>();
    for (const app of activeApps) {
      userDeptMap.set(app.userId, app.departmentId);
    }

    const userIds = activeApps.map((a) => a.userId);
    const studentProfileRows = await db
      .select({
        id: studentProfiles.id,
        userId: studentProfiles.userId,
      })
      .from(studentProfiles)
      .where(inArray(studentProfiles.userId, userIds));

    const profileIdToUserId = new Map<number, string>();
    for (const sp of studentProfileRows) {
      profileIdToUserId.set(sp.id, sp.userId);
    }

    const profileIds = studentProfileRows.map((sp) => sp.id);

    if (profileIds.length === 0) {
      return {
        leaveTop: [],
        lateTop: [],
        absentTop: [],
        period: { year, month },
      };
    }

    // ดึง logs ในช่วงเดือน
    const logs = await db
      .select({
        studentProfileId: attendanceLogs.studentProfileId,
        dailyStatus: attendanceLogs.dailyStatus,
      })
      .from(attendanceLogs)
      .where(
        and(
          inArray(attendanceLogs.studentProfileId, profileIds),
          gte(attendanceLogs.workDate, startDate),
          lte(attendanceLogs.workDate, endDate)
        )
      );

    // ดึง dept short names
    const deptIds = [...new Set(activeApps.map((a) => a.departmentId))];
    const deptRows = await db
      .select({
        deptSap: departments.deptSap,
        deptShort: departments.deptShort,
        deptSapShort: departments.deptSapShort,
      })
      .from(departments)
      .where(inArray(departments.deptSap, deptIds));

    const deptNameMap = new Map<number, string>();
    for (const d of deptRows) {
      deptNameMap.set(
        d.deptSap,
        d.deptSapShort || d.deptShort || `Dept ${d.deptSap}`
      );
    }

    // Aggregate per department
    const deptStats = new Map<
      number,
      { leave: number; late: number; absent: number }
    >();

    for (const log of logs) {
      const userId = profileIdToUserId.get(log.studentProfileId);
      if (!userId) continue;
      const deptId = userDeptMap.get(userId);
      if (!deptId) continue;

      if (!deptStats.has(deptId)) {
        deptStats.set(deptId, { leave: 0, late: 0, absent: 0 });
      }

      const stat = deptStats.get(deptId)!;
      if (log.dailyStatus === "LEAVE") stat.leave++;
      else if (log.dailyStatus === "LATE") stat.late++;
      else if (log.dailyStatus === "ABSENT") stat.absent++;
    }

    const buildTop5 = (key: "leave" | "late" | "absent") => {
      return [...deptStats.entries()]
        .map(([deptId, stat]) => ({
          name: deptNameMap.get(deptId) ?? `${deptId}`,
          value: stat[key],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    };

    return {
      leaveTop: buildTop5("leave"),
      lateTop: buildTop5("late"),
      absentTop: buildTop5("absent"),
      period: { year, month },
    };
  }

  /**
   * ดึงรายชื่อนักศึกษาทั้งหมด (สำหรับตาราง) รองรับ search + pagination
   * Delegates to mentor/students endpoint ด้วย viewType=ALL
   * (endpoint นี้ใช้ร่วมกัน ไม่ต้องสร้างใหม่)
   */
}
