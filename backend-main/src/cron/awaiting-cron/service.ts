import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationInformations,
  applicationStatuses,
  studentProfiles,
} from "@/db/schema";

export class AwaitingCronService {
  async updateAwaitingToActive() {
    try {
      const result = await db.transaction(async (tx) => {
        const now = new Date();

        const rows = await tx
          .select({
            applicationId: applicationStatuses.id,
            userId: applicationStatuses.userId,
          })
          .from(applicationStatuses)
          .innerJoin(
            applicationInformations,
            eq(
              applicationInformations.applicationStatusId,
              applicationStatuses.id
            )
          )
          .innerJoin(
            studentProfiles,
            eq(studentProfiles.userId, applicationStatuses.userId)
          )
          .where(
            and(
              eq(applicationStatuses.applicationStatus, "COMPLETE"),
              eq(applicationStatuses.isActive, true),
              eq(studentProfiles.internshipStatus, "AWAITING"),
              lte(applicationInformations.startDate, now)
            )
          );

        for (const row of rows) {
          await tx
            .update(studentProfiles)
            .set({ internshipStatus: "ACTIVE" })
            .where(eq(studentProfiles.userId, row.userId));
        }

        return {
          success: true,
          updatedCount: rows.length,
        };
      });

      console.log(
        `[CRON] awaiting -> active completed | updatedCount=${result.updatedCount}`
      );

      return result;
    } catch (error) {
      console.error("[CRON ERROR] updateAwaitingToActive failed:", error);
      throw error;
    }
  }
}
