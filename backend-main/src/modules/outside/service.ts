import { desc, eq } from "drizzle-orm";
import { BadRequestError, NotFoundError } from "@/common/exceptions";
import { db } from "@/db";
import { offsiteTaskStudents, offsiteTasks } from "@/db/schema";
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
}
