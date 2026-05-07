import { and, eq, sql } from "drizzle-orm";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  departments,
  internshipEndHistory,
  internshipPositions,
  notifications,
  studentProfiles,
  users,
} from "@/db/schema";
import { MailService } from "@/modules/mail/service";
import type { UpdateStudentInternshipStatusBodyType } from "./model";

const mailService = new MailService();

export class OwnerStudentStatusService {
  private sendEmailAsync(to: string, subject: string, html: string) {
    setImmediate(() => {
      mailService.sendEmail(to, subject, html).catch((err) => {
        console.error("[MAIL ERROR]", err);
      });
    });
  }

  async getInternshipEndHistory(ownerUserId: string, studentUserId: string) {
    return await db.transaction(async (tx) => {
      const [owner] = await tx
        .select({
          roleId: users.roleId,
          departmentId: users.departmentId,
        })
        .from(users)
        .where(eq(users.id, ownerUserId));

      if (!owner) throw new ForbiddenError("ไม่พบผู้ใช้งาน");
      if (owner.roleId === 3)
        throw new ForbiddenError("อนุญาตเฉพาะ Admin, Owner");
      if (!owner.departmentId) throw new ForbiddenError("Owner ไม่ได้สังกัดกอง");

      const [stuUser] = await tx
        .select({
          id: users.id,
          roleId: users.roleId,
          departmentId: users.departmentId,
        })
        .from(users)
        .where(eq(users.id, studentUserId));

      if (!stuUser) throw new NotFoundError("ไม่พบนักศึกษา");
      if (stuUser.roleId !== 3) throw new BadRequestError("ผู้ใช้นี้ไม่ใช่นักศึกษา");

      if (stuUser.departmentId !== owner.departmentId) {
        throw new ForbiddenError("ไม่สามารถดูนักศึกษาต่างกองได้");
      }

      const [sp] = await tx
        .select({
          id: studentProfiles.id,
        })
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, studentUserId));

      if (!sp) throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");

      const rows = await tx
        .select({
          id: internshipEndHistory.id,
          status: internshipEndHistory.status,
          reason: internshipEndHistory.reason,
          createdAt: internshipEndHistory.createdAt,
          changedBy: users.id,
          fname: users.fname,
          lname: users.lname,
        })
        .from(internshipEndHistory)
        .leftJoin(users, eq(users.id, internshipEndHistory.changedBy))
        .where(eq(internshipEndHistory.studentProfileId, sp.id))
        .orderBy(sql`${internshipEndHistory.createdAt} DESC`);

      return rows;
    });
  }

  async updateInternshipStatus(
    ownerUserId: string,
    studentUserId: string,
    body: UpdateStudentInternshipStatusBodyType
  ) {
    return await db.transaction(async (tx) => {
      const [owner] = await tx
        .select({
          roleId: users.roleId,
          departmentId: users.departmentId,
        })
        .from(users)
        .where(eq(users.id, ownerUserId));

      if (!owner) throw new ForbiddenError("ไม่พบผู้ใช้งาน");
      if (owner.roleId === 3)
        throw new ForbiddenError("อนุญาตเฉพาะ Admin, Owner");
      if (!owner.departmentId) throw new ForbiddenError("ไม่ได้สังกัดกอง");

      const [stuUser] = await tx
        .select({
          id: users.id,
          roleId: users.roleId,
          departmentId: users.departmentId,
          fname: users.fname,
          lname: users.lname,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, studentUserId));

      if (!stuUser) throw new NotFoundError("ไม่พบนักศึกษา");
      if (stuUser.roleId !== 3) throw new BadRequestError("ผู้ใช้นี้ไม่ใช่นักศึกษา");

      if (stuUser.departmentId !== owner.departmentId) {
        throw new ForbiddenError("ไม่สามารถจัดการนักศึกษาต่างกองได้");
      }

      const [sp] = await tx
        .select({
          id: studentProfiles.id,
          internshipStatus: studentProfiles.internshipStatus,
        })
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, studentUserId));

      if (!sp) throw new NotFoundError("ไม่พบโปรไฟล์นักศึกษา");

      const allowedStatuses = new Set(["ACTIVE", "AWAITING", "EXTENDED"]);
      if (!allowedStatuses.has(sp.internshipStatus)) {
        throw new BadRequestError(
          "เปลี่ยนสถานะได้เฉพาะนักศึกษาที่อยู่ในสถานะ ACTIVE, AWAITING, EXTENDED เท่านั้น"
        );
      }

      const [app] = await tx
        .select({
          id: applicationStatuses.id,
          positionId: applicationStatuses.positionId,
          departmentId: applicationStatuses.departmentId,
          positionName: internshipPositions.name,
          departmentName: departments.deptFull,
        })
        .from(applicationStatuses)
        .leftJoin(
          internshipPositions,
          eq(internshipPositions.id, applicationStatuses.positionId)
        )
        .leftJoin(
          departments,
          eq(departments.deptSap, applicationStatuses.departmentId)
        )
        .where(
          and(
            eq(applicationStatuses.userId, studentUserId),
            eq(applicationStatuses.isActive, true)
          )
        )
        .limit(1);

      if (!app) throw new NotFoundError("ไม่พบข้อมูลการสมัครของนักศึกษา");

      const nextStatus = body.status;

      if (nextStatus === "CANCEL") {
        const reason = body.reason?.trim();
        if (!reason) throw new BadRequestError("กรุณาระบุเหตุผลการ CANCEฟL");

        await tx
          .update(internshipPositions)
          .set({
            acceptedCount: sql`GREATEST(${internshipPositions.acceptedCount} - 1, 0)`,
          })
          .where(eq(internshipPositions.id, app.positionId));

        await tx
          .update(studentProfiles)
          .set({
            internshipStatus: "CANCEL",
            statusNote: reason,
          })
          .where(eq(studentProfiles.userId, studentUserId));

        await tx
          .update(applicationStatuses)
          .set({
            applicationStatus: "CANCEL",
            statusNote: reason,
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(applicationStatuses.id, app.id));

        await tx.insert(internshipEndHistory).values({
          studentProfileId: sp.id,
          status: "CANCEL",
          reason,
          changedBy: ownerUserId,
        });

        await tx.insert(notifications).values({
          userId: studentUserId,
          title: "การฝึกงานถูกยกเลิก",
          message: `การฝึกงานของคุณถูกยกเลิก เหตุผล: ${reason}`,
          isRead: false,
        });

        if (
          stuUser.email &&
          stuUser.fname &&
          stuUser.lname &&
          app.positionName
        ) {
          const mail = mailService.buildInternshipCanceledEmail({
            firstname: stuUser.fname,
            lastname: stuUser.lname,
            positionName: app.positionName,
            departmentName: app.departmentName ?? "-",
          });

          this.sendEmailAsync(stuUser.email, mail.subject, mail.html);
        }

        return { studentUserId, internshipStatus: "CANCEL" };
      }

      await tx
        .update(internshipPositions)
        .set({
          acceptedCount: sql`GREATEST(${internshipPositions.acceptedCount} - 1, 0)`,
        })
        .where(eq(internshipPositions.id, app.positionId));

      await tx
        .update(studentProfiles)
        .set({
          internshipStatus: "COMPLETE",
        })
        .where(eq(studentProfiles.userId, studentUserId));

      await tx
        .update(applicationStatuses)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(applicationStatuses.id, app.id));

      await tx.insert(internshipEndHistory).values({
        studentProfileId: sp.id,
        status: "COMPLETE",
        reason: null,
        changedBy: ownerUserId,
      });

      await tx.insert(notifications).values({
        userId: studentUserId,
        title: "การฝึกงานเสร็จสิ้น",
        message: "การฝึกงานของคุณเสร็จสิ้นแล้ว",
        isRead: false,
      });

      return { studentUserId, internshipStatus: "COMPLETE" };
    });
  }
}
