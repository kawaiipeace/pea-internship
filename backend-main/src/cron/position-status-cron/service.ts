import { and, eq, inArray, lte, or, gt } from "drizzle-orm";
import { db } from "@/db";
import { internshipPositions } from "@/db/schema";

export class PositionStatusCronService {
  async updatePositionStatuses() {
    try {
      const result = await db.transaction(async (tx) => {
        const now = new Date().toISOString();

        const toOpen = await tx
        .select({
            id: internshipPositions.id,
        })
        .from(internshipPositions)
        .where(
            and(
            eq(internshipPositions.recruitmentStatus, "NOT_OPEN_YET"),
            lte(internshipPositions.recruitStart, now),
            or(
                eq(internshipPositions.recruitEnd, null as never),
                gt(internshipPositions.recruitEnd, now)
            )
            )
        );

        if (toOpen.length > 0) {
          await tx
            .update(internshipPositions)
            .set({
              recruitmentStatus: "OPEN",
              updatedAt: new Date(),
            })
            .where(
              inArray(
                internshipPositions.id,
                toOpen.map((row) => row.id)
              )
            );
        }

        const toExpire = await tx
          .select({
            id: internshipPositions.id,
          })
          .from(internshipPositions)
          .where(
            and(
              inArray(internshipPositions.recruitmentStatus, ["OPEN", "CLOSE"]),
              lte(internshipPositions.recruitEnd, now)
            )
          );

        if (toExpire.length > 0) {
          await tx
            .update(internshipPositions)
            .set({
              recruitmentStatus: "EXPIRED",
              updatedAt: new Date(),
            })
            .where(
              inArray(
                internshipPositions.id,
                toExpire.map((row) => row.id)
              )
            );
        }

        return {
          success: true,
          openedCount: toOpen.length,
          expiredCount: toExpire.length,
        };
      });

      console.log(
        `[CRON] position status completed | openedCount=${result.openedCount} expiredCount=${result.expiredCount}`
      );

      return result;
    } catch (error) {
      console.error("[CRON ERROR] updatePositionStatuses failed:", error);
      throw error;
    }
  }
}