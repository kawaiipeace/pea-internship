import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { BadRequestError, ConflictError } from "@/common/exceptions";
import { isObject, isPostgresError } from "@/common/utils/type-guard";
import { db } from "@/db";
import { departments } from "@/db/schema";
import type * as model from "./model";

export class DepartmentService {
  async findAll(query: model.GetDepartmentsQueryType) {
    const {
      page = 1,
      limit = 50,
      search,
      office,
    } = query as model.GetDepartmentsQueryType & { office?: number };

    const offset = (page - 1) * limit;

    const filters: SQL[] = [];

    if (office !== undefined) {
      filters.push(eq(departments.officeId, office));
    }

    if (search) {
      const terms = search.split(" ").filter(Boolean);

      if (terms.length > 0) {
        const perTerm: SQL[] = terms.map((w) =>
          or(
            ilike(departments.deptShort, `%${w}%`),
            ilike(departments.deptFull, `%${w}%`),
            ilike(departments.peaCode, `%${w}%`)
          )!
        );

        filters.push(and(...perTerm)!);
      }
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const data = await db
      .select({
        id: departments.deptSap,
        deptSap: departments.deptSap,
        deptChangeCode: departments.deptChangeCode,
        deptUpper: departments.deptUpper,

        deptShort1: departments.deptShort1,
        deptShort2: departments.deptShort2,
        deptShort3: departments.deptShort3,
        deptShort4: departments.deptShort4,
        deptShort5: departments.deptShort5,
        deptShort6: departments.deptShort6,
        deptShort7: departments.deptShort7,
        deptShort: departments.deptShort,

        deptFull1: departments.deptFull1,
        deptFull2: departments.deptFull2,
        deptFull3: departments.deptFull3,
        deptFull4: departments.deptFull4,
        deptFull5: departments.deptFull5,
        deptFull6: departments.deptFull6,
        deptFull7: departments.deptFull7,
        deptFull: departments.deptFull,

        costCenterCode: departments.costCenterCode,
        costCenterName: departments.costCenterName,

        peaCode: departments.peaCode,
        businessPlace: departments.businessPlace,
        businessArea: departments.businessArea,

        resourceCode: departments.resourceCode,
        resourceName: departments.resourceName,

        taxBranch: departments.taxBranch,

        isActive: departments.isActive,
        createdAt: departments.createdAt,
        createdBy: departments.createdBy,
        updatedAt: departments.updatedAt,
        updatedBy: departments.updatedBy,
        isDeleted: departments.isDeleted,

        deptStableCode: departments.deptStableCode,
        deptSapShort: departments.deptSapShort,
        deptSapFull: departments.deptSapFull,

        deptFullEng1: departments.deptFullEng1,
        deptFullEng2: departments.deptFullEng2,
        deptFullEng3: departments.deptFullEng3,
        deptFullEng4: departments.deptFullEng4,
        deptFullEng5: departments.deptFullEng5,
        deptFullEng6: departments.deptFullEng6,
        deptFullEng7: departments.deptFullEng7,

        deptOrder: departments.deptOrder,
        flgDelimit: departments.flgDelimit,
        delimitEffectivedt: departments.delimitEffectivedt,
        gsberCctr: departments.gsberCctr,

        deptLev2: departments.deptLev2,
        deptLev3: departments.deptLev3,
        seq: departments.seq,
        location: departments.location,
        officeId: departments.officeId,
      })
      .from(departments)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(departments.deptSap));

    const [totalResult] = await db
      .select({ count: count() })
      .from(departments)
      .where(whereClause);

    const total = Number(totalResult.count);
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
      },
    };
  }

  async create(data: model.CreateDepartmentBodyType) {
    try {
      const payload: typeof departments.$inferInsert = {
        ...data,
        isActive: data.isActive ?? true,
        isDeleted: data.isDeleted ?? false,
      };

      const [newDept] = await db
        .insert(departments)
        .values(payload)
        .returning();

      return newDept;
    } catch (error: unknown) {
      const err = isObject(error) && "cause" in error ? error.cause : error;

      if (isPostgresError(err) && err.code === "23505") {
        throw new ConflictError("ข้อมูลแผนกซ้ำในระบบ (dept_sap หรือ key อื่นซ้ำ)");
      }

      throw error;
    }
  }

  async update(id: number, data: model.UpdateDepartmentBodyType) {
    try {
      const payload: Partial<typeof departments.$inferInsert> = {
        ...data,
        updatedAt: new Date(),
      };

      const [updatedDept] = await db
        .update(departments)
        .set(payload)
        .where(eq(departments.deptSap, id))
        .returning();

      if (!updatedDept) {
        throw new NotFoundError(`ไม่พบข้อมูลแผนกรหัส ${id}`);
      }

      return updatedDept;
    } catch (error: unknown) {
      const err = isObject(error) && "cause" in error ? error.cause : error;

      if (isPostgresError(err) && err.code === "23505") {
        throw new ConflictError("ข้อมูลแผนกซ้ำในระบบ (dept_sap หรือ key อื่นซ้ำ)");
      }

      throw error;
    }
  }

  async delete(id: number) {
    try {
      const [deletedDept] = await db
        .delete(departments)
        .where(eq(departments.deptSap, id))
        .returning();

      if (!deletedDept) {
        throw new NotFoundError(`ไม่พบข้อมูลแผนกรหัส ${id}`);
      }

      return {
        success: true,
        message: "ลบข้อมูลแผนกเรียบร้อยแล้ว",
      };
    } catch (error: unknown) {
      const err = isObject(error) && "cause" in error ? error.cause : error;

      if (isPostgresError(err) && err.code === "23503") {
        throw new BadRequestError(
          "ไม่สามารถลบข้อมูลนี้ได้ เนื่องจากข้อมูลถูกใช้งานอยู่ในส่วนอื่น (Foreign Key Constraint)"
        );
      }

      throw error;
    }
  }
}