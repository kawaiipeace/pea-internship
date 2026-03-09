"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "../../../components/ui/AdminNavbar";
import {
  applicationApi,
  applicationDocumentsApi,
  AllStudentsHistoryItem,
} from "../../../services/api";

type DocTypeName = "transcript" | "resume" | "portfolio" | "request-letter";

const DOC_TYPE_MAP: Record<number, { name: string; key: DocTypeName; label: string }> = {
  1: { name: "Transcript", key: "transcript", label: "Transcript" },
  2: { name: "Resume", key: "resume", label: "Resume" },
  3: { name: "Portfolio", key: "portfolio", label: "Portfolio" },
  4: { name: "หนังสือขอความอนุเคราะห์", key: "request-letter", label: "หนังสือขอความอนุเคราะห์" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

function getValidationBadge(status: string) {
  switch (status) {
    case "VERIFIED": return { label: "ผ่าน", className: "bg-green-100 text-green-700" };
    case "INVALID": return { label: "ไม่ผ่าน", className: "bg-red-100 text-red-700" };
    default: return { label: "รอตรวจ", className: "bg-yellow-100 text-yellow-700" };
  }
}

export default function AdminApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<AllStudentsHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocTypeName | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionCompleted, setActionCompleted] = useState<"approved" | "rejected" | null>(null);

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      const appId = Number(params.id);
      // Fetch all history and find the specific application
      const res = await applicationApi.getAllStudentsHistory({ limit: 500, includeCanceled: true });
      const found = res.data.find((a) => a.applicationId === appId);
      if (found) {
        setApplication(found);
      }
    } catch (err) {
      console.error("Failed to fetch application:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchApplication(); }, [fetchApplication]);

  const handleApproveDoc = async (docType: DocTypeName) => {
    if (!application) return;
    try {
      setActionLoading(true);
      await applicationApi.reviewDocument(application.applicationId, docType, "VERIFIED");
      await fetchApplication();
    } catch (err) {
      console.error("Failed to approve document:", err);
      alert("เกิดข้อผิดพลาดในการอนุมัติเอกสาร");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoc = async (docType: DocTypeName) => {
    if (!application || !rejectionNote.trim()) {
      alert("กรุณาระบุเหตุผล");
      return;
    }
    try {
      setActionLoading(true);
      await applicationApi.reviewDocument(application.applicationId, docType, "INVALID", rejectionNote);
      setRejectionNote("");
      setShowRejectConfirm(false);
      setSelectedDocType(null);
      await fetchApplication();
    } catch (err) {
      console.error("Failed to reject document:", err);
      alert("เกิดข้อผิดพลาดในการปฏิเสธเอกสาร");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadDoc = async (docFile: string) => {
    try {
      await applicationApi.downloadDocument(docFile, false);
    } catch {
      alert("ไม่สามารถเปิดเอกสารได้");
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
          <Link href="/admin/dashboard" className="text-primary-600 hover:underline mt-2 inline-block">กลับหน้า Dashboard</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/admin/dashboard" className="hover:text-primary-600">Dashboard</Link>
          <span className="mx-2">/</span>
          <span>รายละเอียดใบสมัคร #{application.applicationId}</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">ตรวจเอกสารผู้สมัคร</h1>

        {/* Student Info Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">ข้อมูลผู้สมัคร</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">ชื่อ-นามสกุล</span>
              <p className="font-medium text-gray-800">{application.fname} {application.lname}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">เบอร์โทร</span>
              <p className="font-medium text-gray-800">{application.phoneNumber || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">อีเมล</span>
              <p className="font-medium text-gray-800">{application.email || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">สถานศึกษา</span>
              <p className="font-medium text-gray-800">{application.institutionName || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">คณะ / สาขา</span>
              <p className="font-medium text-gray-800">{application.faculty || "-"} / {application.major || "-"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">จำนวนชั่วโมงฝึกงาน</span>
              <p className="font-medium text-gray-800">{application.infoHours || application.profileHours || "-"} ชม.</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">วันที่สมัคร</span>
              <p className="font-medium text-gray-800">{formatDate(application.createdAt)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">ช่วงฝึกงาน</span>
              <p className="font-medium text-gray-800">{formatDate(application.infoStartDate || application.profileStartDate)} - {formatDate(application.infoEndDate || application.profileEndDate)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">ตำแหน่ง</span>
              <p className="font-medium text-gray-800">{application.positionName || "-"}</p>
            </div>
          </div>

          {/* Skills & Expectations */}
          {(application.infoSkill || application.infoExpectation) && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              {application.infoSkill && (
                <div>
                  <span className="text-sm text-gray-500">ทักษะ</span>
                  <p className="font-medium text-gray-800">{application.infoSkill}</p>
                </div>
              )}
              {application.infoExpectation && (
                <div>
                  <span className="text-sm text-gray-500">ความคาดหวัง</span>
                  <p className="font-medium text-gray-800">{application.infoExpectation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documents Review */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">เอกสารประกอบการสมัคร</h2>

          {application.documents.length === 0 ? (
            <p className="text-gray-400 text-center py-4">ไม่มีเอกสาร</p>
          ) : (
            <div className="space-y-4">
              {application.documents.map((doc, idx) => {
                const docInfo = DOC_TYPE_MAP[doc.docTypeId] || { name: `เอกสาร #${doc.docTypeId}`, key: "transcript" as DocTypeName, label: `เอกสาร #${doc.docTypeId}` };
                const badge = getValidationBadge(doc.validationStatus);
                const isPending = doc.validationStatus === "PENDING";

                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{docInfo.label}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{doc.docFile.split("/").pop()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>{badge.label}</span>

                      <button onClick={() => handleDownloadDoc(doc.docFile)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">ดูเอกสาร</button>

                      {isPending && (
                        <>
                          <button onClick={() => handleApproveDoc(docInfo.key)} disabled={actionLoading} className="px-3 py-1.5 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">อนุมัติ</button>
                          <button onClick={() => { setSelectedDocType(docInfo.key); setShowRejectConfirm(true); }} disabled={actionLoading} className="px-3 py-1.5 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">ไม่ผ่าน</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mentors */}
        {application.mentors && application.mentors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">พี่เลี้ยง</h2>
            <div className="space-y-2">
              {application.mentors.map((mentor, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{mentor.fname} {mentor.lname}</p>
                    <p className="text-xs text-gray-500">{mentor.email || "-"} | {mentor.phone || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-end">
          <Link href="/admin/dashboard" className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">กลับหน้า Dashboard</Link>
        </div>
      </main>

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && selectedDocType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ระบุเหตุผลที่เอกสารไม่ผ่าน</h3>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="เหตุผล..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowRejectConfirm(false); setSelectedDocType(null); setRejectionNote(""); }} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">ยกเลิก</button>
              <button onClick={() => handleRejectDoc(selectedDocType)} disabled={actionLoading || !rejectionNote.trim()} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">ยืนยันไม่ผ่าน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
