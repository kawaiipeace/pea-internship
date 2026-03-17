"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AdminNavbar from "@/components/ui/AdminNavbar";
import {
  applicationApi,
  AllStudentsHistoryItem,
  AppStatusEnum,
} from "@/services/api";

type ActiveTab = "pending" | "approved" | "rejected";

type AdminDocStatus = "pending_upload" | "pending_review" | "approved" | "rejected";

function getDocStatus(app: AllStudentsHistoryItem): AdminDocStatus {
  if (app.applicationStatus === "PENDING_REQUEST") {
    const anyInvalid = app.documents.some((d) => d.validationStatus === "INVALID");
    if (anyInvalid) return "rejected";
    return "pending_upload";
  }
  if (app.applicationStatus === "PENDING_REVIEW") {
    const allVerified = app.documents.every((d) => d.validationStatus === "VERIFIED");
    const anyInvalid = app.documents.some((d) => d.validationStatus === "INVALID");
    if (allVerified) return "approved";
    if (anyInvalid) return "rejected";
    return "pending_review";
  }
  if (app.applicationStatus === "COMPLETE") return "approved";
  return "pending_upload";
}

const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function formatDateThai(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateRange(startStr: string | null, endStr: string | null): string {
  if (!startStr || !endStr) return "-";
  return `${formatDateThai(startStr)} - ${formatDateThai(endStr)}`;
}

function getPendingBadge(app: AllStudentsHistoryItem) {
  const status = getDocStatus(app);
  if (status === "pending_review") {
    return { text: "รอตรวจเอกสาร", className: "bg-orange-100 text-orange-700 border border-orange-300" };
  }
  return { text: "รออัพโหลดเอกสาร", className: "bg-yellow-100 text-yellow-700 border border-yellow-300" };
}

function getApprovedBadge(app: AllStudentsHistoryItem) {
  if (app.studentInternshipStatus === "CANCEL") {
    return { text: "ยกเลิกฝึกงาน", className: "bg-red-100 text-red-700 border border-red-300" };
  }
  if (app.studentInternshipStatus === "COMPLETE") {
    return { text: "ฝึกงานเสร็จสิ้น", className: "bg-purple-100 text-purple-700 border border-purple-300" };
  }
  if (app.infoEndDate && new Date(app.infoEndDate) <= new Date()) {
    return { text: "ฝึกงานเสร็จสิ้น", className: "bg-purple-100 text-purple-700 border border-purple-300" };
  }
  return { text: "อยู่ระหว่างฝึกงาน", className: "bg-green-100 text-green-700 border border-green-300" };
}

export default function AdminApplicationsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><AdminNavbar /><div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /><span className="ml-3 text-gray-500">กำลังโหลด...</span></div></div>}>
      <AdminApplicationsPage />
    </Suspense>
  );
}

function AdminApplicationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as ActiveTab | null;
  const activeTab: ActiveTab = tabParam === "approved" || tabParam === "rejected" ? tabParam : "pending";

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [applications, setApplications] = useState<AllStudentsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const setActiveTab = (tab: ActiveTab) => {
    router.push(`/admin/applications?tab=${tab}`);
    setCurrentPage(1);
    setSearchQuery("");
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqRes, revRes, compRes] = await Promise.all([
        applicationApi.getAllStudentsHistory({ limit: 500, status: "PENDING_REQUEST" as AppStatusEnum }),
        applicationApi.getAllStudentsHistory({ limit: 500, status: "PENDING_REVIEW" as AppStatusEnum }),
        applicationApi.getAllStudentsHistory({ limit: 500, status: "COMPLETE" as AppStatusEnum }),
      ]);
      setApplications([...reqRes.data, ...revRes.data, ...compRes.data]);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Stats
  const stats = useMemo(() => {
    // "รอตรวจเอกสาร" includes pending_upload + pending_review + rejected (since rejected goes back to reupload)
    const pending = applications.filter((a) => {
      const s = getDocStatus(a);
      return s === "pending_upload" || s === "pending_review" || s === "rejected";
    }).length;
    const approved = applications.filter((a) => getDocStatus(a) === "approved").length;
    const rejected = applications.filter((a) => getDocStatus(a) === "rejected").length;
    return { pending, approved, rejected };
  }, [applications]);

  // Filter by active tab
  const filtered = useMemo(() => {
    let result = [...applications];
    if (activeTab === "pending") {
      result = result.filter((a) => {
        const s = getDocStatus(a);
        return s === "pending_upload" || s === "pending_review" || s === "rejected";
      });
    } else if (activeTab === "approved") {
      result = result.filter((a) => getDocStatus(a) === "approved");
    } else if (activeTab === "rejected") {
      result = result.filter((a) => getDocStatus(a) === "rejected");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((app) =>
        `${app.fname || ""} ${app.lname || ""}`.toLowerCase().includes(q)
      );
    }
    return result;
  }, [applications, searchQuery, activeTab]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2);
      if (currentPage > 4) pages.push("...");
      const start = Math.max(3, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);
      for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1, totalPages);
    }
    return pages.filter((p, i, arr) => arr.indexOf(p) === i);
  };

  const pageTitle = activeTab === "approved" ? "เอกสารผ่าน" : activeTab === "rejected" ? "เอกสารไม่ผ่าน" : "รอตรวจเอกสาร";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{pageTitle}</h1>
        <p className="text-gray-500 mb-6">ค้นหาใบสมัครสถานะรอตรวจเอกสารได้ {filtered.length} รายการ</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${activeTab === "pending" ? "border-yellow-400 ring-2 ring-yellow-200" : "border-gray-200 hover:border-yellow-300"}`} onClick={() => setActiveTab("pending")}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-sm text-gray-500">รอตรวจเอกสาร</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending} <span className="text-lg font-medium text-gray-500">รายการ</span></p>
          </div>
          <div className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${activeTab === "approved" ? "border-green-400 ring-2 ring-green-200" : "border-gray-200 hover:border-green-300"}`} onClick={() => setActiveTab("approved")}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm text-gray-500">เอกสารผ่าน</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.approved} <span className="text-lg font-medium text-gray-500">รายการ</span></p>
          </div>
          <div className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${activeTab === "rejected" ? "border-red-400 ring-2 ring-red-200" : "border-gray-200 hover:border-red-300"}`} onClick={() => setActiveTab("rejected")}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <span className="text-sm text-gray-500">เอกสารไม่ผ่าน</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.rejected} <span className="text-lg font-medium text-gray-500">รายการ</span></p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="ชื่อ-นามสกุล..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ลำดับ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">เบอร์โทรศัพท์</th>
                  {activeTab !== "rejected" && (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">สถานะผู้สมัคร</th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ชื่อสถาบัน</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">หน่วยงาน</th>
                  {activeTab === "rejected" && (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">วันที่ตรวจ</th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ระยะเวลาฝึกงาน</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ไม่พบรายการ</td></tr>
                ) : paginated.map((app, index) => {
                  const badge = activeTab === "approved"
                    ? getApprovedBadge(app)
                    : activeTab === "pending"
                    ? getPendingBadge(app)
                    : null;
                  return (
                    <tr key={app.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/dashboard/${app.applicationId}`}>
                      <td className="px-4 py-4 text-sm text-gray-800">{startIndex + index + 1}</td>
                      <td className="px-4 py-4 text-sm text-gray-800 font-medium">{app.fname} {app.lname}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{app.phoneNumber || "-"}</td>
                      {activeTab !== "rejected" && badge && (
                        <td className="px-4 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-4 text-sm text-gray-600">{app.institutionName || "-"}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{app.positionName || "-"}</td>
                      {activeTab === "rejected" && (
                        <td className="px-4 py-4 text-sm text-gray-600">{formatDateThai(app.updatedAt)}</td>
                      )}
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDateRange(app.infoStartDate || app.profileStartDate, app.infoEndDate || app.profileEndDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">แสดง {filtered.length > 0 ? startIndex + 1 : 0} ถึง {Math.min(startIndex + itemsPerPage, filtered.length)} จาก {filtered.length} รายการ</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {getPageNumbers().map((page, index) => (
                <button key={index} onClick={() => typeof page === "number" && setCurrentPage(page)} disabled={page === "..."} className={`min-w-[32px] h-8 rounded-lg text-sm ${page === currentPage ? "bg-primary-600 text-white" : page === "..." ? "text-gray-400 cursor-default" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
