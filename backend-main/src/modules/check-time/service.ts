import crypto from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3/dist-types/commands/PutObjectCommand";
import { and, desc, eq, gte, lte, not, sql } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  attendanceLogs,
  checkTimes,
  offsiteTaskStudents,
  offsiteTasks,
  studentProfiles,
  timeCorrectionRequests,
} from "@/db/schema";
import { BUCKET_NAME, s3Client } from "@/lib/s3";
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
        shiftEnd.setHours(23, 59, 59, 59);

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
          isVerified: isOnsite ? true : null,
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

  async history(
    userId: string,
    year?: number,
    month?: number,
    page: number = 1,
    limit: number = 10
  ) {
    const student = await db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.userId, userId),
      columns: { id: true },
    });

    if (!student) {
      throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");
    }

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const monthStr = targetMonth.toString().padStart(2, "0");
    const startDate = `${targetYear}-${monthStr}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${monthStr}-${lastDay}`;

    const whereCondition = and(
      eq(attendanceLogs.studentProfileId, student.id),
      gte(attendanceLogs.workDate, startDate),
      lte(attendanceLogs.workDate, endDate)
    );

    const allRecordsForSummary = await db.query.attendanceLogs.findMany({
      where: whereCondition,
      columns: {
        dailyStatus: true,
        checkInId: true,
        checkOutId: true,
      },
    });

    const totalRecords = allRecordsForSummary.length;
    const totalPages = Math.ceil(totalRecords / limit);

    const summary = {
      present: 0,
      late: 0,
      leave: 0,
      absent: 0,
      missingOut: 0,
    };

    allRecordsForSummary.forEach((log) => {
      let displayStatus = log.dailyStatus;

      if (
        (log.dailyStatus === "PRESENT" || log.dailyStatus === "LATE") &&
        log.checkInId &&
        !log.checkOutId
      ) {
        displayStatus = "MISSING_OUT";
      }

      if (displayStatus === "PRESENT") summary.present++;
      else if (displayStatus === "LATE") summary.late++;
      else if (displayStatus === "LEAVE") summary.leave++;
      else if (displayStatus === "ABSENT") summary.absent++;
      else if (displayStatus === "MISSING_OUT") summary.missingOut++;
    });

    const offset = (page - 1) * limit;

    const historyData = await db.query.attendanceLogs.findMany({
      where: whereCondition,
      orderBy: [desc(attendanceLogs.workDate)],
      limit: limit,
      offset: offset,
      with: {
        checkIn: { columns: { time: true } },
        checkOut: { columns: { time: true } },
      },
    });

    const records = historyData.map((log) => {
      const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return "--:--";
        const d = new Date(timeStr);
        return d.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const inTime = formatTime(log.checkIn?.time);
      const outTime = formatTime(log.checkOut?.time);

      let displayStatus = log.dailyStatus;
      if (
        (log.dailyStatus === "PRESENT" || log.dailyStatus === "LATE") &&
        log.checkInId &&
        !log.checkOutId
      ) {
        displayStatus = "MISSING_OUT";
      }

      return {
        id: log.id,
        workDate: log.workDate,
        displayStatus: displayStatus,
        checkInTime: inTime,
        checkOutTime: outTime,
      };
    });

    return {
      period: { year: targetYear, month: targetMonth },
      summary: summary,
      pagination: {
        page: page,
        limit: limit,
        totalPages: totalPages,
        totalRecords: totalRecords,
      },
      records: records,
    };
  }

  async edit(userId: string, data: checkSchema.EditCheckTimeDto) {
    let uploadedAttachmentUrl: string | null = null;

    if (data.attachment) {
      const file = data.attachment;
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExtension = file.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${fileExtension}`;
      const s3Key = `time-corrections/${userId}/${fileName}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
        })
      );
      uploadedAttachmentUrl = `/${BUCKET_NAME}/${s3Key}`;
    }
    return await db.transaction(async (tx) => {
      const student = await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, userId),
      });

      if (!student) {
        throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");
      }

      if (Number.isNaN(data.attendanceLogId)) {
        throw new ConflictError("ID ของรายการลงเวลาไม่ถูกต้อง");
      }

      const existingLog = await tx.query.attendanceLogs.findFirst({
        where: eq(attendanceLogs.id, data.attendanceLogId),
        with: {
          checkIn: true,
          checkOut: true,
        },
      });

      if (!existingLog || existingLog.studentProfileId !== student.id) {
        throw new NotFoundError("ไม่พบรายการลงเวลานี้");
      }

      const isMissingOut = existingLog.checkInId && !existingLog.checkOutId;
      const currentStatus = existingLog.dailyStatus;
      const allowedToEdit =
        isMissingOut || currentStatus === "ABSENT" || currentStatus === "LATE";

      if (!allowedToEdit) {
        throw new ConflictError(
          "ไม่อนุญาตให้แก้ไขเวลา (ทำได้เฉพาะกรณี ขาดงาน, มาสาย หรือ ลืมเช็คเอาท์)"
        );
      }

      const originalIn = existingLog.checkIn?.time || null;
      const originalOut = existingLog.checkOut?.time || null;

      const workDate = existingLog.workDate;
      const newInDate = new Date(
        `${workDate}T${data.checkInTime}:00+07:00`
      ).toISOString();
      const newOutDate = new Date(
        `${workDate}T${data.checkOutTime}:00+07:00`
      ).toISOString();

      const calculatedHours = this.calculateCorrectionHours(
        data.checkInTime,
        data.checkOutTime
      );

      const [newRequest] = await tx
        .insert(timeCorrectionRequests)
        .values({
          attendanceLogId: existingLog.id,
          studentProfileId: student.id,
          originalCheckIn: originalIn,
          originalCheckOut: originalOut,
          requestedCheckIn: newInDate,
          requestedCheckOut: newOutDate,
          calculatedHours: calculatedHours,
          reason: data.reason,
          attachmentUrl: uploadedAttachmentUrl,
          status: "PENDING",
        })
        .returning();

      return {
        success: true,
        message: "ส่งคำขอแก้ไขเวลาเรียบร้อยแล้ว (รอผู้ดูแลระบบอนุมัติ)",
        requestId: newRequest.id,
        hoursWorked: calculatedHours,
      };
    });
  }

  private calculateCorrectionHours(
    checkInHHmm: string,
    checkOutHHmm: string
  ): string {
    const [inHour, inMin] = checkInHHmm.split(":").map(Number);
    const [outHour, outMin] = checkOutHHmm.split(":").map(Number);

    const inTime = new Date(1970, 0, 1, inHour, inMin);
    const outTime = new Date(1970, 0, 1, outHour, outMin);

    let totalMs = outTime.getTime() - inTime.getTime();
    if (totalMs < 0) totalMs = 0;

    let hours = totalMs / (1000 * 60 * 60);

    if (hours >= 4) {
      hours -= 1;
    }

    if (hours > 7) hours = 7;
    if (hours < 0) hours = 0;

    return hours.toFixed(2);
  }
}
