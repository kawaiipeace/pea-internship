import crypto from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  not,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  attendanceLogs,
  checkTimes,
  leaveRequests,
  offsiteTaskStudents,
  offsiteTasks,
  studentProfiles,
  timeCorrectionRequests,
  users,
} from "@/db/schema";
import { BUCKET_NAME, s3Client } from "@/lib/s3";
import type * as checkSchema from "./model";

type CorrectionRequestData = {
  id: number;
  attendanceLogId: number;
  status: string;
};

type StatusFilter =
  | "PRESENT"
  | "LATE"
  | "LEAVE"
  | "ABSENT"
  | "MISSING_OUT"
  | "";

interface AttendanceRecord {
  id: number;
  workDate: string;
  displayStatus: string;
  checkInTime: string;
  checkOutTime: string;
  location: string;
  workingHours: string;
  isEdited: boolean;
  correctionStatus: string | null;
  correctionId: number | null;
  leaveType: string | null;
  leaveReason: string | null;
  attachmentUrl: string | null;
}

interface GroupedAttendanceRecord extends AttendanceRecord {
  ids: number[];
  startDate: string;
  endDate: string;
}

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

  private calculateCorrectionHours(
    checkInHHmm: string,
    checkOutHHmm: string
  ): string {
    const [inHour, inMin] = checkInHHmm.split(":").map(Number);
    const [outHour, outMin] = checkOutHHmm.split(":").map(Number);

    const inTime = new Date(1970, 0, 1, inHour, inMin);
    const outTime = new Date(1970, 0, 1, outHour, outMin);

    const lunchStart = new Date(1970, 0, 1, 12, 0);
    const lunchEnd = new Date(1970, 0, 1, 13, 0);

    let totalMs = 0;
    if (inTime < lunchStart) {
      const morningEnd = outTime < lunchStart ? outTime : lunchStart;
      totalMs += Math.max(0, morningEnd.getTime() - inTime.getTime());
    }
    if (outTime > lunchEnd) {
      const afternoonStart = inTime > lunchEnd ? inTime : lunchEnd;
      totalMs += Math.max(0, outTime.getTime() - afternoonStart.getTime());
    }

    let hours = totalMs / (1000 * 60 * 60);

    // Consistency check: If checked in within grace period and stayed past lunch, credit full 7 hours
    // This matches the logic in the 'out' method for standard working days (e.g., 08:30 - 16:30)
    if (inHour < 8 || (inHour === 8 && inMin <= 45)) {
      if (outHour >= 16) {
        hours = 7;
      }
    }

    if (hours > 7) hours = 7;
    if (hours < 0) hours = 0;

    return hours.toFixed(2);
  }

  async in(userId: string, ip: string, data: checkSchema.CheckTimeDto) {
    return await db.transaction(async (tx) => {
      const student = await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, userId),
      });

      if (!student) throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");

      const activeApp = await tx.query.applicationStatuses.findFirst({
        where: and(
          eq(applicationStatuses.userId, userId),
          eq(applicationStatuses.isActive, true)
        ),
        with: { department: { with: { office: true } } },
      });

      if (!activeApp?.department?.office) {
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
              "ไม่อนุญาตให้เช็คอินนอกสถานที่ เนื่องจากไม่มีกำหนดการ (ต้องอยู่ในรัศมี 300 เมตร)"
            );
          }
          finalLocationText = `นอกสถานที่: ${assignedTask[0].offsite_tasks.locationName} (ห่างสำนักงาน ${Math.round(distance)} เมตร)`;
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

      let lateMinutes = 0;
      let status: "PRESENT" | "LATE" = "PRESENT";

      if (currentBkkTime > lateCutoffTime) {
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
            dailyStatus: status,
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
        message:
          status === "LATE"
            ? `คุณมาสาย ${lateMinutes} นาที`
            : "บันทึกเวลาเข้างานสำเร็จ",
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

      if (!student) throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");

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

      if (!existingLog?.checkInId) {
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
        with: { department: { with: { office: true } } },
      });

      if (!activeApp?.department?.office)
        throw new NotFoundError("ไม่พบข้อมูลสำนักงาน");

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
              "ไม่อนุญาตให้เช็คเอาท์นอกสถานที่ (ต้องอยู่ในรัศมี 300 เมตร)"
            );
          }
          finalLocationText = `นอกสถานที่: ${assignedTask[0].offsite_tasks.locationName} (ห่างสำนักงาน ${Math.round(distance)} เมตร)`;
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

        if (calcIn <= gracePeriod) calcIn = shiftStart;
        if (calcOut > shiftEnd) calcOut = shiftEnd;

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

        if (inTime <= gracePeriod && outTime >= lunchEnd) {
          hours = 7;
        }

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
          isVerified: isOnsite,
        })
        .where(eq(attendanceLogs.id, existingLog.id));

      return {
        success: true,
        message: "บันทึกเวลาออกงานสำเร็จ",
        checkOutTime: now.toISOString(),
        hoursWorked: actualHoursWorked,
        status: existingLog.dailyStatus, // ส่งสถานะกลับให้ Frontend เอาไปโชว์ (PRESENT/LATE)
        location: finalLocationText,
        isOnsite: isOnsite,
      };
    });
  }

  private groupAttendanceRecords(records: AttendanceRecord[]) {
    if (records.length === 0) return [];

    // 1. Sort by workDate ascending to detect consecutive days
    const sorted = [...records].sort(
      (a, b) => new Date(a.workDate).getTime() - new Date(b.workDate).getTime()
    );

    const grouped: GroupedAttendanceRecord[] = [];
    let currentGroup: GroupedAttendanceRecord | null = null;

    for (const record of sorted) {
      // We only group records with status 'LEAVE'
      const isLeave = record.displayStatus === "LEAVE";

      if (!isLeave) {
        // Close current group if any
        currentGroup = null;
        grouped.push({
          ...record,
          startDate: record.workDate,
          endDate: record.workDate,
          ids: [record.id],
        });
        continue;
      }

      if (!currentGroup || currentGroup.displayStatus !== "LEAVE") {
        currentGroup = {
          ...record,
          ids: [record.id],
          startDate: record.workDate,
          endDate: record.workDate,
        };
        grouped.push(currentGroup);
      } else {
        const prevDate = new Date(currentGroup.endDate);
        const currDate = new Date(record.workDate);
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24)
        );

        // Check if consecutive and shared attributes match
        if (
          diffDays === 1 &&
          record.leaveType === currentGroup.leaveType &&
          record.leaveReason === currentGroup.leaveReason
        ) {
          currentGroup.endDate = record.workDate;
          currentGroup.ids.push(record.id);
        } else {
          currentGroup = {
            ...record,
            ids: [record.id],
            startDate: record.workDate,
            endDate: record.workDate,
          };
          grouped.push(currentGroup);
        }
      }
    }

    // 2. Sort descending by startDate for presentation
    return grouped.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  async history(
    userId: string,
    year?: number,
    month?: number,
    page: number = 1,
    limit: number = 10,
    filterStatus?: StatusFilter
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

    const bkkFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = bkkFormatter.format(now);

    const baseCondition = and(
      eq(attendanceLogs.studentProfileId, student.id),
      gte(attendanceLogs.workDate, startDate),
      lte(attendanceLogs.workDate, endDate)
    );

    const allRecordsForSummary = await db.query.attendanceLogs.findMany({
      where: baseCondition,
      columns: {
        dailyStatus: true,
        checkInId: true,
        checkOutId: true,
        workDate: true,
      },
    });

    const summary = {
      present: 0,
      late: 0,
      leave: 0,
      absent: 0,
      missingOut: 0,
      total: allRecordsForSummary.length,
    };

    allRecordsForSummary.forEach((log) => {
      let displayStatus = log.dailyStatus;
      const logDateStr = String(log.workDate).substring(0, 10);
      if (
        (log.dailyStatus === "PRESENT" || log.dailyStatus === "LATE") &&
        log.checkInId &&
        !log.checkOutId &&
        logDateStr !== todayStr
      ) {
        displayStatus = "MISSING_OUT";
      }

      if (displayStatus === "PRESENT") summary.present++;
      else if (displayStatus === "LATE") summary.late++;
      else if (displayStatus === "LEAVE") summary.leave++;
      else if (displayStatus === "ABSENT") summary.absent++;
      else if (displayStatus === "MISSING_OUT") summary.missingOut++;
    });

    let filterCondition: SQL | undefined;

    if (filterStatus === "MISSING_OUT") {
      filterCondition = and(
        inArray(attendanceLogs.dailyStatus, ["PRESENT", "LATE"]),
        isNotNull(attendanceLogs.checkInId),
        isNull(attendanceLogs.checkOutId),
        not(eq(attendanceLogs.workDate, todayStr))
      );
    } else if (filterStatus === "PRESENT" || filterStatus === "LATE") {
      filterCondition = and(
        eq(attendanceLogs.dailyStatus, filterStatus),
        or(
          isNotNull(attendanceLogs.checkOutId),
          eq(attendanceLogs.workDate, todayStr),
          isNull(attendanceLogs.checkInId)
        )
      );
    } else if (filterStatus === "LEAVE" || filterStatus === "ABSENT") {
      filterCondition = eq(attendanceLogs.dailyStatus, filterStatus);
    }

    const listCondition = and(baseCondition, filterCondition);

    const offset = (page - 1) * limit;

    const historyData = await db.query.attendanceLogs.findMany({
      where: listCondition,
      orderBy: [desc(attendanceLogs.workDate)],
      with: {
        checkIn: { columns: { time: true, location: true } },
        checkOut: { columns: { time: true, location: true } },
      },
    });

    const leaveRecords = await db.query.leaveRequests.findMany({
      where: and(
        eq(leaveRequests.userId, userId),
        gte(leaveRequests.leaveDatetime, startDate),
        lte(leaveRequests.leaveDatetime, `${endDate} 23:59:59`)
      ),
    });

    const logIds = historyData.map((log) => log.id);
    let correctionRequests: CorrectionRequestData[] = [];

    if (logIds.length > 0) {
      correctionRequests = (await db.query.timeCorrectionRequests.findMany({
        where: inArray(timeCorrectionRequests.attendanceLogId, logIds),
        columns: {
          id: true,
          attendanceLogId: true,
          status: true,
        },
      })) as CorrectionRequestData[];
    }

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

      const logDateStr = String(log.workDate).substring(0, 10);

      let displayStatus = log.dailyStatus;

      if (
        (log.dailyStatus === "PRESENT" || log.dailyStatus === "LATE") &&
        log.checkInId &&
        !log.checkOutId &&
        logDateStr !== todayStr
      ) {
        displayStatus = "MISSING_OUT";
      }

      const correctionData = correctionRequests.find(
        (req) => req.attendanceLogId === log.id
      );

      const leaveData = leaveRecords.find((l) => {
        const lDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Bangkok",
        }).format(new Date(l.leaveDatetime!));
        return lDate === logDateStr;
      });

      return {
        id: log.id,
        workDate: log.workDate,
        displayStatus: displayStatus,
        checkInTime: inTime,
        checkOutTime: outTime,
        location: log.checkIn?.location || "-",
        workingHours: log.actualHoursWorked
          ? `${log.actualHoursWorked} ชั่วโมง`
          : "-",
        isEdited: !!correctionData,
        correctionStatus: correctionData?.status || null,
        correctionId: correctionData?.id || null,
        leaveType: leaveData
          ? leaveData.leaveRequestType === "ABSENCE"
            ? "ลากิจ"
            : "ลาป่วย"
          : null,
        leaveReason: leaveData?.reason || null,
        attachmentUrl: leaveData?.file || null,
      };
    });

    const allGroupedRecords = this.groupAttendanceRecords(records);
    const totalFilteredRecordsAfterGrouping = allGroupedRecords.length;
    const totalPagesAfterGrouping = Math.ceil(
      totalFilteredRecordsAfterGrouping / limit
    );
    const pagedRecords = allGroupedRecords.slice(offset, offset + limit);

    return {
      period: { year: targetYear, month: targetMonth },
      summary: summary,
      pagination: {
        page: page,
        limit: limit,
        totalPages: totalPagesAfterGrouping,
        totalRecords: totalFilteredRecordsAfterGrouping,
      },
      records: pagedRecords,
    };
  }

  async edit(userId: string, data: checkSchema.EditCheckTimeDto) {
    if (Number.isNaN(data.attendanceLogId)) {
      throw new ConflictError("ID ของรายการลงเวลาไม่ถูกต้อง");
    }

    const existingRequest = await db.query.timeCorrectionRequests.findFirst({
      where: eq(timeCorrectionRequests.attendanceLogId, data.attendanceLogId),
    });

    if (existingRequest && existingRequest.status !== "REJECTED") {
      throw new ConflictError(
        "คุณได้ส่งคำขอแก้ไขเวลาสำหรับรายการนี้ไปแล้ว (รอการตรวจสอบ)"
      );
    }

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
      uploadedAttachmentUrl = `/${s3Key}`;
    }

    return await db.transaction(async (tx) => {
      const student = await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, userId),
      });

      if (!student) {
        throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");
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

      // Allow editing if it's MISSING_OUT, ABSENT, LATE, or even PRESENT/LEAVE (if they need to fix details)
      // The mentor will still need to approve it.
      const allowedToEdit =
        isMissingOut ||
        ["ABSENT", "LATE", "PRESENT", "LEAVE"].includes(currentStatus);

      if (!allowedToEdit) {
        throw new ConflictError(
          "ไม่อนุญาตให้แก้ไขเวลา (ทำได้เฉพาะกรณี ขาดงาน, มาสาย, ลืมเช็คเอาท์ หรือแก้ไขข้อมูลที่ผิดพลาด)"
        );
      }

      const duplicateCheckInTx =
        await tx.query.timeCorrectionRequests.findFirst({
          where: eq(timeCorrectionRequests.attendanceLogId, existingLog.id),
        });

      if (duplicateCheckInTx && duplicateCheckInTx.status !== "REJECTED") {
        throw new ConflictError("คำขอแก้ไขเวลานี้ถูกส่งไปแล้วและอยู่ระหว่างรอตรวจสอบ");
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

      let resultRequest: { id: number } | null = null;

      if (duplicateCheckInTx) {
        // Update existing rejected request
        const [updatedRequest] = await tx
          .update(timeCorrectionRequests)
          .set({
            originalCheckIn: originalIn,
            originalCheckOut: originalOut,
            requestedCheckIn: newInDate,
            requestedCheckOut: newOutDate,
            calculatedHours: calculatedHours,
            reason: data.reason,
            attachmentUrl:
              uploadedAttachmentUrl || duplicateCheckInTx.attachmentUrl,
            status: "PENDING",
            updatedAt: new Date(),
          })
          .where(eq(timeCorrectionRequests.id, duplicateCheckInTx.id))
          .returning();
        resultRequest = updatedRequest;
      } else {
        // Create new request
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
        resultRequest = newRequest;
      }

      return {
        success: true,
        message: "ส่งคำขอแก้ไขเวลาเรียบร้อยแล้ว (รอผู้ดูแลระบบอนุมัติ)",
        requestId: resultRequest.id,
        hoursWorked: calculatedHours,
      };
    });
  }

  async getCorrectionDetail(userId: string, requestId: number) {
    const requestDetail = await db.query.timeCorrectionRequests.findFirst({
      where: eq(timeCorrectionRequests.id, requestId),
      with: {
        studentProfile: true,
        attendanceLog: true,
      },
    });

    if (!requestDetail) {
      throw new NotFoundError("ไม่พบข้อมูลคำขอแก้ไขเวลานี้");
    }

    if (requestDetail.studentProfile?.userId !== userId) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
    }

    const logInfo = requestDetail.attendanceLog;

    const formatTime = (isoDateString: string | null) => {
      if (!isoDateString) return null;
      const date = new Date(isoDateString);
      return date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
      });
    };

    const getFileName = (url: string | null) => {
      if (!url) return null;
      return url.split("/").pop() || "เอกสารแนบ";
    };

    return {
      success: true,
      data: {
        id: requestDetail.id,
        workDate: logInfo?.workDate || null,
        status: requestDetail.status,
        original: {
          checkInTime: formatTime(requestDetail.originalCheckIn),
          checkOutTime: formatTime(requestDetail.originalCheckOut),
          hoursWorked: logInfo?.actualHoursWorked || 0,
        },
        requested: {
          checkInTime: formatTime(requestDetail.requestedCheckIn),
          checkOutTime: formatTime(requestDetail.requestedCheckOut),
          hoursWorked: requestDetail.calculatedHours,
        },
        reason: requestDetail.reason,
        approverNote: requestDetail.approverNote,
        attachment: {
          url: requestDetail.attachmentUrl,
          name: getFileName(requestDetail.attachmentUrl),
        },
      },
    };
  }

  async getFile(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const data = await s3Client.send(command);

      return {
        buffer: await data.Body?.transformToByteArray(),
        contentType: data.ContentType || "application/octet-stream",
      };
    } catch (error) {
      console.error("Error fetching file from MinIO:", error);
      throw new NotFoundError("ไม่พบไฟล์ที่ต้องการ หรือไฟล์ถูกลบไปแล้ว");
    }
  }
  async getMentorCorrections(
    mentorUserId: string,
    query: checkSchema.GetMentorCorrectionsQueryType
  ) {
    const { page = 1, limit = 10, status, viewType, excludePending } = query;

    const mentor = await db.query.users.findFirst({
      where: eq(users.id, mentorUserId),
      with: { staffProfiles: true },
    });

    if (!mentor?.staffProfiles) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะพี่เลี้ยงเท่านั้น)");
    }

    const appConditions = [eq(applicationStatuses.isActive, true)];

    if (viewType === "MINE" && mentor.departmentId) {
      appConditions.push(
        eq(applicationStatuses.departmentId, mentor.departmentId)
      );
    }

    const applications = await db.query.applicationStatuses.findMany({
      where: and(...appConditions),
    });

    const studentUserIds = applications.map((a) => a.userId);

    if (studentUserIds.length === 0) {
      return {
        data: [],
        meta: { page, limit, totalPages: 0, totalRecords: 0 },
      };
    }

    const profiles = await db.query.studentProfiles.findMany({
      where: inArray(studentProfiles.userId, studentUserIds),
      columns: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    if (profileIds.length === 0) {
      return {
        data: [],
        meta: { page, limit, totalPages: 0, totalRecords: 0 },
      };
    }

    const correctionConditions = [
      inArray(timeCorrectionRequests.studentProfileId, profileIds),
    ];

    if (status) {
      correctionConditions.push(eq(timeCorrectionRequests.status, status));
    }

    if (excludePending === "true") {
      correctionConditions.push(
        not(eq(timeCorrectionRequests.status, "PENDING"))
      );
    }

    const finalCondition = and(...correctionConditions);

    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(timeCorrectionRequests)
      .where(finalCondition);

    const totalFilteredRecords = Number(totalCountResult.count);
    const totalPages = Math.ceil(totalFilteredRecords / limit);
    const offset = (page - 1) * limit;

    const bkkFormatter2 = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = bkkFormatter2.format(new Date());

    const requestsData = await db
      .select({
        id: timeCorrectionRequests.id,
        createdAt: timeCorrectionRequests.createdAt,
        originalCheckIn: timeCorrectionRequests.originalCheckIn,
        originalCheckOut: timeCorrectionRequests.originalCheckOut,
        requestedCheckIn: timeCorrectionRequests.requestedCheckIn,
        requestedCheckOut: timeCorrectionRequests.requestedCheckOut,
        calculatedHours: timeCorrectionRequests.calculatedHours,
        reason: timeCorrectionRequests.reason,
        attachmentUrl: timeCorrectionRequests.attachmentUrl,
        status: timeCorrectionRequests.status,
        workDate: attendanceLogs.workDate,
        dailyStatus: attendanceLogs.dailyStatus,
        checkInId: attendanceLogs.checkInId,
        checkOutId: attendanceLogs.checkOutId,
        fname: users.fname,
        lname: users.lname,
        username: users.displayUsername,
        image: studentProfiles.image,
        approverNote: timeCorrectionRequests.approverNote,
      })
      .from(timeCorrectionRequests)
      .innerJoin(
        attendanceLogs,
        eq(attendanceLogs.id, timeCorrectionRequests.attendanceLogId)
      )
      .innerJoin(
        studentProfiles,
        eq(studentProfiles.id, timeCorrectionRequests.studentProfileId)
      )
      .innerJoin(users, eq(users.id, studentProfiles.userId))
      .where(finalCondition)
      .orderBy(desc(timeCorrectionRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const formatTime = (timeStr: Date | string | null) => {
      if (!timeStr) return "ไม่ลงเวลา";
      return new Date(timeStr).toLocaleTimeString("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const records = requestsData.map((record) => {
      const logDateStr = String(record.workDate).substring(0, 10);
      let attendanceStatus = record.dailyStatus;

      if (
        (record.dailyStatus === "PRESENT" || record.dailyStatus === "LATE") &&
        record.checkInId &&
        !record.checkOutId &&
        logDateStr !== todayStr
      ) {
        attendanceStatus = "MISSING_OUT";
      }

      return {
        id: record.id,
        studentName:
          `${record.fname || ""} ${record.lname || ""} (${record.username || ""})`.trim(),
        profileImg: record.image || null,
        createdAt: record.createdAt,
        workDate: record.workDate,
        originalTime: `${formatTime(record.originalCheckIn)} - ${formatTime(record.originalCheckOut)}`,
        requestedTime: `${formatTime(record.requestedCheckIn)} - ${formatTime(record.requestedCheckOut)}`,
        hoursWorked: record.calculatedHours,
        reason: record.reason,
        attachmentUrl: record.attachmentUrl,
        status: record.status,
        attendanceStatus: attendanceStatus,
        approverNote: record.approverNote,
      };
    });

    return {
      data: records,
      meta: {
        page,
        limit,
        totalPages,
        totalRecords: totalFilteredRecords,
      },
    };
  }

  async approveCorrection(approverUserId: string, requestId: number) {
    return await db.transaction(async (tx) => {
      const request = await tx.query.timeCorrectionRequests.findFirst({
        where: eq(timeCorrectionRequests.id, requestId),
        with: { studentProfile: true },
      });

      if (!request) throw new NotFoundError("ไม่พบคำขอแก้ไขเวลานี้");
      if (request.status !== "PENDING") {
        throw new ConflictError("คำขอนี้ถูกดำเนินการไปแล้ว");
      }

      await tx
        .update(timeCorrectionRequests)
        .set({
          status: "APPROVED",
          approvedBy: approverUserId,
          updatedAt: new Date(),
        })
        .where(eq(timeCorrectionRequests.id, requestId));

      const [newCheckIn] = await tx
        .insert(checkTimes)
        .values({
          userId: request.studentProfile.userId,
          time: request.requestedCheckIn,
          typeCheck: "IN",
          isOnsite: true,
          location: "แก้ไขเวลาโดยพี่เลี้ยง",
          note: "แก้ไขเวลาเข้างาน",
        })
        .returning();

      const [newCheckOut] = await tx
        .insert(checkTimes)
        .values({
          userId: request.studentProfile.userId,
          time: request.requestedCheckOut,
          typeCheck: "OUT",
          isOnsite: true,
          location: "แก้ไขเวลาโดยพี่เลี้ยง",
          note: "แก้ไขเวลาออกงาน",
        })
        .returning();

      const bkkTimeStr = new Date(request.requestedCheckIn).toLocaleString(
        "en-US",
        { timeZone: "Asia/Bangkok" }
      );
      const inTime = new Date(bkkTimeStr);

      const workStartTime = new Date(bkkTimeStr);
      workStartTime.setHours(8, 30, 0, 0);

      const lateCutoffTime = new Date(bkkTimeStr);
      lateCutoffTime.setHours(8, 45, 0, 0);

      let statusToUpdate: "PRESENT" | "LATE" = "PRESENT";
      let newLateMinutes = 0;

      if (inTime > lateCutoffTime) {
        statusToUpdate = "LATE";
        const diffMs = inTime.getTime() - workStartTime.getTime();
        newLateMinutes = Math.floor(diffMs / 60000);
      }

      await tx
        .update(attendanceLogs)
        .set({
          checkInId: newCheckIn.id,
          checkOutId: newCheckOut.id,
          actualHoursWorked: request.calculatedHours,
          dailyStatus: statusToUpdate,
          lateMinutes: newLateMinutes,
          isVerified: true,
        })
        .where(eq(attendanceLogs.id, request.attendanceLogId));

      return {
        success: true,
        message: "อนุมัติคำขอแก้ไขเวลาเรียบร้อยแล้ว",
        newStatus: statusToUpdate,
        lateMinutes: newLateMinutes,
      };
    });
  }

  async rejectCorrection(
    approverUserId: string,
    requestId: number,
    reason: string
  ) {
    return await db.transaction(async (tx) => {
      const request = await tx.query.timeCorrectionRequests.findFirst({
        where: eq(timeCorrectionRequests.id, requestId),
      });

      if (!request) throw new NotFoundError("ไม่พบคำขอแก้ไขเวลานี้");
      if (request.status !== "PENDING") {
        throw new ConflictError("คำขอนี้ถูกดำเนินการไปแล้ว");
      }

      await tx
        .update(timeCorrectionRequests)
        .set({
          status: "REJECTED",
          approvedBy: approverUserId,
          approverNote: reason,
          updatedAt: new Date(),
        })
        .where(eq(timeCorrectionRequests.id, requestId));

      return {
        success: true,
        message: "ปฏิเสธคำขอแก้ไขเวลาเรียบร้อยแล้ว",
      };
    });
  }
}
