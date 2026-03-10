import { and, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { BadRequestError, ForbiddenError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  departments,
  internshipPositionMentors,
  internshipPositions,
  offices,
  staffProfiles,
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

type OwnerDTO = {
  fname: string | null;
  lname: string | null;
  email: string | null;
  phoneNumber: string | null;
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

type EnrichedPosition = PositionWithMentors & {
  owners: OwnerDTO[];
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

  /**
   * ผู้ใช้ต้องมี department_id
   */
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
      .leftJoin(departments, eq(departments.id, users.departmentId))
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

  /**
   * GET /position
   * filter ได้ด้วย search, department, office
   * แสดง mentor
   */
  async findAll(query: model.GetPositionsQueryType) {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      office,
    } = query as model.GetPositionsQueryType & { office?: number };

    const offset = (page - 1) * limit;
    const filters: SQL[] = [];

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

    const owners =
      departmentIds.length > 0
        ? await db
            .select({
              departmentId: users.departmentId,
              fname: users.fname,
              lname: users.lname,
              email: users.email,
              phoneNumber: users.phoneNumber,
            })
            .from(users)
            .where(
              and(
                eq(users.roleId, 2),
                or(...departmentIds.map((dId) => eq(users.departmentId, dId)))
              )
            )
        : [];

    const departmentData =
      departmentIds.length > 0
        ? await db
            .select({
              id: departments.id,
              deptSap: departments.deptSap,
              deptShort: departments.deptShort,
              deptFull: departments.deptFull,
              location: departments.location,
              officeId: departments.officeId,
            })
            .from(departments)
            .where(or(...departmentIds.map((dId) => eq(departments.id, dId))))
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

    const ownersByDept = new Map<number, OwnerDTO[]>();
    for (const o of owners) {
      const deptId = o.departmentId;
      if (deptId === null) continue;

      const list = ownersByDept.get(deptId) ?? [];
      list.push({
        fname: o.fname ?? null,
        lname: o.lname ?? null,
        email: o.email ?? null,
        phoneNumber: o.phoneNumber ?? null,
      });
      ownersByDept.set(deptId, list);
    }

    const enriched: EnrichedPosition[] = positions.map((position) => {
      const dept = departmentData.find((d) => d.id === position.departmentId);
      const off = officeData.find((o) => o.id === position.officeId);

      return {
        ...position,
        owners: ownersByDept.get(position.departmentId) ?? [],
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

  /**
   * POST /position
   * ผูก departmentId + officeId จาก user
   * ผูก mentor
   */
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
        `CREATE_POSITION positionId=${position.id}`
      );

      return position;
    });
  }

  /**
   * PUT /position/:id
   * แก้ได้เฉพาะ position ใน department ของตัวเอง
   */
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
        })
        .from(internshipPositions)
        .where(eq(internshipPositions.id, id));

      if (!existing) throw new NotFoundError(`ไม่พบใบประกาศรหัส ${id}`);
      if (existing.departmentId !== departmentId) {
        throw new ForbiddenError("ไม่มีสิทธิ์แก้ไขใบประกาศของกองอื่น");
      }

      if (data.positionCount !== undefined && data.positionCount !== null) {
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

      const newRecruitStart =
        "recruitStart" in data
          ? (data.recruitStart ?? null)
          : (existing.recruitStart ?? null);

      const newRecruitEnd =
        "recruitEnd" in data
          ? (data.recruitEnd ?? null)
          : (existing.recruitEnd ?? null);

      const autoStatus = computeAutoStatus(newRecruitStart, newRecruitEnd);

      let finalStatus: "NOT_OPEN_YET" | "OPEN" | "CLOSE" | "EXPIRED" =
        autoStatus;

      if (data.recruitmentStatus === "CLOSE") {
        if (autoStatus !== "OPEN") {
          throw new ForbiddenError(
            "สามารถปิดประกาศได้เฉพาะตอนที่สถานะเป็น OPEN เท่านั้น"
          );
        }
        finalStatus = "CLOSE";
      } else if (data.recruitmentStatus === "OPEN") {
        if (autoStatus !== "OPEN") {
          throw new ForbiddenError(
            "ไม่สามารถเปิดรับสมัครได้ เพราะยังไม่ถึงเวลาเปิดรับสมัครหรือประกาศหมดอายุ"
          );
        }
        finalStatus = "OPEN";
      } else {
        if (existing.recruitmentStatus === "CLOSE" && autoStatus === "OPEN") {
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
      if ("positionCount" in data)
        updateData.positionCount = data.positionCount;
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

      const [updated] = await tx
        .update(internshipPositions)
        .set(updateData)
        .where(
          and(
            eq(internshipPositions.id, id),
            eq(internshipPositions.departmentId, departmentId)
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
        `UPDATE_POSITION positionId=${updated.id}`
      );

      return updated;
    });
  }

  /**
   * DELETE /position/:id
   */
  async delete(userId: string, id: number) {
    await this.assertUserExists(userId);
    const { departmentId } = await this.getUserDepartmentAndOffice(userId);

    return await db.transaction(async (tx) => {
      const [pos] = await tx
        .select({
          id: internshipPositions.id,
          departmentId: internshipPositions.departmentId,
        })
        .from(internshipPositions)
        .where(eq(internshipPositions.id, id));

      if (!pos) throw new NotFoundError(`ไม่พบใบประกาศรหัส ${id}`);
      if (pos.departmentId !== departmentId) {
        throw new ForbiddenError("ไม่มีสิทธิ์ลบใบประกาศของกองอื่น");
      }

      const [hasApplication] = await tx
        .select({ id: applicationStatuses.id })
        .from(applicationStatuses)
        .where(eq(applicationStatuses.positionId, id))
        .limit(1);

      if (hasApplication) {
        throw new BadRequestError(
          "ไม่สามารถลบใบประกาศได้ เนื่องจากมีใบสมัครผูกอยู่กับตำแหน่งนี้"
        );
      }

      await tx
        .delete(internshipPositions)
        .where(eq(internshipPositions.id, id));

      await staffLogsService.log(
        tx,
        userId,
        `DELETE_POSITION positionId=${id}`
      );

      return { success: true, message: "ลบใบประกาศเรียบร้อยแล้ว" };
    });
  }
}
