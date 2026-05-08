import crypto from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  asc,
  aliasedTable,
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { NotFoundError } from "elysia";
import { ConflictError, ForbiddenError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  attendanceLogs,
  leaveRequests,
  type leaveStatusEnum,
  notifications,
  studentProfiles,
  users,
} from "@/db/schema";
import { BUCKET_NAME, s3Client } from "@/lib/s3";
import type * as model from "./model";

interface LeaveRecord {
  id: number;
  userId: string;
  leaveDate: string | null;
  leaveType: string;
  status: string;
  reason: string | null;
  attachmentUrl: string | null;
  studentName?: string;
  profileImg?: string | null;
  approverNote?: string | null;
}

interface GroupedLeaveRecord extends Omit<LeaveRecord, "id" | "leaveDate"> {
  ids: number[];
  startDate: string | null;
  endDate: string | null;
}

export class LeaveService {
  private async assertUserExists(userId: string) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) throw new ForbiddenError("ไม่พบผู้ใช้งานในระบบ");
  }

  private groupLeaveRecords(records: LeaveRecord[]) {
    if (records.length === 0) return [];

    // 1. Sort by date ascending to detect consecutive days
    const sorted = [...records].sort(
      (a, b) =>
        new Date(a.leaveDate!).getTime() - new Date(b.leaveDate!).getTime()
    );

    const grouped: GroupedLeaveRecord[] = [];
    let currentGroup: GroupedLeaveRecord | null = null;

    for (const record of sorted) {
      if (!currentGroup) {
        const { id, leaveDate, ...rest } = record;
        currentGroup = {
          ...rest,
          ids: [id],
          startDate: leaveDate,
          endDate: leaveDate,
        };
        grouped.push(currentGroup);
        continue;
      }

      const prevDate = new Date(currentGroup.endDate!);
      const currDate = new Date(record.leaveDate!);

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
        record.userId === currentGroup.userId &&
        record.approverNote === currentGroup.approverNote
      ) {
        currentGroup.endDate = record.leaveDate;
        currentGroup.ids.push(record.id);
      } else {
        const { id, leaveDate, ...rest } = record;
        currentGroup = {
          ...rest,
          ids: [id],
          startDate: leaveDate,
          endDate: leaveDate,
        };
        grouped.push(currentGroup);
      }
    }

    // 2. Sort descending by startDate for presentation
    return grouped.sort(
      (a, b) =>
        new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime()
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
      if (typeof data.attachment === "string") {
        // Reuse existing attachment URL
        uploadedAttachmentUrl = data.attachment;
      } else {
        // New file upload
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
    }

    return await db.transaction(async (tx) => {
      const student = await tx.query.studentProfiles.findFirst({
        where: eq(studentProfiles.userId, userId),
        with: {
          user: true,
        },
      });

      if (!student) throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");

      const studentName = `${student.user.fname} ${student.user.lname}`;
      const datesToLeave = this.getDatesInRange(data.startDate, data.endDate);
      const targetDatetimes = datesToLeave.map((date) => `${date}T00:00:00`);

      const existingLeaves = await tx.query.leaveRequests.findMany({
        where: and(
          eq(leaveRequests.userId, userId),
          inArray(leaveRequests.leaveDatetime, targetDatetimes),
          inArray(leaveRequests.status, ["PENDING", "APPROVED"]),
          isNull(leaveRequests.deletedAt)
        ),
      });

      if (!student.user.departmentId) {
        throw new Error("นักศึกษาไม่มีสังกัดแผนก ไม่สามารถส่งการแจ้งเตือนได้");
      }

      const owners = await tx
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            or(eq(users.roleId, 1), eq(users.roleId, 2)),
            eq(users.departmentId, student.user.departmentId)
          )
        );

      if (owners.length > 0) {
        await tx.insert(notifications).values(
          owners.map((o) => ({
            userId: o.id,
            title: "รายการขอลาใหม่",
            message: `ได้รับคำขอลาของ ${studentName} ตั้งแต่วันที่ ${data.startDate} ถึงวันที่ ${data.endDate}`,
            isRead: false,
            // link: `/admin/leaves/${userId}`
          }))
        );
      }

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
    return await this.bulkApproveLeaveRequests(approverUserId, [
      leaveRequestId,
    ]);
  }

  async bulkApproveLeaveRequests(approverUserId: string, ids: number[]) {
    await this.assertUserExists(approverUserId);

    return await db.transaction(async (tx) => {
      // 1. ดึงข้อมูลพี่เลี้ยงผู้กดอนุมัติก่อน
      const approver = await tx.query.users.findFirst({
        where: eq(users.id, approverUserId),
      });
      const approverName = approver
        ? `${approver.fname} ${approver.lname}`
        : "ผู้ดูแลระบบ";

      const requests = await tx.query.leaveRequests.findMany({
        where: and(
          inArray(leaveRequests.id, ids),
          isNull(leaveRequests.deletedAt)
        ),
      });

      if (requests.length === 0) {
        throw new NotFoundError("ไม่พบข้อมูลคำขอลาที่ต้องการอนุมัติ");
      }

      for (const request of requests) {
        if (request.status !== "PENDING") continue;

        const student = await tx.query.studentProfiles.findFirst({
          where: eq(studentProfiles.userId, request.userId),
          with: {
            user: true,
          },
        });

        if (!student) continue;

        const leaveDateStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Bangkok",
        }).format(new Date(request.leaveDatetime!));

        // 2. Update สถานะการลา
        await tx
          .update(leaveRequests)
          .set({
            status: "APPROVED",
            approvedBy: approverUserId,
            approvedAt: new Date().toISOString(),
          })
          .where(eq(leaveRequests.id, request.id));

        // 3. จัดการ Attendance Log (Logic เดิม)
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
              isVerified: true,
            })
            .where(eq(attendanceLogs.id, existingLog.id));
        } else {
          await tx.insert(attendanceLogs).values({
            studentProfileId: student.id,
            workDate: leaveDateStr,
            dailyStatus: "LEAVE",
            isVerified: true,
          });
        }

        const studentName = `${student.user.fname} ${student.user.lname}`;

        await tx.insert(notifications).values({
          userId: request.userId,
          title: "คำขอลาได้รับการอนุมัติ",
          message: `${studentName} ได้รับการอนุมัติการลาในวันที่ ${leaveDateStr} จากพี่เลี้ยง (${approverName})`,
          isRead: false,
        });
      }

      return {
        success: true,
        message: "อนุมัติการลาเรียบร้อยแล้ว",
      };
    });
  }

  async getLeaveHistory(userId: string, query: model.GetLeaveHistoryQueryType) {
    await this.assertUserExists(userId);

    const { page = 1, limit = 10, type, year, month } = query;

    const listFilters = [
      eq(leaveRequests.userId, userId),
      isNull(leaveRequests.deletedAt),
    ];

    let targetYear = year || null;
    let targetMonth = month || null;

    if (year || month) {
      const now = new Date();
      targetYear = year || now.getFullYear();
      targetMonth = month || now.getMonth() + 1;

      const startOfMonth = new Date(
        targetYear,
        targetMonth - 1,
        1
      ).toISOString();
      const endOfMonth = new Date(
        targetYear,
        targetMonth,
        0,
        23,
        59,
        59
      ).toISOString();

      listFilters.push(gte(leaveRequests.leaveDatetime, startOfMonth));
      listFilters.push(lte(leaveRequests.leaveDatetime, endOfMonth));
    }

    const baseCondition = and(...listFilters);

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

    if (type) {
      listFilters.push(eq(leaveRequests.leaveRequestType, type));
    }

    const finalCondition = and(...listFilters);

    const historyData = await db.query.leaveRequests.findMany({
      where: finalCondition,
      orderBy: [desc(leaveRequests.leaveDatetime), desc(leaveRequests.createdAt)],
    });

    const uniqueHistoryData = [];
    const seen = new Set<string>();
    for (const record of historyData) {
      const dateStr = String(record.leaveDatetime).substring(0, 10);
      const key = `${dateStr}-${record.leavePeriod}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHistoryData.push(record);
      }
    }

    const rawRecords = uniqueHistoryData.map((record) => {
      return {
        id: record.id,
        userId: record.userId,
        leaveDate: record.leaveDatetime,
        leaveType: record.leaveRequestType,
        status: record.status,
        reason: record.reason,
        attachmentUrl: record.file,
        approverNote: record.approverNote,
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

    if (!mentor?.staffProfiles) {
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

    const leaveConditions = [
      inArray(leaveRequests.userId, studentUserIds),
      isNull(leaveRequests.deletedAt),
    ];

    if (status) {
      leaveConditions.push(eq(leaveRequests.status, status));
    }

    const finalCondition = and(...leaveConditions);

    const historyData = await db
      .select({
        id: leaveRequests.id,
        createdAt: leaveRequests.createdAt,
        leaveDatetime: leaveRequests.leaveDatetime,
        leaveRequestType: leaveRequests.leaveRequestType,
        status: leaveRequests.status,
        reason: leaveRequests.reason,
        file: leaveRequests.file,
        userId: leaveRequests.userId,
        fname: users.fname,
        lname: users.lname,
        username: users.displayUsername,
        image: studentProfiles.image,
      })
      .from(leaveRequests)
      .innerJoin(users, eq(users.id, leaveRequests.userId))
      .innerJoin(
        studentProfiles,
        eq(studentProfiles.userId, leaveRequests.userId)
      )
      .where(finalCondition)
      .orderBy(desc(leaveRequests.createdAt));

    const rawRecords = historyData.map((record) => {
      return {
        id: record.id,
        userId: record.userId,
        createdAt: record.createdAt,
        leaveDate: record.leaveDatetime,
        leaveType: record.leaveRequestType,
        status: record.status,
        reason: record.reason,
        attachmentUrl: record.file,
        studentName: (() => {
          const fullName = `${record.fname || ""} ${record.lname || ""}`.trim();
          const nick = record.username;
          return nick
            ? `${fullName} (${nick})`
            : fullName || "นักศึกษา (ไม่ระบุชื่อ)";
        })(),
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
    return await this.bulkRejectLeaveRequests(
      approverUserId,
      [leaveRequestId],
      reason
    );
  }

  async bulkRejectLeaveRequests(
    approverUserId: string,
    ids: number[],
    reason: string
  ) {
    await this.assertUserExists(approverUserId);

    return await db.transaction(async (tx) => {
      // 1. ดึงข้อมูลพี่เลี้ยงผู้กดปฏิเสธ (ใช้ fname, lname ตาม Schema)
      const approver = await tx.query.users.findFirst({
        where: eq(users.id, approverUserId),
      });
      const approverName = approver
        ? `${approver.fname} ${approver.lname}`
        : "ผู้ดูแลระบบ";

      // 2. ดึงข้อมูลคำขอลา พร้อม Join ข้อมูล User ผ่าน Relation 'user_userId'
      const requests = await tx.query.leaveRequests.findMany({
        where: and(
          inArray(leaveRequests.id, ids),
          isNull(leaveRequests.deletedAt)
        ),
        with: {
          user_userId: true, // ใช้ชื่อตามที่ TypeScript แนะนำจาก Error
        },
      });

      if (requests.length === 0) {
        throw new NotFoundError("ไม่พบข้อมูลคำขอลาที่ต้องการปฏิเสธ");
      }

      const pendingRequests = requests.filter((r) => r.status === "PENDING");

      if (pendingRequests.length === 0) {
        throw new ConflictError(
          "คำขอลาเหล่านี้ถูกดำเนินการไปแล้วหรือไม่อยู่ในสถานะรออนุมัติ"
        );
      }

      const pendingIds = pendingRequests.map((r) => r.id);

      // 3. Update สถานะคำขอลาเป็น REJECTED
      await tx
        .update(leaveRequests)
        .set({
          status: "REJECTED",
          approvedBy: approverUserId,
          approverNote: reason,
          approvedAt: new Date().toISOString(), // ส่งเป็น ISO String
        })
        .where(inArray(leaveRequests.id, pendingIds));

      // 4. สร้าง Notification ส่งกลับไปแจ้งเตือนนักศึกษาทุกคนใน List
      const notificationValues = pendingRequests.map((request) => {
        const leaveDateStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Bangkok",
        }).format(new Date(request.leaveDatetime!));

        // ดึงชื่อจาก Relation 'user_userId'
        const studentName = `${request.user_userId.fname} ${request.user_userId.lname}`;

        return {
          userId: request.userId,
          title: "คำขอลาไม่ได้รับการอนุมัติ",
          message: `${studentName} คำขอลาในวันที่ ${leaveDateStr} ไม่ได้รับการอนุมัติจากพี่เลี้ยง (${approverName}) เนื่องจาก: ${reason}`,
          isRead: false,
        };
      });

      if (notificationValues.length > 0) {
        await tx.insert(notifications).values(notificationValues);
      }

      return {
        success: true,
        message:
          pendingIds.length === 1
            ? "ปฏิเสธคำขอลาเรียบร้อยแล้ว"
            : `ปฏิเสธคำขอลาจำนวน ${pendingIds.length} รายการเรียบร้อยแล้ว`,
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
        eq(leaveRequests.userId, userId),
        isNull(leaveRequests.deletedAt)
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
      await tx
        .update(leaveRequests)
        .set({ deletedAt: new Date() })
        .where(inArray(leaveRequests.id, ids));

      return { success: true, message: "ยกเลิกคำขอลาเรียบร้อยแล้ว" };
    });
  }

  async resubmitLeaveRequests(userId: string, ids: number[]) {
    await this.assertUserExists(userId);

    const requests = await db.query.leaveRequests.findMany({
      where: and(
        inArray(leaveRequests.id, ids),
        eq(leaveRequests.userId, userId),
        isNull(leaveRequests.deletedAt)
      ),
    });

    if (requests.length === 0) {
      throw new NotFoundError("ไม่พบข้อมูลคำขอลาที่ต้องการส่งซ้ำ");
    }

    const unresubmittable = requests.filter((r) => r.status !== "REJECTED");
    if (unresubmittable.length > 0) {
      throw new ConflictError(
        "สามารถส่งคำขอซ้ำได้เฉพาะรายการที่ถูกปฏิเสธ (REJECTED) เท่านั้น"
      );
    }

    const newRequests = requests.map((r) => ({
      leaveRequestType: r.leaveRequestType,
      leavePeriod: r.leavePeriod,
      userId: r.userId,
      leaveDatetime: r.leaveDatetime,
      reason: r.reason,
      file: r.file,
      status: "PENDING" as const,
    }));

    await db.insert(leaveRequests).values(newRequests);

    return {
      success: true,
      message: "ส่งคำขออีกครั้งเรียบร้อยแล้ว",
    };
  }

  async getMentorAuditView(mentorUserId: string, leaveId: number) {
    const mentor = await db.query.users.findFirst({
      where: eq(users.id, mentorUserId),
    });

    if (!mentor) throw new ForbiddenError("ไม่พบข้อมูลผู้ใช้งาน");

    const baseRequest = await db.query.leaveRequests.findFirst({
      where: eq(leaveRequests.id, leaveId)
    });

    if (!baseRequest) throw new NotFoundError("ไม่พบข้อมูลใบลา");

    const allRequests = await db.query.leaveRequests.findMany({
      where: and(
        eq(leaveRequests.userId, baseRequest.userId),
        eq(leaveRequests.leaveDatetime, baseRequest.leaveDatetime),
        baseRequest.leavePeriod ? eq(leaveRequests.leavePeriod, baseRequest.leavePeriod) : isNull(leaveRequests.leavePeriod),
        isNull(leaveRequests.deletedAt)
      ),
      orderBy: [asc(leaveRequests.createdAt)],
    });

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, baseRequest.userId)
    });
    const studentName = `${userRecord?.fname} ${userRecord?.lname}`;

    const timeline = [];
    for (const req of allRequests) {
      timeline.push({
        status: "SUBMITTED",
        label: "นักศึกษาส่งคำขอลา",
        time: req.createdAt || req.leaveDatetime,
        by: studentName,
        note: req.reason,
      });

      if (req.status !== "PENDING") {
        let approverInfo = "เจ้าหน้าที่";
        if (req.approvedBy) {
          const approver = await db.query.users.findFirst({
            where: eq(users.id, req.approvedBy),
            columns: { fname: true, lname: true },
          });
          if (approver) approverInfo = `${approver.fname} ${approver.lname}`;
        }

        timeline.push({
          status: req.status,
          label: req.status === "APPROVED" ? "อนุมัติการลา" : "ปฏิเสธการลา",
          time: req.approvedAt,
          by: approverInfo,
          note: req.approverNote,
        });
      }
    }

    return {
      success: true,
      data: {
        leaveId: baseRequest.id,
        studentName: studentName,
        currentStatus: baseRequest.status,
        timeline,
      },
    };
  }

  async getMentorAuditList(
    mentorUserId: string,
    query: { page?: number; limit?: number; status?: string }
  ) {
    const { page = 1, limit = 10, status } = query;
    const offset = (page - 1) * limit;

    const mentor = await db.query.users.findFirst({
      where: eq(users.id, mentorUserId),
    });

    if (!mentor) throw new ForbiddenError("ไม่พบข้อมูลผู้ใช้งาน");

    const approver = aliasedTable(users, "approver");

    const allRecords = await db
      .select({
        id: leaveRequests.id,
        leaveType: leaveRequests.leaveRequestType,
        leavePeriod: leaveRequests.leavePeriod,
        leaveDate: leaveRequests.leaveDatetime,
        status: leaveRequests.status,
        reason: leaveRequests.reason,
        file: leaveRequests.file,
        createdAt: leaveRequests.createdAt,
        studentName: sql<string>`concat(${users.fname}, ' ', ${users.lname})`,
        studentImage: studentProfiles.image,
        userId: leaveRequests.userId,
        username: users.displayUsername,
        approverName: sql<string>`concat(${approver.fname}, ' ', ${approver.lname})`,
        approvedAt: leaveRequests.approvedAt,
        approverNote: leaveRequests.approverNote,
      })
      .from(leaveRequests)
      .innerJoin(users, eq(leaveRequests.userId, users.id))
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .leftJoin(approver, eq(leaveRequests.approvedBy, approver.id)) // Join หาคนอนุมัติ
      .where(
        and(
          isNull(leaveRequests.deletedAt),
          mentor.roleId !== 1
            ? eq(users.departmentId, mentor.departmentId!)
            : undefined,
          status
            ? eq(
                leaveRequests.status,
                status as (typeof leaveStatusEnum.enumValues)[number]
              )
            : inArray(leaveRequests.status, ["APPROVED", "REJECTED"])
        )
      )
      .orderBy(
        desc(leaveRequests.approvedAt),
        desc(leaveRequests.createdAt),
        desc(leaveRequests.leaveDatetime)
      );

    const uniqueRecords = [];
    const seen = new Set<string>();
    for (const r of allRecords) {
      const dateStr = String(r.leaveDate).substring(0, 10);
      const key = `${r.userId}-${dateStr}-${r.leavePeriod || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRecords.push(r);
      }
    }

    const count = uniqueRecords.length;
    const paginatedRecords = uniqueRecords.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedRecords,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}
