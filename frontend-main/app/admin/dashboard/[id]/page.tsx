"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "@/components/ui/AdminNavbar";
import {
  applicationApi,
  positionApi,
  AllStudentsHistoryItem,
  Position,
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
  const showReasonBox =
    (viewMode === "docs_invalid" || viewMode === "cancelled") &&
    application.statusNote;
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
                    <p className="text-sm text-gray-800 mt-1">
                      {application.statusNote}
                    </p>
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
              <h3 className="text-base font-bold text-gray-800 mb-4">เอกสาร</h3>
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
