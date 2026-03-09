"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminNavbar from "../../components/ui/AdminNavbar";
import {
  applicationApi,
  AllStudentsHistoryItem,
} from "../../services/api";

type AdminDocStatus = "pending" | "approved" | "rejected";

function getDocStatus(app: AllStudentsHistoryItem): AdminDocStatus {
  if (!app.documents || app.documents.length === 0) return "pending";
  const allVerified = app.documents.every((d) => d.validationStatus === "VERIFIED");
  const anyInvalid = app.documents.some((d) => d.validationStatus === "INVALID");
  if (allVerified) return "approved";
  if (anyInvalid) return "rejected";
  return "pending";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

const docTypeLabel = (docTypeId: number) => {
  const map: Record<number, string> = { 1: "Transcript", 2: "Resume", 3: "Portfolio", 4: "หนังสือขอความอนุเคราะห์" };
  return map[docTypeId] || `เอกสาร #${docTypeId}`;
};

export default function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [applications, setApplications] = useState<AllStudentsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await applicationApi.getAllStudentsHistory({ limit: 500, includeCanceled: true });
      setApplications(res.data);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute stats
  const stats = (() => {
    const total = applications.length;
    const pending = applications.filter((a) => getDocStatus(a) === "pending").length;
    const approved = applications.filter((a) => getDocStatus(a) === "approved").length;
    const rejected = applications.filter((a) => getDocStatus(a) === "rejected").length;
    return { total, pending, approved, rejected };
  })();

  // Pending apps for table
  const pendingApplications = applications.filter((a) => getDocStatus(a) === "pending");

  const filteredPendingApps = pendingApplications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      `${app.fname || ""} ${app.lname || ""}`.toLowerCase().includes(query) ||
      (app.email || "").toLowerCase().includes(query) ||
      (app.phoneNumber || "").includes(query)
    );
  });

  const recentReviews = applications
    .filter((a) => getDocStatus(a) !== "pending")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const totalPages = Math.ceil(filteredPendingApps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApps = filteredPendingApps.slice(startIndex, startIndex + itemsPerPage);

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
      if (totalPages > 1) pages.push(totalPages - 1, totalPages);
    }
    return pages.filter((p, i, arr) => arr.indexOf(p) === i);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">ผู้สมัครทั้งหมด</span>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">{stats.total}</p>
            <Link href="/admin/applications" className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>ดูลิสต์รายการสมัครทั้งหมด</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">รอตรวจเอกสาร</span>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-yellow-500 mb-2">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">ตรวจผ่านแล้ว</span>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-green-500 mb-2">{stats.approved}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">เอกสารไม่ผ่าน</span>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-red-500 mb-2">{stats.rejected}</p>
          </div>
        </div>

        {/* Pending Table */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">รายชื่อผู้สมัครที่รอตรวจ</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="ชื่อ-นามสกุล" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ลำดับ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">เบอร์โทร</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">อีเมล</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">วันที่ยื่น</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ประเภทเอกสาร</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApps.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ไม่มีรายการที่รอตรวจ</td></tr>
                ) : paginatedApps.map((app, index) => (
                  <tr key={app.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-800">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{app.fname} {app.lname}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{app.phoneNumber || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{app.email || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(app.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{app.documents.map((d) => docTypeLabel(d.docTypeId)).join(", ") || "-"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/dashboard/${app.applicationId}`} className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 border border-primary-600 rounded-full hover:bg-primary-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        ตรวจ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPendingApps.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredPendingApps.length)} จาก {filteredPendingApps.length} รายการ</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {getPageNumbers().map((page, index) => (
                  <button key={index} onClick={() => typeof page === "number" && setCurrentPage(page)} disabled={page === "..."} className={`px-3 py-1 rounded-lg text-sm ${page === currentPage ? "bg-primary-600 text-white" : page === "..." ? "text-gray-400 cursor-default" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">ประวัติการตรวจเอกสารล่าสุด</h2>
          {recentReviews.length === 0 ? (
            <p className="text-gray-400 text-center py-4">ยังไม่มีประวัติการตรวจ</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentReviews.map((review) => (
                <Link key={review.applicationId} href={`/admin/dashboard/${review.applicationId}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{review.fname} {review.lname}</p>
                    <p className="text-xs text-gray-500 truncate">{formatDate(review.updatedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
