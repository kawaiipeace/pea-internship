import crypto from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { and, count, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { ConflictError, ForbiddenError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  attendanceLogs,
  leaveRequests,
  studentProfiles,
  users,
} from "@/db/schema";
import { BUCKET_NAME, s3Client } from "@/lib/s3";
import type * as model from "./model";

export class LeaveService {
  private async assertUserExists(userId: string) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) throw new ForbiddenError("ไม่พบผู้ใช้งานในระบบ");
  }

  private groupLeaveRecords(records: any[]) {
    if (records.length === 0) return [];

    // 1. Sort by date ascending to detect consecutive days
    const sorted = [...records].sort((a, b) =>
      new Date(a.leaveDate).getTime() - new Date(b.leaveDate).getTime()
    );

    const grouped: any[] = [];
    let currentGroup: any = null;

    for (const record of sorted) {
      if (!currentGroup) {
        currentGroup = {
          ...record,
          ids: [record.id],
          startDate: record.leaveDate,
          endDate: record.leaveDate,
        };
        delete currentGroup.id;
        delete currentGroup.leaveDate;
        grouped.push(currentGroup);
        continue;
      }

      const prevDate = new Date(currentGroup.endDate);
      const currDate = new Date(record.leaveDate);

      // Diff in days (rounded to handle potential floating point issues)
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24)
      );

      if (
        diffDays === 1 &&
        record.leaveType === currentGroup.leaveType &&
        record.status === currentGroup.status &&
        record.reason === currentGroup.reason &&
        record.attachmentUrl === currentGroup.attachmentUrl &&
        record.userId === currentGroup.userId
      ) {
        currentGroup.endDate = record.leaveDate;
        currentGroup.ids.push(record.id);
      } else {
        currentGroup = {
          ...record,
          ids: [record.id],
          startDate: record.leaveDate,
          endDate: record.leaveDate,
        };
        delete currentGroup.id;
        delete currentGroup.leaveDate;
        grouped.push(currentGroup);
      }
    }

    // 2. Sort descending by startDate for presentation
    return grouped.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  private getDatesInRange(startDate: string, endDate: string): string[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateArray: string[] = [];

    while (start <= end) {
      dateArray.push(new Date(start).toISOString().split("T")[0]);
      start.setDate(start.getDate() + 1);
    }
    return dateArray;
  }

  async submitLeaveRequest(userId: string, data: model.SubmitLeaveBodyType) {
    await this.assertUserExists(userId);

    let uploadedAttachmentUrl: string | null = null;

    if (data.attachment) {
      const file = data.attachment as File;
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExtension = file.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${fileExtension}`;
      const s3Key = `leave-documents/${userId}/${fileName}`;

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

      if (!student) throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");

      const datesToLeave = this.getDatesInRange(data.startDate, data.endDate);

      const targetDatetimes = datesToLeave.map((date) =>
        `${date}T00:00:00`
      );

      const existingLeaves = await tx.query.leaveRequests.findMany({
        where: and(
          eq(leaveRequests.userId, userId),
          inArray(leaveRequests.leaveDatetime, targetDatetimes),
          inArray(leaveRequests.status, ["PENDING", "APPROVED"])
        ),
      });

      if (existingLeaves.length > 0) {
        const duplicatedDates = existingLeaves
          .map((leave) => {
            const dateStr = leave.leaveDatetime
              ? leave.leaveDatetime
              : String(leave.leaveDatetime);
            return dateStr.substring(0, 10);
          })
          .join(", ");

        throw new ConflictError(
          `ไม่สามารถบันทึกคำขอลาได้ เนื่องจากคุณมีรายการขอลา (สถานะรออนุมัติหรืออนุมัติแล้ว) ในวันที่ ${duplicatedDates} อยู่ในระบบแล้ว`
        );
      }

      const requestsToInsert = datesToLeave.map((date) => ({
        leaveRequestType: data.leaveType as "ABSENCE" | "SICK",
        leavePeriod: "FULL_DAY" as "FULL_DAY" | "MORNING" | "AFTERNOON",
        userId: userId,
        leaveDatetime: `${date}T00:00:00`,
        reason: data.reason,
        file: uploadedAttachmentUrl,
        status: "PENDING" as "PENDING" | "APPROVED" | "REJECTED",
      }));

      await tx.insert(leaveRequests).values(requestsToInsert);

      return {
        success: true,
        message: `ส่งคำขอลาจำนวน ${datesToLeave.length} วันเรียบร้อยแล้ว กรุณารออนุมัติ`,
      };
    });
  }

  async approveLeaveRequest(approverUserId: string, leaveRequestId: number) {
    return await this.bulkApproveLeaveRequests(approverUserId, [leaveRequestId]);
  }

  async bulkApproveLeaveRequests(approverUserId: string, ids: number[]) {
    await this.assertUserExists(approverUserId);

    return await db.transaction(async (tx) => {
      const requests = await tx.query.leaveRequests.findMany({
        where: inArray(leaveRequests.id, ids),
      });

      if (requests.length === 0) {
        throw new NotFoundError("ไม่พบข้อมูลคำขอลาที่ต้องการอนุมัติ");
      }

      for (const request of requests) {
        if (request.status !== "PENDING") continue;

        const student = await tx.query.studentProfiles.findFirst({
          where: eq(studentProfiles.userId, request.userId),
        });

        if (!student) continue;

        const leaveDateStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Bangkok",
        }).format(new Date(request.leaveDatetime!));

        await tx
          .update(leaveRequests)
          .set({
            status: "APPROVED",
            approvedBy: approverUserId,
            approvedAt: new Date().toISOString(),
          })
          .where(eq(leaveRequests.id, request.id));

        const existingLog = await tx.query.attendanceLogs.findFirst({
          where: and(
            eq(attendanceLogs.studentProfileId, student.id),
            eq(attendanceLogs.workDate, leaveDateStr)
          ),
        });

        if (existingLog) {
          await tx
            .update(attendanceLogs)
            .set({
              dailyStatus: "LEAVE",
              approvedLeaveHours: "7.00",
              isVerified: true,
            })
            .where(eq(attendanceLogs.id, existingLog.id));
        } else {
          await tx.insert(attendanceLogs).values({
            studentProfileId: student.id,
            workDate: leaveDateStr,
            checkInTime: null,
            checkOutTime: null,
            dailyStatus: "LEAVE",
            approvedLeaveHours: "7.00",
            totalWorkHours: "0.00",
            isVerified: true,
          });
        }

      return {
        success: true,
        message: "อนุมัติการลาและบันทึกเวลาทำงาน 7 ชั่วโมงเรียบร้อยแล้ว",
      };
    });
  }

  async getLeaveHistory(userId: string, query: model.GetLeaveHistoryQueryType) {
    await this.assertUserExists(userId);

    const { page = 1, limit = 10, type } = query;
    const now = new Date();
    const targetYear = query.year || now.getFullYear();
    const targetMonth = query.month || now.getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endOfMonth = new Date(
      targetYear,
      targetMonth,
      0,
      23,
      59,
      59
    ).toISOString();

    const baseCondition = and(
      eq(leaveRequests.userId, userId),
      gte(leaveRequests.leaveDatetime, startOfMonth),
      lte(leaveRequests.leaveDatetime, endOfMonth)
    );

    const allRecordsForSummary = await db.query.leaveRequests.findMany({
      where: baseCondition,
      columns: { leaveRequestType: true, status: true },
    });

    let totalAbsence = 0;
    let totalSick = 0;

    allRecordsForSummary.forEach((log) => {
      // (ทางเลือก) ถ้าระบบคุณไม่นับใบลาที่ถูกปฏิเสธ (REJECTED) ให้ใส่ if เช็คสถานะตรงนี้เพิ่มได้
      if (log.leaveRequestType === "ABSENCE") totalAbsence++;
      else if (log.leaveRequestType === "SICK") totalSick++;
    });

    const summary = {
      total: totalAbsence + totalSick,
      absence: totalAbsence,
      sick: totalSick,
    };

    const listFilters = [baseCondition];

    if (type) {
      listFilters.push(eq(leaveRequests.leaveRequestType, type));
    }

    const finalCondition = and(...listFilters);

    const historyData = await db.query.leaveRequests.findMany({
      where: finalCondition,
      orderBy: [desc(leaveRequests.leaveDatetime)],
    });

    const rawRecords = historyData.map((record) => {
      return {
        id: record.id,
        userId: record.userId,
        leaveDate: record.leaveDatetime,
        leaveType: record.leaveRequestType,
        status: record.status,
        reason: record.reason,
        attachmentUrl: record.file,
      };
    });

    const groupedRecords = this.groupLeaveRecords(rawRecords);
    const totalFilteredRecords = groupedRecords.length;
    const totalPages = Math.ceil(totalFilteredRecords / limit);
    const offset = (page - 1) * limit;
    const pagedRecords = groupedRecords.slice(offset, offset + limit);

    return {
      period: { year: targetYear, month: targetMonth },
      summary,
      pagination: {
        page,
        limit,
        totalPages,
        totalRecords: totalFilteredRecords,
      },
      records: pagedRecords,
    };
  }

  async getMentorLeaveRequests(
    mentorUserId: string,
    query: model.GetMentorLeaveRequestsQueryType
  ) {
    const { page = 1, limit = 10, status, viewType } = query;

    const mentor = await db.query.users.findFirst({
      where: eq(users.id, mentorUserId),
      with: { staffProfiles: true },
    });

    if (!mentor || !mentor.staffProfiles) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะพี่เลี้ยงเท่านั้น)");
    }

    const appConditions = [eq(applicationStatuses.isActive, true)];

    if (viewType === "ALL") {
    } else {
      if (mentor.departmentId) {
        appConditions.push(
          eq(applicationStatuses.departmentId, mentor.departmentId)
        );
      }
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

    const leaveConditions = [inArray(leaveRequests.userId, studentUserIds)];

    if (status) {
      leaveConditions.push(eq(leaveRequests.status, status));
    }

    const finalCondition = and(...leaveConditions);

    const historyData = await db
      .select({
        id: leaveRequests.id,
        leaveDatetime: leaveRequests.leaveDatetime,
        leaveRequestType: leaveRequests.leaveRequestType,
        status: leaveRequests.status,
        reason: leaveRequests.reason,
        file: leaveRequests.file,
        userId: leaveRequests.userId,
        fname: users.fname,
        lname: users.lname,
        image: studentProfiles.image,
      })
      .from(leaveRequests)
      .innerJoin(users, eq(users.id, leaveRequests.userId))
      .innerJoin(
        studentProfiles,
        eq(studentProfiles.userId, leaveRequests.userId)
      )
      .where(finalCondition)
      .orderBy(desc(leaveRequests.leaveDatetime));

    const rawRecords = historyData.map((record) => {
      return {
        id: record.id,
        userId: record.userId,
        leaveDate: record.leaveDatetime,
        leaveType: record.leaveRequestType,
        status: record.status,
        reason: record.reason,
        attachmentUrl: record.file,
        studentName:
          `${record.fname || ""} ${record.lname || ""}`.trim() ||
          "นักศึกษา (ไม่ระบุชื่อ)",
        profileImg: record.image || null,
      };
    });

    const groupedRecords = this.groupLeaveRecords(rawRecords);
    const totalFilteredRecords = groupedRecords.length;
    const totalPages = Math.ceil(totalFilteredRecords / limit);
    const offset = (page - 1) * limit;
    const pagedRecords = groupedRecords.slice(offset, offset + limit);

    return {
      data: pagedRecords,
      meta: {
        page,
        limit,
        totalPages,
        totalRecords: totalFilteredRecords,
      },
    };
  }

  async rejectLeaveRequest(
    approverUserId: string,
    leaveRequestId: number,
    reason: string
  ) {
    await this.assertUserExists(approverUserId);

    return await db.transaction(async (tx) => {
      const request = await tx.query.leaveRequests.findFirst({
        where: eq(leaveRequests.id, leaveRequestId),
      });

      if (!request) throw new NotFoundError("ไม่พบคำขอลา");
      if (request.status !== "PENDING") {
        throw new ConflictError("คำขอลานี้ถูกดำเนินการไปแล้ว");
      }

      await tx
        .update(leaveRequests)
        .set({
          status: "REJECTED",
          approvedBy: approverUserId,
          approverNote: reason,
          approvedAt: new Date().toISOString(),
        })
        .where(eq(leaveRequests.id, leaveRequestId));

      return {
        success: true,
        message: "ปฏิเสธคำขอลาเรียบร้อยแล้ว",
      };
    });
  }

  async deleteLeaveRequest(userId: string, id: number) {
    return await this.bulkDeleteLeaveRequests(userId, [id]);
  }

  async bulkDeleteLeaveRequests(userId: string, ids: number[]) {
    await this.assertUserExists(userId);

    const requests = await db.query.leaveRequests.findMany({
      where: and(
        inArray(leaveRequests.id, ids),
        eq(leaveRequests.userId, userId)
      ),
    });

    if (requests.length === 0) {
      throw new NotFoundError(`ไม่พบข้อมูลใบลาที่ต้องการยกเลิก`);
    }

    const unprocessible = requests.filter((r) => r.status !== "PENDING");
    if (unprocessible.length > 0) {
      throw new ConflictError(
        "ไม่สามารถยกเลิกได้ เนื่องจากบางรายการถูกดำเนินการไปแล้ว (APPROVED/REJECTED)"
      );
    }

    return await db.transaction(async (tx) => {
      for (const request of requests) {
        if (request.file) {
          try {
            const s3Key = request.file.startsWith("/")
              ? request.file.slice(1)
              : request.file;

            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key,
              })
            );
          } catch (error) {
            console.error("ลบไฟล์ใน S3 ล้มเหลว:", error);
          }
        }
      }

      await tx.delete(leaveRequests).where(inArray(leaveRequests.id, ids));

      return { success: true, message: "ยกเลิกคำขอลาเรียบร้อยแล้ว" };
    });
  }
}
