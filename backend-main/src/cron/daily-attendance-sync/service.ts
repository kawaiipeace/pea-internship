import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationStatuses,
  attendanceLogs,
  studentProfiles,
} from "../../db/schema";

export class CheckTimeService {
  async syncDailyAttendance() {
    return await db.transaction(async (tx) => {
      const now = new Date();
      const bkkFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const todayStr = bkkFormatter.format(now);

      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6)
        return { message: "Weekend, skipping..." };

      const activeStudents = await tx.query.studentProfiles.findMany({
        where: eq(studentProfiles.internshipStatus, "ACTIVE"),
        with: {
          user: {
            with: {
              applicationStatuses: {
                where: eq(applicationStatuses.isActive, true),
                with: { applicationInformations: true },
              },
            },
          },
        },
      });

      const processedAbsent = [];

      for (const student of activeStudents) {
        const appInfo =
          student.user.applicationStatuses[0]?.applicationInformations[0];
        if (appInfo?.startDate && appInfo?.endDate) {
          const today = new Date(todayStr);
          const start = new Date(appInfo.startDate);
          const end = new Date(appInfo.endDate);
          if (today < start || today > end) continue;
        }

        const existingLog = await tx.query.attendanceLogs.findFirst({
          where: and(
            eq(attendanceLogs.studentProfileId, student.id),
            eq(attendanceLogs.workDate, todayStr)
          ),
        });

        if (!existingLog) {
          await tx.insert(attendanceLogs).values({
            studentProfileId: student.id,
            workDate: todayStr,
            dailyStatus: "ABSENT",
            actualHoursWorked: "0.00",
            isVerified: true,
          });
          processedAbsent.push(student.id);
        }
      }

      const missingOutRecords = await tx
        .update(attendanceLogs)
        .set({ dailyStatus: "MISSING_OUT" })
        .where(
          and(
            eq(attendanceLogs.workDate, todayStr),
            isNotNull(attendanceLogs.checkInId),
            isNull(attendanceLogs.checkOutId),
            inArray(attendanceLogs.dailyStatus, ["PRESENT", "LATE"])
          )
        )
        .returning({ id: attendanceLogs.id });

      return {
        success: true,
        date: todayStr,
        markedAbsentCount: processedAbsent.length,
        markedMissingOutCount: missingOutRecords.length,
      };
    });
  }
}
