import { and, eq } from "drizzle-orm";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/common/exceptions";
import { db } from "@/db";
import { applicationStatuses, completeAcknowledge, users } from "@/db/schema";

export class ApplicationCompleteModalService {
  async getModalStatus(userId: string) {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .select({
          id: users.id,
          roleId: users.roleId,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) throw new NotFoundError("ไม่พบผู้ใช้งาน");
      if (user.roleId !== 3) {
        throw new ForbiddenError("อนุญาตเฉพาะนักศึกษา");
      }

      const [completedApp] = await tx
        .select({
          id: applicationStatuses.id,
        })
        .from(applicationStatuses)
        .where(
          and(
            eq(applicationStatuses.userId, userId),
            eq(applicationStatuses.applicationStatus, "COMPLETE")
          )
        )
        .limit(1);

      if (!completedApp) {
        return {
          shouldShow: false,
          applicationStatusId: null,
          title: null,
          message: null,
        };
      }

      const [ack] = await tx
        .select({
          id: completeAcknowledge.id,
        })
        .from(completeAcknowledge)
        .where(eq(completeAcknowledge.applicationStatusId, completedApp.id))
        .limit(1);

      if (ack) {
        return {
          shouldShow: false,
          applicationStatusId: completedApp.id,
          title: null,
          message: null,
        };
      }

      return {
        shouldShow: true,
        applicationStatusId: completedApp.id,
        title: "การฝึกงานเสร็จสิ้นแล้ว",
        message: "กรุณากดรับทราบเพื่อปิดข้อความนี้",
      };
    });
  }

  async acknowledgeModal(userId: string) {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .select({
          id: users.id,
          roleId: users.roleId,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) throw new NotFoundError("ไม่พบผู้ใช้งาน");
      if (user.roleId !== 3) {
        throw new ForbiddenError("อนุญาตเฉพาะนักศึกษา");
      }

      const [completedApp] = await tx
        .select({
          id: applicationStatuses.id,
        })
        .from(applicationStatuses)
        .where(
          and(
            eq(applicationStatuses.userId, userId),
            eq(applicationStatuses.applicationStatus, "COMPLETE")
          )
        )
        .limit(1);

      if (!completedApp) {
        throw new BadRequestError("ไม่พบสถานะ COMPLETE สำหรับนักศึกษาคนนี้");
      }

      const [existingAck] = await tx
        .select({
          id: completeAcknowledge.id,
        })
        .from(completeAcknowledge)
        .where(eq(completeAcknowledge.applicationStatusId, completedApp.id))
        .limit(1);

      if (!existingAck) {
        await tx.insert(completeAcknowledge).values({
          applicationStatusId: completedApp.id,
          userId,
        });
      }

      return {
        message: "รับทราบสถานะเรียบร้อยแล้ว",
      };
    });
  }
}
