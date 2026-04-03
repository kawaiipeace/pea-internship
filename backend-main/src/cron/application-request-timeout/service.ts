import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationStatusActions,
  applicationStatuses,
  studentProfiles,
} from "@/db/schema";

const NORMAL_TIMEOUT_DAYS = 30;
const RETURNED_FROM_REVIEW_TIMEOUT_DAYS = 15;

// const NORMAL_TIMEOUT_DAYS = 1 / 24 / 6; // test 10 นาที
// const RETURNED_FROM_REVIEW_TIMEOUT_DAYS = 1 / 24 / 12; // test 5 นาที

export class ApplicationRequestTimeoutService {
  async abortExpiredPendingRequests() {
    try {
      const pendingRequests = await db
        .select({
          id: applicationStatuses.id,
          userId: applicationStatuses.userId,
          createdAt: applicationStatuses.createdAt,
          updatedAt: applicationStatuses.updatedAt,
        })
        .from(applicationStatuses)
        .where(
          and(
            eq(applicationStatuses.applicationStatus, "PENDING_REQUEST"),
            eq(applicationStatuses.isActive, true)
          )
        );

      for (const app of pendingRequests) {
        const latestEnterPendingRequest = await db
          .select({
            id: applicationStatusActions.id,
            oldStatus: applicationStatusActions.oldStatus,
            newStatus: applicationStatusActions.newStatus,
            createdAt: applicationStatusActions.createdAt,
          })
          .from(applicationStatusActions)
          .where(
            and(
              eq(applicationStatusActions.applicationStatusId, app.id),
              eq(applicationStatusActions.newStatus, "PENDING_REQUEST")
            )
          )
          .orderBy(desc(applicationStatusActions.createdAt))
          .limit(1);

        const latestAction = latestEnterPendingRequest[0];

        const enteredAt =
          latestAction?.createdAt ?? app.updatedAt ?? app.createdAt;

        const timeoutDays =
          latestAction?.oldStatus === "PENDING_REVIEW"
            ? RETURNED_FROM_REVIEW_TIMEOUT_DAYS
            : NORMAL_TIMEOUT_DAYS;

        const expireTime = new Date(
          enteredAt.getTime() + timeoutDays * 24 * 60 * 60 * 1000
        );

        if (new Date() < expireTime) {
          continue;
        }

        await db.transaction(async (tx) => {
          await tx
            .update(applicationStatuses)
            .set({
              applicationStatus: "ABORT",
              isActive: false,
              statusNote: "ผู้สมัครไม่ส่งเอกสารขอความอนุเคราะห์ภายในระยะเวลาที่กำหนด",
              updatedAt: new Date(),
            })
            .where(eq(applicationStatuses.id, app.id));

          await tx
            .update(studentProfiles)
            .set({
              internshipStatus: "IDLE",
            })
            .where(eq(studentProfiles.userId, app.userId));

          await tx.insert(applicationStatusActions).values({
            applicationStatusId: app.id,
            actionBy: "system",
            oldStatus: "PENDING_REQUEST",
            newStatus: "ABORT",
          });

          console.log(
            `[CRON] pending request timeout -> ABORT | appId=${app.id} | timeoutDays=${timeoutDays}`
          );
        });
      }
    } catch (error) {
      console.error("[CRON ERROR] abortExpiredPendingRequests failed:", error);
    }
  }
}
