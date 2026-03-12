import { db } from "@/db";
import { checkTimes, attendanceLogs, studentProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type * as checkSchema from "./model";


export class CheckTimeService {
  async in(userId: string, ip: string, data: checkSchema.CheckTimeDto) {
    return await db.transaction(async (tx) => {
      const student = await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, userId),
      });

      if (!student) {
        throw new Error("ไม่พบโปรไฟล์นักศึกษา");
      }

      const now = new Date();
      const today = now.toLocaleDateString("en-CA");

      const existingLog = await tx.query.attendanceLogs.findFirst({
        where: and(
          eq(attendanceLogs.studentProfileId, student.id),
          eq(attendanceLogs.workDate, today)
        ),
      });

      if (existingLog && existingLog.checkInId) {
        throw new Error("คุณได้บันทึกเวลาเข้างานของวันนี้ไปแล้ว");
      }

      const workStartTime = new Date(now);
      workStartTime.setHours(9, 0, 0, 0);

      let isLate = false;
      let lateMinutes = 0;
      let status: "PRESENT" | "LATE" = "PRESENT";

      if (now > workStartTime) {
        isLate = true;
        status = "LATE";
        const diffMs = now.getTime() - workStartTime.getTime();
        lateMinutes = Math.floor(diffMs / 60000);
      }

      const [newCheckIn] = await tx
        .insert(checkTimes)
        .values({
          userId: userId,
          time: now.toISOString(),
          typeCheck: "IN",
          ip: ip,
        })
        .returning();

      if (existingLog) {
        await tx
          .update(attendanceLogs)
          .set({
            checkInId: newCheckIn.id,
            lateMinutes: existingLog.lateMinutes! + lateMinutes,
          })
          .where(eq(attendanceLogs.id, existingLog.id));
      } else {
        await tx.insert(attendanceLogs).values({
          studentProfileId: student.id,
          workDate: today,
          checkInId: newCheckIn.id,
          lateMinutes: lateMinutes,
          dailyStatus: status,
        });
      }

      return {
        success: true,
        message: isLate ? `คุณมาสาย ${lateMinutes} นาที` : "บันทึกเวลาเข้างานสำเร็จ",
        checkInTime: now.toISOString(),
        status: status,
      };
    });
  }
}