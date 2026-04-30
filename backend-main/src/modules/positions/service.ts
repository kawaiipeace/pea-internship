import { and, count, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { BadRequestError, ForbiddenError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  departments,
  internshipPositionMentors,
  internshipPositions,
  notifications,
  offices,
  staffProfiles,
  studentProfiles,
  users,
} from "@/db/schema";
import { StaffLogsService } from "@/modules/staff-logs/service";
import type * as model from "./model";

const staffLogsService = new StaffLogsService();

type MentorDTO = {
  staffId: number;
  name: string;
  email: string | null;
  phoneNumber: string | null;
};

type PositionWithMentors = typeof internshipPositions.$inferSelect & {
  mentors: MentorDTO[];
};

type DepartmentDTO = {
  id: number;
  deptSap: number;
  deptShort: string | null;
  deptFull: string | null;
  location: string | null;
  officeId: number;
};

type OfficeDTO = {
  id: number;
  name: string;
  shortName: string;
};

type PositionOwnerDTO = {
  id: string;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phoneNumber: string | null;
};

type EnrichedPosition = Omit<PositionWithMentors, "positionOwner"> & {
  positionOwner: PositionOwnerDTO | null;
  department: DepartmentDTO | null;
  office: OfficeDTO | null;
};

function computeAutoStatus(
  recruitStart: string | Date | null,
  recruitEnd: string | Date | null
): "NOT_OPEN_YET" | "OPEN" | "EXPIRED" {
  const now = new Date();

  if (!recruitStart && !recruitEnd) return "OPEN";
  if (!recruitStart || !recruitEnd) return "OPEN";

  const start = new Date(recruitStart);
  const end = new Date(recruitEnd);

  if (now < start) return "NOT_OPEN_YET";
  if (now > end) return "EXPIRED";

  return "OPEN";
}

export class PositionService {
  private async assertUserExists(userId: string) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) throw new ForbiddenError("ไม่พบผู้ใช้งานในระบบ");
  }

  private async getUserDepartmentAndOffice(userId: string): Promise<{
    departmentId: number;
    officeId: number;
  }> {
    const [row] = await db
      .select({
        departmentId: users.departmentId,
        officeId: departments.officeId,
      })
      .from(users)
      .leftJoin(departments, eq(departments.deptSap, users.departmentId))
      .where(eq(users.id, userId));

    if (!row) throw new ForbiddenError("ไม่พบผู้ใช้งานในระบบ");
    if (row.departmentId === null) {
      throw new ForbiddenError("ผู้ใช้งานยังไม่ได้สังกัดแผนก (department)");
    }
    if (row.officeId === null) {
      throw new ForbiddenError("department ของผู้ใช้งานยังไม่ได้ผูกสำนักงาน (office)");
    }

    return { departmentId: row.departmentId, officeId: row.officeId };
  }

  private async assertAssignablePositionOwner(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    positionOwnerUserId: string,
    positionDepartmentId: number
  ) {
    const [targetUser] = await tx
      .select({
        id: users.id,
        roleId: users.roleId,
        departmentId: users.departmentId,
      })
      .from(users)
      .where(eq(users.id, positionOwnerUserId));

    if (!targetUser) {
      throw new NotFoundError("ไม่พบผู้ใช้งานที่จะตั้งเป็น position owner");
    }

    if (targetUser.departmentId === null) {
      throw new BadRequestError(
        "ผู้ใช้งานที่จะตั้งเป็น position owner ยังไม่มี department"
      );
    }

    if (targetUser.departmentId !== positionDepartmentId) {
      throw new ForbiddenError("position owner ต้องอยู่กองเดียวกับใบประกาศ");
    }

    if (![1, 2].includes(targetUser.roleId)) {
      throw new ForbiddenError("position owner ต้องมี role เป็น ADMIN หรือ OWNER");
    }
  }

  async findAll(query: model.GetPositionsQueryType) {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      office,
    } = query as model.GetPositionsQueryType & { office?: number };

    const offset = (page - 1) * limit;
    const filters: SQL[] = [isNull(internshipPositions.deletedAt)];

    if (department !== undefined) {
      filters.push(eq(internshipPositions.departmentId, department));
    }

    if (office !== undefined) {
      filters.push(eq(internshipPositions.officeId, office));
    }

    if (search) {
      const terms = search.split(" ").filter(Boolean);
      if (terms.length > 0) {
        const searchFilters = terms.map((w) =>
          ilike(internshipPositions.name, `%${w}%`)
        );
        filters.push(or(...searchFilters)!);
      }
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const rows = await db
      .select({
        position: internshipPositions,

        mentorStaffId: internshipPositionMentors.mentorStaffId,
        mentorFname: users.fname,
        mentorLname: users.lname,
        mentorEmail: users.email,
        mentorPhone: users.phoneNumber,
      })
      .from(internshipPositions)
      .leftJoin(
        internshipPositionMentors,
        eq(internshipPositionMentors.positionId, internshipPositions.id)
      )
      .leftJoin(
        staffProfiles,
        eq(staffProfiles.id, internshipPositionMentors.mentorStaffId)
      )
      .leftJoin(users, eq(users.id, staffProfiles.userId))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(
        internshipPositions.recruitStart,
        internshipPositions.createdAt,
        internshipPositions.id
      );

    const map = new Map<number, PositionWithMentors>();

    for (const r of rows) {
      const id = r.position.id;

      if (!map.has(id)) {
        map.set(id, { ...r.position, mentors: [] });
      }

      if (r.mentorStaffId) {
        map.get(id)!.mentors.push({
          staffId: r.mentorStaffId,
          name: `${r.mentorFname ?? ""} ${r.mentorLname ?? ""}`.trim(),
          email: r.mentorEmail,
          phoneNumber: r.mentorPhone,
        });
      }
    }

    const positions = Array.from(map.values());

    const departmentIds = [...new Set(positions.map((p) => p.departmentId))];
    const officeIds = [...new Set(positions.map((p) => p.officeId))];
    const positionOwnerIds = [
      ...new Set(
        positions
          .map((p) => p.positionOwner)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const ownerRows =
      positionOwnerIds.length > 0
        ? await db
            .select({
              id: users.id,
              fname: users.fname,
              lname: users.lname,
              email: users.email,
              phoneNumber: users.phoneNumber,
            })
            .from(users)
            .where(or(...positionOwnerIds.map((id) => eq(users.id, id))))
        : [];

    const ownerMap = new Map<string, PositionOwnerDTO>();
    for (const owner of ownerRows) {
      ownerMap.set(owner.id, {
        id: owner.id,
        fname: owner.fname ?? null,
        lname: owner.lname ?? null,
        email: owner.email ?? null,
        phoneNumber: owner.phoneNumber ?? null,
      });
    }

    const departmentData =
      departmentIds.length > 0
        ? await db
            .select({
              id: departments.deptSap,
              deptSap: departments.deptSap,
              deptShort: departments.deptShort,
              deptFull: departments.deptFull,
              location: departments.location,
              officeId: departments.officeId,
            })
            .from(departments)
            .where(
              or(...departmentIds.map((dId) => eq(departments.deptSap, dId)))
            )
        : [];

    const officeData =
      officeIds.length > 0
        ? await db
            .select({
              id: offices.id,
              name: offices.name,
              shortName: offices.shortName,
            })
            .from(offices)
            .where(or(...officeIds.map((oId) => eq(offices.id, oId))))
        : [];

    const enriched: EnrichedPosition[] = positions.map((position) => {
      const dept = departmentData.find((d) => d.id === position.departmentId);
      const off = officeData.find((o) => o.id === position.officeId);

      return {
        ...position,
        positionOwner: position.positionOwner
          ? (ownerMap.get(position.positionOwner) ?? null)
          : null,
        department: dept
          ? {
              id: dept.id,
              deptSap: dept.deptSap,
              deptShort: dept.deptShort ?? null,
              deptFull: dept.deptFull ?? null,
              location: dept.location ?? null,
              officeId: dept.officeId,
            }
          : null,
        office: off
          ? {
              id: off.id,
              name: off.name,
              shortName: off.shortName,
            }
          : null,
      };
    });

    const [totalResult] = await db
      .select({ count: count() })
      .from(internshipPositions)
      .where(whereClause);

    const total = Number(totalResult.count);
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;

    return {
      data: enriched,
      meta: { total, page, limit, totalPages, hasNextPage },
    };
  }

  async create(userId: string, data: model.CreatePositionBodyType) {
    await this.assertUserExists(userId);
    const { departmentId, officeId } =
      await this.getUserDepartmentAndOffice(userId);

    return await db.transaction(async (tx) => {
      const autoStatus = computeAutoStatus(
        data.recruitStart ?? null,
        data.recruitEnd ?? null
      );

      if (data.recruitmentStatus === "CLOSE") {
        throw new ForbiddenError("ไม่สามารถสร้างประกาศที่มีสถานะ CLOSE ได้");
      }

      const [position] = await tx
        .insert(internshipPositions)
        .values({
          departmentId,
          officeId,
          positionOwner: userId,

          name: data.name,
          location: data.location ?? null,
          positionCount: data.positionCount ?? null,
          major: data.major ?? null,

          recruitStart: data.recruitStart ?? null,
          recruitEnd: data.recruitEnd ?? null,
          applyStart: data.applyStart ?? null,
          applyEnd: data.applyEnd ?? null,

          resumeRq: data.resumeRq ?? false,
          portfolioRq: data.portfolioRq ?? false,

          jobDetails: data.jobDetails ?? null,
          requirement: data.requirement ?? null,
          benefits: data.benefits ?? null,

          recruitmentStatus: autoStatus,
        })
        .returning();

      if (data.mentorStaffIds && data.mentorStaffIds.length > 0) {
        await tx.insert(internshipPositionMentors).values(
          data.mentorStaffIds.map((mentorStaffId) => ({
            positionId: position.id,
            mentorStaffId,
          }))
        );
      }

      await staffLogsService.log(
        tx,
        userId,
        `CREATE_POSITION positionId=${position.id} positionOwner=${userId}`
      );

      return position;
    });
  }

  async update(userId: string, id: number, data: model.UpdatePositionBodyType) {
    await this.assertUserExists(userId);
    const { departmentId } = await this.getUserDepartmentAndOffice(userId);

    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: internshipPositions.id,
          departmentId: internshipPositions.departmentId,
          recruitStart: internshipPositions.recruitStart,
          recruitEnd: internshipPositions.recruitEnd,
          recruitmentStatus: internshipPositions.recruitmentStatus,
          acceptedCount: internshipPositions.acceptedCount,
          positionOwner: internshipPositions.positionOwner,
        })
        .from(internshipPositions)
        .where(
          and(
            eq(internshipPositions.id, id),
            isNull(internshipPositions.deletedAt)
          )
        );

      if (!existing) throw new NotFoundError(`ไม่พบใบประกาศรหัส ${id}`);
      if (existing.departmentId !== departmentId) {
        throw new ForbiddenError("ไม่มีสิทธิ์แก้ไขใบประกาศของกองอื่น");
      }

      if ("positionOwner" in data && data.positionOwner !== undefined) {
        if (data.positionOwner === null || data.positionOwner === "") {
          throw new BadRequestError(
            "ไม่อนุญาตให้ล้าง position owner ผ่าน endpoint นี้"
          );
        }

        await this.assertAssignablePositionOwner(
          tx,
          data.positionOwner,
          existing.departmentId
        );
      }

      if ("positionCount" in data) {
        if (data.positionCount !== null && data.positionCount !== undefined) {
          const nextCount = Number(data.positionCount);

          if (!Number.isFinite(nextCount) || nextCount < 0) {
            throw new BadRequestError("positionCount ไม่ถูกต้อง");
          }

          const accepted = Number(existing.acceptedCount ?? 0);
          if (nextCount < accepted) {
            throw new BadRequestError(
              `ไม่สามารถลด positionCount ให้ต่ำกว่า acceptedCount (acceptedCount=${accepted})`
            );
          }
        }
      }

      const newRecruitStart =
        "recruitStart" in data
          ? (data.recruitStart ?? null)
          : (existing.recruitStart ?? null);

      const newRecruitEnd =
        "recruitEnd" in data
          ? (data.recruitEnd ?? null)
          : (existing.recruitEnd ?? null);

      const autoStatus = computeAutoStatus(newRecruitStart, newRecruitEnd);

      let finalStatus: "NOT_OPEN_YET" | "OPEN" | "CLOSE" | "EXPIRED";

      if ("recruitmentStatus" in data && data.recruitmentStatus !== undefined) {
        if (data.recruitmentStatus === "CLOSE") {
          finalStatus = "CLOSE";
        } else {
          finalStatus = autoStatus;
        }
      } else {
        if (existing.recruitmentStatus === "CLOSE" && autoStatus === "OPEN") {
          finalStatus = "CLOSE";
        } else if (existing.recruitmentStatus === "CLOSE") {
          finalStatus = "CLOSE";
        } else {
          finalStatus = autoStatus;
        }
      }

      const updateData: Partial<typeof internshipPositions.$inferInsert> = {
        updatedAt: new Date(),
        recruitmentStatus: finalStatus,
      };

      if ("name" in data) updateData.name = data.name;
      if ("location" in data) updateData.location = data.location;
      if ("positionCount" in data) {
        updateData.positionCount = data.positionCount;
      }
      if ("major" in data) updateData.major = data.major;

      if ("recruitStart" in data) updateData.recruitStart = data.recruitStart;
      if ("recruitEnd" in data) updateData.recruitEnd = data.recruitEnd;

      if ("applyStart" in data) updateData.applyStart = data.applyStart;
      if ("applyEnd" in data) updateData.applyEnd = data.applyEnd;

      if ("resumeRq" in data) updateData.resumeRq = data.resumeRq;
      if ("portfolioRq" in data) updateData.portfolioRq = data.portfolioRq;

      if ("jobDetails" in data) updateData.jobDetails = data.jobDetails;
      if ("requirement" in data) updateData.requirement = data.requirement;
      if ("benefits" in data) updateData.benefits = data.benefits;

      if ("positionOwner" in data && data.positionOwner !== undefined) {
        updateData.positionOwner = data.positionOwner;
      }

      const [updated] = await tx
        .update(internshipPositions)
        .set(updateData)
        .where(
          and(
            eq(internshipPositions.id, id),
            eq(internshipPositions.departmentId, departmentId),
            isNull(internshipPositions.deletedAt)
          )
        )
        .returning();

      if (!updated) throw new NotFoundError(`ไม่พบใบประกาศรหัส ${id}`);

      if (data.mentorStaffIds) {
        await tx
          .delete(internshipPositionMentors)
          .where(eq(internshipPositionMentors.positionId, id));

        if (data.mentorStaffIds.length > 0) {
          await tx.insert(internshipPositionMentors).values(
            data.mentorStaffIds.map((mentorStaffId) => ({
              positionId: id,
              mentorStaffId,
            }))
          );
        }
      }

      await staffLogsService.log(
        tx,
        userId,
        `UPDATE_POSITION positionId=${updated.id}${
          "positionOwner" in data && data.positionOwner !== undefined
            ? ` positionOwner=${data.positionOwner}`
            : ""
        }`
      );

      return updated;
    });
  }

  async delete(userId: string, id: number) {
    await this.assertUserExists(userId);
    const { departmentId } = await this.getUserDepartmentAndOffice(userId);

    return await db.transaction(async (tx) => {
      const [pos] = await tx
        .select({
          id: internshipPositions.id,
          departmentId: internshipPositions.departmentId,
          acceptedCount: internshipPositions.acceptedCount,
        })
        .from(internshipPositions)
        .where(
          and(
            eq(internshipPositions.id, id),
            isNull(internshipPositions.deletedAt)
          )
        );

      if (!pos) throw new NotFoundError(`ไม่พบใบประกาศรหัส ${id}`);

      if (pos.departmentId !== departmentId) {
        throw new ForbiddenError("ไม่มีสิทธิ์ลบใบประกาศของกองอื่น");
      }

      if ((pos.acceptedCount ?? 0) > 0) {
        throw new BadRequestError("ไม่สามารถลบประกาศได้ เนื่องจากมีผู้ได้รับคัดเลือกแล้ว");
      }

      await tx
        .update(internshipPositions)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(internshipPositions.id, id),
            isNull(internshipPositions.deletedAt)
          )
        );

      const affectedApplications = await tx
        .select({
          userId: applicationStatuses.userId,
        })
        .from(applicationStatuses)
        .where(eq(applicationStatuses.positionId, id));

      await tx
        .update(applicationStatuses)
        .set({
          applicationStatus: "ABORT",
          isActive: false,
          statusNote: "ใบประกาศฝึกงานถูกลบโดยเจ้าหน้าที่",
          updatedAt: new Date(),
        })
        .where(eq(applicationStatuses.positionId, id));

      if (affectedApplications.length > 0) {
        const userIds = affectedApplications.map((a) => a.userId);

        await tx
          .update(studentProfiles)
          .set({
            internshipStatus: "IDLE",
          })
          .where(or(...userIds.map((uid) => eq(studentProfiles.userId, uid))));

        await tx.insert(notifications).values(
          userIds.map((uid) => ({
            userId: uid,
            title: "ใบสมัครถูกยกเลิก",
            message: "ใบสมัครของคุณถูกยกเลิก เนื่องจากใบประกาศฝึกงานนี้ถูกลบโดยเจ้าหน้าที่",
          }))
        );
      }

      await staffLogsService.log(
        tx,
        userId,
        `SOFT_DELETE_POSITION positionId=${id} AND_ABORT_APPLICATIONS`
      );

      return {
        success: true,
        message: "ลบใบประกาศเรียบร้อยแล้ว และเปลี่ยนสถานะใบสมัครเป็น ABORT",
      };
    });
  }
}
