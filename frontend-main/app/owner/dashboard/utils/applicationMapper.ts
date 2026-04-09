/**
 * Shared utility to map backend AllStudentsHistoryItem to frontend Application type.
 * Extracted from applications/page.tsx for reuse in all owner dashboard sub-pages.
 */
import {
  AllStudentsHistoryItem,
  AppStatusEnum,
  applicationApi,
} from "@/services/api";

export type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "interview"
  | "accepted"
  | "rejected"
  | "cancelled";

export type DetailedStatus =
  | "waiting_document"
  | "waiting_interview"
  | "waiting_confirm"
  | "rejected"
  | "waiting_analysis_doc"
  | "waiting_send_doc"
  | "doc_rejected"
  | "doc_sent"
  | "doc_passed"
  | "completed"
  | "cancelled";

export type FilterTab =
  | "all"
  | "waiting_document"
  | "waiting_interview"
  | "waiting_confirm"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "abort";

export interface Application {
  id: string;
  internId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  education: string;
  institution: string;
  major: string;
  startDate: string;
  endDate: string;
  trainingHours: number;
  department: string;
  position: string;
  status: ApplicationStatus;
  detailedStatus?: DetailedStatus;
  appliedDate: string;
  gender: "male" | "female";
  expectation: string;
  documents: {
    name: string;
    type: string;
    docFile?: string;
  }[];
  analysisDocuments?: {
    name: string;
    type: string;
    status: "pending" | "approved" | "rejected";
    docFile?: string;
  }[];
  step: number;
  stepDescription: string;
  isNearStart?: boolean;
  daysUntilStart?: number;
  interviewCompleted?: boolean;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledDate?: string;
  faculty?: string;
  studentNote?: string;
  mentors?: {
    fname: string | null;
    lname: string | null;
    email: string | null;
    phone: string | null;
  }[];
  skill?: string;
  actionDate?: string;
  studentInternshipStatus?: string | null;
  isActive?: boolean;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export function getDetailedStatusLabel(detailedStatus?: DetailedStatus): string {
  if (!detailedStatus) return "";
  const labels: Record<DetailedStatus, string> = {
    waiting_document: "รอยื่นเอกสาร",
    waiting_interview: "รอสัมภาษณ์",
    waiting_confirm: "รอการยืนยัน",
    rejected: "ไม่ผ่าน",
    waiting_analysis_doc: "รอเอกสารขอความอนุเคราะห์",
    waiting_send_doc: "รอการตรวจสอบ",
    doc_rejected: "เอกสารไม่ผ่าน",
    doc_sent: "ส่งเอกสารแล้ว",
    doc_passed: "เอกสารผ่าน",
    completed: "เรียบร้อย",
    cancelled: "ยกเลิกฝึกงาน",
  };
  return labels[detailedStatus];
}

export function getEducationDisplayText(app: {
  education: string;
  studentNote?: string;
}): string {
  const labels: Record<string, string> = {
    high_school: "มัธยมศึกษาตอนปลาย",
    vocational: "ปวช.",
    high_vocational: "ปวส.",
    university: "มหาวิทยาลัย",
    other: "อื่น ๆ",
  };

  if (app.education === "other") {
    const raw = (app.studentNote || "").trim();
    if (raw) {
      const firstPart = raw
        .split("|")
        .map((p) => p.trim())
        .find((p) => p && !p.startsWith("สถานศึกษา:"));
      if (firstPart) return firstPart;
    }
  }

  return labels[app.education] || app.education;
}

export function getStudyPlanDisplayText(app: {
  major?: string;
  studentNote?: string;
}): string {
  const major = app.major?.trim();
  if (major) return major;

  const raw = (app.studentNote || "").trim();
  if (!raw) return "-";

  const firstPart = raw
    .split("|")
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("สถานศึกษา:"));

  return firstPart || "-";
}

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
    step: 6,
    status: "cancelled",
    detailedStatus: "cancelled",
    stepDescription: "ยกเลิกฝึกงาน",
  },
  ABORT: {
    step: 0,
    status: "cancelled",
    detailedStatus: "cancelled",
    stepDescription: "ยกเลิกการสมัคร",
  },
  REJECTED: {
    step: 1,
    status: "rejected",
    detailedStatus: "rejected",
    stepDescription: "ไม่ผ่าน",
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
  OTHERS: "other",
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

  // CANCEL = internship cancelled (was active, then ended)
  if (
    item.applicationStatus === "COMPLETE" &&
    item.studentInternshipStatus === "CANCEL"
  ) {
    // Backward compatibility for legacy records where profile was cancelled
    // but applicationStatus stayed COMPLETE.
    mapped = {
      step: 6,
      status: "cancelled",
      detailedStatus: "cancelled",
      stepDescription: "ยกเลิกฝึกงาน",
    };
  } else if (item.applicationStatus === "ABORT") {
    // Determine step from statusNote set by cron
    let abortStep = 1;
    const note = item.statusNote || "";
    if (note.includes("เอกสารขอความอนุเคราะห์")) {
      // Was at PENDING_REQUEST (step 4)
      abortStep = 4;
    } else if (note.includes("สัมภาษณ์")) {
      // Was at PENDING_INTERVIEW (step 2)
      abortStep = 2;
    } else if (note.includes("เอกสาร")) {
      // Was at PENDING_DOCUMENT (step 1)
      abortStep = 1;
    }
    mapped = {
      step: abortStep,
      status: "cancelled",
      detailedStatus: "cancelled",
      stepDescription: "ยกเลิกการสมัคร",
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
    major: item.major?.trim() || "",
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
    faculty: item.faculty?.trim() || undefined,
    studentNote: item.studentNote || undefined,
    cancellationReason:
      item.applicationStatus === "CANCEL" ||
      item.applicationStatus === "ABORT" ||
      item.applicationStatus === "REJECTED" ||
      (item.applicationStatus === "COMPLETE" &&
        item.studentInternshipStatus === "CANCEL")
        ? item.statusNote || undefined
        : undefined,
    cancelledBy:
      item.applicationStatus === "ABORT"
        ? "ระบบ (อัตโนมัติ)"
        : undefined,
    cancelledDate:
      item.applicationStatus === "CANCEL" ||
      item.applicationStatus === "REJECTED" ||
      (item.applicationStatus === "COMPLETE" &&
        item.studentInternshipStatus === "CANCEL") ||
      item.applicationStatus === "ABORT"
        ? item.updatedAt || undefined
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
