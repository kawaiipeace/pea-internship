import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationInformations,
  applicationStatuses,
  internshipEndHistory,
  internshipExtensions,
  studentProfiles,
} from "@/db/schema";

export class InternshipCompleteCronService {
  async updateToComplete() {
    return await db.transaction(async (tx) => {
      const activeStudents = await tx
        .update(studentProfiles)
        .set({
          internshipStatus: "COMPLETE",
          statusNote:
            "ระบบเปลี่ยนสถานะเป็น COMPLETE อัตโนมัติหลังสิ้นสุดฝึกงานครบ 4 วัน",
        })
        .where(
          and(
            eq(studentProfiles.internshipStatus, "ACTIVE"),
            inArray(
              studentProfiles.userId,
              tx
                .select({
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
                .where(
                  and(
                    eq(applicationStatuses.isActive, true),
                    lte(
                      sql`${applicationInformations.endDate} + INTERVAL '4 days'`,
                    //   sql`${applicationInformations.endDate} + INTERVAL '20 seconds'`,
                      sql`CURRENT_TIMESTAMP`
                    )
                  )
                )
            )
          )
        )
        .returning({
          studentProfileId: studentProfiles.id,
          userId: studentProfiles.userId,
        });

      const extendedStudents = await tx
        .update(studentProfiles)
        .set({
          internshipStatus: "COMPLETE",
          statusNote:
            "ระบบเปลี่ยนสถานะเป็น COMPLETE อัตโนมัติหลังสิ้นสุดการขยายเวลาครบ 4 วัน",
        })
        .where(
          and(
            eq(studentProfiles.internshipStatus, "EXTENDED"),
            inArray(
              studentProfiles.userId,
              tx
                .select({
                  userId: applicationStatuses.userId,
                })
                .from(applicationStatuses)
                .innerJoin(
                  internshipExtensions,
                  eq(
                    internshipExtensions.applicationStatusId,
                    applicationStatuses.id
                  )
                )
                .where(
                  and(
                    eq(applicationStatuses.isActive, true),
                    eq(internshipExtensions.status, "APPROVED"),
                    lte(
                      sql`${internshipExtensions.newEndDate} + INTERVAL '4 days'`,
                    //   sql`${internshipExtensions.newEndDate} + INTERVAL '20 seconds'`,
                      sql`CURRENT_TIMESTAMP`
                    )
                  )
                )
            )
          )
        )
        .returning({
          studentProfileId: studentProfiles.id,
          userId: studentProfiles.userId,
        });

      const completedStudents = [...activeStudents, ...extendedStudents];

      if (completedStudents.length > 0) {
            await tx.insert(internshipEndHistory).values(
                completedStudents.map((student) => ({
                studentProfileId: student.studentProfileId,
                status: "COMPLETE" as const,
                reason:
                    "ระบบเปลี่ยนสถานะเป็น COMPLETE อัตโนมัติหลังครบกำหนด 4 วัน",
                changedBy: "system",
                }))
            );
        }

      return {
        activeCompleted: activeStudents.length,
        extendedCompleted: extendedStudents.length,
        historyCreated: completedStudents.length,
      };
    });
  }
}