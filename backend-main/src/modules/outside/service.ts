import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationStatuses,
  offsiteTaskStudents,
  offsiteTasks,
  users,
} from "@/db/schema";
import type * as offsiteModel from "./model";

export class OffsiteTaskService {
  async createTask(mentorId: string, data: offsiteModel.CreateOffsiteTaskDto) {
    if (!data.studentIds || data.studentIds.length === 0) {
      throw new BadRequestError("ต้องระบุนักศึกษาอย่างน้อย 1 คน");
    }

    return await db.transaction(async (tx) => {
      const [newTask] = await tx
        .insert(offsiteTasks)
        .values({
          assignedBy: mentorId,
          workDate: data.workDate,
          locationName: data.locationName,
          taskDetail: data.taskDetail,
          note: data.note,
        })
        .returning({ id: offsiteTasks.id });

      const studentsToInsert = data.studentIds.map((studentId) => ({
        taskId: newTask.id,
        studentId: studentId,
      }));

      await tx.insert(offsiteTaskStudents).values(studentsToInsert);

      return {
        success: true,
        message: "มอบหมายงานนอกสถานที่สำเร็จ",
        taskId: newTask.id,
      };
    });
  }

  async getTasksByMentor(mentorId: string) {
    const tasks = await db.query.offsiteTasks.findMany({
      where: eq(offsiteTasks.assignedBy, mentorId),
      orderBy: [desc(offsiteTasks.workDate)],
      with: {
        students: {
          with: {
            student: {
              columns: { id: true, fname: true, lname: true },
            },
          },
        },
      },
    });
    return tasks;
  }

  async getTasksForStudent(studentId: string) {
    const studentApp = await db.query.applicationStatuses.findFirst({
      where: and(
        eq(applicationStatuses.userId, studentId),
        eq(applicationStatuses.isActive, true)
      ),
      with: {
        internshipPosition: {
          columns: { name: true },
        },
      },
    });

    const positionName = studentApp?.internshipPosition?.name || "ไม่ระบุตำแหน่ง";

    const assignedTasks = await db.query.offsiteTaskStudents.findMany({
      where: eq(offsiteTaskStudents.studentId, studentId),
      with: {
        task: {
          with: {
            assignedByUser: {
              columns: { fname: true, lname: true },
            },
          },
        },
      },
    });

    return assignedTasks
      .map((st) => ({
        taskId: st.task.id,
        workDate: st.task.workDate,
        locationName: st.task.locationName,
        taskDetail: st.task.taskDetail,
        note: st.task.note,
        positionName: positionName,
        assignedBy: `${st.task.assignedByUser.fname} ${st.task.assignedByUser.lname}`,
      }))
      .sort(
        (a, b) =>
          new Date(b.workDate).getTime() - new Date(a.workDate).getTime()
      );
  }

  async updateTask(
    taskId: number,
    mentorId: string,
    data: offsiteModel.UpdateOffsiteTaskDto
  ) {
    return await db.transaction(async (tx) => {
      const existingTask = await tx.query.offsiteTasks.findFirst({
        where: (tasks, { and, eq }) =>
          and(eq(tasks.id, taskId), eq(tasks.assignedBy, mentorId)),
      });

      if (!existingTask) {
        throw new NotFoundError("ไม่พบงานที่ต้องการแก้ไข หรือคุณไม่มีสิทธิ์แก้ไขงานนี้");
      }

      await tx
        .update(offsiteTasks)
        .set({
          workDate: data.workDate,
          locationName: data.locationName,
          taskDetail: data.taskDetail,
          note: data.note,
          updatedAt: new Date(),
        })
        .where(eq(offsiteTasks.id, taskId));

      if (data.studentIds) {
        if (data.studentIds.length === 0) {
          throw new BadRequestError("ต้องระบุนักศึกษาอย่างน้อย 1 คน");
        }

        await tx
          .delete(offsiteTaskStudents)
          .where(eq(offsiteTaskStudents.taskId, taskId));

        const newStudents = data.studentIds.map((studentId) => ({
          taskId: taskId,
          studentId: studentId,
        }));
        await tx.insert(offsiteTaskStudents).values(newStudents);
      }

      return { success: true, message: "แก้ไขข้อมูลงานนอกสถานที่สำเร็จ" };
    });
  }
  async deleteTask(taskId: number, mentorId: string) {
    return await db.transaction(async (tx) => {
      const existingTask = await tx.query.offsiteTasks.findFirst({
        where: (tasks, { and, eq }) =>
          and(eq(tasks.id, taskId), eq(tasks.assignedBy, mentorId)),
      });

      if (!existingTask) {
        throw new NotFoundError("ไม่พบงานที่ต้องการลบ หรือคุณไม่มีสิทธิ์ลบงานนี้");
      }

      await tx
        .delete(offsiteTaskStudents)
        .where(eq(offsiteTaskStudents.taskId, taskId));

      await tx.delete(offsiteTasks).where(eq(offsiteTasks.id, taskId));

      return { success: true, message: "ลบงานนอกสถานที่สำเร็จ" };
    });
  }

  async getTasksForDept(
    mentorId: string,
    query: offsiteModel.GetOffsiteTasksQueryDto
  ) {
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, mentorId),
      columns: { departmentId: true },
    });

    if (!currentUser || !currentUser.departmentId) {
      throw new BadRequestError("ไม่พบข้อมูลแผนกของคุณ");
    }

    const conditions = [];

    if (query.targetMentorId) {
      const targetMentor = await db.query.users.findFirst({
        where: eq(users.id, query.targetMentorId),
        columns: { departmentId: true },
      });

      if (!targetMentor) {
        throw new BadRequestError("ไม่พบข้อมูลพี่เลี้ยงที่ระบุ");
      }

      const isSameDept = targetMentor.departmentId === currentUser.departmentId;
      if (!isSameDept) {
        throw new ForbiddenError("คุณไม่มีสิทธิ์ดูข้อมูลการมอบหมายงานของบุคลากรนอกแผนก");
      }

      conditions.push(eq(offsiteTasks.assignedBy, query.targetMentorId));
    } else if (query.viewMode === "mine") {
      conditions.push(eq(offsiteTasks.assignedBy, mentorId));
    } else if (query.viewMode === "all") {
      // Find all mentors in this department
      const deptMentors = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.departmentId, currentUser.departmentId));

      const mentorIds = deptMentors.map((m) => m.id);

      if (mentorIds.length > 0) {
        conditions.push(sql`${offsiteTasks.assignedBy} IN ${mentorIds}`);
      } else {
        // Fallback: This shouldn't really happen since the caller is a mentor in the dept
        conditions.push(eq(offsiteTasks.assignedBy, mentorId));
      }
    } else {
      // Default to mine if no viewMode or invalid
      conditions.push(eq(offsiteTasks.assignedBy, mentorId));
    }

    if (query.year && query.month) {
      const formattedMonth = query.month.toString().padStart(2, "0");
      const lastDay = new Date(query.year, query.month, 0).getDate();

      const startDateStr = `${query.year}-${formattedMonth}-01`;
      const endDateStr = `${query.year}-${formattedMonth}-${lastDay}`;

      conditions.push(
        gte(offsiteTasks.workDate, startDateStr),
        lte(offsiteTasks.workDate, endDateStr)
      );
    }

    const orderCol =
      query.sortBy === "createdAt"
        ? offsiteTasks.createdAt
        : offsiteTasks.workDate;
    const orderFn = query.sortOrder === "asc" ? asc(orderCol) : desc(orderCol);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(offsiteTasks)
      .where(and(...conditions));

    const totalCount = Number(totalResult.count);

    const tasks = await db.query.offsiteTasks.findMany({
      where: and(...conditions),
      orderBy: [orderFn],
      limit: limit,
      offset: offset,
      with: {
        assignedByUser: {
          columns: { id: true, fname: true, lname: true },
        },
        students: {
          with: {
            student: {
              columns: { id: true, fname: true, lname: true },
              with: {
                studentProfiles: {
                  columns: { image: true },
                },
              },
            },
          },
        },
      },
    });

    return {
      data: tasks.map((t) => ({
        id: t.id,
        workDate: t.workDate,
        createdAt: t.createdAt,
        locationName: t.locationName,
        assignedBy: t.assignedByUser
          ? `${t.assignedByUser.fname} ${t.assignedByUser.lname}`
          : "ไม่ระบุ",
        isOwner: t.assignedByUser?.id === mentorId,
        students: t.students.map((s) => ({
          id: s.student.id,
          name: `${s.student.fname} ${s.student.lname}`,
          image: s.student.studentProfiles[0]?.image || null,
        })),
      })),
      meta: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getTaskById(taskId: number, userId: string, roleId: number) {
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, departmentId: true },
    });

    if (!currentUser) throw new BadRequestError("ไม่พบข้อมูลผู้ใช้");

    const task = await db.query.offsiteTasks.findFirst({
      where: eq(offsiteTasks.id, taskId),
      with: {
        assignedByUser: {
          columns: { id: true, fname: true, lname: true, departmentId: true },
          with: {
            staffProfiles: {
              columns: { employeeId: true },
            },
          },
        },
        students: {
          with: {
            student: {
              columns: {
                id: true,
                fname: true,
                lname: true,
                displayUsername: true,
              },
              with: {
                studentProfiles: {
                  columns: { image: true, faculty: true, major: true },
                },
                // ดึงข้อมูลการสมัครงานเพื่อเอาชื่อตำแหน่ง
                applicationStatuses: {
                  where: eq(applicationStatuses.isActive, true),
                  with: {
                    internshipPosition: {
                      columns: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError("ไม่พบข้อมูลงานนอกสถานที่รายการนี้");
    }

    const isMentor = roleId === 2;
    const isAdmin = roleId === 1;
    const isStudent = roleId === 3;

    if (isMentor || isAdmin) {
      if (task.assignedByUser.departmentId !== currentUser.departmentId) {
        throw new BadRequestError("คุณไม่มีสิทธิ์เข้าถึงงานของแผนกอื่น");
      }
    } else if (isStudent) {
      const isAssignedToThisTask = task.students.some(
        (s) => s.student.id === userId
      );
      if (!isAssignedToThisTask) {
        throw new BadRequestError("คุณไม่มีสิทธิ์เข้าถึงงานนี้ เนื่องจากไม่ได้รับมอบหมาย");
      }
    } else {
      throw new BadRequestError("ไม่มีสิทธิ์เข้าถึง");
    }

    return {
      id: task.id,
      workDate: task.workDate,
      createdAt: task.createdAt,
      locationName: task.locationName,
      taskDetail: task.taskDetail,
      note: task.note,
      isOwner: task.assignedByUser.id === userId,
      assignedBy: `${task.assignedByUser.fname} ${task.assignedByUser.lname}`,
      assignedByEmployeeId:
        task.assignedByUser.staffProfiles[0]?.employeeId || null,
      students: task.students.map((s) => {
        const activeApp = s.student.applicationStatuses?.[0];
        const positionName =
          activeApp?.internshipPosition?.name || "ไม่ระบุตำแหน่ง";

        return {
          id: s.student.id,
          name: `${s.student.fname} ${s.student.lname}`,
          image: s.student.studentProfiles[0]?.image || null,
          nickname: s.student.displayUsername || "",
          faculty: s.student.studentProfiles[0]?.faculty || "",
          major: s.student.studentProfiles[0]?.major || "",
          positionName: positionName,
        };
      }),
    };
  }
}
