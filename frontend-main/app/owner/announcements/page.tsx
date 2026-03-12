"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OwnerNavbar from "../../components/ui/OwnerNavbar";
import VideoLoading from "../../components/ui/VideoLoading";
import { AnnouncementStats } from "../../types/announcement";
import { positionApi, Position, userApi, applicationApi } from "../../services/api";

// Helper function to format date in Thai
const formatDateThai = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const thaiMonths = [
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
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Convert to Buddhist year
  return `${day} ${month} ${year}`;
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Position[]>([]);
  const [stats, setStats] = useState<AnnouncementStats>({
    totalAnnouncements: 0,
    totalOpenPositions: 0,
    totalApplicants: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Preview modal state
  const [previewPosition, setPreviewPosition] = useState<Position | null>(null);

  // Per-position applicant counts: { positionId: { total, accepted } }
  const [applicantCounts, setApplicantCounts] = useState<Record<number, { total: number; accepted: number }>>({});

  const itemsPerPage = 10;

  // Load data from API - filter by user's department
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // TODO: ลบ delay นี้ออกหลัง test เสร็จ
        // await new Promise((resolve) => setTimeout(resolve, 3000));
        // ดึงข้อมูล user profile ก่อนเพื่อรู้ departmentId
        const userProfile = await userApi.getUserProfile();
        const departmentId = userProfile?.departmentId;

        console.log("User departmentId:", departmentId);

        // ดึง positions โดย filter ตาม department (ถ้ามี)
        const response = await positionApi.getPositions({
          limit: 100,
          department: departmentId || undefined,
        });
        const positions = response.data || [];
        setAnnouncements(positions);

        // Fetch all applications to compute per-position counts
        const acceptedStatuses = new Set(["PENDING_CONFIRMATION", "PENDING_REQUEST", "PENDING_REVIEW", "COMPLETE"]);
        try {
          const appResponse = await applicationApi.getAllStudentsHistory({ limit: 1000, includeCanceled: false });
          const apps = appResponse.data || [];
          const counts: Record<number, { total: number; accepted: number }> = {};
          for (const app of apps) {
            if (!app.positionId) continue;
            if (!counts[app.positionId]) counts[app.positionId] = { total: 0, accepted: 0 };
            counts[app.positionId].total += 1;
            if (acceptedStatuses.has(app.applicationStatus)) {
              counts[app.positionId].accepted += 1;
            }
          }
          setApplicantCounts(counts);

          // Calculate total applicants from real data
          const totalApplicantsReal = Object.values(counts).reduce((sum, c) => sum + c.total, 0);

          // Calculate stats from positions
          const totalPositions = positions.reduce(
            (sum, p) => sum + (p.positionCount || 0),
            0,
          );
          setStats({
            totalAnnouncements: positions.length,
            totalOpenPositions: totalPositions,
            totalApplicants: totalApplicantsReal,
          });
        } catch {
          // If applications fail, still calculate position stats
          const totalPositions = positions.reduce(
            (sum, p) => sum + (p.positionCount || 0),
            0,
          );
          setStats({
            totalAnnouncements: positions.length,
            totalOpenPositions: totalPositions,
            totalApplicants: 0,
          });
        }
      } catch (error) {
        console.error("Error loading positions:", error);
        setAnnouncements([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      searchKeyword === "" ||
      announcement.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (announcement.location &&
        announcement.location
          .toLowerCase()
          .includes(searchKeyword.toLowerCase()));

    const matchesField =
      selectedField === "" ||
      (announcement.major &&
        announcement.major.toLowerCase().includes(selectedField.toLowerCase()));

    return matchesSearch && matchesField;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAnnouncements = filteredAnnouncements.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Handlers
  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      await positionApi.deletePosition(Number(deleteTargetId));
      const updatedAnnouncements = announcements.filter(
        (a) => a.id !== Number(deleteTargetId),
      );
      setAnnouncements(updatedAnnouncements);

      // Recalculate stats
      const totalPositions = updatedAnnouncements.reduce(
        (sum, p) => sum + (p.positionCount || 0),
        0,
      );
      // Recalculate total applicants excluding deleted position
      const deletedId = Number(deleteTargetId);
      const remainingCounts = { ...applicantCounts };
      delete remainingCounts[deletedId];
      setApplicantCounts(remainingCounts);
      const totalApplicantsReal = Object.values(remainingCounts).reduce((sum, c) => sum + c.total, 0);
      setStats({
        totalAnnouncements: updatedAnnouncements.length,
        totalOpenPositions: totalPositions,
        totalApplicants: totalApplicantsReal,
      });

      setShowDeleteModal(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("เกิดข้อผิดพลาดในการลบประกาศ");
    }
  };

  // Compute date-based status for a position
  type AnnouncementStatus = "OPEN" | "CLOSE" | "EXPIRED" | "NOT_YET";

  const getAnnouncementStatus = (announcement: Position): AnnouncementStatus => {
    // Manual close always takes priority
    if (announcement.recruitmentStatus === "CLOSE") return "CLOSE";

    const now = new Date();
    const recruitStart = announcement.recruitStart ? new Date(announcement.recruitStart) : null;
    const recruitEnd = announcement.recruitEnd ? new Date(announcement.recruitEnd) : null;

    // No time limit (both null) → always open if OPEN
    if (!recruitStart && !recruitEnd) return "OPEN";

    // Before start date
    if (recruitStart && now < recruitStart) return "NOT_YET";

    // After end date (position expires at end of the last day 23:59:59)
    if (recruitEnd) {
      const endOfDay = new Date(recruitEnd);
      endOfDay.setHours(23, 59, 59, 999);
      if (now > endOfDay) return "EXPIRED";
    }

    // Between start and end (or start exists but no end, etc.)
    return "OPEN";
  };

  const getStatusBadge = (announcement: Position) => {
    const status = getAnnouncementStatus(announcement);
    const config: Record<AnnouncementStatus, { style: string; label: string }> = {
      OPEN: { style: "bg-green-50 text-green-700 border border-green-500", label: "เปิดรับสมัคร" },
      CLOSE: { style: "bg-red-50 text-red-600 border border-red-500", label: "ปิดรับสมัคร" },
      EXPIRED: { style: "bg-gray-50 text-gray-600 border border-gray-400", label: "ประกาศหมดอายุ" },
      NOT_YET: { style: "bg-yellow-50 text-yellow-700 border border-yellow-500", label: "ยังไม่ถึงกำหนด" },
    };
    const { style, label } = config[status];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-normal whitespace-nowrap ${style}`}>
        {label}
      </span>
    );
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-8 h-8 flex items-center justify-center rounded text-sm ${currentPage === i
            ? "bg-primary-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
            }`}
        >
          {i}
        </button>,
      );
    }

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-50"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-50"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 5rem)" }}>
          <VideoLoading message="กำลังโหลดข้อมูลประกาศ..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OwnerNavbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-42">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-black">
            ประกาศที่รับสมัครอยู่
          </h1>
          <p className="text-gray-500 mt-1">ติดตามประกาศและสร้างประกาศใหม่</p>
        </div>

        {/* Stats Cards - Single Row with Dividers */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
          {/* Total Announcements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
            {/* <div className="flex items-center gap-4"> */}
            <div className="text-primary-600">
              <svg
                width="20"
                height="19"
                viewBox="0 0 20 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM2 17H18V6H2V17ZM8 4H12V2H8V4Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalAnnouncements}
              </p>
              <p className="text-gray-500 text-sm">ประกาศทั้งหมด</p>
            </div>
            {/* </div> */}
          </div>

          {/* Open Positions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
            {/* <div className="flex items-center gap-4"> */}
            <div className="text-primary-600">
              <svg
                width="22"
                height="16"
                viewBox="0 0 22 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V13.2ZM20 16H17.45C17.6333 15.7 17.7708 15.3792 17.8625 15.0375C17.9542 14.6958 18 14.35 18 14V13C18 12.2667 17.7958 11.5625 17.3875 10.8875C16.9792 10.2125 16.4 9.63333 15.65 9.15C16.5 9.25 17.3 9.42083 18.05 9.6625C18.8 9.90417 19.5 10.2 20.15 10.55C20.75 10.8833 21.2083 11.2542 21.525 11.6625C21.8417 12.0708 22 12.5167 22 13V14C22 14.55 21.8042 15.0208 21.4125 15.4125C21.0208 15.8042 20.55 16 20 16ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM18 4C18 5.1 17.6083 6.04167 16.825 6.825C16.0417 7.60833 15.1 8 14 8C13.8167 8 13.5833 7.97917 13.3 7.9375C13.0167 7.89583 12.7833 7.85 12.6 7.8C13.05 7.26667 13.3958 6.675 13.6375 6.025C13.8792 5.375 14 4.7 14 4C14 3.3 13.8792 2.625 13.6375 1.975C13.3958 1.325 13.05 0.733333 12.6 0.2C12.8333 0.116667 13.0667 0.0625 13.3 0.0375C13.5333 0.0125 13.7667 0 14 0C15.1 0 16.0417 0.391667 16.825 1.175C17.6083 1.95833 18 2.9 18 4ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalOpenPositions}
              </p>
              <p className="text-gray-500 text-sm">ตำแหน่งว่างทั้งหมด</p>
            </div>
            {/* </div> */}
          </div>

          {/* Total Applicants */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
            {/* <div className="flex items-center gap-4"> */}
            <div className="text-primary-600">
              <svg
                width="26"
                height="16"
                viewBox="0 0 24 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 12C0.716667 12 0.479167 11.9042 0.2875 11.7125C0.0958333 11.5208 0 11.2833 0 11V10.425C0 9.70833 0.366667 9.125 1.1 8.675C1.83333 8.225 2.8 8 4 8C4.21667 8 4.425 8.00417 4.625 8.0125C4.825 8.02083 5.01667 8.04167 5.2 8.075C4.96667 8.425 4.79167 8.79167 4.675 9.175C4.55833 9.55833 4.5 9.95833 4.5 10.375V12H1ZM7 12C6.71667 12 6.47917 11.9042 6.2875 11.7125C6.09583 11.5208 6 11.2833 6 11V10.375C6 9.84167 6.14583 9.35417 6.4375 8.9125C6.72917 8.47083 7.14167 8.08333 7.675 7.75C8.20833 7.41667 8.84583 7.16667 9.5875 7C10.3292 6.83333 11.1333 6.75 12 6.75C12.8833 6.75 13.6958 6.83333 14.4375 7C15.1792 7.16667 15.8167 7.41667 16.35 7.75C16.8833 8.08333 17.2917 8.47083 17.575 8.9125C17.8583 9.35417 18 9.84167 18 10.375V11C18 11.2833 17.9042 11.5208 17.7125 11.7125C17.5208 11.9042 17.2833 12 17 12H7ZM19.5 12V10.375C19.5 9.94167 19.4458 9.53333 19.3375 9.15C19.2292 8.76667 19.0667 8.40833 18.85 8.075C19.0333 8.04167 19.2208 8.02083 19.4125 8.0125C19.6042 8.00417 19.8 8 20 8C21.2 8 22.1667 8.22083 22.9 8.6625C23.6333 9.10417 24 9.69167 24 10.425V11C24 11.2833 23.9042 11.5208 23.7125 11.7125C23.5208 11.9042 23.2833 12 23 12H19.5ZM8.125 10H15.9C15.7333 9.66667 15.2708 9.375 14.5125 9.125C13.7542 8.875 12.9167 8.75 12 8.75C11.0833 8.75 10.2458 8.875 9.4875 9.125C8.72917 9.375 8.275 9.66667 8.125 10ZM4 7C3.45 7 2.97917 6.80417 2.5875 6.4125C2.19583 6.02083 2 5.55 2 5C2 4.43333 2.19583 3.95833 2.5875 3.575C2.97917 3.19167 3.45 3 4 3C4.56667 3 5.04167 3.19167 5.425 3.575C5.80833 3.95833 6 4.43333 6 5C6 5.55 5.80833 6.02083 5.425 6.4125C5.04167 6.80417 4.56667 7 4 7ZM20 7C19.45 7 18.9792 6.80417 18.5875 6.4125C18.1958 6.02083 18 5.55 18 5C18 4.43333 18.1958 3.95833 18.5875 3.575C18.9792 3.19167 19.45 3 20 3C20.5667 3 21.0417 3.19167 21.425 3.575C21.8083 3.95833 22 4.43333 22 5C22 5.55 21.8083 6.02083 21.425 6.4125C21.0417 6.80417 20.5667 7 20 7ZM12 6C11.1667 6 10.4583 5.70833 9.875 5.125C9.29167 4.54167 9 3.83333 9 3C9 2.15 9.29167 1.4375 9.875 0.8625C10.4583 0.2875 11.1667 0 12 0C12.85 0 13.5625 0.2875 14.1375 0.8625C14.7125 1.4375 15 2.15 15 3C15 3.83333 14.7125 4.54167 14.1375 5.125C13.5625 5.70833 12.85 6 12 6ZM12 4C12.2833 4 12.5208 3.90417 12.7125 3.7125C12.9042 3.52083 13 3.28333 13 3C13 2.71667 12.9042 2.47917 12.7125 2.2875C12.5208 2.09583 12.2833 2 12 2C11.7167 2 11.4792 2.09583 11.2875 2.2875C11.0958 2.47917 11 2.71667 11 3C11 3.28333 11.0958 3.52083 11.2875 3.7125C11.4792 3.90417 11.7167 4 12 4Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalApplicants}
              </p>
              <p className="text-gray-500 text-sm">ผู้สมัครทั้งหมด</p>
            </div>
            {/* </div> */}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              รายการประกาศของหน่วยงานทั้งหมด ({filteredAnnouncements.length}{" "}
              รายการ)
            </h2>
            <div className="flex items-center gap-3">
              {/* 🔍 Search by position name */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาตำแหน่งงาน..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1); // รีเซ็ตหน้าเมื่อค้นหา
                  }}
                  className="w-64 bg-white border-2  border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-700 hover:border-primary-600 shadow-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition "
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                  />
                </svg>
              </div>

              {/* ➕ Create */}
              <Link
                href="/owner/announcements/create"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                สร้างประกาศใหม่
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-black whitespace-nowrap">
                    ตำแหน่ง
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-black whitespace-nowrap">
                    จำนวนผู้สมัคร<br />ที่เปิดรับ
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-black whitespace-nowrap">
                    จำนวนผู้สมัคร
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-black whitespace-nowrap">
                    ระยะเวลาที่<br />เปิดรับสมัคร
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-black whitespace-nowrap">
                    สาขาวิชา
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-black whitespace-nowrap">
                    สถานะ
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-black whitespace-nowrap">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center"
                    >
                      <VideoLoading message="กำลังโหลดประกาศ..." />
                    </td>
                  </tr>
                ) : paginatedAnnouncements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <img
                          src="/images/department_em.png"
                          alt="ยังไม่มีประกาศรับสมัครฝึกงาน"
                          className="w-40 h-40 object-contain opacity-80"
                        />
                        <p className="text-gray-700 font-semibold text-base mt-2">ยังไม่มีประกาศรับสมัครฝึกงาน</p>
                        <p className="text-gray-400 text-sm">คุณยังไม่ได้สร้างประกาศรับสมัครฝึกงาน<br />กดปุ่ม &lsquo;+สร้างประกาศใหม่&rsquo; เพื่อเริ่มต้น</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAnnouncements.map((announcement) => {
                    // Parse major field to array
                    const majorFields = announcement.major
                      ? announcement.major
                        .split(",")
                        .map((m) => m.trim())
                        .filter((m) => m)
                      : [];

                    return (
                      <tr key={announcement.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/owner/dashboard/applications?positionId=${announcement.id}`)}>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-800 font-medium">
                            {announcement.name}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-3 py-1 rounded-full text-sm bg-primary-50 border border-primary-600 text-gray-800 whitespace-nowrap">
                            {announcement.positionCount ? `${announcement.acceptedCount ?? 0}/${announcement.positionCount} คน` : "ไม่จำกัดจำนวน"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-3 py-1 rounded-full text-sm bg-primary-50 border border-primary-600 text-gray-800 whitespace-nowrap">
                            {applicantCounts[announcement.id]?.total ?? 0} คน
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <p className="text-sm text-gray-600 whitespace-nowrap">
                            {announcement.recruitStart && announcement.recruitEnd ? (
                              <>{formatDateThai(announcement.recruitStart)} - {formatDateThai(announcement.recruitEnd)}</>
                            ) : (
                              <>ไม่กำหนดระยะเวลา</>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            {majorFields.slice(0, 2).map((field, idx) => (
                              <span
                                key={idx}
                                className="inline-block text-xs  text-gray-900 bg-primary-50 px-2 py-1 rounded-full border border-primary-600 w-fit max-w-[150px] truncate"
                                title={field}
                              >
                                {field}
                              </span>
                            ))}
                            {majorFields.length > 2 && (
                              <span className="inline-block text-xs text-gray-500 px-2 py-1">
                                +{majorFields.length - 2}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {getStatusBadge(announcement)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* ดูรายละเอียด */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPosition(announcement);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors cursor-pointer"
                              title="ดูรายละเอียด"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {/* แก้ไข */}
                            <Link
                              href={`/owner/announcements/${announcement.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-colors"
                              title="แก้ไข"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            {/* ลบ */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(String(announcement.id));
                                setShowDeleteModal(true);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                              title="ลบ"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              แสดง {startIndex + 1}-
              {Math.min(
                startIndex + itemsPerPage,
                filteredAnnouncements.length,
              )}{" "}
              จากทั้งหมด {filteredAnnouncements.length}
            </p>
            {renderPagination()}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                ยืนยันการลบประกาศ
              </h3>
              <p className="text-gray-500 mb-6">
                คุณต้องการลบประกาศนี้หรือไม่?
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTargetId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  ลบประกาศ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Detail Modal */}
      {previewPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewPosition(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setPreviewPosition(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10 cursor-pointer"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Scrollable content */}
            <div className="overflow-y-auto p-6 lg:p-8 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">รายละเอียดประกาศรับสมัคร</h2>
                <hr className="border-gray-200" />
              </div>

              {/* Title + Status Badge */}
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold text-gray-800">{previewPosition.name}</h3>
                {getStatusBadge(previewPosition)}
              </div>

              {/* Info Grid - Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">จำนวนผู้สมัครที่เปิดรับ</p>
                    <p className="text-sm font-medium text-gray-800">
                      {(() => {
                        const accepted = previewPosition.acceptedCount ?? 0;
                        const total = previewPosition.positionCount || 0;
                        return total === 0 ? "ไม่จำกัดจำนวน" : `${accepted}/${total} ตำแหน่ง`;
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">หน่วยงาน</p>
                    <p className="text-sm font-medium text-gray-800">{previewPosition.department?.deptFull || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">สถานที่ปฏิบัติงาน</p>
                    <p className="text-sm font-medium text-gray-800">{previewPosition.location || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid - Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">ระยะเวลาที่เปิดรับสมัคร</p>
                    <p className="text-sm font-medium text-gray-800">
                      {previewPosition.recruitStart && previewPosition.recruitEnd
                        ? `${formatDateThai(previewPosition.recruitStart)} - ${formatDateThai(previewPosition.recruitEnd)}`
                        : "ไม่กำหนดระยะเวลา"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">จำนวนผู้สมัคร</p>
                    <p className="text-sm font-medium text-gray-800">{applicantCounts[previewPosition.id]?.total || 0} คน</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* สาขาวิชาที่เกี่ยวข้อง */}
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-3">สาขาวิชาที่เกี่ยวข้อง</h4>
                <div className="flex flex-wrap gap-2">
                  {previewPosition.major?.split(",").map((field, idx) => (
                    <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 border border-primary-300 rounded-full text-sm">
                      {field.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* เอกสารที่ต้องการเพิ่ม */}
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-3">เอกสารที่ต้องการเพิ่ม</h4>
                <div className="flex flex-wrap gap-2">
                  {previewPosition.portfolioRq && (
                    <span className="px-4 py-1 border border-gray-300 rounded-full text-sm text-gray-700">Portfolio</span>
                  )}
                  {previewPosition.resumeRq && (
                    <span className="px-4 py-1 border border-gray-300 rounded-full text-sm text-gray-700">Resume</span>
                  )}
                  {!previewPosition.portfolioRq && !previewPosition.resumeRq && (
                    <span className="text-sm text-gray-500">ไม่มีเอกสารที่ต้องการ</span>
                  )}
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* รายละเอียดงาน */}
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-4">รายละเอียดงาน</h4>

                {/* ลักษณะงาน */}
                {previewPosition.jobDetails && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">ลักษณะงาน</p>
                    <ul className="space-y-2">
                      {previewPosition.jobDetails.split("\n").filter(Boolean).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* คุณสมบัติ */}
                {previewPosition.requirement && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">คุณสมบัติ</p>
                    <ul className="space-y-2">
                      {previewPosition.requirement.split("\n").filter(Boolean).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* สวัสดิการ */}
              <div>
                <h4 className="text-base font-bold text-gray-800 mb-3">สวัสดิการ</h4>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-700">{previewPosition.benefits || "ไม่มีค่าตอบแทน"}</span>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* รายละเอียดผู้ประกาศรับสมัคร */}
              {(() => {
                const ownerData = previewPosition.owner || (previewPosition.owners && previewPosition.owners.length > 0 ? previewPosition.owners[0] : null);
                if (!ownerData) return null;
                return (
                  <>
                    <div>
                      <h4 className="text-base font-bold text-gray-800 mb-3">รายละเอียดผู้ประกาศรับสมัคร</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-700">{`${ownerData.fname || ""} ${ownerData.lname || ""}`.trim() || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{ownerData.email || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-sm text-gray-700">{ownerData.phoneNumber || "-"}</span>
                        </div>
                      </div>
                    </div>
                    <hr className="border-gray-200" />
                  </>
                );
              })()}

              {/* รายละเอียดพี่เลี้ยง */}
              {previewPosition.mentors && previewPosition.mentors.length > 0 && (
                <div className="space-y-6">
                  {previewPosition.mentors.map((mentor, idx) => (
                    <div key={idx}>
                      <h4 className="text-base font-bold text-gray-800 mb-3">
                        รายละเอียดพี่เลี้ยง {idx + 1}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-sm text-gray-700">{mentor.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{mentor.email || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-sm text-gray-700">{mentor.phoneNumber || "-"}</span>
                        </div>
                      </div>
                      {idx < previewPosition.mentors!.length - 1 && <hr className="border-gray-200 mt-6" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
