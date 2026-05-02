import {
  aliasedTable,
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationInformations,
  applicationStatuses,
  attendanceLogs,
  checkTimes,
  departments,
  institutions,
  internshipPositions,
  internshipExtensions,
  leaveRequests,
  offsiteTaskStudents,
  offsiteTasks,
  staffProfiles,
  studentAttendanceSummary,
  studentProfiles,
  timeCorrectionRequests,
  users,
} from "@/db/schema";
import type * as model from "./model";

export class MentorService {
  async getStudents(
    mentorUserId: string,
    query: model.GetStudentsUnderCareQueryType
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
      viewType,
    } = query;

    const mentor = await db.query.users.findFirst({
      where: eq(users.id, mentorUserId),
      with: { staffProfiles: true },
    });

    if (!mentor?.staffProfiles) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะพี่เลี้ยงเท่านั้น)");
    }

    const conditions: (SQL | undefined)[] = [
      or(
        eq(applicationStatuses.isActive, true),
        eq(applicationStatuses.applicationStatus, "COMPLETE")
      ),
    ];

    if (viewType !== "ALL" && mentor.departmentId) {
      conditions.push(
        eq(applicationStatuses.departmentId, mentor.departmentId)
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.fname, `%${search}%`),
          ilike(users.lname, `%${search}%`),
          ilike(internshipPositions.name, `%${search}%`),
          ilike(departments.deptShort, `%${search}%`),
          ilike(departments.deptFull, `%${search}%`),
          ilike(institutions.name, `%${search}%`)
        )
      );
    }

    const offset = (page - 1) * limit;

    const baseQuery = db
      .select({
        userId: users.id,
        studentProfileId: studentProfiles.id,
        firstName: users.fname,
        lastName: users.lname,
        image: studentProfiles.image,
        totalHoursGoal: applicationInformations.hours,
        positionName: internshipPositions.name,
        username: users.displayUsername,
        departmentName: sql<string>`COALESCE(${departments.deptSapShort}, ${departments.deptShort}, ${departments.deptFull})`,
        endDate: applicationInformations.endDate,
        institutionName: institutions.name,
        globalAccumulatedHours: studentAttendanceSummary.totalAccumulatedHours,
        globalTotalHoursGoal: studentAttendanceSummary.totalHoursGoal,
      })
      .from(applicationStatuses)
      .innerJoin(users, eq(users.id, applicationStatuses.userId))
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .leftJoin(
        applicationInformations,
        eq(applicationInformations.applicationStatusId, applicationStatuses.id)
      )
      .leftJoin(
        internshipPositions,
        eq(internshipPositions.id, applicationStatuses.positionId)
      )
      .leftJoin(
        departments,
        eq(departments.deptSap, applicationStatuses.departmentId)
      )
      .leftJoin(
        institutions,
        eq(institutions.id, studentProfiles.institutionId)
      )
      .leftJoin(
        studentAttendanceSummary,
        eq(studentAttendanceSummary.studentProfileId, studentProfiles.id)
      )
      .where(and(...conditions));

    const students = await baseQuery.limit(limit).offset(offset);

    if (students.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const totalStudents = (await baseQuery).length;

    const studentProfileIds = students.map((s) => s.studentProfileId);
    const studentUserIds = students.map((s) => s.userId);

    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(new Date());

    const todayLeaves =
      studentUserIds.length > 0
        ? await db
            .select({
              userId: leaveRequests.userId,
              leaveType: leaveRequests.leaveRequestType,
            })
            .from(leaveRequests)
            .where(
              and(
                inArray(leaveRequests.userId, studentUserIds),
                sql`DATE(${leaveRequests.leaveDatetime}) = ${todayStr}`,
                eq(leaveRequests.status, "APPROVED")
              )
            )
        : [];

    const logConditions = [
      inArray(attendanceLogs.studentProfileId, studentProfileIds),
    ];
    if (startDate) logConditions.push(gte(attendanceLogs.workDate, startDate));
    if (endDate) logConditions.push(lte(attendanceLogs.workDate, endDate));

    const allLogs = await db
      .select()
      .from(attendanceLogs)
      .where(and(...logConditions));

    const todayLogs = allLogs.filter((log) => {
      const logDate = log.workDate ? String(log.workDate).substring(0, 10) : "";
      return logDate === todayStr;
    });

    const formattedData = students.map((student) => {
      const studentLogs = allLogs.filter(
        (l) => l.studentProfileId === student.studentProfileId
      );
      const todayLog = todayLogs.find(
        (l) => l.studentProfileId === student.studentProfileId
      );

      let present = 0,
        late = 0,
        leave = 0,
        absent = 0;
      const accumulatedHours = Number(student.globalAccumulatedHours || 0);
      const totalHoursGoal = Number(student.globalTotalHoursGoal || 0);

      studentLogs.forEach((log) => {
        if (log.dailyStatus === "PRESENT") present++;
        else if (log.dailyStatus === "LATE") late++;
        else if (log.dailyStatus === "LEAVE") leave++;
        else if (log.dailyStatus === "ABSENT") absent++;
      });

      let todayStatusText = "ยังไม่ลงเวลา";
      let todayStatusCode = "IDLE";

      if (todayLog) {
        const statusMap: Record<string, string> = {
          PRESENT: "เข้างานปกติ",
          LATE: "มาสาย",
          LEAVE: "ลางาน",
          ABSENT: "ขาดงาน",
        };
        todayStatusCode = todayLog.dailyStatus;
        todayStatusText = statusMap[todayLog.dailyStatus] || "ยังไม่ลงเวลา";

        if (todayLog.dailyStatus === "LEAVE") {
          const studentLeave = todayLeaves.find(
            (l) => l.userId === student.userId
          );
          if (studentLeave?.leaveType === "SICK") {
            todayStatusCode = "SICK";
            todayStatusText = "ลาป่วย";
          } else if (studentLeave?.leaveType === "ABSENCE") {
            todayStatusCode = "ABSENCE";
            todayStatusText = "ลากิจ";
          }
        }
      }

      const remainingHours = totalHoursGoal - accumulatedHours;
      let remainingDays = 0;
      if (remainingHours > 0) {
        const workingDaysLeft = Math.ceil(remainingHours / 7);
        // We use a simple approximation for calendar days: working days * 1.4 (to account for weekends)
        // or just use the endDate if it exists and is further in the future.
        if (student.endDate) {
          const nowBkk = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
          );
          const today = new Date(
            nowBkk.getFullYear(),
            nowBkk.getMonth(),
            nowBkk.getDate()
          );
          const endBkk = new Date(
            new Date(student.endDate).toLocaleString("en-US", {
              timeZone: "Asia/Bangkok",
            })
          );
          const end = new Date(
            endBkk.getFullYear(),
            endBkk.getMonth(),
            endBkk.getDate()
          );

          const diffTime = end.getTime() - today.getTime();
          remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else {
          remainingDays = Math.ceil(workingDaysLeft * 1.4);
        }
      }

      return {
        id: student.userId,
        profileId: student.studentProfileId,
        fullName: `${student.firstName} ${student.lastName} (${student.username})`,
        image: student.image,
        positionName: student.positionName || "ไม่ระบุตำแหน่ง",
        unitName: student.departmentName || "ไม่ระบุหน่วยงาน",
        todayStatus: {
          text: todayStatusText,
          code: todayStatusCode,
        },
        statistics: {
          present,
          late,
          leave,
          absent,
        },
        workHours: {
          accumulated: Number(accumulatedHours.toFixed(2)),
          goal: Number(student.totalHoursGoal || 560),
          remainingDays,
        },
        evaluation: null,
      };
    });

    return {
      data: formattedData,
      meta: {
        total: totalStudents,
        page,
        limit,
        totalPages: Math.ceil(totalStudents / limit),
      },
    };
  }

  async getStudentDetail(
    mentorUserId: string,
    studentId: string,
    query: model.GetStudentDetailQueryType
  ) {
    const { page = 1, limit = 10 } = query;

    const [mentor] = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(staffProfiles, eq(staffProfiles.userId, users.id))
      .where(eq(users.id, mentorUserId));

    if (!mentor) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    }

    const [studentInfo] = await db
      .select({
        userId: users.id,
        applicationStatusId: applicationStatuses.id,
        firstName: users.fname,
        lastName: users.lname,
        username: users.displayUsername,
        email: users.email,
        phone: users.phoneNumber,
        image: studentProfiles.image,
        internshipStatus: studentProfiles.internshipStatus,
        statusNote: studentProfiles.statusNote,
        institutionName: institutions.name,
        positionName: internshipPositions.name,
        startDate: applicationInformations.startDate,
        endDate: applicationInformations.endDate,
        totalHoursGoal: applicationInformations.hours,
        studentProfileId: studentProfiles.id,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .leftJoin(
        institutions,
        eq(institutions.id, studentProfiles.institutionId)
      )
      .innerJoin(applicationStatuses, eq(applicationStatuses.userId, users.id))
      .leftJoin(
        internshipPositions,
        eq(internshipPositions.id, applicationStatuses.positionId)
      )
      .leftJoin(
        applicationInformations,
        eq(applicationInformations.applicationStatusId, applicationStatuses.id)
      )
      .where(
        and(
          eq(users.id, studentId),
          or(
            eq(applicationStatuses.isActive, true),
            eq(applicationStatuses.applicationStatus, "COMPLETE")
          )
        )
      )

      .limit(1);

    if (!studentInfo) {
      throw new NotFoundError("ไม่พบข้อมูลนักศึกษา หรือนักศึกษาไม่ได้อยู่ในสถานะฝึกงาน");
    }

    const totalHoursGoal = Number(studentInfo.totalHoursGoal || 0);
    let accumulatedHours = 0;

    const allLogsForStats = await db
      .select({
        dailyStatus: attendanceLogs.dailyStatus,
        actualHoursWorked: attendanceLogs.actualHoursWorked,
        approvedLeaveHours: attendanceLogs.approvedLeaveHours,
      })
      .from(attendanceLogs)
      .where(eq(attendanceLogs.studentProfileId, studentInfo.studentProfileId));

    allLogsForStats.forEach((log) => {
      accumulatedHours += Number(log.actualHoursWorked || 0);
      accumulatedHours += Number(log.approvedLeaveHours || 0);
    });

    const remainingHours = totalHoursGoal - accumulatedHours;
    let remainingDays = 0;
    if (remainingHours > 0) {
      if (studentInfo.endDate) {
        const nowBkk = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
        );
        const today = new Date(
          nowBkk.getFullYear(),
          nowBkk.getMonth(),
          nowBkk.getDate()
        );
        const endBkk = new Date(
          new Date(studentInfo.endDate).toLocaleString("en-US", {
            timeZone: "Asia/Bangkok",
          })
        );
        const end = new Date(
          endBkk.getFullYear(),
          endBkk.getMonth(),
          endBkk.getDate()
        );

        const diffTime = end.getTime() - today.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        remainingDays = Math.ceil((remainingHours / 7) * 1.4);
      }
    }
    if (remainingDays < 0) remainingDays = 0;

    const [extendedData] = await db
      .select({
        totalExtendedHours: sql`SUM(CAST(${internshipExtensions.additionalHours} AS NUMERIC))`,
        latestNewEndDate: sql`MAX(${internshipExtensions.newEndDate})`,
        latestApprovedAt: sql`MAX(${internshipExtensions.approvedAt})`
      })
      .from(internshipExtensions)
      .where(
        and(
          inArray(
            internshipExtensions.applicationStatusId,
            db.select({ id: applicationStatuses.id })
              .from(applicationStatuses)
              .where(eq(applicationStatuses.userId, studentId))
          ),
          eq(internshipExtensions.status, "APPROVED")
        )
      );

    const totalExtendedHours = Number(extendedData?.totalExtendedHours || 0);
    const extendedEndDate = extendedData?.latestNewEndDate ? new Date(extendedData.latestNewEndDate as string) : null;

    let presentCount = 0,
      lateCount = 0,
      leaveCount = 0,
      absentCount = 0;

    allLogsForStats.forEach((log) => {
      if (log.dailyStatus === "PRESENT") presentCount++;
      else if (log.dailyStatus === "LATE") lateCount++;
      else if (log.dailyStatus === "LEAVE") leaveCount++;
      else if (log.dailyStatus === "ABSENT") absentCount++;
    });

    const offset = (page - 1) * limit;

    const [totalLogsCount] = await db
      .select({ count: count() })
      .from(attendanceLogs)
      .where(eq(attendanceLogs.studentProfileId, studentInfo.studentProfileId));

    const totalRecords = Number(totalLogsCount.count);

    const checkInTable = aliasedTable(checkTimes, "checkIn");
    const checkOutTable = aliasedTable(checkTimes, "checkOut");

    const paginatedLogs = await db
      .select({
        id: attendanceLogs.id,
        workDate: attendanceLogs.workDate,
        status: attendanceLogs.dailyStatus,
        actualHoursWorked: attendanceLogs.actualHoursWorked,
        approvedLeaveHours: attendanceLogs.approvedLeaveHours,
        dailyTaskNote: attendanceLogs.dailyTaskNote,
        checkInTime: checkInTable.time,
        checkInNote: checkInTable.note,
        checkOutTime: checkOutTable.time,
        checkOutNote: checkOutTable.note,
        leaveReason: leaveRequests.reason,
        leaveType: leaveRequests.leaveRequestType,
        leaveFile: leaveRequests.file,
        offsiteLocation: offsiteTasks.locationName,
        offsiteTaskDetail: offsiteTasks.taskDetail,
        correctionReason: timeCorrectionRequests.reason,
      })
      .from(attendanceLogs)
      .leftJoin(checkInTable, eq(attendanceLogs.checkInId, checkInTable.id))
      .leftJoin(checkOutTable, eq(attendanceLogs.checkOutId, checkOutTable.id))
      .leftJoin(
        leaveRequests,
        and(
          eq(leaveRequests.userId, studentInfo.userId),
          sql`DATE(${leaveRequests.leaveDatetime}) = DATE(${attendanceLogs.workDate})`,
          eq(leaveRequests.status, "APPROVED")
        )
      )
      .leftJoin(
        offsiteTasks,
        sql`DATE(${offsiteTasks.workDate}) = DATE(${attendanceLogs.workDate}) 
            AND EXISTS (
              SELECT 1 FROM ${offsiteTaskStudents} ots 
              WHERE ots.task_id = ${offsiteTasks.id} 
              AND ots.student_id = ${studentInfo.userId}
            )`
      )
      .leftJoin(
        timeCorrectionRequests,
        and(
          eq(timeCorrectionRequests.attendanceLogId, attendanceLogs.id),
          eq(timeCorrectionRequests.status, "APPROVED")
        )
      )
      .where(eq(attendanceLogs.studentProfileId, studentInfo.studentProfileId))
      .orderBy(desc(attendanceLogs.workDate))
      .limit(limit)
      .offset(offset);

    const formatTime = (timeStr?: Date | string | null) => {
      if (!timeStr) return "--:--";
      return new Date(timeStr).toLocaleTimeString("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const tableRecords = paginatedLogs.map((log) => {
      const noteList: { type: string; detail: string }[] = [];

      // 1. ข้อมูลการลา
      if (log.status === "LEAVE" && log.leaveReason) {
        noteList.push({
          type: "LEAVE",
          detail: `${log.leaveReason}`,
        });
      }

      // 2. ข้อมูลนอกสถานที่
      if (log.offsiteTaskDetail) {
        noteList.push({
          type: "OFFSITE",
          detail: `ปฏิบัติงานนอกสถานที่`,
        });
      }

      // 3. ข้อมูลคำขอแก้ไขเวลา
      if (log.correctionReason) {
        noteList.push({
          type: "CORRECTION",
          detail: `แก้ไขเวลาออกงาน`,
        });
      }

      // // 4. Note งานประจำวัน
      // if (log.dailyTaskNote) {
      //   noteList.push({
      //     type: "TASK",
      //     detail: `งาน: ${log.dailyTaskNote}`
      //   });
      // }

      // // 5. Note ตอนเข้างาน
      // if (log.checkInNote) {
      //   noteList.push({
      //     type: "CHECK_IN",
      //     detail: `เข้า: ${log.checkInNote}`
      //   });
      // }

      // // 6. Note ตอนออกงาน
      // if (log.checkOutNote) {
      //   noteList.push({
      //     type: "CHECK_OUT",
      //     detail: `ออก: ${log.checkOutNote}`
      //   });
      // }

      return {
        id: log.id,
        workDate: log.workDate,
        status: log.status,
        checkInTime: formatTime(log.checkInTime),
        checkOutTime: formatTime(log.checkOutTime),
        hours:
          Number(log.actualHoursWorked || 0) +
          Number(log.approvedLeaveHours || 0),
        evidenceUrl: log.leaveFile || null,
        notes: noteList,
        leaveType: log.leaveType,
      };
    });

    return {
      profile: {
        id: studentInfo.userId,
        fullName: `${studentInfo.firstName} ${studentInfo.lastName} (${studentInfo.username})`,
        image: studentInfo.image,
        position: studentInfo.positionName,
        institution: studentInfo.institutionName,
        email: studentInfo.email,
        phone: studentInfo.phone,
        internshipStatus: studentInfo.internshipStatus,
        statusNote: studentInfo.statusNote,
        period: {
          startDate: studentInfo.startDate,
          endDate: studentInfo.endDate,
        },
      },
      progress: {
        accumulatedHours: Number(accumulatedHours.toFixed(2)),
        totalHoursGoal: Number(studentInfo.totalHoursGoal || 560),
        remainingDays: remainingDays,
        totalExtendedHours: totalExtendedHours,
        extendedEndDate: extendedEndDate,
        lastExtensionDate: extendedData?.latestApprovedAt ? new Date(extendedData.latestApprovedAt as string) : null,
      },
      summary: {
        present: presentCount,
        late: lateCount,
        leave: leaveCount,
        absent: absentCount,
      },
      attendanceTable: {
        records: tableRecords,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
        },
      },
    };
  }
}
