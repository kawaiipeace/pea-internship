import { desc, eq } from "drizzle-orm";
import { BadRequestError } from "@/common/exceptions";
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
}
