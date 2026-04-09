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
} from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "@/common/exceptions";
import { db } from "@/db";
import {
  applicationInformations,
  applicationStatuses,
  attendanceLogs,
  checkTimes,
  institutions,
  internshipPositions,
  staffProfiles,
  studentProfiles,
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

    if (!mentor || !mentor.staffProfiles) {
      throw new ForbiddenError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะพี่เลี้ยงเท่านั้น)");
    }

    const conditions: (SQL | undefined)[] = [
      eq(applicationStatuses.isActive, true),
    ];
    if (viewType === "ALL") {
    } else {
      if (mentor.departmentId) {
        conditions.push(
          eq(applicationStatuses.departmentId, mentor.departmentId)
        );
      }
    }

    if (search) {
      conditions.push(
        or(ilike(users.fname, `%${search}%`), ilike(users.lname, `%${search}%`))
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
      })
      .from(applicationStatuses)
      .innerJoin(users, eq(users.id, applicationStatuses.userId))
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .leftJoin(
        applicationInformations,
        eq(applicationInformations.applicationStatusId, applicationStatuses.id)
      )
      .where(and(...conditions));

    const students = await baseQuery.limit(limit).offset(offset);

    if (students.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const totalStudents = (await baseQuery).length;

    const studentProfileIds = students.map((s) => s.studentProfileId);

    const logConditions = [
      inArray(attendanceLogs.studentProfileId, studentProfileIds),
    ];
    if (startDate) logConditions.push(gte(attendanceLogs.workDate, startDate));
    if (endDate) logConditions.push(lte(attendanceLogs.workDate, endDate));

    const allLogs = await db
      .select()
      .from(attendanceLogs)
      .where(and(...logConditions));

    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
    }).format(new Date());
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
      let accumulatedHours = 0;

      studentLogs.forEach((log) => {
        if (log.dailyStatus === "PRESENT") present++;
        else if (log.dailyStatus === "LATE") late++;
        else if (log.dailyStatus === "LEAVE") leave++;
        else if (log.dailyStatus === "ABSENT") absent++;

        accumulatedHours += Number(log.actualHoursWorked || 0);
        accumulatedHours += Number(log.approvedLeaveHours || 0);
      });

      let todayStatusText = "ยังไม่ลงเวลา";
      let todayStatusCode = "IDLE";

      if (todayLog) {
        if (todayLog.dailyStatus === "PRESENT") {
          todayStatusText = "เข้างานปกติ";
          todayStatusCode = "PRESENT";
        } else if (todayLog.dailyStatus === "LATE") {
          todayStatusText = "มาสาย";
          todayStatusCode = "LATE";
        } else if (todayLog.dailyStatus === "LEAVE") {
          todayStatusText = "ลางาน";
          todayStatusCode = "LEAVE";
        } else if (todayLog.dailyStatus === "ABSENT") {
          todayStatusText = "ขาดงาน";
          todayStatusCode = "ABSENT";
        }
      }

      return {
        id: student.userId,
        profileId: student.studentProfileId,
        fullName: `${student.firstName} ${student.lastName}`,
        image: student.image,
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
        firstName: users.fname,
        lastName: users.lname,
        email: users.email,
        phone: users.phoneNumber,
        image: studentProfiles.image,
        internshipStatus: studentProfiles.internshipStatus,
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
        and(eq(users.id, studentId), eq(applicationStatuses.isActive, true))
      )
      .limit(1);

    if (!studentInfo) {
      throw new NotFoundError("ไม่พบข้อมูลนักศึกษา หรือนักศึกษาไม่ได้อยู่ในสถานะฝึกงาน");
    }

    let remainingDays = 0;
    if (studentInfo.endDate) {
      const today = new Date();
      const end = new Date(studentInfo.endDate);
      const diffTime = end.getTime() - today.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (remainingDays < 0) remainingDays = 0;
    }

    const allLogsForStats = await db
      .select({
        dailyStatus: attendanceLogs.dailyStatus,
        actualHoursWorked: attendanceLogs.actualHoursWorked,
        approvedLeaveHours: attendanceLogs.approvedLeaveHours,
      })
      .from(attendanceLogs)
      .where(eq(attendanceLogs.studentProfileId, studentInfo.studentProfileId));

    let presentCount = 0,
      lateCount = 0,
      leaveCount = 0,
      absentCount = 0;
    let accumulatedHours = 0;

    allLogsForStats.forEach((log) => {
      if (log.dailyStatus === "PRESENT") presentCount++;
      else if (log.dailyStatus === "LATE") lateCount++;
      else if (log.dailyStatus === "LEAVE") leaveCount++;
      else if (log.dailyStatus === "ABSENT") absentCount++;

      accumulatedHours += Number(log.actualHoursWorked || 0);
      accumulatedHours += Number(log.approvedLeaveHours || 0);
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
      })
      .from(attendanceLogs)
      .leftJoin(checkInTable, eq(attendanceLogs.checkInId, checkInTable.id))
      .leftJoin(checkOutTable, eq(attendanceLogs.checkOutId, checkOutTable.id))
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
      const note =
        log.dailyTaskNote || log.checkOutNote || log.checkInNote || "-";

      return {
        id: log.id,
        workDate: log.workDate,
        status: log.status,
        checkInTime: formatTime(log.checkInTime),
        checkOutTime: formatTime(log.checkOutTime),
        hours:
          Number(log.actualHoursWorked || 0) +
          Number(log.approvedLeaveHours || 0),
        evidenceUrl: null,
        note: note,
      };
    });

    return {
      profile: {
        id: studentInfo.userId,
        fullName: `${studentInfo.firstName} ${studentInfo.lastName}`,
        image: studentInfo.image,
        position: studentInfo.positionName,
        institution: studentInfo.institutionName,
        email: studentInfo.email,
        phone: studentInfo.phone,
        internshipStatus: studentInfo.internshipStatus,
        period: {
          startDate: studentInfo.startDate,
          endDate: studentInfo.endDate,
        },
      },
      progress: {
        accumulatedHours: Number(accumulatedHours.toFixed(2)),
        totalHoursGoal: Number(studentInfo.totalHoursGoal || 560),
        remainingDays: remainingDays,
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
