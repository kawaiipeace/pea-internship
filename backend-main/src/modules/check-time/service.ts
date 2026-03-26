import { and, eq, not, sql } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  attendanceLogs,
  checkTimes,
  offsiteTaskStudents,
  offsiteTasks,
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

      const now = new Date();
      const bkkFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const todayStr = bkkFormatter.format(now);

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
          isOnsite = false;
          const assignedTask = await tx
            .select()
            .from(offsiteTaskStudents)
            .innerJoin(
              offsiteTasks,
              eq(offsiteTaskStudents.taskId, offsiteTasks.id)
            )
            .where(
              and(
                eq(offsiteTaskStudents.studentId, userId),
                eq(offsiteTasks.workDate, todayStr)
              )
            );

          if (assignedTask.length === 0) {
            throw new ConflictError(
              "ไม่อนุญาตให้เช็คอินนอกสถานที่ เนื่องจากคุณไม่มีกำหนดการปฏิบัติงานนอกสถานที่ในวันนี้ (ต้องอยู่ในรัศมี 300 เมตรจากสำนักงาน)"
            );
          }

          const locationName = assignedTask[0].offsite_tasks.locationName;
          finalLocationText = `นอกสถานที่: ${locationName} (ห่างสำนักงาน ${Math.round(distance)} เมตร)`;
        }
      }

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

      const openTime = new Date(bkkTimeStr);
      openTime.setHours(8, 0, 0, 0);

      if (currentBkkTime < openTime) {
        throw new ConflictError("ระบบเปิดให้บันทึกเวลาเข้างานตั้งแต่ 08:00 น. เป็นต้นไป");
      }

      const workStartTime = new Date(bkkTimeStr);
      workStartTime.setHours(8, 30, 0, 0);

      const lateCutoffTime = new Date(bkkTimeStr);
      lateCutoffTime.setHours(8, 45, 0, 0);

      let isLate = false;
      let lateMinutes = 0;
      let status: "PRESENT" | "LATE" = "PRESENT";

      if (currentBkkTime > lateCutoffTime) {
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

  async out(userId: string, ip: string, data: checkSchema.CheckTimeDto) {
    return await db.transaction(async (tx) => {
      const student = await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, userId),
      });

      if (!student) {
        throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");
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

      if (!existingLog || !existingLog.checkInId) {
        throw new ConflictError(
          "ไม่สามารถออกงานได้ เนื่องจากคุณยังไม่ได้บันทึกเวลาเข้างานในวันนี้"
        );
      }

      if (existingLog.checkOutId) {
        throw new ConflictError("คุณได้บันทึกเวลาออกงานของวันนี้ไปแล้ว");
      }

      const activeApp = await tx.query.applicationStatuses.findFirst({
        where: and(
          eq(applicationStatuses.userId, userId),
          eq(applicationStatuses.isActive, true)
        ),
        with: {
          department: { with: { office: true } },
        },
      });

      if (!activeApp || !activeApp.department?.office) {
        throw new NotFoundError("ไม่พบข้อมูลสำนักงานที่คุณกำลังฝึกงานอยู่");
      }

      const officeLat = activeApp.department.office.latitude;
      const officeLon = activeApp.department.office.longitude;

      let isOnsite = false;
      let finalLocationText = "ไม่สามารถระบุพิกัดได้";

      if (data.latitude && data.longitude) {
        const distance = this.getDistanceInMeters(
          data.latitude,
          data.longitude,
          officeLat,
          officeLon
        );

        if (distance <= 300) {
          isOnsite = true;
          finalLocationText = `ในสถานที่ (ห่าง ${Math.round(distance)} เมตร)`;
        } else {
          isOnsite = false;
          const assignedTask = await tx
            .select()
            .from(offsiteTaskStudents)
            .innerJoin(
              offsiteTasks,
              eq(offsiteTaskStudents.taskId, offsiteTasks.id)
            )
            .where(
              and(
                eq(offsiteTaskStudents.studentId, userId),
                eq(offsiteTasks.workDate, todayStr)
              )
            );

          if (assignedTask.length === 0) {
            throw new ConflictError(
              "ไม่อนุญาตให้เช็คเอาท์นอกสถานที่ (ต้องอยู่ในรัศมี 300 เมตรจากสำนักงาน)"
            );
          }

          const locationName = assignedTask[0].offsite_tasks.locationName;
          finalLocationText = `นอกสถานที่: ${locationName} (ห่างสำนักงาน ${Math.round(distance)} เมตร)`;
        }
      }

      const checkInRecord = await tx.query.checkTimes.findFirst({
        where: eq(checkTimes.id, existingLog.checkInId),
      });

      let actualHoursWorked = "0.00";
      if (checkInRecord?.time) {
        const inTimeStr = new Date(checkInRecord.time).toLocaleString("en-US", {
          timeZone: "Asia/Bangkok",
        });
        const inTime = new Date(inTimeStr);

        const outTimeStr = now.toLocaleString("en-US", {
          timeZone: "Asia/Bangkok",
        });
        const outTime = new Date(outTimeStr);

        const shiftStart = new Date(inTimeStr);
        shiftStart.setHours(8, 30, 0, 0);
        const gracePeriod = new Date(inTimeStr);
        gracePeriod.setHours(8, 45, 0, 0);
        const lunchStart = new Date(inTimeStr);
        lunchStart.setHours(12, 0, 0, 0);
        const lunchEnd = new Date(inTimeStr);
        lunchEnd.setHours(13, 0, 0, 0);
        const shiftEnd = new Date(inTimeStr);
        shiftEnd.setHours(16, 30, 0, 0);

        let calcIn = inTime;
        let calcOut = outTime;

        if (calcIn <= gracePeriod) {
          calcIn = shiftStart;
        }

        if (calcOut > shiftEnd) {
          calcOut = shiftEnd;
        }

        let totalMs = 0;

        if (calcIn < lunchStart) {
          const morningEnd = calcOut < lunchStart ? calcOut : lunchStart;
          totalMs += morningEnd.getTime() - calcIn.getTime();
        }

        if (calcOut > lunchEnd) {
          const afternoonStart = calcIn > lunchEnd ? calcIn : lunchEnd;
          totalMs += calcOut.getTime() - afternoonStart.getTime();
        }

        let hours = totalMs / (1000 * 60 * 60);

        if (hours < 0) hours = 0;
        if (hours > 7) hours = 7;

        actualHoursWorked = hours.toFixed(2);
      }

      const [newCheckOut] = await tx
        .insert(checkTimes)
        .values({
          userId: userId,
          time: now.toISOString(),
          typeCheck: "OUT",
          ip: ip,
          isOnsite: isOnsite,
          latitude: data.latitude,
          longitude: data.longitude,
          location: finalLocationText,
          note: data.location_note,
        })
        .returning();

      await tx
        .update(attendanceLogs)
        .set({
          checkOutId: newCheckOut.id,
          actualHoursWorked: actualHoursWorked,
        })
        .where(eq(attendanceLogs.id, existingLog.id));

      return {
        success: true,
        message: "บันทึกเวลาออกงานสำเร็จ",
        checkOutTime: now.toISOString(),
        hoursWorked: actualHoursWorked,
        location: finalLocationText,
        isOnsite: isOnsite,
      };
    });
  }
}
