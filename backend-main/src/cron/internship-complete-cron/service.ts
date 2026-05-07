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
            "ระบบเปลี่ยนสถานะเป็น COMPLETE อัตโนมัติหลังสิ้นสุดฝึกงานครบ 3 วันทำการ",
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
                      sql`(
                        SELECT d::date
                        FROM generate_series(
                          ${applicationInformations.endDate}::date + INTERVAL '1 day',
                          ${applicationInformations.endDate}::date + INTERVAL '14 days',
                          INTERVAL '1 day'
                        ) AS d
                        WHERE EXTRACT(ISODOW FROM d) NOT IN (6, 7)
                        ORDER BY d
                        OFFSET 3
                        LIMIT 1
                      )`,
                      sql`CURRENT_DATE`
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
            "ระบบเปลี่ยนสถานะเป็น COMPLETE อัตโนมัติหลังสิ้นสุดการขยายเวลาครบ 3 วันทำการ",
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
                      sql`(
                        SELECT d::date
                        FROM generate_series(
                          ${internshipExtensions.newEndDate}::date + INTERVAL '1 day',
                          ${internshipExtensions.newEndDate}::date + INTERVAL '14 days',
                          INTERVAL '1 day'
                        ) AS d
                        WHERE EXTRACT(ISODOW FROM d) NOT IN (6, 7)
                        ORDER BY d
                        OFFSET 3
                        LIMIT 1
                      )`,
                      sql`CURRENT_DATE`
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
              "ระบบเปลี่ยนสถานะเป็น COMPLETE อัตโนมัติหลังครบกำหนด 3 วันทำการ",
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