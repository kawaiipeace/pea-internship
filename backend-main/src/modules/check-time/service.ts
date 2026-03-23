import { and, eq, not, sql } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/common/exceptions";
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
        throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");
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
        throw new NotFoundError("ไม่พบข้อมูลสำนักงานที่คุณกำลังฝึกงานอยู่");
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
      const bkkFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const todayStr = bkkFormatter.format(now);

      const existingLog = await tx.query.attendanceLogs.findFirst({
        where: and(
          eq(attendanceLogs.studentProfileId, student.id),
          eq(attendanceLogs.workDate, todayStr)
        ),
      });

      if (existingLog?.checkInId) {
        throw new ConflictError("คุณได้บันทึกเวลาเข้างานของวันนี้ไปแล้ว");
      }

      const ipUsedByOther = await tx.query.checkTimes.findFirst({
        where: and(
          eq(checkTimes.ip, ip),
          eq(checkTimes.typeCheck, "IN"),
          sql`DATE(${checkTimes.time} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') = ${todayStr}`,
          not(eq(checkTimes.userId, userId))
        ),
      });

      if (ipUsedByOther) {
        throw new ConflictError(
          "ระบบตรวจพบการใช้งานอุปกรณ์ซ้ำ (ไม่อนุญาตให้เช็คอินแทนกันหรือใช้เครือข่ายร่วมกัน)"
        );
      }

      const bkkTimeStr = now.toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
      });
      const currentBkkTime = new Date(bkkTimeStr);

      const workStartTime = new Date(bkkTimeStr);
      workStartTime.setHours(9, 0, 0, 0);

      let isLate = false;
      let lateMinutes = 0;
      let status: "PRESENT" | "LATE" = "PRESENT";

      if (currentBkkTime > workStartTime) {
        isLate = true;
        status = "LATE";
        const diffMs = currentBkkTime.getTime() - workStartTime.getTime();
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
            lateMinutes: (existingLog.lateMinutes || 0) + lateMinutes,
          })
          .where(eq(attendanceLogs.id, existingLog.id));
      } else {
        await tx.insert(attendanceLogs).values({
          studentProfileId: student.id,
          workDate: todayStr,
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
