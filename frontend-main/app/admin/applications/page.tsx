"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import AdminNavbar from "../../components/ui/AdminNavbar";
import {
  applicationApi,
  AllStudentsHistoryItem,
} from "../../services/api";

type AdminDocStatus = "pending" | "approved" | "rejected";
type SortField = "appliedDate" | "trainingStartDate";
type SortOrder = "asc" | "desc";

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

export default function AdminApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAppliedDateDropdown, setShowAppliedDateDropdown] = useState(false);
  const [showTrainingDateDropdown, setShowTrainingDateDropdown] = useState(false);
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

  // Stats
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => getDocStatus(a) === "pending").length;
    const approved = applications.filter((a) => getDocStatus(a) === "approved").length;
    const rejected = applications.filter((a) => getDocStatus(a) === "rejected").length;
    return {
      total, pending, approved, rejected,
      pendingPercentage: total > 0 ? ((pending / total) * 100).toFixed(1) : "0",
      approvedPercentage: total > 0 ? ((approved / total) * 100).toFixed(1) : "0",
      rejectedPercentage: total > 0 ? ((rejected / total) * 100).toFixed(1) : "0",
    };
  }, [applications]);

  // Filter and sort
  const filteredAndSortedApplications = useMemo(() => {
    let result = [...applications];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((app) =>
        `${app.fname || ""} ${app.lname || ""}`.toLowerCase().includes(query) ||
        (app.email || "").toLowerCase().includes(query) ||
        (app.phoneNumber || "").includes(query)
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        let aVal: number, bVal: number;
        if (sortField === "appliedDate") {
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
        } else {
          aVal = new Date(a.infoStartDate || a.profileStartDate || "").getTime() || 0;
          bVal = new Date(b.infoStartDate || b.profileStartDate || "").getTime() || 0;
        }
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return result;
  }, [applications, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = filteredAndSortedApplications.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setShowAppliedDateDropdown(false);
    setShowTrainingDateDropdown(false);
  };

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
    return pages;
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
        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Left - Title and Search */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">ลิสต์รายการสมัคร</h1>
            <p className="text-gray-500 mb-6">ค้นหาลิสต์รายการสมัครได้ {filteredAndSortedApplications.length} รายการ</p>

            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="ชื่อ-นามสกุล" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="relative">
                <button onClick={() => { setShowAppliedDateDropdown(!showAppliedDateDropdown); setShowTrainingDateDropdown(false); }} className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <span className="text-gray-700">วันที่ยื่น</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showAppliedDateDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10">
                    <button onClick={() => handleSort("appliedDate", "asc")} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700">เก่าสุดก่อน</button>
                    <button onClick={() => handleSort("appliedDate", "desc")} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700">ใหม่สุดก่อน</button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => { setShowTrainingDateDropdown(!showTrainingDateDropdown); setShowAppliedDateDropdown(false); }} className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <span className="text-gray-700">วันที่ฝึก</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showTrainingDateDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10">
                    <button onClick={() => handleSort("trainingStartDate", "asc")} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700">เก่าสุดก่อน</button>
                    <button onClick={() => handleSort("trainingStartDate", "desc")} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700">ใหม่สุดก่อน</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right - Status Chart */}
          <div className="lg:w-96">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">สถานะผู้สมัคร</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                      <span className="text-sm text-gray-600">รอตรวจเอกสาร</span>
                      <span className="text-sm text-gray-800 ml-auto">{stats.pendingPercentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-600">เอกสารไม่ผ่าน</span>
                      <span className="text-sm text-gray-800 ml-auto">{stats.rejectedPercentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">ตรวจผ่านแล้ว</span>
                      <span className="text-sm text-gray-800 ml-auto">{stats.approvedPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#facc15" strokeWidth="20" strokeDasharray={`${(parseFloat(stats.pendingPercentage) / 100) * 251.2} 251.2`} strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="20" strokeDasharray={`${(parseFloat(stats.rejectedPercentage) / 100) * 251.2} 251.2`} strokeDashoffset={`${-(parseFloat(stats.pendingPercentage) / 100) * 251.2}`} />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="20" strokeDasharray={`${(parseFloat(stats.approvedPercentage) / 100) * 251.2} 251.2`} strokeDashoffset={`${-((parseFloat(stats.pendingPercentage) + parseFloat(stats.rejectedPercentage)) / 100) * 251.2}`} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">ลำดับ</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">เบอร์โทร</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">อีเมล</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">วันที่ยื่น</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">วันที่ฝึก</th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-gray-500">สถานะเอกสาร</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApplications.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ไม่พบรายการ</td></tr>
                ) : paginatedApplications.map((app, index) => (
                  <tr key={app.applicationId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-800">{startIndex + index + 1}</td>
                    <td className="px-4 py-4 text-sm text-gray-800">{app.fname} {app.lname}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{app.phoneNumber || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{app.email || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{formatDate(app.createdAt)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{formatDate(app.infoStartDate || app.profileStartDate)}-{formatDate(app.infoEndDate || app.profileEndDate)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <Link href={`/admin/dashboard/${app.applicationId}`} className="flex items-center gap-1.5 px-4 py-2 text-sm text-primary-600 border border-primary-600 rounded-full hover:bg-primary-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          ตรวจ
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">แสดง {startIndex + 1} ถึง {Math.min(startIndex + itemsPerPage, filteredAndSortedApplications.length)} จาก {filteredAndSortedApplications.length} รายการ</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {getPageNumbers().map((page, index) => (
                <button key={index} onClick={() => typeof page === "number" && setCurrentPage(page)} disabled={page === "..."} className={`px-3 py-1 rounded-lg text-sm ${page === currentPage ? "bg-primary-600 text-white" : page === "..." ? "text-gray-400 cursor-default" : "text-gray-600 hover:bg-gray-100"}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
