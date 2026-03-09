"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OwnerNavbar from "../../../components/ui/OwnerNavbar";
import VideoLoading from "../../../components/ui/VideoLoading";
import { JobAnnouncement } from "../../../types/announcement";
import { formatDateThai } from "../../../data/mockAnnouncements";
import { mockApplications, Application } from "../../../data/mockApplications";
import OwnerSearchSection from "../../../components/ui/OwnerSearchSection";
import { positionApi, positionToAnnouncement } from "../../../services/api";
import {
  highSchools,
  vocationalSchools,
  highVocationalSchools,
  universities,
} from "../../../data/institutions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AnnouncementDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<JobAnnouncement | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter states
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>(
    [],
  );
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const institutionDropdownRef = useRef<HTMLDivElement>(null);

  // Close institution dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        institutionDropdownRef.current &&
        !institutionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowInstitutionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Institution categories for dropdown
  const institutionCategories = [
    { id: "high_school", label: "มัธยมศึกษาตอนปลาย" },
    { id: "vocational", label: "ประกาศนียบัตรวิชาชีพ (ปวช.)" },
    { id: "high_vocational", label: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)" },
    { id: "university", label: "มหาวิทยาลัย" },
  ];

  const handleInstitutionToggle = (instId: string) => {
    setSelectedInstitutions((prev) =>
      prev.includes(instId)
        ? prev.filter((s) => s !== instId)
        : [...prev, instId],
    );
  };

  const getInstitutionDisplayText = () => {
    if (selectedInstitutions.length === 0) return "ชื่อสถาบันศึกษา";
    if (selectedInstitutions.length === institutionCategories.length)
      return "ทั้งหมด";
    return selectedInstitutions
      .map(
        (instId) =>
          institutionCategories.find((c) => c.id === instId)?.label || instId,
      )
      .join(", ");
  };

  const getSchoolsByCategory = (categoryId: string): string[] => {
    switch (categoryId) {
      case "high_school":
        return highSchools.slice(0, 3);
      case "vocational":
        return vocationalSchools.slice(0, 3);
      case "high_vocational":
        return highVocationalSchools.slice(0, 3);
      case "university":
        return universities.slice(0, 4);
      default:
        return [];
    }
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId],
    );
  };

  const clearInstitutionFilter = () => {
    setSelectedInstitutions([]);
    setSelectedSchools([]);
    setInstitutionSearch("");
    setExpandedCategories([]);
    setShowInstitutionDropdown(false);
  };

  const handleSchoolToggle = (school: string) => {
    setSelectedSchools((prev) =>
      prev.includes(school)
        ? prev.filter((s) => s !== school)
        : [...prev, school],
    );
  };

  // Load status changes from localStorage
  const [cancelledAppsData, setCancelledAppsData] = useState<
    { id: string; reason: string; cancelledBy: string; cancelledDate: string }[]
  >([]);
  const [rejectedAppIds, setRejectedAppIds] = useState<string[]>([]);
  const [approvedAppIds, setApprovedAppIds] = useState<string[]>([]);
  const [interviewedAppIds, setInterviewedAppIds] = useState<string[]>([]);
  const [docUploadedAppIds, setDocUploadedAppIds] = useState<string[]>([]);
  const [docApprovedAppIds, setDocApprovedAppIds] = useState<string[]>([]);
  const [docRejectedAppIds, setDocRejectedAppIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pea_cancelled_apps");
      if (stored) setCancelledAppsData(JSON.parse(stored));
    } catch {}
    // Load all status keys from localStorage
    const loadArr = (key: string): string[] => {
      try {
        const s = localStorage.getItem(key);
        return s ? JSON.parse(s) : [];
      } catch {
        return [];
      }
    };
    setRejectedAppIds(loadArr("pea_rejected_apps"));
    setApprovedAppIds(loadArr("pea_approved_apps"));
    setInterviewedAppIds(loadArr("pea_interviewed_apps"));
    setDocUploadedAppIds(loadArr("pea_doc_uploaded_apps"));
    setDocApprovedAppIds(loadArr("pea_doc_approved_apps"));
    setDocRejectedAppIds(loadArr("pea_doc_rejected_apps"));
  }, []);
  const cancelledAppIds = useMemo(
    () => cancelledAppsData.map((c) => c.id),
    [cancelledAppsData],
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // ดึงข้อมูล position จาก API
        const positionId = parseInt(id);
        if (isNaN(positionId)) {
          console.error("Invalid position ID");
          setIsLoading(false);
          return;
        }

        const position = await positionApi.getPositionById(positionId);
        if (position) {
          const announcementData = positionToAnnouncement(position);
          setAnnouncement(announcementData);
        }
      } catch (error) {
        console.error("Error loading announcement:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const getStatusBadge = (status: JobAnnouncement["status"]) => {
    const styles = {
      open: "bg-green-50 text-gray-800 border border-green-500",
      closed: "bg-gray-100 text-gray-600 border border-gray-200",
      draft: "bg-yellow-50 text-yellow-600 border border-yellow-200",
      expired: "bg-red-50 text-red-600 border border-red-200",
    };
    const labels = {
      open: "เปิดรับสมัคร",
      closed: "ปิดรับสมัคร",
      draft: "ฉบับร่าง",
      expired: "หมดอายุ",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const getEducationLabel = (education: string): string => {
    const labels: Record<string, string> = {
      high_school: "มัธยมศึกษาตอนปลาย",
      vocational: "ปวช.",
      high_vocational: "ปวส.",
      university: "มหาวิทยาลัย",
    };
    return labels[education] || education;
  };

  // Derive effective status considering localStorage changes
  const getEffectiveStatus = (app: Application): string => {
    if (cancelledAppIds.includes(app.id)) return "cancelled";
    if (rejectedAppIds.includes(app.id)) return "rejected";
    if (approvedAppIds.includes(app.id)) return "accepted";
    if (interviewedAppIds.includes(app.id) && app.status === "interview")
      return "reviewing";
    return app.status;
  };

  const getAppStatusBadge = (app: Application) => {
    const effectiveStatus = getEffectiveStatus(app);
    const statusMap: Record<string, { style: string; label: string }> = {
      pending: {
        style: "bg-yellow-50 text-[#7A2E0E] border border-yellow-200",
        label: "รอยื่นเอกสาร",
      },
      interview: {
        style: "bg-yellow-50 text-[#7A2E0E] border border-yellow-200",
        label: "รอสัมภาษณ์",
      },
      reviewing: {
        style: "bg-yellow-50 text-[#7A2E0E] border border-yellow-200",
        label: "รอการยืนยัน",
      },
      accepted: {
        style: "bg-green-50 text-[#085D3A] border border-green-200",
        label: "รับเข้าฝึกงาน",
      },
      rejected: {
        style: "bg-red-50 text-[#912018] border border-red-200",
        label: "ไม่ผ่าน",
      },
      cancelled: {
        style: "bg-red-50 text-[#912018] border border-red-200",
        label: "ยกเลิกฝึกงาน",
      },
    };
    const s = statusMap[effectiveStatus] || statusMap.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.style}`}>
        {s.label}
      </span>
    );
  };

  const getAppDocumentStatusBadge = (app: Application) => {
    const effectiveStatus = getEffectiveStatus(app);
    // If cancelled via localStorage, show "-"
    if (effectiveStatus === "cancelled") {
      return <span className="text-gray-500">-</span>;
    }
    // Not accepted yet (pending, interview, reviewing, rejected) → show "-"
    if (effectiveStatus !== "accepted") {
      return <span className="text-gray-500">-</span>;
    }
    // Check doc status from localStorage
    if (docApprovedAppIds.includes(app.id)) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-[#085D3A] border border-green-200">
          เอกสารผ่าน
        </span>
      );
    }
    if (docRejectedAppIds.includes(app.id)) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-[#912018] border border-red-200">
          เอกสารไม่ผ่าน
        </span>
      );
    }
    if (docUploadedAppIds.includes(app.id)) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-[#7A2E0E] border border-yellow-200">
          รอการตรวจสอบ
        </span>
      );
    }
    if (
      approvedAppIds.includes(app.id) &&
      !docUploadedAppIds.includes(app.id)
    ) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-[#7A2E0E] border border-yellow-200">
          รอเอกสารขอความอนุเคราะห์
        </span>
      );
    }
    // Accepted: show document status based on detailedStatus
    // Step 4: waiting for analysis doc
    if (app.detailedStatus === "waiting_analysis_doc") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-[#7A2E0E] border border-yellow-200">
          รอเอกสารขอความอนุเคราะห์
        </span>
      );
    }
    // Analysis doc rejected
    if (app.detailedStatus === "doc_rejected") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-[#912018] border border-red-200">
          เอกสารไม่ผ่าน
        </span>
      );
    }
    // Analysis doc sent (pending HR review)
    if (
      app.detailedStatus === "doc_sent" &&
      app.analysisDocuments?.[0]?.status === "pending"
    ) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-[#7A2E0E] border border-yellow-200">
          รอการตรวจสอบ
        </span>
      );
    }
    // Doc sent with approved analysis doc (still at step 5, HR reviewing)
    if (
      app.detailedStatus === "doc_sent" &&
      app.analysisDocuments?.[0]?.status === "approved"
    ) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-[#7A2E0E] border border-yellow-200">
          รอการตรวจสอบ
        </span>
      );
    }
    // Doc passed / completed
    if (
      app.detailedStatus === "doc_passed" ||
      app.detailedStatus === "completed"
    ) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-[#085D3A] border border-green-200">
          เอกสารผ่าน
        </span>
      );
    }
    // Default for accepted
    return <span className="text-gray-500">-</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 5rem)" }}
        >
          <VideoLoading message="กำลังโหลดข้อมูล..." />
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">ไม่พบประกาศ</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OwnerNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/owner/announcements"
              className="text-gray-500 hover:text-primary-600"
            >
              ประกาศที่รับสมัครอยู่
            </Link>
            <span className="text-gray-400">{">"}</span>
            <span className="text-primary-600 font-medium">
              รายละเอียดประกาศและผู้สมัคร
            </span>
          </div>
          <h1 className="text-2xl font-bold text-black mt-2">
            {announcement.title}
          </h1>
          <p className="text-gray-500 mt-1">รายละเอียดประกาศและผู้สมัคร</p>
        </div>

        <div className="mb-6">
          <div className="bg-primary-50 border-l-4 border-primary-600 rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.00038 19C4.71704 19 4.47954 18.9042 4.28788 18.7125C4.09621 18.5208 4.00038 18.2833 4.00038 18C4.00038 17.7167 4.09621 17.4792 4.28788 17.2875C4.47954 17.0958 4.71704 17 5.00038 17H6.00038V10C6.00038 8.61667 6.41704 7.3875 7.25038 6.3125C8.08371 5.2375 9.16704 4.53333 10.5004 4.2V3.5C10.5004 3.08333 10.6462 2.72917 10.9379 2.4375C11.2295 2.14583 11.5837 2 12.0004 2C12.417 2 12.7712 2.14583 13.0629 2.4375C13.3545 2.72917 13.5004 3.08333 13.5004 3.5V4.2C14.8337 4.53333 15.917 5.2375 16.7504 6.3125C17.5837 7.3875 18.0004 8.61667 18.0004 10V17H19.0004C19.2837 17 19.5212 17.0958 19.7129 17.2875C19.9045 17.4792 20.0004 17.7167 20.0004 18C20.0004 18.2833 19.9045 18.5208 19.7129 18.7125C19.5212 18.9042 19.2837 19 19.0004 19H5.00038ZM12.0004 22C11.4504 22 10.9795 21.8042 10.5879 21.4125C10.1962 21.0208 10.0004 20.55 10.0004 20H14.0004C14.0004 20.55 13.8045 21.0208 13.4129 21.4125C13.0212 21.8042 12.5504 22 12.0004 22ZM8.00038 17H16.0004V10C16.0004 8.9 15.6087 7.95833 14.8254 7.175C14.042 6.39167 13.1004 6 12.0004 6C10.9004 6 9.95871 6.39167 9.17538 7.175C8.39204 7.95833 8.00038 8.9 8.00038 10V17ZM3.00038 10C2.71704 10 2.47954 9.89167 2.28788 9.675C2.09621 9.45833 2.01704 9.20833 2.05038 8.925C2.18371 7.675 2.53371 6.5125 3.10038 5.4375C3.66704 4.3625 4.39204 3.425 5.27538 2.625C5.49204 2.44167 5.73788 2.35833 6.01288 2.375C6.28788 2.39167 6.50871 2.51667 6.67538 2.75C6.84204 2.98333 6.90871 3.23333 6.87538 3.5C6.84204 3.76667 6.71704 4 6.50038 4.2C5.85038 4.81667 5.31704 5.53333 4.90038 6.35C4.48371 7.16667 4.20871 8.05 4.07538 9C4.04204 9.28333 3.92538 9.52083 3.72538 9.7125C3.52538 9.90417 3.28371 10 3.00038 10ZM21.0004 10C20.717 10 20.4754 9.90417 20.2754 9.7125C20.0754 9.52083 19.9587 9.28333 19.9254 9C19.792 8.05 19.517 7.16667 19.1004 6.35C18.6837 5.53333 18.1504 4.81667 17.5004 4.2C17.2837 4 17.1587 3.76667 17.1254 3.5C17.092 3.23333 17.1587 2.98333 17.3254 2.75C17.492 2.51667 17.7129 2.39167 17.9879 2.375C18.2629 2.35833 18.5087 2.44167 18.7254 2.625C19.6087 3.425 20.3337 4.3625 20.9004 5.4375C21.467 6.5125 21.817 7.675 21.9504 8.925C21.9837 9.20833 21.9045 9.45833 21.7129 9.675C21.5212 9.89167 21.2837 10 21.0004 10Z"
                    fill="#A80689"
                  />
                </svg>
              </div>
              <span className="text-gray-800 font-medium text-base">
                แจ้งเตือน:{" "}
                <span className="font-semibold">
                  ผู้สมัครที่ใกล้ถึงกำหนดเริ่มฝึกงาน (2 ใบสมัคร)
                </span>
              </span>
            </div>
            <Link
              href="/owner/dashboard/near-start"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                  fill="currentColor"
                />
              </svg>
              ดูรายละเอียด
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Announcement Info */}
          <div className="lg:col-span-1">
            {/* Combined Info Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              {/* Header with Status */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  ข้อมูลประกาศ
                </h2>
                {getStatusBadge(announcement.status)}
              </div>

              {/* Basic Info Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM0 11.6667V11C0 10.5278 0.121528 10.0937 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9687 9.69792C13.2118 10.0937 13.3333 10.5278 13.3333 11V11.6667C13.3333 12.125 13.1701 12.5174 12.8438 12.8438C12.5174 13.1701 12.125 13.3333 11.6667 13.3333H1.66667C1.20833 13.3333 0.815972 13.1701 0.489583 12.8438C0.163194 12.5174 0 12.125 0 11.6667ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z"
                        fill="#A80689"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ตำแหน่ง</p>
                    <p className="text-sm text-gray-800">
                      {announcement.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1.66667 15C1.20833 15 0.815972 14.8368 0.489583 14.5104C0.163194 14.184 0 13.7917 0 13.3333V5C0 4.54167 0.163194 4.14931 0.489583 3.82292C0.815972 3.49653 1.20833 3.33333 1.66667 3.33333H3.33333V1.66667C3.33333 1.20833 3.49653 0.815972 3.82292 0.489583C4.14931 0.163194 4.54167 0 5 0H10C10.4583 0 10.8507 0.163194 11.1771 0.489583C11.5035 0.815972 11.6667 1.20833 11.6667 1.66667V6.66667H13.3333C13.7917 6.66667 14.184 6.82986 14.5104 7.15625C14.8368 7.48264 15 7.875 15 8.33333V13.3333C15 13.7917 14.8368 14.184 14.5104 14.5104C14.184 14.8368 13.7917 15 13.3333 15H8.33333V11.6667H6.66667V15H1.66667ZM1.66667 13.3333H3.33333V11.6667H1.66667V13.3333ZM1.66667 10H3.33333V8.33333H1.66667V10ZM1.66667 6.66667H3.33333V5H1.66667V6.66667ZM5 10H6.66667V8.33333H5V10ZM5 6.66667H6.66667V5H5V6.66667ZM5 3.33333H6.66667V1.66667H5V3.33333ZM8.33333 10H10V8.33333H8.33333V10ZM8.33333 6.66667H10V5H8.33333V6.66667ZM8.33333 3.33333H10V1.66667H8.33333V3.33333ZM11.6667 13.3333H13.3333V11.6667H11.6667V13.3333ZM11.6667 10H13.3333V8.33333H11.6667V10Z"
                        fill="#A80689"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">กองงาน</p>
                    <p className="text-sm text-gray-800">
                      {announcement.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">สถานที่</p>
                    <p className="text-sm text-gray-800">
                      {announcement.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">จำนวนรับ</p>
                    <p className="text-sm text-gray-800">
                      {announcement.currentApplicants}/
                      {announcement.maxApplicants} ตำแหน่ง
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">จำนวนผู้สมัคร</p>
                    <p className="text-sm text-gray-800">
                      {announcement.currentApplicants} คน
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ระยะเวลาฝึกงาน</p>
                    <p className="text-sm text-gray-800">
                      {announcement.recruitStartDate &&
                      announcement.recruitEndDate
                        ? `${formatDateThai(announcement.recruitStartDate)} - ${formatDateThai(announcement.recruitEndDate)}`
                        : "ไม่ได้ระบุ"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      ระยะเวลาเปิดรับสมัคร
                    </p>
                    <p className="text-sm text-gray-800">
                      {formatDateThai(announcement.startDate)} -{" "}
                      {formatDateThai(announcement.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-5"></div>

              {/* Related Fields Section */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">
                  สาขาวิชาที่เกี่ยวข้อง
                </h3>
                <div className="flex flex-wrap gap-2">
                  {announcement.relatedFields.length > 0 ? (
                    announcement.relatedFields.map((field, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm border border-primary-200"
                      >
                        {field}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">ไม่ได้ระบุ</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-5"></div>

              {/* Required Documents Section */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">
                  เอกสารที่ต้องการเพิ่ม
                </h3>
                <div className="flex flex-wrap gap-2">
                  {announcement.requiredDocuments.length > 0 ? (
                    announcement.requiredDocuments.map((doc, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-200"
                      >
                        {doc === "portfolio" ? "Portfolio" : "Resume"}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-sm border border-gray-200">
                      ไม่มีเอกสารที่ต้องการเพิ่ม
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-5"></div>

              {/* Job Details Section */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">รายละเอียดงาน</h3>

                {announcement.responsibilities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      ลักษณะงาน
                    </p>
                    <ul className="space-y-2">
                      {announcement.responsibilities.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.6 11.8L6.45 9.65C6.26667 9.46667 6.03333 9.375 5.75 9.375C5.46667 9.375 5.23333 9.46667 5.05 9.65C4.86667 9.83333 4.775 10.0667 4.775 10.35C4.775 10.6333 4.86667 10.8667 5.05 11.05L7.9 13.9C8.1 14.1 8.33333 14.2 8.6 14.2C8.86667 14.2 9.1 14.1 9.3 13.9L14.95 8.25C15.1333 8.06667 15.225 7.83333 15.225 7.55C15.225 7.26667 15.1333 7.03333 14.95 6.85C14.7667 6.66667 14.5333 6.575 14.25 6.575C13.9667 6.575 13.7333 6.66667 13.55 6.85L8.6 11.8ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z"
                                fill="#17B26A"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {announcement.qualifications.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      คุณสมบัติ
                    </p>
                    <ul className="space-y-2">
                      {announcement.qualifications.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 16 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z"
                                fill="#A80689"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    สวัสดิการ
                  </p>
                  <ul className="space-y-2">
                    {(announcement.benefits || "ไม่มีค่าตอบแทน")
                      .split("\n")
                      .filter((item) => item.trim())
                      .map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg
                              width="20"
                              height="20"
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
                          <span className="text-gray-700 text-sm">{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-5"></div>

              {/* Contact Info Section - ผู้ประกาศรับสมัคร */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">
                  รายละเอียดผู้ประกาศรับสมัคร
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
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
                    <span className="text-gray-700 text-sm">
                      {announcement.contactName || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">
                      {announcement.contactEmail || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">
                      {announcement.contactPhone || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-5"></div>

              {/* Mentor Info Section - รายละเอียดพี่เลี้ยง */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">
                  รายละเอียดพี่เลี้ยง
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
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
                    <span className="text-gray-700 text-sm">
                      {announcement.mentorName || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">
                      {announcement.mentorEmail || "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-sm">
                      {announcement.mentorPhone || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Applicants Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filter Section */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Keyword Search */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาตำแหน่งหรือชื่อผู้สมัคร..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 shadow-sm hover:border-primary-600 outline-none text-gray-700 bg-white text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition"
                />
              </div>

              {/* Institution Dropdown */}
              <div className="relative flex-1" ref={institutionDropdownRef}>
                <button
                  onClick={() =>
                    setShowInstitutionDropdown(!showInstitutionDropdown)
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 shadow-sm hover:border-primary-600 outline-none text-gray-700 bg-white flex items-center justify-between cursor-pointer text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition"
                >
                  <span className="text-gray-500 truncate">
                    {getInstitutionDisplayText()}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${showInstitutionDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    {selectedInstitutions.length > 0 && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearInstitutionFilter();
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                </button>

                {showInstitutionDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#FDF2F8] rounded-xl shadow-lg border-2 border-gray-200 z-50 overflow-hidden">
                    {/* Search inside dropdown */}
                    <div className="p-3 pb-0">
                      <input
                        type="text"
                        placeholder="ค้นหาชื่อสถาบันศึกษา..."
                        value={institutionSearch}
                        onChange={(e) => setInstitutionSearch(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition"
                      />
                    </div>
                    <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
                      {/* Select All */}
                      <div
                        className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-pink-100 rounded-lg"
                        onClick={() => {
                          if (
                            selectedInstitutions.length ===
                            institutionCategories.length
                          ) {
                            setSelectedInstitutions([]);
                          } else {
                            setSelectedInstitutions(
                              institutionCategories.map((c) => c.id),
                            );
                          }
                        }}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                            selectedInstitutions.length ===
                            institutionCategories.length
                              ? "bg-primary-600 border-primary-600"
                              : "border-gray-400"
                          }`}
                        >
                          {selectedInstitutions.length ===
                            institutionCategories.length && (
                            <svg
                              className="w-3 h-3 text-white"
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
                          )}
                        </div>
                        <span className="text-gray-700 text-sm">
                          ทั้งหมด ({institutionCategories.length})
                        </span>
                      </div>

                      {/* Categories */}
                      {institutionCategories
                        .filter((cat) => {
                          if (!institutionSearch.trim()) return true;
                          const kw = institutionSearch.trim().toLowerCase();
                          if (cat.label.toLowerCase().includes(kw)) return true;
                          return getSchoolsByCategory(cat.id).some((school) =>
                            school.toLowerCase().includes(kw),
                          );
                        })
                        .map((cat) => {
                          const schools = getSchoolsByCategory(cat.id);
                          const filteredSchools = institutionSearch.trim()
                            ? schools.filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(
                                    institutionSearch.trim().toLowerCase(),
                                  ),
                              )
                            : schools;
                          const isExpanded = expandedCategories.includes(
                            cat.id,
                          );

                          return (
                            <div key={cat.id}>
                              <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-pink-100 rounded-lg">
                                <div
                                  className="flex items-center gap-3 flex-1"
                                  onClick={() =>
                                    handleInstitutionToggle(cat.id)
                                  }
                                >
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                      selectedInstitutions.includes(cat.id)
                                        ? "bg-primary-600 border-primary-600"
                                        : "border-gray-400"
                                    }`}
                                  >
                                    {selectedInstitutions.includes(cat.id) && (
                                      <svg
                                        className="w-3 h-3 text-white"
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
                                    )}
                                  </div>
                                  <span className="text-gray-700 text-sm">
                                    {cat.label}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCategoryExpand(cat.id);
                                  }}
                                  className="p-1 text-gray-500 hover:text-gray-700"
                                >
                                  <svg
                                    className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>
                              </div>

                              {/* Expanded sub-items (schools) */}
                              {isExpanded && (
                                <div className="ml-6 space-y-1">
                                  {filteredSchools.map((school) => (
                                    <div
                                      key={school}
                                      className="flex items-center gap-3 px-2 py-1.5 cursor-pointer hover:bg-pink-100 rounded-lg"
                                      onClick={() => handleSchoolToggle(school)}
                                    >
                                      <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                          selectedSchools.includes(school)
                                            ? "bg-primary-600 border-primary-600"
                                            : "border-gray-400"
                                        }`}
                                      >
                                        {selectedSchools.includes(school) && (
                                          <svg
                                            className="w-3 h-3 text-white"
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
                                        )}
                                      </div>
                                      <span className="text-gray-600 text-sm">
                                        {school}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Applicants Card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  ผู้สมัครฝึกงาน ({mockApplications.length} คน)
                </h2>
                <Link
                  href="/owner/dashboard/applications"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.99935 11.9999H9.99935C10.1882 11.9999 10.3466 11.936 10.4743 11.8083C10.6021 11.6805 10.666 11.5221 10.666 11.3333C10.666 11.1444 10.6021 10.986 10.4743 10.8583C10.3466 10.7305 10.1882 10.6666 9.99935 10.6666H5.99935C5.81046 10.6666 5.65213 10.7305 5.52435 10.8583C5.39657 10.986 5.33268 11.1444 5.33268 11.3333C5.33268 11.5221 5.39657 11.6805 5.52435 11.8083C5.65213 11.936 5.81046 11.9999 5.99935 11.9999ZM5.99935 9.33325H9.99935C10.1882 9.33325 10.3466 9.26936 10.4743 9.14159C10.6021 9.01381 10.666 8.85547 10.666 8.66658C10.666 8.4777 10.6021 8.31936 10.4743 8.19159C10.3466 8.06381 10.1882 7.99992 9.99935 7.99992H5.99935C5.81046 7.99992 5.65213 8.06381 5.52435 8.19159C5.39657 8.31936 5.33268 8.4777 5.33268 8.66658C5.33268 8.85547 5.39657 9.01381 5.52435 9.14159C5.65213 9.26936 5.81046 9.33325 5.99935 9.33325ZM3.99935 14.6666C3.63268 14.6666 3.31879 14.536 3.05768 14.2749C2.79657 14.0138 2.66602 13.6999 2.66602 13.3333V2.66659C2.66602 2.29992 2.79657 1.98603 3.05768 1.72492C3.31879 1.46381 3.63268 1.33325 3.99935 1.33325H8.78268C8.96046 1.33325 9.1299 1.36659 9.29102 1.43325C9.45213 1.49992 9.59379 1.59436 9.71602 1.71659L12.9493 4.94992C13.0716 5.07214 13.166 5.21381 13.2327 5.37492C13.2993 5.53603 13.3327 5.70547 13.3327 5.88325V13.3333C13.3327 13.6999 13.2021 14.0138 12.941 14.2749C12.6799 14.536 12.366 14.6666 11.9993 14.6666H3.99935ZM8.66602 5.33325V2.66659H3.99935V13.3333H11.9993V5.99992H9.33268C9.14379 5.99992 8.98546 5.93603 8.85768 5.80825C8.7299 5.68047 8.66602 5.52214 8.66602 5.33325Z"
                      fill="currentColor"
                    />
                  </svg>
                  ใบสมัครทั้งหมด
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        ชื่อนามสกุล
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        การศึกษา
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        สถาบัน/สาขา
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        สถานะ
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        สถานะเอกสาร
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockApplications.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          ยังไม่มีผู้สมัคร
                        </td>
                      </tr>
                    ) : (
                      mockApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-800 whitespace-nowrap">
                              {app.firstName} {app.lastName}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600">
                              {getEducationLabel(app.education)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-800">
                              {app.institution}
                            </p>
                            <p className="text-xs text-gray-500">{app.major}</p>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {getAppStatusBadge(app)}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {getAppDocumentStatusBadge(app)}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <Link
                              href={`/owner/dashboard/${app.id}?from=announcements`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
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
                              ดูรายละเอียด
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
