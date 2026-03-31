import { PutObjectCommand } from "@aws-sdk/client-s3";
import { and, desc, eq, or } from "drizzle-orm";
import { NotFoundError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationInformations,
  applicationStatuses,
  staffProfiles,
  studentAttendanceSummary,
  studentProfiles,
  users,
} from "@/db/schema";
import { s3Client } from "../../lib/s3";
import type * as userModel from "./model";

const ROLE_ADMIN = 1;
const ROLE_OWNER = 2;
const ROLE_INTERN = 3;

export class UserService {
  async me(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        staffProfiles: true,
        studentProfiles: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.roleId === ROLE_INTERN) {
      const [latestApp] = await db
        .select({
          applicationStatusId: applicationStatuses.id,
        })
        .from(applicationStatuses)
        .where(eq(applicationStatuses.userId, userId))
        .orderBy(desc(applicationStatuses.internshipRound))
        .limit(1);

      let latestInfo: {
        startDate: Date | string | null;
        endDate: Date | string | null;
        hours: string | null;
      } | null = null;

      if (latestApp?.applicationStatusId) {
        const [info] = await db
          .select({
            startDate: applicationInformations.startDate,
            endDate: applicationInformations.endDate,
            hours: applicationInformations.hours,
          })
          .from(applicationInformations)
          .where(
            eq(
              applicationInformations.applicationStatusId,
              latestApp.applicationStatusId
            )
          )
          .limit(1);

        if (info) latestInfo = info;
      }

      const { studentProfiles, staffProfiles, ...userData } = user;

      const profile = Array.isArray(studentProfiles)
        ? studentProfiles[0]
        : studentProfiles;

      const mergedProfile = profile
        ? {
            ...profile,
            hours: latestInfo?.hours ?? null,
            startDate: latestInfo?.startDate ?? null,
            endDate: latestInfo?.endDate ?? null,
          }
        : {
            hours: latestInfo?.hours ?? null,
            startDate: latestInfo?.startDate ?? null,
            endDate: latestInfo?.endDate ?? null,
          };

      return {
        ...userData,
        profile: mergedProfile,
      };
    }

    const { staffProfiles, studentProfiles, ...userData } = user;
    return {
      ...userData,
      profile: staffProfiles,
    };
  }

  async getStaff(departmentId?: number) {
    const staffUsers = await db.query.users.findMany({
      where: departmentId
        ? and(
            or(eq(users.roleId, ROLE_ADMIN), eq(users.roleId, ROLE_OWNER)),
            eq(users.departmentId, departmentId)
          )
        : or(eq(users.roleId, ROLE_ADMIN), eq(users.roleId, ROLE_OWNER)),
      with: {
        staffProfiles: true,
      },
    });

    return staffUsers.map((user) => {
      const { staffProfiles, ...userData } = user;
      const profile = Array.isArray(staffProfiles)
        ? staffProfiles[0]
        : staffProfiles;

      return {
        ...userData,
        staffProfileId: profile?.id ?? null,
      };
    });
  }

  async getStudent() {
    return db.query.users.findMany({
      where: eq(users.roleId, ROLE_INTERN),
    });
  }

  async updateUser(
    userId: string,
    data: {
      fname?: string;
      lname?: string;
      email?: string;
      phoneNumber?: string;
    }
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.fname !== undefined) updateData.fname = data.fname;
    if (data.lname !== undefined) updateData.lname = data.lname;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      throw new Error("User not found");
    }

    return updated;
  }

  async updateStaffPhone(staffProfileId: number, phoneNumber: string) {
    const [profile] = await db
      .select({ userId: staffProfiles.userId })
      .from(staffProfiles)
      .where(eq(staffProfiles.id, staffProfileId))
      .limit(1);

    if (!profile) {
      throw new NotFoundError(`ไม่พบ staffProfile รหัส ${staffProfileId}`);
    }

    const [updated] = await db
      .update(users)
      .set({ phoneNumber })
      .where(eq(users.id, profile.userId))
      .returning();

    if (!updated) {
      throw new NotFoundError("ไม่พบผู้ใช้งานในระบบ");
    }

    return updated;
  }

  async updateStudentProfile(
    userId: string,
    data: {
      hours?: number;
      faculty?: string;
      major?: string;
      studentNote?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    return await db.transaction(async (tx) => {
      const profileUpdateData: Record<string, unknown> = {};
      if (data.faculty !== undefined) profileUpdateData.faculty = data.faculty;
      if (data.major !== undefined) profileUpdateData.major = data.major;
      if (data.studentNote !== undefined) {
        profileUpdateData.studentNote = data.studentNote;
      }

      let updatedProfile: typeof studentProfiles.$inferSelect | null = null;

      if (Object.keys(profileUpdateData).length > 0) {
        const [profile] = await tx
          .update(studentProfiles)
          .set(profileUpdateData)
          .where(eq(studentProfiles.userId, userId))
          .returning();

        if (!profile) {
          throw new Error("Student profile not found");
        }

        updatedProfile = profile;
      } else {
        const [profile] = await tx
          .select()
          .from(studentProfiles)
          .where(eq(studentProfiles.userId, userId))
          .limit(1);

        if (!profile) {
          throw new Error("Student profile not found");
        }

        updatedProfile = profile;
      }

      const hasApplicationInfoField =
        data.hours !== undefined ||
        data.startDate !== undefined ||
        data.endDate !== undefined;

      let updatedApplicationInfo: {
        hours: string | null;
        startDate: Date | null;
        endDate: Date | null;
      } | null = null;

      if (hasApplicationInfoField) {
        const [latestApp] = await tx
          .select({
            applicationStatusId: applicationStatuses.id,
          })
          .from(applicationStatuses)
          .where(eq(applicationStatuses.userId, userId))
          .orderBy(desc(applicationStatuses.internshipRound))
          .limit(1);

        if (!latestApp) {
          throw new Error("Latest application not found");
        }

        const [existingInfo] = await tx
          .select({
            id: applicationInformations.id,
            startDate: applicationInformations.startDate,
            endDate: applicationInformations.endDate,
            hours: applicationInformations.hours,
          })
          .from(applicationInformations)
          .where(
            eq(
              applicationInformations.applicationStatusId,
              latestApp.applicationStatusId
            )
          )
          .limit(1);

        if (!existingInfo) {
          throw new Error("Application information not found");
        }

        const nextStartDate =
          data.startDate !== undefined
            ? data.startDate
              ? new Date(data.startDate)
              : null
            : existingInfo.startDate;

        const nextEndDate =
          data.endDate !== undefined
            ? data.endDate
              ? new Date(data.endDate)
              : null
            : existingInfo.endDate;

        if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
          throw new Error("endDate must be greater than or equal to startDate");
        }

        const infoUpdateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };

        if (data.hours !== undefined) {
          infoUpdateData.hours =
            data.hours === null || data.hours === undefined
              ? null
              : String(data.hours);
        }

        if (data.startDate !== undefined) {
          infoUpdateData.startDate = data.startDate
            ? new Date(data.startDate)
            : null;
        }

        if (data.endDate !== undefined) {
          infoUpdateData.endDate = data.endDate ? new Date(data.endDate) : null;
        }

        const [info] = await tx
          .update(applicationInformations)
          .set(infoUpdateData)
          .where(
            eq(
              applicationInformations.applicationStatusId,
              latestApp.applicationStatusId
            )
          )
          .returning({
            hours: applicationInformations.hours,
            startDate: applicationInformations.startDate,
            endDate: applicationInformations.endDate,
          });

        updatedApplicationInfo = info ?? null;
      } else {
        const [latestApp] = await tx
          .select({
            applicationStatusId: applicationStatuses.id,
          })
          .from(applicationStatuses)
          .where(eq(applicationStatuses.userId, userId))
          .orderBy(desc(applicationStatuses.internshipRound))
          .limit(1);

        if (latestApp) {
          const [info] = await tx
            .select({
              hours: applicationInformations.hours,
              startDate: applicationInformations.startDate,
              endDate: applicationInformations.endDate,
            })
            .from(applicationInformations)
            .where(
              eq(
                applicationInformations.applicationStatusId,
                latestApp.applicationStatusId
              )
            )
            .limit(1);

          updatedApplicationInfo = info ?? null;
        }
      }

      return {
        ...updatedProfile,
        hours: updatedApplicationInfo?.hours ?? null,
        startDate: updatedApplicationInfo?.startDate ?? null,
        endDate: updatedApplicationInfo?.endDate ?? null,
      };
    });
  }

  async getStudentProgress(userId: string) {
    const [summary] = await db
      .select({
        accumulatedHours: studentAttendanceSummary.totalAccumulatedHours,
        totalHoursGoal: studentAttendanceSummary.totalHoursGoal,
      })
      .from(studentAttendanceSummary)
      .where(eq(studentAttendanceSummary.userId, userId));

    if (!summary) {
      throw new NotFoundError("ไม่พบข้อมูลสรุปเวลาฝึกงานของนักศึกษา");
    }

    const accumulated = Number(summary.accumulatedHours || 0);
    const goal = Number(summary.totalHoursGoal || 0);

    let percentage = goal > 0 ? (accumulated / goal) * 100 : 0;

    if (percentage > 100) percentage = 100;

    return {
      accumulatedHours: accumulated,
      totalHoursGoal: goal,
      percentage: Number(percentage.toFixed(2)),
    };
  }

  async updateProfile(userId: string, data: userModel.createProfile) {
    return await db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) throw new NotFoundError("ไม่พบผู้ใช้งานในระบบ");

      let imagePath: string | undefined;

      if (data.image) {
        const fileExt = data.image.name.split(".").pop() || "png";
        const fileName = `profiles/${userId}-${Date.now()}.${fileExt}`;

        const arrayBuffer = await data.image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadCommand = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: fileName,
          Body: buffer,
          ContentType: data.image.type,
        });

        await s3Client.send(uploadCommand);

        imagePath = fileName;

        await tx
          .update(studentProfiles)
          .set({ image: imagePath })
          .where(eq(studentProfiles.userId, userId));
      }

      if (data.nickname) {
        await tx
          .update(users)
          .set({ displayUsername: data.nickname })
          .where(eq(users.id, userId));
      }

      return {
        success: true,
        message: "ตั้งค่าโปรไฟล์และอัปโหลดรูปภาพสำเร็จ",
        data: {
          nickname: data.nickname || user.displayUsername,
          imageUrl: imagePath,
        },
      };
    });
  }
}
