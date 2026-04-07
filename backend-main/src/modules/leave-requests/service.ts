import crypto from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { ConflictError, ForbiddenError } from "@/common/exceptions";
import { db } from "@/db";
import {
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

      const requestsToInsert = datesToLeave.map((date) => ({
        leaveRequestType: data.leaveType as "ABSENCE" | "SICK",
        leavePeriod: "FULL_DAY" as "FULL_DAY" | "MORNING" | "AFTERNOON",
        userId: userId,
        leaveDatetime: new Date(`${date}T00:00:00+07:00`).toISOString(),
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
    await this.assertUserExists(approverUserId);

    return await db.transaction(async (tx) => {
      const request = await tx.query.leaveRequests.findFirst({
        where: eq(leaveRequests.id, leaveRequestId),
      });

      if (!request) throw new NotFoundError("ไม่พบคำขอลา");
      if (request.status !== "PENDING") {
        throw new ConflictError("คำขอลานี้ถูกดำเนินการไปแล้ว");
      }

      const student = await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, request.userId),
      });

      if (!student) throw new NotFoundError("ไม่พบข้อมูลนักศึกษาของคำขอลานี้");

      const leaveDateStr = new Date(request.leaveDatetime!)
        .toISOString()
        .split("T")[0];

      await tx
        .update(leaveRequests)
        .set({
          status: "APPROVED",
          approvedBy: approverUserId,
          approvedAt: new Date().toISOString(),
        })
        .where(eq(leaveRequests.id, leaveRequestId));

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
          dailyStatus: "LEAVE",
          approvedLeaveHours: "7.00",
          actualHoursWorked: "0.00",
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

    const [totalCountResult] = await db
      .select({ count: count() })
      .from(leaveRequests)
      .where(finalCondition);

    const totalFilteredRecords = Number(totalCountResult.count);
    const totalPages = Math.ceil(totalFilteredRecords / limit);
    const offset = (page - 1) * limit;

    const historyData = await db.query.leaveRequests.findMany({
      where: finalCondition,
      orderBy: [desc(leaveRequests.leaveDatetime)],
      limit: limit,
      offset: offset,
    });

    const records = historyData.map((record) => {
      return {
        id: record.id,
        leaveDate: new Date(record.leaveDatetime!).toISOString(),
        leaveType: record.leaveRequestType,
        status: record.status,
        reason: record.reason,
        attachmentUrl: record.file,
      };
    });

    return {
      period: { year: targetYear, month: targetMonth },
      summary,
      pagination: {
        page,
        limit,
        totalPages,
        totalRecords: totalFilteredRecords,
      },
      records,
    };
  }

  async deleteLeaveRequest(userId: string, id: number) {
    await this.assertUserExists(userId);
    const request = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, id),
    });

    if (!request) {
      throw new NotFoundError(`ไม่พบข้อมูลใบลาที่ต้องการลบ (ID: ${id})`);
    }
    if (request.userId !== userId) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์ลบรายการลาของผู้อื่น");
    }
    if (request.status !== "PENDING") {
      throw new ConflictError(
        "ไม่สามารถลบได้ เนื่องจากใบลาถูกดำเนินการไปแล้ว (APPROVED/REJECTED)"
      );
    }

    return await db.transaction(async (tx) => {
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

      await tx.delete(leaveRequests).where(eq(leaveRequests.id, id));

      return { success: true, message: "ยกเลิกคำขอลาเรียบร้อยแล้ว" };
    });
  }
}
