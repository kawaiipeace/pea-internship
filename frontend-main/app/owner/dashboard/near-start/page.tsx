"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import OwnerNavbar from "../../../components/ui/OwnerNavbar";
import {
  Application,
  fetchAllApplications,
  getNearStartApps,
} from "../utils/applicationMapper";
import {
  applicationApi,
  applicationStatusActionsApi,
  type ApplicationStatusAction,
  type AppStatusEnum,
  type MyApplicationData,
} from "../../../services/api";
import {
  highSchools,
  vocationalSchools,
  highVocationalSchools,
  universities,
} from "../../../data/institutions";

// Thai month names
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

const formatDateThai = (dateString: string): string => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  return `${day} ${thaiMonths[month]} ${year}`;
};

// LocalStorage keys
const STORAGE_KEYS = {
  DOC_APPROVED_APPS: "pea_doc_approved_apps",
  DOC_REJECTED_APPS: "pea_doc_rejected_apps",
  DOC_UPLOADED_APPS: "pea_doc_uploaded_apps",
  APPROVED_APPS: "pea_approved_apps",
};

const getFromStorage = (key: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

function NearStartApplicationsContent() {
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const searchParams = useSearchParams();
  const positionId = searchParams.get("positionId");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // All applications fetched from API (replaces mockApplications)
  const [allApps, setAllApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchAllApplications(positionId ? Number(positionId) : undefined).then(
      (apps) => {
        setAllApps(apps);
        setLoading(false);
      },
    );
  }, [positionId]);

  // localStorage state
  const [docApprovedApps, setDocApprovedApps] = useState<string[]>([]);
  const [docRejectedApps, setDocRejectedApps] = useState<string[]>([]);
  const [docUploadedApps, setDocUploadedApps] = useState<string[]>([]);
  const [approvedApps, setApprovedApps] = useState<string[]>([]);

  // UI toggles
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showMentorInfo, setShowMentorInfo] = useState(false);

  // Timeline actions state (real data from API)
  const [timelineActions, setTimelineActions] = useState<
    ApplicationStatusAction[]
  >([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Application history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<MyApplicationData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Cancel modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Cancelled apps data
  const [cancelledAppsData, setCancelledAppsData] = useState<
    { id: string; reason: string; cancelledBy: string; cancelledDate: string }[]
  >([]);

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

  // Fetch timeline actions when selected application changes
  useEffect(() => {
    if (!selectedApplication) {
      setTimelineActions([]);
      return;
    }
    const appId = Number(selectedApplication.id);
    if (!appId || isNaN(appId)) {
      setTimelineActions([]);
      return;
    }
    setTimelineLoading(true);
    applicationStatusActionsApi
      .getByApplicationStatusId(appId)
      .then((actions) => {
        setTimelineActions([...actions].reverse());
      })
      .catch((err) => {
        console.error("Failed to fetch timeline actions:", err);
        setTimelineActions([]);
      })
      .finally(() => setTimelineLoading(false));
  }, [selectedApplication?.id]);

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

  const handleInstitutionToggle = (id: string) => {
    setSelectedInstitutions((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const getInstitutionDisplayText = () => {
    if (selectedInstitutions.length === 0) return "ชื่อสถาบันศึกษา";
    if (selectedInstitutions.length === institutionCategories.length)
      return "ทั้งหมด";
    return selectedInstitutions
      .map((id) => institutionCategories.find((c) => c.id === id)?.label || id)
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

  // Load from localStorage on mount
  useEffect(() => {
    setDocApprovedApps(getFromStorage(STORAGE_KEYS.DOC_APPROVED_APPS));
    setDocRejectedApps(getFromStorage(STORAGE_KEYS.DOC_REJECTED_APPS));
    setDocUploadedApps(getFromStorage(STORAGE_KEYS.DOC_UPLOADED_APPS));
    setApprovedApps(getFromStorage(STORAGE_KEYS.APPROVED_APPS));
    try {
      const stored = localStorage.getItem("pea_cancelled_apps");
      if (stored) setCancelledAppsData(JSON.parse(stored));
    } catch {}
  }, []);

  // Get effective detailed status for accepted apps
  const getAcceptedEffectiveDetailed = (app: Application) => {
    if (docApprovedApps.includes(app.id)) return "doc_passed";
    if (docRejectedApps.includes(app.id)) return "doc_rejected";
    if (docUploadedApps.includes(app.id)) return "doc_sent";
    if (approvedApps.includes(app.id) && app.status !== "accepted")
      return "waiting_analysis_doc";
    return app.detailedStatus;
  };

  // Get accepted sub-status badge
  const getAcceptedSubBadge = (effectiveDetailed: string) => {
    switch (effectiveDetailed) {
      case "waiting_analysis_doc":
        return {
          text: "รอเอกสารขอความอนุเคราะห์",
          color:
            "bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FEDF89]",
        };
      case "waiting_send_doc":
      case "doc_sent":
        return {
          text: "รอการตรวจสอบ",
          color:
            "bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FEDF89]",
        };
      case "doc_rejected":
        return {
          text: "เอกสารไม่ผ่าน",
          color:
            "bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA]",
        };
      case "doc_passed":
      case "completed":
        return {
          text: "เอกสารผ่าน",
          color:
            "bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]",
        };
      default:
        return {
          text: "รับเข้าฝึกงาน",
          color:
            "bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]",
        };
    }
  };

  // Filter applications when search changes
  useEffect(() => {
    let filtered = getNearStartApps(allApps);

    // Apply search keyword filter
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      filtered = filtered.filter(
        (app) =>
          `${app.firstName} ${app.lastName}`.toLowerCase().includes(kw) ||
          app.position?.toLowerCase().includes(kw) ||
          app.department?.toLowerCase().includes(kw) ||
          app.institution?.toLowerCase().includes(kw) ||
          app.major?.toLowerCase().includes(kw),
      );
    }

    // Apply institution filter (category-level or school-level)
    if (selectedInstitutions.length > 0 || selectedSchools.length > 0) {
      filtered = filtered.filter((app) => {
        if (selectedSchools.length > 0 && app.institution) {
          if (selectedSchools.includes(app.institution)) return true;
        }
        if (selectedInstitutions.length > 0) {
          const eduMap: Record<string, string> = {
            high_school: "high_school",
            vocational: "vocational",
            high_vocational: "high_vocational",
            university: "university",
          };
          return selectedInstitutions.some(
            (instId) => app.education === eduMap[instId],
          );
        }
        return false;
      });
    }

    setFilteredApplications(filtered);
    setCurrentPage(1);

    // Auto-select first item if current selection is not in the filtered list
    if (selectedApplication) {
      const stillInList = filtered.some(
        (app) => app.id === selectedApplication.id,
      );
      if (!stillInList) {
        if (filtered.length > 0) {
          setSelectedApplication(filtered[0]);
        } else {
          setSelectedApplication(null);
        }
      }
    } else if (filtered.length > 0) {
      setSelectedApplication(filtered[0]);
    }
  }, [searchKeyword, selectedInstitutions, selectedSchools]);

  // Set first application as selected on mount
  useEffect(() => {
    const nearStart = getNearStartApps(allApps);
    setFilteredApplications(nearStart);
    if (nearStart.length > 0 && !selectedApplication) {
      setSelectedApplication(nearStart[0]);
    }
  }, []);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Fetch real application history for a student
  const fetchApplicationHistory = async (app: Application) => {
    if (!app.internId) return;
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const data = await applicationApi.getStudentHistory(app.internId, true);
      setHistoryData(
        data.filter(
          (h) =>
            h.applicationStatus === "COMPLETE" ||
            h.applicationStatus === "CANCEL",
        ),
      );
    } catch (error) {
      console.error("Failed to fetch student history:", error);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getHistoryStatusInfo = (status: AppStatusEnum) => {
    switch (status) {
      case "COMPLETE":
        return {
          label: "ฝึกงานเสร็จสิ้น",
          color: "bg-[#DCFAE6] text-[#085D3A] border-[#A9EFC5]",
        };
      case "CANCEL":
        return {
          label: "ยกเลิกฝึกงาน",
          color: "bg-red-50 text-red-600 border-red-200",
        };
      default:
        return {
          label: "กำลังดำเนินการ",
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        };
    }
  };

  const formatHistoryDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const beYear = d.getFullYear() + 543;
    const month = thaiMonths[d.getMonth()];
    const day = d.getDate();
    return `${day} ${month} ${beYear}`;
  };

  // Render right panel content for accepted near-start applications
  const renderRightPanelContent = () => {
    if (!selectedApplication) return null;

    const effectiveDetailed = getAcceptedEffectiveDetailed(selectedApplication);
    const isDocPassed =
      effectiveDetailed === "doc_passed" || effectiveDetailed === "completed";
    const isDocRejected = effectiveDetailed === "doc_rejected";
    const acceptedSubBadge = getAcceptedSubBadge(effectiveDetailed || "");
    const hasDocuments =
      selectedApplication.documents && selectedApplication.documents.length > 0;
    const hasAnalysisDocuments =
      selectedApplication.analysisDocuments &&
      selectedApplication.analysisDocuments.length > 0;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Name + buttons */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900">
            {selectedApplication.firstName} {selectedApplication.lastName}
          </h3>
          <div className="flex items-center gap-2">
            {/* History button */}
            <button
              onClick={() => {
                setShowHistoryModal(true);
                fetchApplicationHistory(selectedApplication);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18C6.9 18 5.04167 17.3625 3.425 16.0875C1.80833 14.8125 0.758333 13.1833 0.275 11.2C0.208333 10.95 0.258333 10.7208 0.425 10.5125C0.591667 10.3042 0.816667 10.1833 1.1 10.15C1.36667 10.1167 1.60833 10.1667 1.825 10.3C2.04167 10.4333 2.19167 10.6333 2.275 10.9C2.675 12.4 3.5 13.625 4.75 14.575C6 15.525 7.41667 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H5C5.28333 5 5.52083 5.09583 5.7125 5.2875C5.90417 5.47917 6 5.71667 6 6C6 6.28333 5.90417 6.52083 5.7125 6.7125C5.52083 6.90417 5.28333 7 5 7H1C0.716667 7 0.479167 6.90417 0.2875 6.7125C0.0958333 6.52083 0 6.28333 0 6V2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1C1.28333 1 1.52083 1.09583 1.7125 1.2875C1.90417 1.47917 2 1.71667 2 2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM10 8.6L12.5 11.1C12.6833 11.2833 12.775 11.5167 12.775 11.8C12.775 12.0833 12.6833 12.3167 12.5 12.5C12.3167 12.6833 12.0833 12.775 11.8 12.775C11.5167 12.775 11.2833 12.6833 11.1 12.5L8.3 9.7C8.2 9.6 8.125 9.4875 8.075 9.3625C8.025 9.2375 8 9.10833 8 8.975V5C8 4.71667 8.09583 4.47917 8.2875 4.2875C8.47917 4.09583 8.71667 4 9 4C9.28333 4 9.52083 4.09583 9.7125 4.2875C9.90417 4.47917 10 4.71667 10 5V8.6Z"
                  fill="currentColor"
                />
              </svg>
              ประวัติผู้สมัคร
            </button>
            {/* External link icon */}
            <Link
              href={`/owner/dashboard/${selectedApplication.id}?from=near-start${positionId ? `&positionId=${positionId}` : ""}`}
              className="p-2 text-gray-500 rounded-4xl hover:bg-gray-200 transition-colors"
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>
          </div>
        </div>
        {/* Status badges below name */}
        <div className="flex flex-wrap gap-1 mb-4">
          <span className="text-sm px-3 py-1 rounded-full bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]">
            รับเข้าฝึกงาน
          </span>
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${acceptedSubBadge.color}`}
          >
            {acceptedSubBadge.text}
          </span>
        </div>
        {/* Department */}
        <div className="flex items-center gap-2 text-gray-600 mb-4">
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
          <span className="text-sm">
            {selectedApplication.position ||
              selectedApplication.department ||
              "-"}
          </span>
        </div>
        {/* Near start warning */}
        {/* {selectedApplication.daysUntilStart !== undefined && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-amber-700 text-sm font-medium">
              ใกล้ถึงกำหนดเริ่มฝึกงาน ({selectedApplication.daysUntilStart} วัน)
            </span>
          </div>
        )} */}
        {/* Cancel button (full width) */}
        {isDocPassed && (
          <button
            onClick={() => {
              setCancelReason("");
              setShowCancelModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-600 border-2 border-red-600 text-white py-3 rounded-lg hover:bg-red-700 hover:text-white transition-colors font-medium mb-6 cursor-pointer"
          >
            <svg
              width="18"
              height="14"
              viewBox="0 0 18 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.4167 5.77083L14.25 6.91667C14.0972 7.06944 13.9063 7.14931 13.6771 7.15625C13.4479 7.16319 13.25 7.08333 13.0833 6.91667C12.9306 6.76389 12.8542 6.56944 12.8542 6.33333C12.8542 6.09722 12.9306 5.90278 13.0833 5.75L14.2292 4.58333L13.0833 3.4375C12.9306 3.28472 12.8542 3.09375 12.8542 2.86458C12.8542 2.63542 12.9306 2.4375 13.0833 2.27083C13.25 2.10417 13.4479 2.02083 13.6771 2.02083C13.9063 2.02083 14.1042 2.10417 14.2708 2.27083L15.4167 3.41667L16.5625 2.25C16.7153 2.08333 16.9062 2 17.1354 2C17.3646 2 17.5625 2.08333 17.7292 2.25C17.8958 2.41667 17.9792 2.61458 17.9792 2.84375C17.9792 3.07292 17.8958 3.27083 17.7292 3.4375L16.5833 4.58333L17.75 5.75C17.9167 5.91667 17.9965 6.11111 17.9896 6.33333C17.9826 6.55556 17.8958 6.75 17.7292 6.91667C17.5625 7.06944 17.3681 7.14931 17.1458 7.15625C16.9236 7.16319 16.7292 7.08333 16.5625 6.91667L15.4167 5.77083ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM0 11.6667V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V11.6667C13.3333 12.125 13.1701 12.5174 12.8438 12.8438C12.5174 13.1701 12.125 13.3333 11.6667 13.3333H1.66667C1.20833 13.3333 0.815972 13.1701 0.489583 12.8438C0.163194 12.5174 0 12.125 0 11.6667ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z"
                fill="CurrentColor"
              />
            </svg>
            ยกเลิกฝึกงาน
          </button>
        )}
        {/* Training period card */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            ข้อมูลผู้สมัคร
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">ระยะเวลาการฝึกงาน</span>
                <p className="text-gray-900 text-sm">
                  {formatDateThai(selectedApplication.startDate)} -{" "}
                  {formatDateThai(selectedApplication.endDate)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">ชั่วโมงที่ต้องฝึก</span>
                <p className="text-gray-900 text-sm">
                  {selectedApplication.trainingHours} ชั่วโมง
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">อีเมล</span>
                <p className="text-gray-900 text-sm">
                  {selectedApplication.email}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">เพศ</span>
                <p className="text-gray-900 text-sm">
                  {selectedApplication.gender === "male" ? "ชาย" : "หญิง"}
                </p>
              </div>
            </div>

            <div>
              <span className="text-gray-500 text-sm">เบอร์โทร</span>
              <p className="text-gray-900 text-sm">
                {selectedApplication.phone}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">การศึกษาปัจจุบัน</span>
                <p className="text-gray-900 text-sm">มหาวิทยาลัย</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">ชื่อสถาบัน</span>
                <p className="text-gray-900 text-sm">
                  {selectedApplication.institution}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">คณะ</span>
                <p className="text-gray-900 text-sm">
                  {selectedApplication.faculty || "-"}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">สาขา</span>
                <p className="text-gray-900 text-sm">
                  {selectedApplication.major}
                </p>
              </div>
            </div>

            <div>
              <span className="text-gray-500 text-sm">
                ทักษะด้านต่าง ๆ ของผู้สมัคร
              </span>
              <p className="text-gray-900 text-sm">
                {selectedApplication?.skill || "-"}
              </p>
            </div>

            <div>
              <span className="text-gray-500 text-sm">
                สิ่งที่คาดหวังจากการฝึกงาน
              </span>
              <p className="text-gray-900 text-sm">
                {selectedApplication.expectation}
              </p>
            </div>
          </div>
        </div>
        {/* เอกสารแนบ */}
        <div className="mb-6">
          <h4 className="text-md font-bold text-gray-900 mb-3">เอกสารแนบ</h4>
          {hasDocuments ? (
            <div className="space-y-2">
              {selectedApplication.documents.map((doc, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      width="16"
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
                    <span className="text-gray-700 text-sm">{doc.name}</span>
                  </div>
                  <button className="p-2 text-gray-400 group-hover:text-primary-600 transition-colors">
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="group flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-600 transition-colors">
              <div className="flex items-center gap-3">
                <svg
                  width="16"
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
                <span className="text-gray-400">ยังไม่มีเอกสารแนบ</span>
              </div>
            </div>
          )}
        </div>
        {/* เอกสารแนบเพิ่ม */}
        <div className="mb-6">
          <h4 className="text-md font-bold text-gray-900 mb-3">
            เอกสารแนบเพิ่ม
          </h4>
          {hasAnalysisDocuments ? (
            <div className="space-y-2">
              {selectedApplication.analysisDocuments?.map((doc, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      width="16"
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
                    <span className="text-gray-700 text-sm">
                      เอกสารขอความอนุเคราะห์.PDF
                    </span>
                  </div>
                  <button className="p-2 text-gray-400 group-hover:text-primary-600 transition-colors">
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="group flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-600 transition-colors">
              <div className="flex items-center gap-3">
                <svg
                  width="16"
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
                <span className="text-gray-400">ยังไม่มีเอกสารแนบ</span>
              </div>
            </div>
          )}
        </div>
        {/* เหตุผลที่เอกสารไม่ผ่าน */}
        {isDocRejected && selectedApplication.rejectionReason && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              เหตุผลที่เอกสารไม่ผ่าน
            </h4>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-red-500 text-sm">
                {selectedApplication.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* Status Progress Dropdown */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            className="w-full flex items-center justify-between py-3 cursor-pointer"
          >
            <span className="text-md font-semibold text-gray-900">
              สถานะการดำเนินการ
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showAdditionalInfo ? "rotate-180" : ""}`}
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
          {/* Summary: circular progress + status text */}
          {(() => {
            const totalSteps = 5;
            const detailed = selectedApplication.detailedStatus;
            let completedSteps = 0;
            if (detailed === "doc_passed" || detailed === "completed") {
              completedSteps = 5;
            } else if (
              detailed === "doc_sent" ||
              detailed === "waiting_send_doc"
            ) {
              completedSteps = 4;
            } else if (detailed === "doc_rejected") {
              completedSteps = 3;
            } else {
              completedSteps = 3;
            }
            const currentStepLabel = [
              "รอผู้สมัครยื่นเอกสาร",
              "รอสัมภาษณ์",
              "รอการยืนยัน",
              "รอผู้สมัครยื่นเอกสารขอความอนุเคราะห์",
              "รอ HR ตรวจสอบ",
            ];
            const isAllCompleted = completedSteps >= totalSteps;
            const currentStepIndex = isAllCompleted
              ? totalSteps - 1
              : completedSteps;
            const nextStepLabel =
              currentStepIndex + 1 < totalSteps && !isAllCompleted
                ? currentStepLabel[currentStepIndex + 1]
                : null;
            const circumference = 2 * Math.PI * 36;
            const progress = (completedSteps / totalSteps) * circumference;

            // Get summary text from real action data
            const summaryStepStatusMap: AppStatusEnum[] = [
              "PENDING_INTERVIEW",
              "PENDING_CONFIRMATION",
              "PENDING_REQUEST",
              "PENDING_REVIEW",
              "COMPLETE",
            ];
            const fmtDate = (dateStr: string): string => {
              const d = new Date(dateStr);
              const mo = [
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
              return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear() + 543} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            };
            const fmtActor = (
              action: ApplicationStatusAction,
            ): string | undefined => {
              if (!action.actor) return undefined;
              const { fname, lname, roleId } = action.actor;
              if (roleId === 3 || (!fname && !lname)) return undefined;
              return `พนักงาน : ${[fname, lname].filter(Boolean).join(" ")}`;
            };
            const stepCompletedInfo: { date: string; operator?: string }[] =
              summaryStepStatusMap.map((targetStatus) => {
                const action = timelineActions.find(
                  (a) => a.newStatus === targetStatus,
                );
                if (!action) return { date: "" };
                return {
                  date: fmtDate(action.createdAt),
                  operator: fmtActor(action),
                };
              });

            return (
              <div className="flex items-center gap-5 mb-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#E5E7EB"
                      strokeWidth="5"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#A80689"
                      strokeWidth="5"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - progress}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-700">
                    {completedSteps}/{totalSteps}
                  </span>
                </div>
                <div>
                  {isAllCompleted ? (
                    <>
                      <p className="font-bold text-gray-900">
                        การตรวจสอบเสร็จสิ้น
                      </p>
                      {stepCompletedInfo[4]?.operator && (
                        <p className="text-gray-400 text-sm">
                          {stepCompletedInfo[4].operator}
                        </p>
                      )}
                      <p className="text-gray-400 text-sm">
                        {stepCompletedInfo[4]?.date}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-gray-900">
                        {currentStepLabel[currentStepIndex]}
                      </p>
                      {stepCompletedInfo[currentStepIndex - 1]?.date && (
                        <p className="text-gray-400 text-sm">
                          {stepCompletedInfo[currentStepIndex - 1].date}
                        </p>
                      )}
                      {stepCompletedInfo[currentStepIndex - 1]?.operator && (
                        <p className="text-gray-400 text-sm">
                          {stepCompletedInfo[currentStepIndex - 1].operator}
                        </p>
                      )}
                      <p className="text-gray-400 text-sm">กำลังดำเนินการ</p>
                      {nextStepLabel && (
                        <p className="text-gray-400 text-sm">
                          ขั้นตอนถัดไป : {nextStepLabel}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}
          {/* Expandable Timeline */}
          {showAdditionalInfo && (
            <div className="pb-2">
              {renderStatusTimeline(selectedApplication)}
            </div>
          )}
        </div>

        {/* Mentor Info Dropdown */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowMentorInfo(!showMentorInfo)}
            className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">ข้อมูลพี่เลี้ยง</span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showMentorInfo ? "rotate-180" : ""}`}
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
          {showMentorInfo && (
            <div className="pb-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 mt-0.5 shrink-0"
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
                  <div>
                    <p className="text-gray-400 text-sm">ชื่อพี่เลี้ยง</p>
                    <p className="font-medium text-gray-900">
                      {selectedApplication?.mentors?.[0]
                        ? `${selectedApplication.mentors[0].fname || ""} ${selectedApplication.mentors[0].lname || ""}`.trim()
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 mt-0.5 shrink-0"
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
                  <div>
                    <p className="text-gray-400 text-sm">อีเมล</p>
                    <p className="font-medium text-gray-900">
                      {selectedApplication?.mentors?.[0]?.email || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 mt-0.5 shrink-0"
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
                  <div>
                    <p className="text-gray-400 text-sm">เบอร์โทร</p>
                    <p className="font-medium text-gray-900">
                      {selectedApplication?.mentors?.[0]?.phone || "-"}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-red-500 text-sm mt-3">
                *หมายเหตุ: หากประสงค์ให้ลงนามในเอกสารตอบรับกรุณาติดต่อพี่เลี้ยง
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render status timeline
  const renderStatusTimeline = (app: Application) => {
    let completedUpTo = 0;
    let currentStep = 0;

    const effDetailed = getAcceptedEffectiveDetailed(app);
    if (effDetailed === "doc_passed" || effDetailed === "completed") {
      completedUpTo = 5;
    } else if (
      effDetailed === "doc_sent" ||
      effDetailed === "waiting_send_doc"
    ) {
      completedUpTo = 4;
      currentStep = 5;
    } else if (effDetailed === "doc_rejected") {
      completedUpTo = 3;
      currentStep = 4;
    } else {
      completedUpTo = 3;
      currentStep = 4;
    }

    const stepLabels = [
      "รอยื่นเอกสาร",
      "รอสัมภาษณ์",
      "รอการยืนยัน",
      "รอยื่นเอกสารขอความอนุเคราะห์",
      "รอ HR ตรวจสอบ",
    ];

    const stepStatusMap: AppStatusEnum[] = [
      "PENDING_INTERVIEW",
      "PENDING_CONFIRMATION",
      "PENDING_REQUEST",
      "PENDING_REVIEW",
      "COMPLETE",
    ];
    const formatActionDate = (dateStr: string): string => {
      const d = new Date(dateStr);
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
      const beYear = d.getFullYear() + 543;
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${d.getDate()} ${thaiShortMonths[d.getMonth()]} ${beYear} ${hours}:${minutes}`;
    };
    const getActorLabel = (
      action: ApplicationStatusAction,
    ): string | undefined => {
      if (!action.actor) return undefined;
      const { fname, lname, roleId } = action.actor;
      if (roleId === 3 || (!fname && !lname)) return undefined;
      return `พนักงาน : ${[fname, lname].filter(Boolean).join(" ")}`;
    };
    const stepCompletedInfo: { date: string; operator?: string }[] =
      stepStatusMap.map((targetStatus) => {
        const action = timelineActions.find(
          (a) => a.newStatus === targetStatus,
        );
        if (!action) return { date: "" };
        return {
          date: formatActionDate(action.createdAt),
          operator: getActorLabel(action),
        };
      });

    return (
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          สถานะการดำเนินการ
        </h3>
        <div className="relative">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum <= completedUpTo;
            const isCurrent = stepNum === currentStep;
            const isLast = index === stepLabels.length - 1;

            return (
              <div key={index} className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full bg-[#A80689] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
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
                  ) : isCurrent ? (
                    <div className="w-8 h-8 rounded-full border-[3px] border-[#A80689] bg-white shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  )}
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-6 ${isCompleted ? "bg-[#A80689]" : "bg-gray-200"}`}
                    />
                  )}
                </div>
                <div className={`${isLast ? "pb-0" : "pb-6"} pt-1`}>
                  <p
                    className={`font-bold text-sm ${isCompleted || isCurrent ? "text-[#A80689]" : "text-gray-400"}`}
                  >
                    {label}
                  </p>
                  {isCompleted && stepCompletedInfo[index] && (
                    <>
                      {stepCompletedInfo[index].operator && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {stepCompletedInfo[index].operator}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-0.5">
                        {stepCompletedInfo[index].date}
                      </p>
                    </>
                  )}
                  {isCurrent && (
                    <p className="text-gray-400 text-xs mt-0.5">
                      กำลังดำเนินการ
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OwnerNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-2">
          <Link
            href="/owner/dashboard"
            className="text-gray-500 hover:text-primary-600"
          >
            ประกาศรับสมัครอยู่
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-primary-600 font-medium">
            รายละเอียดผู้สมัครใกล้เริ่มฝึกงาน
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-black mt-2">
          ใบสมัครที่ใกล้เริ่มฝึกงาน
        </h1>
        <p className="text-gray-500 mt-1 mb-4">
          ผู้สมัครที่ใกล้ถึงกำหนดเริ่มฝึกงาน {filteredApplications.length}{" "}
          รายการ
        </p>

        {/* Search & Filter Section */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 ">
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
                              .includes(institutionSearch.trim().toLowerCase()),
                          )
                        : schools;
                      const isExpanded = expandedCategories.includes(cat.id);

                      return (
                        <div key={cat.id}>
                          <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-pink-100 rounded-lg">
                            <div
                              className="flex items-center gap-3 flex-1"
                              onClick={() => handleInstitutionToggle(cat.id)}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Applications List */}
          <div className="space-y-4">
            {paginatedApplications.length > 0 ? (
              paginatedApplications.map((app) => {
                const effectiveDetailed = getAcceptedEffectiveDetailed(app);
                const acceptedSubBadge = getAcceptedSubBadge(
                  effectiveDetailed || "",
                );

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApplication(app)}
                    className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      selectedApplication?.id === app.id
                        ? "border-primary-600 shadow-md"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {app.daysUntilStart !== undefined && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1.5 bg-[#FEF0C7] border border-[#FEDF89] text-[#7A2E0E] px-3 py-1 rounded-full text-sm">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10 15C10.2833 15 10.5208 14.9042 10.7125 14.7125C10.9042 14.5208 11 14.2833 11 14V10C11 9.71667 10.9042 9.47917 10.7125 9.2875C10.5208 9.09583 10.2833 9 10 9C9.71667 9 9.47917 9.09583 9.2875 9.2875C9.09583 9.47917 9 9.71667 9 10V14C9 14.2833 9.09583 14.5208 9.2875 14.7125C9.47917 14.9042 9.71667 15 10 15ZM10 7C10.2833 7 10.5208 6.90417 10.7125 6.7125C10.9042 6.52083 11 6.28333 11 6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6C9 6.28333 9.09583 6.52083 9.2875 6.7125C9.47917 6.90417 9.71667 7 10 7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z"
                              fill="#7A2E0E"
                            />
                          </svg>
                          ใกล้ถึงกำหนดเริ่มฝึกงาน ({app.daysUntilStart} วัน)
                        </div>
                      </div>
                    )}
                    <div className="mb-1">
                      <span className="font-semibold text-gray-900">
                        {app.firstName} {app.lastName}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {/* Position row */}
                      <div className="flex items-center gap-2">
                        <svg
                          width="14"
                          height="13"
                          viewBox="0 0 20 19"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM2 17H18V6H2V17ZM8 4H12V2H8V4Z"
                            fill="#A80689"
                          />
                        </svg>
                        {app.position || app.department || "-"}
                      </div>
                      {/* Department row */}
                      {/* <div className="flex items-center gap-2">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1.33333 12C0.966667 12 0.652778 11.8694 0.391667 11.6083C0.130556 11.3472 0 11.0333 0 10.6667V4C0 3.63333 0.130556 3.31944 0.391667 3.05833C0.652778 2.79722 0.966667 2.66667 1.33333 2.66667H2.66667V1.33333C2.66667 0.966667 2.79722 0.652778 3.05833 0.391667C3.31944 0.130556 3.63333 0 4 0H8C8.36667 0 8.68056 0.130556 8.94167 0.391667C9.20278 0.652778 9.33333 0.966667 9.33333 1.33333V5.33333H10.6667C11.0333 5.33333 11.3472 5.46389 11.6083 5.725C11.8694 5.98611 12 6.3 12 6.66667V10.6667C12 11.0333 11.8694 11.3472 11.6083 11.6083C11.3472 11.8694 11.0333 12 10.6667 12H6.66667V9.33333H5.33333V12H1.33333ZM1.33333 10.6667H2.66667V9.33333H1.33333V10.6667ZM1.33333 8H2.66667V6.66667H1.33333V8ZM1.33333 5.33333H2.66667V4H1.33333V5.33333ZM4 8H5.33333V6.66667H4V8ZM4 5.33333H5.33333V4H4V5.33333ZM4 2.66667H5.33333V1.33333H4V2.66667ZM6.66667 8H8V6.66667H6.66667V8ZM6.66667 5.33333H8V4H6.66667V5.33333ZM6.66667 2.66667H8V1.33333H6.66667V2.66667ZM9.33333 10.6667H10.6667V9.33333H9.33333V10.6667ZM9.33333 8H10.6667V6.66667H9.33333V8Z"
                            fill="#A80689"
                          />
                        </svg>

                        {app.department}
                      </div> */}
                      <div className="flex items-center gap-2">
                        <svg
                          width="14"
                          height="12"
                          viewBox="0 0 14 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2.65 9.66667C2.42778 9.54445 2.25556 9.38056 2.13333 9.175C2.01111 8.96944 1.95 8.73889 1.95 8.48333V5.28333L0.35 4.4C0.227778 4.33333 0.138889 4.25 0.0833333 4.15C0.0277778 4.05 0 3.93889 0 3.81667C0 3.69444 0.0277778 3.58333 0.0833333 3.48333C0.138889 3.38333 0.227778 3.3 0.35 3.23333L5.98333 0.166667C6.08333 0.111111 6.18611 0.0694444 6.29167 0.0416667C6.39722 0.0138889 6.50556 0 6.61667 0C6.72778 0 6.83611 0.0138889 6.94167 0.0416667C7.04722 0.0694444 7.15 0.111111 7.25 0.166667L13.6 3.63333C13.7111 3.68889 13.7972 3.76944 13.8583 3.875C13.9194 3.98056 13.95 4.09444 13.95 4.21667V8.48333C13.95 8.67222 13.8861 8.83056 13.7583 8.95833C13.6306 9.08611 13.4722 9.15 13.2833 9.15C13.0944 9.15 12.9361 9.08611 12.8083 8.95833C12.6806 8.83056 12.6167 8.67222 12.6167 8.48333V4.55L11.2833 5.28333V8.48333C11.2833 8.73889 11.2222 8.96944 11.1 9.175C10.9778 9.38056 10.8056 9.54445 10.5833 9.66667L7.25 11.4667C7.15 11.5222 7.04722 11.5639 6.94167 11.5917C6.83611 11.6194 6.72778 11.6333 6.61667 11.6333C6.50556 11.6333 6.39722 11.6194 6.29167 11.5917C6.18611 11.5639 6.08333 11.5222 5.98333 11.4667L2.65 9.66667ZM6.61667 6.28333L11.1833 3.81667L6.61667 1.35L2.05 3.81667L6.61667 6.28333ZM6.61667 10.3L9.95 8.5V5.98333L7.26667 7.46667C7.16667 7.52222 7.06111 7.56389 6.95 7.59167C6.83889 7.61944 6.72778 7.63333 6.61667 7.63333C6.50556 7.63333 6.39445 7.61944 6.28333 7.59167C6.17222 7.56389 6.06667 7.52222 5.96667 7.46667L3.28333 5.98333V8.5L6.61667 10.3Z"
                            fill="#A80689"
                          />
                        </svg>

                        {app.institution}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1.33333 4H10.6667V2.66667H1.33333V4ZM1.33333 13.3333C0.966667 13.3333 0.652778 13.2028 0.391667 12.9417C0.130556 12.6806 0 12.3667 0 12V2.66667C0 2.3 0.130556 1.98611 0.391667 1.725C0.652778 1.46389 0.966667 1.33333 1.33333 1.33333H2V0.666667C2 0.477778 2.06389 0.319444 2.19167 0.191667C2.31944 0.0638889 2.47778 0 2.66667 0C2.85556 0 3.01389 0.0638889 3.14167 0.191667C3.26944 0.319444 3.33333 0.477778 3.33333 0.666667V1.33333H8.66667V0.666667C8.66667 0.477778 8.73056 0.319444 8.85833 0.191667C8.98611 0.0638889 9.14444 0 9.33333 0C9.52222 0 9.68056 0.0638889 9.80833 0.191667C9.93611 0.319444 10 0.477778 10 0.666667V1.33333H10.6667C11.0333 1.33333 11.3472 1.46389 11.6083 1.725C11.8694 1.98611 12 2.3 12 2.66667V5.78333C12 5.97222 11.9361 6.13056 11.8083 6.25833C11.6806 6.38611 11.5222 6.45 11.3333 6.45C11.1444 6.45 10.9861 6.38611 10.8583 6.25833C10.7306 6.13056 10.6667 5.97222 10.6667 5.78333V5.33333H1.33333V12H5.2C5.38889 12 5.54722 12.0639 5.675 12.1917C5.80278 12.3194 5.86667 12.4778 5.86667 12.6667C5.86667 12.8556 5.80278 13.0139 5.675 13.1417C5.54722 13.2694 5.38889 13.3333 5.2 13.3333H1.33333ZM10 14C9.07778 14 8.29167 13.675 7.64167 13.025C6.99167 12.375 6.66667 11.5889 6.66667 10.6667C6.66667 9.74444 6.99167 8.95833 7.64167 8.30833C8.29167 7.65833 9.07778 7.33333 10 7.33333C10.9222 7.33333 11.7083 7.65833 12.3583 8.30833C13.0083 8.95833 13.3333 9.74444 13.3333 10.6667C13.3333 11.5889 13.0083 12.375 12.3583 13.025C11.7083 13.675 10.9222 14 10 14ZM10.3333 10.5333V9C10.3333 8.91111 10.3 8.83333 10.2333 8.76667C10.1667 8.7 10.0889 8.66667 10 8.66667C9.91111 8.66667 9.83333 8.7 9.76667 8.76667C9.7 8.83333 9.66667 8.91111 9.66667 9V10.5167C9.66667 10.6056 9.68333 10.6917 9.71667 10.775C9.75 10.8583 9.8 10.9333 9.86667 11L10.8833 12.0167C10.95 12.0833 11.0278 12.1167 11.1167 12.1167C11.2056 12.1167 11.2833 12.0833 11.35 12.0167C11.4167 11.95 11.45 11.8722 11.45 11.7833C11.45 11.6944 11.4167 11.6167 11.35 11.55L10.3333 10.5333Z"
                            fill="#A80689"
                          />
                        </svg>
                        ระยะเวลาการฝึกงาน: {formatDateThai(app.startDate)} -{" "}
                        {formatDateThai(app.endDate)}
                      </div>
                    </div>

                    {/* Step Progress */}
                    <div className="mt-2 pt-2">
                      <div className="flex items-center gap-2 bg-primary-50 border border-primary-600 rounded-lg px-3 py-2">
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
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-primary-600 text-sm">
                          ขั้นตอนที่ {app.step} -
                        </span>
                        <span className="text-primary-600 text-sm">
                          {app.stepDescription}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <img
                    src="/images/NoFound.png"
                    alt="ไม่พบใบสมัคร"
                    className="w-40 h-40 object-contain opacity-80"
                  />
                  <p className="text-gray-700 font-semibold text-base mt-2">
                    ไม่พบใบสมัคร
                  </p>
                  <p className="text-gray-400 text-sm">
                    ขณะนี้ยังไม่มีผู้สมัครสำหรับประกาศนี้
                    <br />
                    กรุณาตรวจสอบอีกครั้งภายหลัง
                  </p>
                </div>
              </div>
            )}

            {/* Pagination */}
            {filteredApplications.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  แสดง {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredApplications.length,
                  )}{" "}
                  จากทั้งหมด {filteredApplications.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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

                  {Array.from(
                    { length: Math.min(10, totalPages) },
                    (_, i) => i + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? "bg-primary-600 text-white"
                          : "border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
              </div>
            )}
          </div>

          {/* Right Column: Application Detail */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            {selectedApplication ? (
              renderRightPanelContent()
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">เลือกใบสมัครเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Internship Modal */}
      {showCancelModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 18 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.4167 5.77083L14.25 6.91667C14.0972 7.06944 13.9063 7.14931 13.6771 7.15625C13.4479 7.16319 13.25 7.08333 13.0833 6.91667C12.9306 6.76389 12.8542 6.56944 12.8542 6.33333C12.8542 6.09722 12.9306 5.90278 13.0833 5.75L14.2292 4.58333L13.0833 3.4375C12.9306 3.28472 12.8542 3.09375 12.8542 2.86458C12.8542 2.63542 12.9306 2.4375 13.0833 2.27083C13.25 2.10417 13.4479 2.02083 13.6771 2.02083C13.9063 2.02083 14.1042 2.10417 14.2708 2.27083L15.4167 3.41667L16.5625 2.25C16.7153 2.08333 16.9062 2 17.1354 2C17.3646 2 17.5625 2.08333 17.7292 2.25C17.8958 2.41667 17.9792 2.61458 17.9792 2.84375C17.9792 3.07292 17.8958 3.27083 17.7292 3.4375L16.5833 4.58333L17.75 5.75C17.9167 5.91667 17.9965 6.11111 17.9896 6.33333C17.9826 6.55556 17.8958 6.75 17.7292 6.91667C17.5625 7.06944 17.3681 7.14931 17.1458 7.15625C16.9236 7.16319 16.7292 7.08333 16.5625 6.91667L15.4167 5.77083ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM0 11.6667V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V11.6667C13.3333 12.125 13.1701 12.5174 12.8438 12.8438C12.5174 13.1701 12.125 13.3333 11.6667 13.3333H1.66667C1.20833 13.3333 0.815972 13.1701 0.489583 12.8438C0.163194 12.5174 0 12.125 0 11.6667ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z"
                    fill="#F04438"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ยกเลิกการฝึกงาน
                </h3>
                <p className="text-gray-500 text-sm">
                  คุณกำลังดำเนินการยกเลิกฝึกงานของ
                  <br />
                  <span className="font-semibold text-gray-900">
                    {selectedApplication.firstName}{" "}
                    {selectedApplication.lastName}
                  </span>{" "}
                  กรุณาระบุเหตุผลเพื่อให้ผู้สมัครทราบ
                </p>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                เหตุผลประกอบการยกเลิกฝึกงาน{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="กรุณาระบุเหตุผลที่ชัดเจน..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (cancelReason.trim()) setShowCancelConfirm(true);
                }}
                disabled={!cancelReason.trim()}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                ยืนยันการยกเลิกฝึกงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Internship Confirmation Modal */}
      {showCancelConfirm && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 text-center">
            <div className="flex justify-center mb-4">
              <svg
                width="48"
                height="48"
                viewBox="0 0 34 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.6667 19L21.5 23.8333C21.8056 24.1389 22.1944 24.2917 22.6667 24.2917C23.1389 24.2917 23.5278 24.1389 23.8333 23.8333C24.1389 23.5278 24.2917 23.1389 24.2917 22.6667C24.2917 22.1944 24.1389 21.8056 23.8333 21.5L19 16.6667L23.8333 11.8333C24.1389 11.5278 24.2917 11.1389 24.2917 10.6667C24.2917 10.1944 24.1389 9.80556 23.8333 9.5C23.5278 9.19444 23.1389 9.04167 22.6667 9.04167C22.1944 9.04167 21.8056 9.19444 21.5 9.5L16.6667 14.3333L11.8333 9.5C11.5278 9.19444 11.1389 9.04167 10.6667 9.04167C10.1944 9.04167 9.80556 9.19444 9.5 9.5C9.19444 9.80556 9.04167 10.1944 9.04167 10.6667C9.04167 11.1389 9.19444 11.5278 9.5 11.8333L14.3333 16.6667L9.5 21.5C9.19444 21.8056 9.04167 22.1944 9.04167 22.6667C9.04167 23.1389 9.19444 23.5278 9.5 23.8333C9.80556 24.1389 10.1944 24.2917 10.6667 24.2917C11.1389 24.2917 11.5278 24.1389 11.8333 23.8333L16.6667 19ZM16.6667 33.3333C14.3611 33.3333 12.1944 32.8958 10.1667 32.0208C8.13889 31.1458 6.375 29.9583 4.875 28.4583C3.375 26.9583 2.1875 25.1944 1.3125 23.1667C0.4375 21.1389 0 18.9722 0 16.6667C0 14.3611 0.4375 12.1944 1.3125 10.1667C2.1875 8.13889 3.375 6.375 4.875 4.875C6.375 3.375 8.13889 2.1875 10.1667 1.3125C12.1944 0.4375 14.3611 0 16.6667 0C18.9722 0 21.1389 0.4375 23.1667 1.3125C25.1944 2.1875 26.9583 3.375 28.4583 4.875C29.9583 6.375 31.1458 8.13889 32.0208 10.1667C32.8958 12.1944 33.3333 14.3611 33.3333 16.6667C33.3333 18.9722 32.8958 21.1389 32.0208 23.1667C31.1458 25.1944 29.9583 26.9583 28.4583 28.4583C26.9583 29.9583 25.1944 31.1458 23.1667 32.0208C21.1389 32.8958 18.9722 33.3333 16.6667 33.3333Z"
                  fill="#F04438"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ยืนยันการยกเลิกฝึกงาน?
            </h3>
            <p className="text-gray-600 mb-6">
              คุณต้องการยกเลิกการฝึกงาน ของ{" "}
              <span className="font-semibold">
                {selectedApplication.firstName} {selectedApplication.lastName}
              </span>{" "}
              ใช่หรือไม่?
              <br />
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer font-medium"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={() => {
                  const existingCancelled = (() => {
                    try {
                      const stored = localStorage.getItem("pea_cancelled_apps");
                      return stored ? JSON.parse(stored) : [];
                    } catch {
                      return [];
                    }
                  })();
                  const today = new Date();
                  const buddhistYear = today.getFullYear() + 543;
                  const month = String(today.getMonth() + 1).padStart(2, "0");
                  const day = String(today.getDate()).padStart(2, "0");
                  const cancelDate = `${buddhistYear}-${month}-${day}`;
                  if (
                    !existingCancelled.find(
                      (c: { id: string }) => c.id === selectedApplication.id,
                    )
                  ) {
                    existingCancelled.push({
                      id: selectedApplication.id,
                      reason: cancelReason,
                      cancelledBy: "เจ้าของหน่วยงาน",
                      cancelledDate: cancelDate,
                    });
                    localStorage.setItem(
                      "pea_cancelled_apps",
                      JSON.stringify(existingCancelled),
                    );
                    setCancelledAppsData(existingCancelled);
                  }
                  setShowCancelConfirm(false);
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer font-medium"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Application History Modal */}
      {showHistoryModal &&
        selectedApplication &&
        (() => {
          return (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
              onClick={() => setShowHistoryModal(false)}
            >
              <div
                className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-full">
                      <svg
                        className="w-6 h-6 text-primary-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        ประวัติการสมัคร
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedApplication.firstName}{" "}
                        {selectedApplication.lastName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
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
                <div className="overflow-y-auto flex-1">
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
                      <p className="text-gray-500 text-sm">
                        กำลังโหลดประวัติ...
                      </p>
                    </div>
                  ) : historyData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <img
                        src="/images/NoFound.png"
                        alt="ไม่มีประวัติการสมัคร"
                        className="w-40 h-40 object-contain opacity-80 mb-4"
                      />
                      <h3 className="text-lg font-semibold text-gray-500 mb-1">
                        ไม่มีประวัติการสมัคร
                      </h3>
                      <p className="text-gray-400 text-center text-sm leading-relaxed">
                        ผู้สมัครรายนี้ยังไม่เคย
                        <br />
                        สมัครฝึกงานผ่านระบบนี้
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
                      {historyData.map((item) => {
                        const statusInfo = getHistoryStatusInfo(
                          item.applicationStatus,
                        );
                        return (
                          <div key={item.applicationId}>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M3.75 6H14.25V4.5H3.75V6ZM3.75 16.5C3.3375 16.5 2.98438 16.3531 2.69063 16.0594C2.39688 15.7656 2.25 15.4125 2.25 15V4.5C2.25 4.0875 2.39688 3.73438 2.69063 3.44063C2.98438 3.14688 3.3375 3 3.75 3H4.5V2.25C4.5 2.0375 4.57188 1.85938 4.71563 1.71562C4.85938 1.57187 5.0375 1.5 5.25 1.5C5.4625 1.5 5.64062 1.57187 5.78438 1.71562C5.92813 1.85938 6 2.0375 6 2.25V3H12V2.25C12 2.0375 12.0719 1.85938 12.2156 1.71562C12.3594 1.57187 12.5375 1.5 12.75 1.5C12.9625 1.5 13.1406 1.57187 13.2844 1.71562C13.4281 1.85938 13.5 2.0375 13.5 2.25V3H14.25C14.6625 3 15.0156 3.14688 15.3094 3.44063C15.6031 3.73438 15.75 4.0875 15.75 4.5V8.00625C15.75 8.21875 15.6781 8.39687 15.5344 8.54062C15.3906 8.68437 15.2125 8.75625 15 8.75625C14.7875 8.75625 14.6094 8.68437 14.4656 8.54062C14.3219 8.39687 14.25 8.21875 14.25 8.00625V7.5H3.75V15H8.1C8.3125 15 8.49062 15.0719 8.63437 15.2156C8.77812 15.3594 8.85 15.5375 8.85 15.75C8.85 15.9625 8.77812 16.1406 8.63437 16.2844C8.49062 16.4281 8.3125 16.5 8.1 16.5H3.75ZM13.5 17.25C12.4625 17.25 11.5781 16.8844 10.8469 16.1531C10.1156 15.4219 9.75 14.5375 9.75 13.5C9.75 12.4625 10.1156 11.5781 10.8469 10.8469C11.5781 10.1156 12.4625 9.75 13.5 9.75C14.5375 9.75 15.4219 10.1156 16.1531 10.8469C16.8844 11.5781 17.25 12.4625 17.25 13.5C17.25 14.5375 16.8844 15.4219 16.1531 16.1531C15.4219 16.8844 14.5375 17.25 13.5 17.25ZM13.875 13.35V11.625C13.875 11.525 13.8375 11.4375 13.7625 11.3625C13.6875 11.2875 13.6 11.25 13.5 11.25C13.4 11.25 13.3125 11.2875 13.2375 11.3625C13.1625 11.4375 13.125 11.525 13.125 11.625V13.3313C13.125 13.4313 13.1438 13.5281 13.1812 13.6219C13.2188 13.7156 13.275 13.8 13.35 13.875L14.4938 15.0187C14.5688 15.0938 14.6563 15.1313 14.7563 15.1313C14.8563 15.1313 14.9437 15.0938 15.0187 15.0187C15.0938 14.9437 15.1313 14.8563 15.1313 14.7563C15.1313 14.6563 15.0938 14.5688 15.0187 14.4938L13.875 13.35Z"
                                      fill="#98A2B3"
                                    />
                                  </svg>
                                  <span>
                                    {formatHistoryDate(item.createdAt)}
                                  </span>
                                </div>
                                <span
                                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusInfo.color}`}
                                >
                                  {statusInfo.label}
                                </span>
                              </div>
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {item.positionName || "ตำแหน่งไม่ระบุ"}
                              </h4>
                              <p className="text-sm text-gray-500">
                                รอบที่ {item.internshipRound}
                              </p>
                            </div>
                            {item.statusNote && (
                              <div className="mx-4 mb-4 rounded-xl bg-red-50 overflow-hidden">
                                <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M10 15C10.2833 15 10.5208 14.9042 10.7125 14.7125C10.9042 14.5208 11 14.2833 11 14V10C11 9.71667 10.9042 9.47917 10.7125 9.2875C10.5208 9.09583 10.2833 9 10 9C9.71667 9 9.47917 9.09583 9.2875 9.2875C9.09583 9.47917 9 9.71667 9 10V14C9 14.2833 9.09583 14.5208 9.2875 14.7125C9.47917 14.9042 9.71667 15 10 15ZM10 7C10.2833 7 10.5208 6.90417 10.7125 6.7125C10.9042 6.52083 11 6.28333 11 6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6C9 6.28333 9.09583 6.52083 9.2875 6.7125C9.47917 6.90417 9.71667 7 10 7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20Z"
                                      fill="#D92D20"
                                    />
                                  </svg>
                                  <span className="text-sm font-semibold text-red-500">
                                    {item.applicationStatus === "CANCEL"
                                      ? "เหตุผลประกอบการยกเลิกฝึกงาน"
                                      : "หมายเหตุ"}
                                  </span>
                                </div>
                                <div className="mx-4 border-t border-red-200" />
                                <div className="px-4 pt-3 pb-4">
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {item.statusNote}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

export default function NearStartApplicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <NearStartApplicationsContent />
    </Suspense>
  );
}
