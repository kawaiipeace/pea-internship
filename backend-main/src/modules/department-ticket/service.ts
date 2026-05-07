import { eq } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { db } from "@/db";
import { departments } from "@/db/schema";

export class DepartmentTicketService {
  async findById(id: number) {
    const [row] = await db
      .select({
        deptSap: departments.deptSap,
        deptShort: departments.deptShort,
        deptFull: departments.deptFull,
        location: departments.location,
        officeId: departments.officeId,
      })
      .from(departments)
      .where(eq(departments.deptSap, id))
      .limit(1);

    if (!row) throw new NotFoundError(`ไม่พบหน่วยงานรหัส ${id}`);

    return row;
  }
}
