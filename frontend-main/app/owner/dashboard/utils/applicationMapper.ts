/**
 * Shared utility to map backend AllStudentsHistoryItem to frontend Application type.
 * Extracted from applications/page.tsx for reuse in all owner dashboard sub-pages.
 */
import {
  AllStudentsHistoryItem,
  AppStatusEnum,
  applicationApi,
} from "../../../services/api";
import type {
  Application,
  ApplicationStatus,
  DetailedStatus,
  Mentor,
} from "../../../data/mockApplications";

// Re-export for convenience
export type { Application, ApplicationStatus, DetailedStatus, Mentor };

const statusMap: Record<
  AppStatusEnum,
  {
    step: number;
    status: ApplicationStatus;
    detailedStatus: DetailedStatus;
    stepDescription: string;
  }
> = {
  PENDING_DOCUMENT: {
    step: 1,
    status: "pending",
    detailedStatus: "waiting_document",
    stepDescription: "รอเอกสารจากผู้สมัคร",
  },
  PENDING_INTERVIEW: {
    step: 2,
    status: "reviewing",
    detailedStatus: "waiting_interview",
    stepDescription: "สัมภาษณ์ผู้สมัคร",
  },
  PENDING_CONFIRMATION: {
    step: 3,
    status: "reviewing",
    detailedStatus: "waiting_confirm",
    stepDescription: "ยืนยันสถานะการสมัคร",
  },
  PENDING_REQUEST: {
    step: 4,
    status: "accepted",
    detailedStatus: "waiting_analysis_doc",
    stepDescription: "รอเอกสารขอความอนุเคราะห์จากผู้สมัคร",
  },
  PENDING_REVIEW: {
    step: 5,
    status: "accepted",
    detailedStatus: "doc_sent",
    stepDescription: "รอ HR ตรวจสอบความถูกต้องเอกสาร",
  },
  COMPLETE: {
    step: 6,
    status: "accepted",
    detailedStatus: "completed",
    stepDescription: "รับผู้สมัครฝึกงานเรียบร้อยแล้ว",
  },
  CANCEL: {
    step: 1,
    status: "cancelled",
    detailedStatus: "cancelled",
    stepDescription: "ไม่ผ่าน",
  },
  ABORT: {
    step: 1,
    status: "cancelled",
    detailedStatus: "cancelled",
    stepDescription: "ยกเลิกการสมัคร",
  },
};

const docTypeNames: Record<number, string> = {
  1: "Transcript",
  2: "Resume",
  3: "Portfolio",
  4: "เอกสารขอความอนุเคราะห์",
};

const eduMap: Record<string, string> = {
  UNIVERSITY: "university",
  VOCATIONAL: "vocational",
  HIGH_VOCATIONAL: "high_vocational",
  SCHOOL: "high_school",
  OTHERS: "university",
};

function formatDate(d: string | null): string {
  if (!d) return "";
  const date = new Date(d);
  const beYear = date.getFullYear() + 543;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${beYear}-${month}-${day}`;
}

/**
 * Maps a single backend AllStudentsHistoryItem to the frontend Application type.
 */
export function mapApiToApplication(
  item: AllStudentsHistoryItem
): Application {
  let mapped = statusMap[item.applicationStatus] || statusMap.PENDING_DOCUMENT;

  // CANCEL + statusNote = owner rejected, plain CANCEL = actual cancellation
  if (item.applicationStatus === "CANCEL" && item.statusNote) {
    mapped = {
      step: 3,
      status: "rejected",
      detailedStatus: "rejected",
      stepDescription: "ไม่ผ่านการคัดเลือก",
    };
  }

  const education = eduMap[item.institutionType || ""] || "university";

  const documents = (item.documents || []).map((doc) => ({
    name: docTypeNames[doc.docTypeId] || `เอกสาร ${doc.docTypeId}`,
    type: doc.docFile.split(".").pop() || "pdf",
    docFile: doc.docFile,
  }));

  const analysisDocuments = (item.documents || [])
    .filter((doc) => doc.docTypeId === 4)
    .map((doc) => ({
      name: docTypeNames[doc.docTypeId] || "เอกสารขอความอนุเคราะห์",
      type: doc.docFile.split(".").pop() || "pdf",
      status: (doc.validationStatus === "VERIFIED"
        ? "approved"
        : doc.validationStatus === "INVALID"
          ? "rejected"
          : "pending") as "pending" | "approved" | "rejected",
      docFile: doc.docFile,
    }));

  return {
    id: String(item.applicationId),
    internId: item.studentUserId || "",
    firstName: item.fname || "",
    lastName: item.lname || "",
    email: item.email || "",
    phone: item.phoneNumber || "",
    education,
    institution: item.institutionName || "",
    major: item.major || "",
    startDate: formatDate(item.infoStartDate || item.profileStartDate),
    endDate: formatDate(item.infoEndDate || item.profileEndDate),
    trainingHours: Number(item.infoHours || item.profileHours || 0),
    department: item.positionName || "",
    position: item.positionName || "",
    status: mapped.status,
    detailedStatus: mapped.detailedStatus,
    appliedDate: formatDate(item.createdAt),
    gender: (item.gender === "MALE" ? "male" : "female") as "male" | "female",
    expectation: item.infoExpectation || "",
    documents,
    analysisDocuments:
      analysisDocuments.length > 0 ? analysisDocuments : undefined,
    step: mapped.step,
    stepDescription: mapped.stepDescription,
    faculty: item.faculty || undefined,
    studentNote: item.studentNote || undefined,
    cancellationReason:
      item.applicationStatus === "CANCEL" || item.applicationStatus === "ABORT"
        ? item.statusNote || undefined
        : undefined,
    mentors:
      item.mentors && item.mentors.length > 0 ? item.mentors : undefined,
    skill: item.infoSkill || undefined,
    actionDate: formatDate(item.updatedAt),
    studentInternshipStatus: item.studentInternshipStatus,
    isActive: item.isActive,
  };
}

/**
 * Fetches all applications from the API and maps them to Application type.
 * Replaces all usage of mockApplications.
 */
export async function fetchAllApplications(
  positionId?: number
): Promise<Application[]> {
  try {
    const response = await applicationApi.getAllStudentsHistory({
      positionId,
      limit: 9999,
      includeCanceled: true,
    });
    return (response.data || []).map(mapApiToApplication);
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    return [];
  }
}

/**
 * Computes dynamic stats from real application data.
 * Replaces getApplicationStats / getDynamicApplicationStats.
 */
export function computeApplicationStats(applications: Application[]) {
  const total = applications.length;
  const pending = applications.filter(
    (a) => a.status === "pending" || a.status === "reviewing"
  ).length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  const cancelled = applications.filter(
    (a) => a.status === "cancelled"
  ).length;

  return {
    total,
    pending,
    accepted,
    rejected,
    cancelled,
    interview: applications.filter((a) => a.status === "interview").length,
    all: total,
    // Near start: accepted apps with start date within 7 days
    nearStart: applications.filter((a) => {
      if (a.status !== "accepted" || !a.startDate) return false;
      const start = new Date(a.startDate.replace(/^(\d{4})/, (_, y) => String(Number(y) - 543)));
      const today = new Date();
      const diff = Math.ceil(
        (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diff >= 0 && diff <= 7;
    }).length,
  };
}

/**
 * Gets near-start applications (accepted, starting within 7 days).
 */
export function getNearStartApps(applications: Application[]): Application[] {
  const today = new Date();
  return applications
    .filter((a) => {
      if (a.status !== "accepted" || !a.startDate) return false;
      // Convert Buddhist Era date back to CE for comparison
      const start = new Date(a.startDate.replace(/^(\d{4})/, (_, y) => String(Number(y) - 543)));
      const diff = Math.ceil(
        (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diff >= 0 && diff <= 7;
    })
    .map((a) => {
      const start = new Date(a.startDate.replace(/^(\d{4})/, (_, y) => String(Number(y) - 543)));
      const today2 = new Date();
      const diff = Math.ceil(
        (start.getTime() - today2.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...a, isNearStart: true, daysUntilStart: diff };
    });
}
