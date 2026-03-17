import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationStatuses,
  attendanceLogs,
  checkTimes,
  studentProfiles,
} from "@/db/schema";
import type * as checkSchema from "./model";

export class CheckTimeService {
  private getDistanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async in(userId: string, ip: string, data: checkSchema.CheckTimeDto) {
    return await db.transaction(async (tx) => {
      const student = await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, userId),
      });

      if (!student) {
        throw new Error("ไม่พบโปรไฟล์นักศึกษา");
      }

      const activeApp = await tx.query.applicationStatuses.findFirst({
        where: and(
          eq(applicationStatuses.userId, userId),
          eq(applicationStatuses.isActive, true)
        ),
        with: {
          department: {
            with: { office: true },
          },
        },
      });

      if (!activeApp || !activeApp.department?.office) {
        throw new Error("ไม่พบข้อมูลสำนักงานที่คุณกำลังฝึกงานอยู่");
      }

      const officeLat = activeApp.department.office.latitude;
      const officeLon = activeApp.department.office.longitude;

      let isOnsite = false;
      let distance: number | null = null;
      let finalLocationText = "ไม่สามารถระบุพิกัดได้";

      if (data.latitude && data.longitude) {
        distance = this.getDistanceInMeters(
          data.latitude,
          data.longitude,
          officeLat,
          officeLon
        );

        if (distance <= 300) {
          isOnsite = true;
          finalLocationText = `ในสถานที่ (ห่าง ${Math.round(distance)} เมตร)`;
        } else {
          finalLocationText = `นอกสถานที่ (ห่าง ${Math.round(distance)} เมตร)`;
        }
      }

      const now = new Date();
      const today = now.toLocaleDateString("en-CA");

      const existingLog = await tx.query.attendanceLogs.findFirst({
        where: and(
          eq(attendanceLogs.studentProfileId, student.id),
          eq(attendanceLogs.workDate, today)
        ),
      });

      if (existingLog?.checkInId) {
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
          isOnsite: isOnsite,
          latitude: data.latitude,
          longitude: data.longitude,
          location: finalLocationText,
          note: data.location_note,
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
        location: finalLocationText,
        isOnsite: isOnsite,
      };
    });
  }
}
