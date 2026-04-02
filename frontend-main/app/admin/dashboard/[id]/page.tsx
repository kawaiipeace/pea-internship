"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/ui/AdminNavbar";
import {
  applicationApi,
  positionApi,
  staffLogsApi,
  AllStudentsHistoryItem,
  Position,
  StaffLog,
} from "@/services/api";

type DocTypeName = "transcript" | "resume" | "portfolio" | "request-letter";

const DOC_TYPE_MAP: Record<
  number,
  { name: string; key: DocTypeName; label: string }
> = {
  1: { name: "Transcript", key: "transcript", label: "Transcript" },
  2: { name: "Resume", key: "resume", label: "Resume" },
  3: { name: "Portfolio", key: "portfolio", label: "Portfolio" },
  4: {
    name: "หนังสือขอความอนุเคราะห์",
    key: "request-letter",
    label: "หนังสือขอความอนุเคราะห์",
  },
};

function formatDateThai(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateThaiShort(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const thaiShortMonths = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  return `${d.getDate()} ${thaiShortMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m} น.`;
}

function parseReviewAction(action: string): {
  docTypeId: number | null;
  status: string | null;
} {
  const docMatch = action.match(/docTypeId=(\d+)/);
  const statusMatch = action.match(/status=(\w+)/);
  return {
    docTypeId: docMatch ? Number(docMatch[1]) : null,
    status: statusMatch ? statusMatch[1] : null,
  };
}

function formatDateRange(
  startStr: string | null,
  endStr: string | null,
): string {
  if (!startStr || !endStr) return "-";
  return `${formatDateThai(startStr)} - ${formatDateThai(endStr)}`;
}

function translateGender(gender: string | null): string {
  if (!gender) return "-";
  switch (gender.toUpperCase()) {
    case "MALE":
      return "ชาย";
    case "FEMALE":
      return "หญิง";
    default:
      return gender;
  }
}

function translateEducation(type: string | null): string {
  if (!type) return "-";
  switch (type.toUpperCase()) {
    case "SCHOOL":
      return "มัธยมศึกษาตอนปลาย";
    case "VOCATIONAL":
      return "ประกาศนียบัตรวิชาชีพ (ปวช.)";
    case "HIGH_VOCATIONAL":
      return "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)";
    case "UNIVERSITY":
      return "มหาวิทยาลัย";
    case "OTHERS":
      return "อื่น ๆ";
    default:
      return type;
  }
}

function parseStudentNote(studentNote: string | null): {
  educationText: string | null;
  institutionText: string | null;
} {
  const raw = (studentNote || "").trim();
  if (!raw) {
    return { educationText: null, institutionText: null };
  }

  let educationText: string | null = null;
  let institutionText: string | null = null;

  for (const part of raw.split("|")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("สถานศึกษา:")) {
      const value = trimmed.replace("สถานศึกษา:", "").trim();
      if (value) institutionText = value;
      continue;
    }

    if (!educationText) educationText = trimmed;
  }

  return { educationText, institutionText };
}

function formatHours(hours: string | null): string {
  if (!hours) return "-";
  const num = parseFloat(hours);
  if (isNaN(num)) return hours;
  return `${Number.isInteger(num) ? num : num.toFixed(0)} ชั่วโมง`;
}

function getValidationBadge(status: string) {
  switch (status) {
    case "VERIFIED":
      return { label: "ผ่าน", className: "bg-green-100 text-green-700" };
    case "INVALID":
      return { label: "ไม่ผ่าน", className: "bg-red-100 text-red-700" };
    default:
      return { label: "รอตรวจ", className: "bg-[#FEF0C7] text-[#7A2E0E]" };
  }
}

type ViewMode =
  | "pending_review"
  | "docs_invalid"
  | "awaiting"
  | "active"
  | "completed"
  | "cancelled";

function getViewMode(app: AllStudentsHistoryItem): ViewMode {
  const hasInvalidDocs = app.documents.some(
    (d) => d.validationStatus === "INVALID",
  );
  if (hasInvalidDocs) return "docs_invalid";
  if (app.applicationStatus === "PENDING_REVIEW") return "pending_review";
  if (app.applicationStatus === "COMPLETE") {
    switch (app.studentInternshipStatus) {
      case "CANCEL":
        return "cancelled";
      case "COMPLETE":
        return "completed";
      case "AWAITING":
      case "ACCEPT":
        return "awaiting";
      case "ACTIVE":
        return "active";
      default:
        return "active";
    }
  }
  return "pending_review";
}

export default function AdminApplicationDetailPage() {
  const params = useParams();
  const [application, setApplication] = useState<AllStudentsHistoryItem | null>(
    null,
  );
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionCompleted, setActionCompleted] = useState<
    "approved" | "rejected" | null
  >(null);
  const [showDocHistory, setShowDocHistory] = useState(false);
  const [docHistoryLoading, setDocHistoryLoading] = useState(false);
  const [docHistoryData, setDocHistoryData] = useState<StaffLog[]>([]);

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      const appId = Number(params.id);
      const res = await applicationApi.getAllStudentsHistory({
        limit: 500,
        includeCanceled: true,
      });
      const found = res.data.find((a) => a.applicationId === appId);
      if (found) {
        setApplication(found);
        if (found.positionId) {
          const pos = await positionApi.getPositionById(found.positionId);
          setPosition(pos);
        }
      }
    } catch (err) {
      console.error("Failed to fetch application:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleOpenDocHistory = async () => {
    setShowDocHistory(true);
    setDocHistoryLoading(true);
    try {
      const appId = Number(params.id);
      const logs = await staffLogsApi.getLogs({ limit: 500 });
      const rows = Array.isArray(logs) ? logs : (logs?.data ?? []);
      const filtered = rows.filter((log: StaffLog) =>
        log.action?.includes(`REVIEW_DOCUMENT applicationId=${appId}`),
      );
      setDocHistoryData(filtered);
    } catch (err) {
      console.error("Failed to fetch document history:", err);
      setDocHistoryData([]);
    } finally {
      setDocHistoryLoading(false);
    }
  };

  const handleDownloadDoc = async (docFile: string, download: boolean) => {
    try {
      await applicationApi.downloadDocument(docFile, download);
    } catch {
      alert(
        download ? "ไม่สามารถดาวน์โหลดเอกสารได้" : "ไม่สามารถเปิดเอกสารได้",
      );
    }
  };

  const handleApproveAll = async () => {
    if (!application) return;
    const pending = application.documents.filter(
      (d) => d.validationStatus === "PENDING",
    );
    if (pending.length === 0) return;
    try {
      setActionLoading(true);
      for (const doc of pending) {
        const docInfo = DOC_TYPE_MAP[doc.docTypeId];
        if (docInfo) {
          await applicationApi.reviewDocument(
            application.applicationId,
            docInfo.key,
            "VERIFIED",
          );
        }
      }
      await fetchApplication();
      setActionCompleted("approved");
    } catch (err) {
      console.error("Failed to approve documents:", err);
      alert("เกิดข้อผิดพลาดในการอนุมัติเอกสาร");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAll = async () => {
    if (!application || !rejectionNote.trim()) {
      alert("กรุณาระบุเหตุผล");
      return;
    }
    const pending = application.documents.filter(
      (d) => d.validationStatus === "PENDING",
    );
    if (pending.length === 0) return;
    try {
      setActionLoading(true);
      for (const doc of pending) {
        const docInfo = DOC_TYPE_MAP[doc.docTypeId];
        if (docInfo) {
          await applicationApi.reviewDocument(
            application.applicationId,
            docInfo.key,
            "INVALID",
            rejectionNote,
            [rejectionNote],
          );
        }
      }
      setRejectionNote("");
      setShowRejectConfirm(false);
      await fetchApplication();
      setActionCompleted("rejected");
    } catch (err) {
      console.error("Failed to reject documents:", err);
      alert("เกิดข้อผิดพลาดในการปฏิเสธเอกสาร");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">ไม่พบข้อมูลใบสมัคร</p>
          <Link
            href="/admin/applications"
            className="text-primary-600 hover:underline mt-2 inline-block"
          >
            กลับหน้ารายการ
          </Link>
        </main>
      </div>
    );
  }

  const viewMode = getViewMode(application);
  const hasPendingDocs = application.documents.some(
    (d) => d.validationStatus === "PENDING",
  );

  // Breadcrumb text & link
  const breadcrumbText =
    viewMode === "pending_review"
      ? "รอตรวจเอกสาร"
      : viewMode === "docs_invalid"
        ? "เอกสารไม่ผ่าน"
        : "เอกสารผ่าน";
  const breadcrumbTab =
    viewMode === "docs_invalid"
      ? "rejected"
      : viewMode === "awaiting" ||
          viewMode === "active" ||
          viewMode === "completed" ||
          viewMode === "cancelled"
        ? "approved"
        : "pending";

  // Primary badge
  const primaryBadge =
    viewMode === "pending_review"
      ? {
          text: "รอตรวจเอกสาร",
          className: "bg-[#FEF0C7] text-[#7A2E0E] border border-[#FEDF89]",
        }
      : viewMode === "docs_invalid"
        ? {
            text: "เอกสารไม่ผ่าน",
            className: "bg-[#FEE4E2] text-[#912018] border border-[#FECDCA]",
          }
        : null;

  // Secondary badge (only for COMPLETE status)
  const secondaryBadge =
    viewMode === "awaiting"
      ? {
          text: "รอเริ่มฝึกงาน",
          className: "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]",
        }
      : viewMode === "active"
        ? {
            text: "อยู่ระหว่างฝึกงาน",
            className: "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]",
          }
        : viewMode === "completed"
          ? {
              text: "ฝึกงานเสร็จสิ้น",
              className: "bg-[#DCFAE6] text-[#085D3A] border border-[#A9EFC5]",
            }
          : viewMode === "cancelled"
            ? {
                text: "ยกเลิกฝึกงาน",
                className:
                  "bg-[#FEE4E2] text-[#B42318] border border-[#FECDCA]",
              }
            : null;

  // Reason box
  const latestInvalidReason = (() => {
    if (viewMode !== "docs_invalid") return null;
    const invalidDoc = application.documents.find(
      (d) => d.validationStatus === "INVALID" && d.invalidReasons?.length,
    );
    if (!invalidDoc?.invalidReasons?.length) return null;
    return invalidDoc.invalidReasons[invalidDoc.invalidReasons.length - 1];
  })();
  const reasonText =
    viewMode === "docs_invalid"
      ? latestInvalidReason || application.statusNote
      : application.statusNote;
  const showReasonBox =
    (viewMode === "docs_invalid" || viewMode === "cancelled") && reasonText;
  const reasonTitle =
    viewMode === "docs_invalid"
      ? "เหตุผลที่เอกสารไม่ผ่าน"
      : "เหตุผลที่ยกเลิกฝึกงาน";

  // Owner & department from position
  const owner = position?.owners?.[0] || position?.owner;
  const departmentName =
    position?.department?.deptFull || position?.department?.deptShort || "-";
  const parsedNote = parseStudentNote(application.studentNote);
  const educationDisplay =
    application.institutionType?.toUpperCase() === "OTHERS"
      ? parsedNote.educationText || "อื่น ๆ"
      : translateEducation(application.institutionType);
  const isHighSchool = application.institutionType?.toUpperCase() === "SCHOOL";
  const studyPlanDisplay =
    application.major?.trim() || parsedNote.educationText || "-";
  const institutionDisplay =
    parsedNote.institutionText || application.institutionName?.trim() || "-";

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link
            href={`/admin/applications?tab=${breadcrumbTab}`}
            className="hover:text-primary-600"
          >
            {breadcrumbText}
          </Link>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-800 font-medium">รายละเอียดผู้สมัคร</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800">
                {application.fname} {application.lname}
              </h2>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {primaryBadge && (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${primaryBadge.className}`}
                  >
                    {primaryBadge.text}
                  </span>
                )}
                {secondaryBadge && (
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${secondaryBadge.className}`}
                  >
                    {secondaryBadge.text}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-gray-500">ช่วงฝึกงาน</p>
              <p className="text-sm font-medium text-gray-700">
                {formatDateRange(
                  application.infoStartDate || application.profileStartDate,
                  application.infoEndDate || application.profileEndDate,
                )}
              </p>
            </div>

            {/* Reason Box */}
            {showReasonBox && (
              <div className="bg-[#FEE4E2] border border-[#FECDCA] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 17C12.2833 17 12.5208 16.9042 12.7125 16.7125C12.9042 16.5208 13 16.2833 13 16V12C13 11.7167 12.9042 11.4792 12.7125 11.2875C12.5208 11.0958 12.2833 11 12 11C11.7167 11 11.4792 11.0958 11.2875 11.2875C11.0958 11.4792 11 11.7167 11 12V16C11 16.2833 11.0958 16.5208 11.2875 16.7125C11.4792 16.9042 11.7167 17 12 17ZM12 9C12.2833 9 12.5208 8.90417 12.7125 8.7125C12.9042 8.52083 13 8.28333 13 8C13 7.71667 12.9042 7.47917 12.7125 7.2875C12.5208 7.09583 12.2833 7 12 7C11.7167 7 11.4792 7.09583 11.2875 7.2875C11.0958 7.47917 11 7.71667 11 8C11 8.28333 11.0958 8.52083 11.2875 8.7125C11.4792 8.90417 11.7167 9 12 9ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z"
                        fill="#D92D20"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#D92D20]">
                      {reasonTitle}
                    </p>
                    <p className="text-sm text-gray-800 mt-1">{reasonText}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Internship Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">
                ข้อมูลการฝึกงาน
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">ชื่อหน่วยงาน</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {departmentName}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">ชื่อตำแหน่งงาน</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {application.positionName || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800">เอกสาร</h3>
                <button
                  onClick={handleOpenDocHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 18C6.9 18 5.04167 17.3625 3.425 16.0875C1.80833 14.8125 0.758333 13.1833 0.275 11.2C0.208333 10.95 0.258333 10.7208 0.425 10.5125C0.591667 10.3042 0.816667 10.1833 1.1 10.15C1.36667 10.1167 1.60833 10.1667 1.825 10.3C2.04167 10.4333 2.19167 10.6333 2.275 10.9C2.675 12.4 3.5 13.625 4.75 14.575C6 15.525 7.41667 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H5C5.28333 5 5.52083 5.09583 5.7125 5.2875C5.90417 5.47917 6 5.71667 6 6C6 6.28333 5.90417 6.52083 5.7125 6.7125C5.52083 6.90417 5.28333 7 5 7H1C0.716667 7 0.479167 6.90417 0.2875 6.7125C0.0958333 6.52083 0 6.28333 0 6V2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1C1.28333 1 1.52083 1.09583 1.7125 1.2875C1.90417 1.47917 2 1.71667 2 2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM10 8.6L12.5 11.1C12.6833 11.2833 12.775 11.5167 12.775 11.8C12.775 12.0833 12.6833 12.3167 12.5 12.5C12.3167 12.6833 12.0833 12.775 11.8 12.775C11.5167 12.775 11.2833 12.6833 11.1 12.5L8.3 9.7C8.2 9.6 8.125 9.4875 8.075 9.3625C8.025 9.2375 8 9.10833 8 8.975V5C8 4.71667 8.09583 4.47917 8.2875 4.2875C8.47917 4.09583 8.71667 4 9 4C9.28333 4 9.52083 4.09583 9.7125 4.2875C9.90417 4.47917 10 4.71667 10 5V8.6Z"
                      fill="currentColor"
                    />
                  </svg>
                  ประวัติเอกสาร
                </button>
              </div>
              {application.documents.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  ไม่มีเอกสาร
                </p>
              ) : (
                <div className="space-y-3">
                  {application.documents.map((doc, idx) => {
                    const docInfo = DOC_TYPE_MAP[doc.docTypeId] || {
                      name: `เอกสาร #${doc.docTypeId}`,
                      key: "transcript" as DocTypeName,
                      label: `เอกสาร #${doc.docTypeId}`,
                    };
                    const badge = getValidationBadge(doc.validationStatus);
                    const hideVerifiedBadge =
                      [1, 2, 3].includes(doc.docTypeId) &&
                      doc.validationStatus === "VERIFIED";
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-red-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {docInfo.label}
                            </p>
                            {!hideVerifiedBadge && (
                              <span
                                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() =>
                              handleDownloadDoc(doc.docFile, false)
                            }
                            title="ดูเอกสาร"
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownloadDoc(doc.docFile, true)}
                            title="ดาวน์โหลด"
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4">
                {/* Action Buttons — only for PENDING_REVIEW with pending docs */}
                {viewMode === "pending_review" &&
                  hasPendingDocs &&
                  !actionCompleted && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowApproveConfirm(true)}
                        disabled={actionLoading}
                        className="w-full py-3 bg-[#17B26A] text-white rounded-2xl cursor-pointer font-semibold text-base hover:bg-[#067647] disabled:opacity-50 transition-colors"
                      >
                        {actionLoading ? "กำลังดำเนินการ..." : "เอกสารถูกต้อง"}
                      </button>
                      <button
                        onClick={() => setShowRejectConfirm(true)}
                        disabled={actionLoading}
                        className="w-full py-3 bg-[#D92D20] text-white rounded-2xl cursor-pointer font-semibold text-base hover:bg-[#912018] disabled:opacity-50 transition-colors"
                      >
                        เอกสารไม่ถูกต้อง
                      </button>
                    </div>
                  )}
              </div>
            </div>

            {/* {actionCompleted === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-green-700 font-semibold">อนุมัติเอกสารเรียบร้อยแล้ว</p>
              </div>
            )}
            {actionCompleted === "rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-red-700 font-semibold">ปฏิเสธเอกสารเรียบร้อยแล้ว</p>
              </div>
            )} */}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Details */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">
                ข้อมูลผู้สมัคร
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">อีเมล</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {application.email || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">เพศ</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {translateGender(application.gender)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">การศึกษาปัจจุบัน</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {educationDisplay}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">ชื่อสถาบัน</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {institutionDisplay}
                  </p>
                </div>
                {isHighSchool ? (
                  <div>
                    <span className="text-gray-500">แผนการเรียน</span>
                    <p className="font-medium text-gray-800 mt-0.5">
                      {studyPlanDisplay}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-gray-500">คณะ</span>
                      <p className="font-medium text-gray-800 mt-0.5">
                        {application.faculty || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">สาขา</span>
                      <p className="font-medium text-gray-800 mt-0.5">
                        {application.major || "-"}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-gray-500">ชั่วโมงที่ต้องฝึก</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {formatHours(
                      application.infoHours || application.profileHours,
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">เบอร์โทรศัพท์</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {application.phoneNumber || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Related Persons */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  ข้อมูลผู้เกี่ยวข้อง
                </h3>
              </div>

              {/* Owner */}
              <div className="mb-6">
                {owner ? (
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <h5 className="text-base font-semibold text-gray-800">
                      รายละเอียดผู้ประกาศรับสมัคร
                    </h5>
                    <hr className="border-gray-200 mt-3 mb-4" />
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-400">ชื่อผู้ประกาศ</p>
                        <p className="font-medium text-gray-800 mt-0.5">
                          {owner.fname} {owner.lname}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">อีเมลผู้ประกาศรับสมัคร</p>
                        <p className="font-medium text-gray-800 mt-0.5">
                          {owner.email || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">
                          เบอร์โทรผู้ประกาศรับสมัคร
                        </p>
                        <p className="font-medium text-gray-800 mt-0.5">
                          {owner.phoneNumber || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">ไม่พบข้อมูล</p>
                )}
              </div>

              {/* Mentors */}
              <div>
                {application.mentors && application.mentors.length > 0 ? (
                  <div className="space-y-3">
                    {application.mentors.map((mentor, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl">
                        <h5 className="text-base font-semibold text-gray-800">
                          รายละเอียดพี่เลี้ยง
                        </h5>
                        <hr className="border-gray-200 mt-3 mb-4" />
                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="text-gray-400">ชื่อพี่เลี้ยง</p>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {mentor.fname} {mentor.lname}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">อีเมล</p>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {mentor.email || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">เบอร์โทร</p>
                            <p className="font-medium text-gray-800 mt-0.5">
                              {mentor.phone || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">ไม่พบข้อมูล</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Document History Modal */}
      {showDocHistory && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowDocHistory(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-full">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 18C6.9 18 5.04167 17.3625 3.425 16.0875C1.80833 14.8125 0.758333 13.1833 0.275 11.2C0.208333 10.95 0.258333 10.7208 0.425 10.5125C0.591667 10.3042 0.816667 10.1833 1.1 10.15C1.36667 10.1167 1.60833 10.1667 1.825 10.3C2.04167 10.4333 2.19167 10.6333 2.275 10.9C2.675 12.4 3.5 13.625 4.75 14.575C6 15.525 7.41667 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H5C5.28333 5 5.52083 5.09583 5.7125 5.2875C5.90417 5.47917 6 5.71667 6 6C6 6.28333 5.90417 6.52083 5.7125 6.7125C5.52083 6.90417 5.28333 7 5 7H1C0.716667 7 0.479167 6.90417 0.2875 6.7125C0.0958333 6.52083 0 6.28333 0 6V2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1C1.28333 1 1.52083 1.09583 1.7125 1.2875C1.90417 1.47917 2 1.71667 2 2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM10 8.6L12.5 11.1C12.6833 11.2833 12.775 11.5167 12.775 11.8C12.775 12.0833 12.6833 12.3167 12.5 12.5C12.3167 12.6833 12.0833 12.775 11.8 12.775C11.5167 12.775 11.2833 12.6833 11.1 12.5L8.3 9.7C8.2 9.6 8.125 9.4875 8.075 9.3625C8.025 9.2375 8 9.10833 8 8.975V5C8 4.71667 8.09583 4.47917 8.2875 4.2875C8.47917 4.09583 8.71667 4 9 4C9.28333 4 9.52083 4.09583 9.7125 4.2875C9.90417 4.47917 10 4.71667 10 5V8.6Z"
                      fill="#A80689"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    ประวัติเอกสาร
                  </h3>
                  <p className="text-sm text-gray-500">
                    {application?.fname} {application?.lname}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDocHistory(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* History list */}
            <div className="overflow-y-auto flex-1">
              {docHistoryLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-500 text-sm">กำลังโหลดประวัติ...</p>
                </div>
              ) : docHistoryData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-500 mb-1">
                    ไม่มีประวัติการตรวจเอกสาร
                  </h3>
                  <p className="text-gray-400 text-center text-sm leading-relaxed">
                    ยังไม่มีการตรวจเอกสาร
                    <br />
                    สำหรับผู้สมัครรายนี้
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // Sort newest first for display
                    const sorted = [...docHistoryData].sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    );

                    // Build per-docType reason mapping from chronological order
                    const chronological = [...docHistoryData].sort(
                      (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime(),
                    );
                    const invalidCountByDocType: Record<number, number> = {};
                    const reasonByLogId = new Map<number, string>();
                    const invalidNumberByLogId = new Map<number, number>();
                    for (const log of chronological) {
                      const { docTypeId: dtId, status: st } = parseReviewAction(
                        log.action,
                      );
                      if (st === "INVALID" && dtId) {
                        const count = invalidCountByDocType[dtId] ?? 0;
                        invalidCountByDocType[dtId] = count + 1;
                        invalidNumberByLogId.set(log.id, count + 1);
                        const doc = application?.documents.find(
                          (d) => d.docTypeId === dtId,
                        );
                        const reason = doc?.invalidReasons?.[count];
                        if (reason) reasonByLogId.set(log.id, reason);
                      }
                    }

                    return sorted.map((log) => {
                      const { docTypeId, status } = parseReviewAction(
                        log.action,
                      );
                      const docInfo = docTypeId
                        ? DOC_TYPE_MAP[docTypeId]
                        : null;
                      const isInvalid = status === "INVALID";
                      const invalidNumber = isInvalid
                        ? (invalidNumberByLogId.get(log.id) ?? 0)
                        : 0;
                      const reasonText = reasonByLogId.get(log.id) ?? null;

                      return (
                        <div
                          key={log.id}
                          className="border border-gray-200 rounded-xl p-4"
                        >
                          {/* Date & Time row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
                            <div className="flex items-center gap-1.5">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M3.75 6H14.25V4.5H3.75V6ZM3.75 16.5C3.3375 16.5 2.98438 16.3531 2.69063 16.0594C2.39688 15.7656 2.25 15.4125 2.25 15V4.5C2.25 4.0875 2.39688 3.73438 2.69063 3.44063C2.98438 3.14688 3.3375 3 3.75 3H4.5V2.25C4.5 2.0375 4.57188 1.85938 4.71563 1.71562C4.85938 1.57187 5.0375 1.5 5.25 1.5C5.4625 1.5 5.64062 1.57187 5.78438 1.71562C5.92813 1.85938 6 2.0375 6 2.25V3H12V2.25C12 2.0375 12.0719 1.85938 12.2156 1.71562C12.3594 1.57187 12.5375 1.5 12.75 1.5C12.9625 1.5 13.1406 1.57187 13.2844 1.71562C13.4281 1.85938 13.5 2.0375 13.5 2.25V3H14.25C14.6625 3 15.0156 3.14688 15.3094 3.44063C15.6031 3.73438 15.75 4.0875 15.75 4.5V15C15.75 15.4125 15.6031 15.7656 15.3094 16.0594C15.0156 16.3531 14.6625 16.5 14.25 16.5H3.75Z"
                                  fill="#98A2B3"
                                />
                              </svg>
                              <span>{formatDateThaiShort(log.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm1-8h4v2h-6V7h2v5z"
                                  fill="#98A2B3"
                                />
                              </svg>
                              <span>
                                เวลาที่ตรวจ: {formatTime(log.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Reviewer row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
                            <div className="flex items-center gap-1.5">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                  fill="#98A2B3"
                                />
                              </svg>
                              <span>
                                ผู้ตรวจ: {log.fname} {log.lname}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"
                                  fill="#98A2B3"
                                />
                              </svg>
                              <span>รหัสพนักงาน: {log.username || "-"}</span>
                            </div>
                          </div>

                          {/* Status */}
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {isInvalid
                              ? `เอกสารไม่ผ่านครั้งที่ ${invalidNumber}`
                              : "เอกสารผ่านการตรวจ"}
                            {docInfo ? ` (${docInfo.label})` : ""}
                          </h4>

                          {/* Reason box for INVALID */}
                          {isInvalid && reasonText && (
                            <div className="mt-2 bg-[#FEE4E2] border border-[#FECDCA] rounded-xl p-3">
                              <div className="flex items-start gap-2">
                                <svg
                                  className="w-5 h-5 text-[#D92D20] flex-shrink-0 mt-0.5"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 17C12.2833 17 12.5208 16.9042 12.7125 16.7125C12.9042 16.5208 13 16.2833 13 16V12C13 11.7167 12.9042 11.4792 12.7125 11.2875C12.5208 11.0958 12.2833 11 12 11C11.7167 11 11.4792 11.0958 11.2875 11.2875C11.0958 11.4792 11 11.7167 11 12V16C11 16.2833 11.0958 16.5208 11.2875 16.7125C11.4792 16.9042 11.7167 17 12 17ZM12 9C12.2833 9 12.5208 8.90417 12.7125 8.7125C12.9042 8.52083 13 8.28333 13 8C13 7.71667 12.9042 7.47917 12.7125 7.2875C12.5208 7.09583 12.2833 7 12 7C11.7167 7 11.4792 7.09583 11.2875 7.2875C11.0958 7.47917 11 7.71667 11 8C11 8.28333 11.0958 8.52083 11.2875 8.7125C11.4792 8.90417 11.7167 9 12 9ZM12 22C10.6167 22 9.31667 21.7375 8.1 21.2125C6.88333 20.6875 5.825 19.975 4.925 19.075C4.025 18.175 3.3125 17.1167 2.7875 15.9C2.2625 14.6833 2 13.3833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.3833 21.7375 14.6833 21.2125 15.9C20.6875 17.1167 19.975 18.175 19.075 19.075C18.175 19.975 17.1167 20.6875 15.9 21.2125C14.6833 21.7375 13.3833 22 12 22Z" />
                                </svg>
                                <div>
                                  <p className="text-sm font-semibold text-[#D92D20]">
                                    เหตุผลที่ไม่ผ่านการคัดเลือก
                                  </p>
                                  <p className="text-sm text-gray-800 mt-1">
                                    {reasonText}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold">กำลังดำเนินการ...</p>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && !actionLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-6">
              ยืนยันการตรวจ
            </h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={() => {
                  setShowApproveConfirm(false);
                  handleApproveAll();
                }}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-[#17B26A] text-white rounded-xl hover:bg-[#067647] disabled:opacity-50 transition-colors font-medium"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && !actionLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  เอกสารไม่ถูกต้อง
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRejectConfirm(false);
                  setRejectionNote("");
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <hr className="border-gray-200 mb-4" />
            {/* Student name */}
            <p className="text-sm text-gray-700 mb-1">
              คุณกำลังดำเนินการตรวจเอกสารของ{" "}
              <span className="font-bold">
                {application?.fname} {application?.lname}
              </span>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              กรุณาระบุเหตุผลเพื่อให้ผู้สมัครทราบ
            </p>
            {/* Reason label */}
            <label className="text-sm font-semibold text-gray-800 mb-2 block">
              เหตุผลประกอบการตรวจเอกสาร <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="กรุณาระบุเหตุผลที่ชัดเจน..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-6"
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowRejectConfirm(false);
                  setRejectionNote("");
                }}
                className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleRejectAll}
                disabled={actionLoading || !rejectionNote.trim()}
                className="px-6 py-2.5 bg-[#D92D20] text-white rounded-xl hover:bg-[#912018] disabled:opacity-50 transition-colors font-medium"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
