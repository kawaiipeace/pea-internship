import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationStatusActions,
  applicationStatuses,
  studentProfiles,
} from "@/db/schema";

const TIMEOUT_SECONDS = 30 * 24 * 60 * 60;
// const TIMEOUT_SECONDS = 10; // test

export class ApplicationTimeoutService {
  async cancelExpiredApplications() {
    try {
      const expireTime = new Date(Date.now() - TIMEOUT_SECONDS * 1000);

      const expired = await db
        .select({
          id: applicationStatuses.id,
          userId: applicationStatuses.userId,
        })
        .from(applicationStatuses)
        .where(
          and(
            eq(applicationStatuses.applicationStatus, "PENDING_DOCUMENT"),
            eq(applicationStatuses.isActive, true),
            lte(applicationStatuses.createdAt, expireTime)
          )
        );

      for (const app of expired) {
        await db.transaction(async (tx) => {
          await tx
            .update(applicationStatuses)
            .set({
              applicationStatus: "ABORT",
              isActive: false,
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
            oldStatus: "PENDING_DOCUMENT",
            newStatus: "ABORT",
          });

          console.log("[CRON] application cancelled:", app.id);
        });
      }
    } catch (error) {
      console.error("[CRON ERROR] cancelExpiredApplications failed:", error);
    }
  }
}
