"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "../../../components/ui/AdminNavbar";
import {
  applicationApi,
  positionApi,
  AllStudentsHistoryItem,
  Position,
} from "../../../services/api";

type DocTypeName = "transcript" | "resume" | "portfolio" | "request-letter";

const DOC_TYPE_MAP: Record<number, { name: string; key: DocTypeName; label: string }> = {
  1: { name: "Transcript", key: "transcript", label: "Transcript" },
  2: { name: "Resume", key: "resume", label: "Resume" },
  3: { name: "Portfolio", key: "portfolio", label: "Portfolio" },
  4: { name: "หนังสือขอความอนุเคราะห์", key: "request-letter", label: "หนังสือขอความอนุเคราะห์" },
};

function formatDateThai(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateRange(startStr: string | null, endStr: string | null): string {
  if (!startStr || !endStr) return "-";
  return `${formatDateThai(startStr)} - ${formatDateThai(endStr)}`;
}

function translateGender(gender: string | null): string {
  if (!gender) return "-";
  switch (gender.toUpperCase()) {
    case "MALE": return "ชาย";
    case "FEMALE": return "หญิง";
    default: return gender;
  }
}

function translateEducation(type: string | null): string {
  if (!type) return "-";
  switch (type.toUpperCase()) {
    case "SCHOOL": return "มัธยมศึกษาตอนปลาย";
    case "VOCATIONAL": return "ประกาศนียบัตรวิชาชีพ (ปวช.)";
    case "HIGH_VOCATIONAL": return "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)";
    case "UNIVERSITY": return "มหาวิทยาลัย";
    default: return type;
  }
}

function formatHours(hours: string | null): string {
  if (!hours) return "-";
  const num = parseFloat(hours);
  if (isNaN(num)) return hours;
  return `${Number.isInteger(num) ? num : num.toFixed(0)} ชั่วโมง`;
}

function getValidationBadge(status: string) {
  switch (status) {
    case "VERIFIED": return { label: "ผ่าน", className: "bg-green-100 text-green-700" };
    case "INVALID": return { label: "ไม่ผ่าน", className: "bg-red-100 text-red-700" };
    default: return { label: "รอตรวจ", className: "bg-yellow-100 text-yellow-700" };
  }
}

type ViewMode = "pending_review" | "docs_invalid" | "active" | "completed" | "cancelled";

function getViewMode(app: AllStudentsHistoryItem): ViewMode {
  const hasInvalidDocs = app.documents.some(d => d.validationStatus === "INVALID");
  if (hasInvalidDocs) return "docs_invalid";
  if (app.applicationStatus === "PENDING_REVIEW") return "pending_review";
  if (app.applicationStatus === "COMPLETE") {
    if (app.studentInternshipStatus === "CANCEL") return "cancelled";
    if (app.studentInternshipStatus === "COMPLETE") return "completed";
    // Check if end date has passed (frontend fallback for active students)
    if (app.infoEndDate && new Date(app.infoEndDate) <= new Date()) return "completed";
    return "active";
  }
  return "pending_review";
}

export default function AdminApplicationDetailPage() {
  const params = useParams();
  const [application, setApplication] = useState<AllStudentsHistoryItem | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionCompleted, setActionCompleted] = useState<"approved" | "rejected" | null>(null);

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      const appId = Number(params.id);
      const res = await applicationApi.getAllStudentsHistory({ limit: 500, includeCanceled: true });
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

  useEffect(() => { fetchApplication(); }, [fetchApplication]);

  const handleDownloadDoc = async (docFile: string) => {
    try {
      await applicationApi.downloadDocument(docFile, false);
    } catch {
      alert("ไม่สามารถเปิดเอกสารได้");
    }
  };

  const handleApproveAll = async () => {
    if (!application) return;
    const pending = application.documents.filter(d => d.validationStatus === "PENDING");
    if (pending.length === 0) return;
    try {
      setActionLoading(true);
      for (const doc of pending) {
        const docInfo = DOC_TYPE_MAP[doc.docTypeId];
        if (docInfo) {
          await applicationApi.reviewDocument(application.applicationId, docInfo.key, "VERIFIED");
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
    const pending = application.documents.filter(d => d.validationStatus === "PENDING");
    if (pending.length === 0) return;
    try {
      setActionLoading(true);
      for (const doc of pending) {
        const docInfo = DOC_TYPE_MAP[doc.docTypeId];
        if (docInfo) {
          await applicationApi.reviewDocument(application.applicationId, docInfo.key, "INVALID", rejectionNote);
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
          <Link href="/admin/applications" className="text-primary-600 hover:underline mt-2 inline-block">กลับหน้ารายการ</Link>
        </main>
      </div>
    );
  }

  const viewMode = getViewMode(application);
  const hasPendingDocs = application.documents.some(d => d.validationStatus === "PENDING");

  // Breadcrumb text & link
  const breadcrumbText = viewMode === "pending_review" ? "รอตรวจเอกสาร"
    : viewMode === "docs_invalid" ? "เอกสารไม่ผ่าน"
      : "เอกสารผ่าน";
  const breadcrumbTab = viewMode === "docs_invalid" ? "rejected"
    : (viewMode === "active" || viewMode === "completed" || viewMode === "cancelled") ? "approved"
      : "pending";

  // Primary badge
  const primaryBadge = viewMode === "pending_review"
    ? { text: "รอตรวจเอกสาร", className: "bg-orange-100 text-orange-700 border border-orange-300" }
    : viewMode === "docs_invalid"
      ? { text: "เอกสารไม่ผ่าน", className: "bg-red-100 text-red-700 border border-red-300" }
      : { text: "เอกสารผ่าน", className: "bg-green-100 text-green-700 border border-green-300" };

  // Secondary badge (only for COMPLETE status)
  const secondaryBadge = viewMode === "active"
    ? { text: "อยู่ระหว่างฝึกงาน", className: "bg-blue-100 text-blue-700 border border-blue-300" }
    : viewMode === "completed"
      ? { text: "ฝึกงานเสร็จสิ้น", className: "bg-gray-100 text-gray-700 border border-gray-300" }
      : viewMode === "cancelled"
        ? { text: "ยกเลิกฝึกงาน", className: "bg-gray-100 text-gray-700 border border-gray-300" }
        : null;

  // Reason box
  const showReasonBox = (viewMode === "docs_invalid" || viewMode === "cancelled") && application.statusNote;
  const reasonTitle = viewMode === "docs_invalid" ? "เหตุผลที่เอกสารไม่ผ่าน" : "เหตุผลที่ยกเลิกฝึกงาน";

  // Owner & department from position
  const owner = position?.owners?.[0] || position?.owner;
  const departmentName = position?.department?.deptFull || position?.department?.deptShort || "-";

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href={`/admin/applications?tab=${breadcrumbTab}`} className="hover:text-primary-600">{breadcrumbText}</Link>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-800 font-medium">รายละเอียดผู้สมัคร</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800">{application.fname} {application.lname}</h2>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${primaryBadge.className}`}>{primaryBadge.text}</span>
                {secondaryBadge && (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${secondaryBadge.className}`}>{secondaryBadge.text}</span>
                )}
              </div>
              <p className="mt-3 text-sm text-gray-500">ช่วงฝึกงาน</p>
              <p className="text-sm font-medium text-gray-700">{formatDateRange(application.infoStartDate || application.profileStartDate, application.infoEndDate || application.profileEndDate)}</p>
            </div>

            {/* Reason Box */}
            {showReasonBox && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">{reasonTitle}</p>
                    <p className="text-sm text-orange-700 mt-1">{application.statusNote}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Internship Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">ข้อมูลการฝึกงาน</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">ชื่อหน่วยงาน</span>
                  <p className="font-medium text-gray-800 mt-0.5">{departmentName}</p>
                </div>
                <div>
                  <span className="text-gray-500">ชื่อตำแหน่งงาน</span>
                  <p className="font-medium text-gray-800 mt-0.5">{application.positionName || "-"}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">เอกสาร</h3>
              {application.documents.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">ไม่มีเอกสาร</p>
              ) : (
                <div className="space-y-3">
                  {application.documents.map((doc, idx) => {
                    const docInfo = DOC_TYPE_MAP[doc.docTypeId] || { name: `เอกสาร #${doc.docTypeId}`, key: "transcript" as DocTypeName, label: `เอกสาร #${doc.docTypeId}` };
                    const badge = getValidationBadge(doc.validationStatus);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{docInfo.label}</p>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.className}`}>{badge.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => handleDownloadDoc(doc.docFile)} title="ดูเอกสาร" className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => handleDownloadDoc(doc.docFile)} title="ดาวน์โหลด" className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4">
                {/* Action Buttons — only for PENDING_REVIEW with pending docs */}
                {viewMode === "pending_review" && hasPendingDocs && !actionCompleted && (
                  <div className="space-y-3">
                    <button onClick={() => setShowApproveConfirm(true)} disabled={actionLoading} className="w-full py-3 bg-green-500 text-white rounded-2xl font-semibold text-base hover:bg-green-600 disabled:opacity-50 transition-colors">
                      {actionLoading ? "กำลังดำเนินการ..." : "เอกสารถูกต้อง"}
                    </button>
                    <button onClick={() => setShowRejectConfirm(true)} disabled={actionLoading} className="w-full py-3 bg-red-500 text-white rounded-2xl font-semibold text-base hover:bg-red-600 disabled:opacity-50 transition-colors">
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
              <h3 className="text-base font-bold text-gray-800 mb-4">ข้อมูลผู้สมัคร</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">อีเมล</span>
                  <p className="font-medium text-gray-800 mt-0.5">{application.email || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">เพศ</span>
                  <p className="font-medium text-gray-800 mt-0.5">{translateGender(application.gender)}</p>
                </div>
                <div>
                  <span className="text-gray-500">การศึกษาปัจจุบัน</span>
                  <p className="font-medium text-gray-800 mt-0.5">{translateEducation(application.institutionType)}</p>
                </div>
                <div>
                  <span className="text-gray-500">ชื่อสถาบัน</span>
                  <p className="font-medium text-gray-800 mt-0.5">{application.institutionName || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">คณะ</span>
                  <p className="font-medium text-gray-800 mt-0.5">{application.faculty || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">สาขา</span>
                  <p className="font-medium text-gray-800 mt-0.5">{application.major || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">ชั่วโมงที่ต้องฝึก</span>
                  <p className="font-medium text-gray-800 mt-0.5">{formatHours(application.infoHours || application.profileHours)}</p>
                </div>
                <div>
                  <span className="text-gray-500">เบอร์โทรศัพท์</span>
                  <p className="font-medium text-gray-800 mt-0.5">{application.phoneNumber || "-"}</p>
                </div>
              </div>
            </div>

            {/* Related Persons */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-6">ข้อมูลผู้เกี่ยวข้อง</h3>

              {/* Owner */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">รายละเอียดผู้ประกาศรับสมัคร</h4>
                {owner ? (
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-800">{owner.fname} {owner.lname}</p>
                      <div className="flex flex-wrap gap-x-4 mt-1 text-gray-500">
                        <span>{owner.email || "-"}</span>
                        <span>{owner.phoneNumber || "-"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">ไม่พบข้อมูล</p>
                )}
              </div>

              {/* Mentors */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">รายละเอียดพี่เลี้ยง</h4>
                {application.mentors && application.mentors.length > 0 ? (
                  <div className="space-y-3">
                    {application.mentors.map((mentor, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">{mentor.fname} {mentor.lname}</p>
                          <div className="flex flex-wrap gap-x-4 mt-1 text-gray-500">
                            <span>{mentor.email || "-"}</span>
                            <span>{mentor.phone || "-"}</span>
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
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-6">ยืนยันการตรวจ</h3>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowApproveConfirm(false)} className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">ย้อนกลับ</button>
              <button onClick={() => { setShowApproveConfirm(false); handleApproveAll(); }} disabled={actionLoading} className="px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors font-medium">ยืนยัน</button>
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
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">เอกสารไม่ถูกต้อง</h3>
              </div>
              <button onClick={() => { setShowRejectConfirm(false); setRejectionNote(""); }} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <hr className="border-gray-200 mb-4" />
            {/* Student name */}
            <p className="text-sm text-gray-700 mb-1">
              คุณกำลังดำเนินการตรวจเอกสารของ <span className="font-bold">{application?.fname} {application?.lname}</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">กรุณาระบุเหตุผลเพื่อให้ผู้สมัครทราบ</p>
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
              <button onClick={() => { setShowRejectConfirm(false); setRejectionNote(""); }} className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">ย้อนกลับ</button>
              <button onClick={handleRejectAll} disabled={actionLoading || !rejectionNote.trim()} className="px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors font-medium">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
