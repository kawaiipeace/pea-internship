import { and, eq, sql } from "drizzle-orm";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  internshipPositions,
  notifications,
  studentProfiles,
  users,
} from "@/db/schema";
import type { UpdateStudentInternshipStatusBodyType } from "./model";

export class OwnerStudentStatusService {
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

      if (sp.internshipStatus !== "ACTIVE") {
        throw new BadRequestError(
          "เปลี่ยนสถานะได้เฉพาะนักศึกษาที่อยู่ในสถานะ ACTIVE เท่านั้น"
        );
      }

      const [app] = await tx
        .select({
          id: applicationStatuses.id,
          positionId: applicationStatuses.positionId,
        })
        .from(applicationStatuses)
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
        if (!reason) throw new BadRequestError("กรุณาระบุเหตุผลการ CANCEL");

        await tx
          .update(internshipPositions)
          .set({
            acceptedCount: sql`${internshipPositions.acceptedCount} - 1`,
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

        await tx.insert(notifications).values({
          userId: studentUserId,
          title: "การฝึกงานถูกยกเลิก",
          message: `การฝึกงานของคุณถูกยกเลิก เหตุผล: ${reason}`,
          isRead: false,
        });

        return { studentUserId, internshipStatus: "CANCEL" };
      }

      await tx
        .update(internshipPositions)
        .set({
          acceptedCount: sql`${internshipPositions.acceptedCount} - 1`,
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
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(applicationStatuses.id, app.id));

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
