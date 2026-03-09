"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import OwnerNavbar from "../../../components/ui/OwnerNavbar";
import VideoLoading from "../../../components/ui/VideoLoading";
import {
  Application,
  FilterTab,
  getDetailedStatusLabel,
  type ApplicationStatus,
  type DetailedStatus,
} from "../../../data/mockApplications";
import {
  applicationApi,
  applicationStatusActionsApi,
  positionApi,
  type ApplicationStatusAction,
  type Position,
  type AllStudentsHistoryItem,
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

// Format date to Thai format (dates in mock data are already in Buddhist Era format YYYY-MM-DD)
const formatDateThai = (dateString: string): string => {
  if (!dateString) return "";
  // Parse the date string directly since it's in BE format (YYYY-MM-DD)
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // 0-indexed
  const day = parseInt(parts[2]);
  return `${day} ${thaiMonths[month]} ${year}`;
};

// LocalStorage keys
const STORAGE_KEYS = {
  INTERVIEWED_APPS: "pea_interviewed_apps",
  APPROVED_APPS: "pea_approved_apps",
  REJECTED_APPS: "pea_rejected_apps",
  DOC_UPLOADED_APPS: "pea_doc_uploaded_apps",
  DOC_APPROVED_APPS: "pea_doc_approved_apps",
  DOC_REJECTED_APPS: "pea_doc_rejected_apps",
  UPLOADED_FILENAMES: "pea_uploaded_filenames",
  REJECTED_APPS_DATA: "pea_rejected_apps_data",
};

// Helper to get from localStorage
const getFromStorage = (key: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save to localStorage
const saveToStorage = (key: string, value: string[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Helper to get uploaded filenames from localStorage
const getFilenamesFromStorage = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILENAMES);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Helper to save uploaded filename to localStorage
const saveFilenameToStorage = (appId: string, filename: string) => {
  if (typeof window === "undefined") return;
  const current = getFilenamesFromStorage();
  current[appId] = filename;
  localStorage.setItem(
    STORAGE_KEYS.UPLOADED_FILENAMES,
    JSON.stringify(current),
  );
};

// Mapping: backend applicationStatus → frontend Application fields
function mapApiToApplication(item: AllStudentsHistoryItem): Application {
  const statusMap: Record<
    AppStatusEnum,
    {
      step: number;
      status: ApplicationStatus;
      detailedStatus: DetailedStatus;
      stepDescription: string;
    }
  > = {
    PENDING_DOCUMENT: {
      step: 1,
      status: "pending",
      detailedStatus: "waiting_document",
      stepDescription: "รอเอกสารจากผู้สมัคร",
    },
    PENDING_INTERVIEW: {
      step: 2,
      status: "reviewing",
      detailedStatus: "waiting_interview",
      stepDescription: "สัมภาษณ์ผู้สมัคร",
    },
    PENDING_CONFIRMATION: {
      step: 3,
      status: "reviewing",
      detailedStatus: "waiting_confirm",
      stepDescription: "ยืนยันสถานะการสมัคร",
    },
    PENDING_REQUEST: {
      step: 4,
      status: "accepted",
      detailedStatus: "waiting_analysis_doc",
      stepDescription: "รอเอกสารขอความอนุเคราะห์จากผู้สมัคร",
    },
    PENDING_REVIEW: {
      step: 5,
      status: "accepted",
      detailedStatus: "doc_sent",
      stepDescription: "รอ HR ตรวจสอบความถูกต้องเอกสาร",
    },
    COMPLETE: {
      step: 6,
      status: "accepted",
      detailedStatus: "completed",
      stepDescription: "รับผู้สมัครฝึกงานเรียบร้อยแล้ว",
    },
    CANCEL: {
      step: 1,
      status: "cancelled",
      detailedStatus: "cancelled",
      stepDescription: "ยกเลิก",
    },
  };

  let mapped = statusMap[item.applicationStatus] || statusMap.PENDING_DOCUMENT;

  // CANCEL + statusNote = owner rejected (ไม่ผ่าน), plain CANCEL = actual cancellation (ยกเลิกฝึกงาน)
  if (item.applicationStatus === "CANCEL" && item.statusNote) {
    mapped = {
      step: 3,
      status: "rejected",
      detailedStatus: "rejected",
      stepDescription: "ไม่ผ่านการคัดเลือก",
    };
  }

  // Format dates from ISO to YYYY-MM-DD (Buddhist Era)
  const formatDate = (d: string | null): string => {
    if (!d) return "";
    const date = new Date(d);
    const beYear = date.getFullYear() + 543;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${beYear}-${month}-${day}`;
  };

  // Map institution type to education category
  const eduMap: Record<string, string> = {
    UNIVERSITY: "university",
    VOCATIONAL: "vocational",
    HIGH_VOCATIONAL: "high_vocational",
    SCHOOL: "high_school",
    OTHERS: "university",
  };
  const education = eduMap[item.institutionType || ""] || "university";

  // Map documents
  const docTypeNames: Record<number, string> = {
    1: "Transcript",
    2: "Resume",
    3: "Portfolio",
    4: "เอกสารขอความอนุเคราะห์",
  };
  const documents = (item.documents || []).map((doc) => ({
    name: docTypeNames[doc.docTypeId] || `เอกสาร ${doc.docTypeId}`,
    type: doc.docFile.split(".").pop() || "pdf",
    docFile: doc.docFile,
  }));

  // Analysis documents (doc type 4 = request letter)
  const analysisDocuments = (item.documents || [])
    .filter((doc) => doc.docTypeId === 4)
    .map((doc) => ({
      name: docTypeNames[doc.docTypeId] || "เอกสารขอความอนุเคราะห์",
      type: doc.docFile.split(".").pop() || "pdf",
      status: (doc.validationStatus === "VERIFIED"
        ? "approved"
        : doc.validationStatus === "INVALID"
          ? "rejected"
          : "pending") as "pending" | "approved" | "rejected",
      docFile: doc.docFile,
    }));

  return {
    id: String(item.applicationId),
    internId: item.studentUserId || "",
    firstName: item.fname || "",
    lastName: item.lname || "",
    email: item.email || "",
    phone: item.phoneNumber || "",
    education,
    institution: item.institutionName || "",
    major: item.major || "",
    startDate: formatDate(item.infoStartDate || item.profileStartDate),
    endDate: formatDate(item.infoEndDate || item.profileEndDate),
    trainingHours: Number(item.infoHours || item.profileHours || 0),
    department: item.positionName || "",
    position: item.positionName || "",
    status: mapped.status,
    detailedStatus: mapped.detailedStatus,
    appliedDate: formatDate(item.createdAt),
    gender: (item.gender === "MALE" ? "male" : "female") as "male" | "female",
    expectation: item.infoExpectation || "",
    documents,
    analysisDocuments:
      analysisDocuments.length > 0 ? analysisDocuments : undefined,
    step: mapped.step,
    stepDescription: mapped.stepDescription,
    faculty: item.faculty || undefined,
    studentNote: item.studentNote || undefined,
    cancellationReason:
      item.applicationStatus === "CANCEL"
        ? item.statusNote || undefined
        : undefined,
    mentors: item.mentors && item.mentors.length > 0 ? item.mentors : undefined,
    skill: item.infoSkill || undefined,
    actionDate: formatDate(item.updatedAt),
  };
}

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const positionId = searchParams.get("positionId");
  const positionQueryAmp = positionId ? `&positionId=${positionId}` : '';

  // All applications fetched from API (replaces mockApplications)
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionInfo, setPositionInfo] = useState<Position | null>(null);

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const itemsPerPage = 10;
  
  // (Include rest of original AllApplicationsPage content here...)


  // Popup states
  const [showInterviewConfirm, setShowInterviewConfirm] = useState(false);
  const [showInterviewSuccess, setShowInterviewSuccess] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDocRejectModal, setShowDocRejectModal] = useState(false);
  const [showDocumentPopup, setShowDocumentPopup] = useState(false);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Application history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<MyApplicationData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Tab loading state
  const [tabLoading, setTabLoading] = useState(false);

  // State with localStorage persistence
  const [interviewedApps, setInterviewedApps] = useState<string[]>([]);
  const [approvedApps, setApprovedApps] = useState<string[]>([]);
  const [rejectedApps, setRejectedApps] = useState<string[]>([]);
  const [docUploadedApps, setDocUploadedApps] = useState<string[]>([]);
  const [docApprovedApps, setDocApprovedApps] = useState<string[]>([]);
  const [docRejectedApps, setDocRejectedApps] = useState<string[]>([]);
  const [cancelledAppsData, setCancelledAppsData] = useState<
    { id: string; reason: string; cancelledBy: string; cancelledDate: string }[]
  >([]);
  const [rejectedAppsData, setRejectedAppsData] = useState<
    { id: string; reason: string; rejectedBy: string; rejectedDate: string }[]
  >([]);

  // Document upload states
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFilenames, setUploadedFilenames] = useState<
    Record<string, string>
  >({});
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [showFinalSuccess, setShowFinalSuccess] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showMentorInfo, setShowMentorInfo] = useState(false);

  // Timeline actions state (real data from API)
  const [timelineActions, setTimelineActions] = useState<ApplicationStatusAction[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

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
        // Backend returns newest first, reverse to chronological order
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

  const isWaitingAnalysisDoc = !!(
    selectedApplication?.step === 4 ||
    (selectedApplication &&
      approvedApps.includes(selectedApplication.id) &&
      !docUploadedApps.includes(selectedApplication.id))
  );

  // Clear stale localStorage on mount — API is the source of truth now
  useEffect(() => {
    // Remove all localStorage keys that used to override API status
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("pea_cancelled_apps");
  }, []);

  // Fetch applications from API
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch applications (optionally filtered by positionId)
      const query: { positionId?: number; limit: number; includeCanceled: boolean } = {
        limit: 9999,
        includeCanceled: true,
      };
      if (positionId) {
        query.positionId = Number(positionId);
      }

      // Fetch position info only if positionId is provided
      const [positionData, response] = await Promise.all([
        positionId ? positionApi.getPositionById(Number(positionId)) : Promise.resolve(null),
        applicationApi.getAllStudentsHistory(query),
      ]);
      setPositionInfo(positionData);
      const mapped = response.data.map(mapApiToApplication);
      setAllApplications(mapped);
      // Preserve selected application if still in list, otherwise select first
      setSelectedApplication((prev) => {
        if (prev) {
          const found = mapped.find((a) => a.id === prev.id);
          if (found) return found;
        }
        return mapped.length > 0 ? mapped[0] : null;
      });
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setAllApplications([]);
    } finally {
      setLoading(false);
    }
  }, [positionId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Derive cancelled app IDs from localStorage data (memoized to avoid infinite re-renders)
  const cancelledAppIds = useMemo(
    () => cancelledAppsData.map((c) => c.id),
    [cancelledAppsData],
  );

  // Helper function to get effective status of an app
  // API data is the source of truth; localStorage only used for optimistic UI within current session
  const getEffectiveAppStatus = (app: Application) => {
    return { status: app.status, detailedStatus: app.detailedStatus };
  };

  // Helper function to get effective step and stepDescription
  const getEffectiveStep = (app: Application) => {
    return { step: app.step, stepDescription: app.stepDescription };
  };

  // Calculate dynamic tab counts based on API data
  const getDynamicTabCounts = () => {
    let waiting_document = 0;
    let waiting_interview = 0;
    let waiting_confirm = 0;
    let accepted = 0;
    let rejected = 0;
    let cancelled = 0;

    allApplications.forEach((app) => {
      if (app.status === "rejected") {
        rejected++;
      } else if (app.status === "cancelled") {
        cancelled++;
      } else if (app.status === "accepted") {
        accepted++;
      } else if (app.detailedStatus === "waiting_confirm") {
        waiting_confirm++;
      } else if (app.detailedStatus === "waiting_interview") {
        waiting_interview++;
      } else if (app.detailedStatus === "waiting_document") {
        waiting_document++;
      }
    });

    return {
      all: allApplications.length,
      waiting_document,
      waiting_interview,
      waiting_confirm,
      accepted,
      rejected,
      cancelled,
    };
  };

  const tabCounts = getDynamicTabCounts();

  // Sort applications: by step, and rejected at the end
  const sortApplications = (apps: Application[]): Application[] => {
    return [...apps].sort((a, b) => {
      // Cancelled applications go to the very end
      const aCancelled = a.status === "cancelled";
      const bCancelled = b.status === "cancelled";

      if (aCancelled && !bCancelled) return 1;
      if (!aCancelled && bCancelled) return -1;

      // Rejected applications go after active but before cancelled
      const aRejected = a.status === "rejected";
      const bRejected = b.status === "rejected";

      if (aRejected && !bRejected) return 1;
      if (!aRejected && bRejected) return -1;

      // For step 6, sort doc_sent before doc_rejected
      if (a.step === 6 && b.step === 6) {
        if (
          a.detailedStatus === "doc_sent" &&
          b.detailedStatus === "doc_rejected"
        )
          return -1;
        if (
          a.detailedStatus === "doc_rejected" &&
          b.detailedStatus === "doc_sent"
        )
          return 1;
      }

      // Sort by step
      return a.step - b.step;
    });
  };

  // Dynamic filter applications based on tab
  const filterDynamicApplications = (tab: FilterTab): Application[] => {
    const filtered = allApplications.filter((app) => {
      switch (tab) {
        case "all":
          return true;
        case "waiting_document":
          return app.detailedStatus === "waiting_document";
        case "waiting_interview":
          return app.detailedStatus === "waiting_interview";
        case "waiting_confirm":
          return app.detailedStatus === "waiting_confirm";
        case "accepted":
          return app.status === "accepted";
        case "rejected":
          return app.status === "rejected";
        case "cancelled":
          return app.status === "cancelled";
        default:
          return true;
      }
    });
    return sortApplications(filtered);
  };

  // Filter applications when tab changes, state changes, or search changes
  useEffect(() => {
    let filtered = filterDynamicApplications(activeTab);

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
        // Check school-level match first
        if (selectedSchools.length > 0 && app.institution) {
          if (selectedSchools.includes(app.institution)) return true;
        }
        // Check category-level match
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

    // Only auto-select first item if current selection is not in the filtered list
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
  }, [
    activeTab,
    searchKeyword,
    selectedInstitutions,
    selectedSchools,
    allApplications,
  ]);

  // Set first application as selected when data loaded
  useEffect(() => {
    if (allApplications.length > 0 && !selectedApplication) {
      setSelectedApplication(allApplications[0]);
    }
  }, [allApplications]);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Get status badge — based on API data
  const getStatusBadge = (app: Application) => {
    // === Check rejected BEFORE cancelled — "ไม่ผ่าน" takes priority ===
    if (app.status === "rejected") {
      return {
        text: "ไม่ผ่าน",
        color:
          "bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA]",
      };
    }

    // === Cancelled ===
    if (app.status === "cancelled") {
      return {
        text: "ยกเลิกฝึกงาน",
        color:
          "bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA]",
      };
    }

    // === Accepted: dual badge ("รับเข้าฝึกงาน" + sub-status) ===
    if (app.status === "accepted") {
      const effectiveDetailed = app.detailedStatus;

      const base = {
        text: "รับเข้าฝึกงาน",
        color:
          "bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]",
      };

      switch (effectiveDetailed) {
        case "waiting_analysis_doc":
          return {
            ...base,
            secondary: "รอเอกสารขอความอนุเคราะห์",
            secondaryColor:
              "bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FEDF89]",
          };
        case "waiting_send_doc":
        case "doc_sent":
          return {
            ...base,
            secondary: "รอ HR ตรวจสอบ",
            secondaryColor:
              "bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FEDF89]",
          };
        case "doc_rejected":
          return {
            ...base,
            secondary: "เอกสารไม่ผ่าน",
            secondaryColor:
              "bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA]",
          };
        case "doc_passed":
        case "completed":
          return {
            ...base,
            secondary: "เอกสารผ่าน",
            secondaryColor:
              "bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]",
          };
        default:
          return base;
      }
    }

    // === Pending: single badge based on detailedStatus ===
    switch (app.detailedStatus) {
      case "waiting_document":
        return {
          text: "รอยื่นเอกสาร",
          color:
            "bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FCD34D]",
        };
      case "waiting_interview":
        return {
          text: "รอสัมภาษณ์",
          color:
            "bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FCD34D]",
        };
      case "waiting_confirm":
        return {
          text: "รอการยืนยัน",
          color:
            "bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FCD34D]",
        };
      default:
        return { text: "รอดำเนินการ", color: "bg-gray-100 text-gray-700" };
    }
  };

  // Handle document download from MinIO
  const handleDownloadDocument = async (docFile: string | undefined) => {
    if (!docFile) return;
    try {
      await applicationApi.downloadDocument(docFile, true);
    } catch (err) {
      console.error("Failed to download document:", err);
      alert("ไม่สามารถดาวน์โหลดเอกสารได้");
    }
  };

  // Handle document preview (open in new tab)
  const handlePreviewDocument = async (docFile: string | undefined) => {
    if (!docFile) return;
    try {
      await applicationApi.downloadDocument(docFile, false);
    } catch (err) {
      console.error("Failed to preview document:", err);
      alert("ไม่สามารถเปิดเอกสารได้");
    }
  };

  // Handle interview confirmation (Owner approves interview → PENDING_INTERVIEW → PENDING_CONFIRMATION)
  const handleConfirmInterview = async () => {
    if (selectedApplication) {
      try {
        await applicationApi.approveInterview(Number(selectedApplication.id));
        // Also update localStorage for backward compatibility
        const newInterviewed = [...interviewedApps, selectedApplication.id];
        setInterviewedApps(newInterviewed);
        saveToStorage(STORAGE_KEYS.INTERVIEWED_APPS, newInterviewed);
        setShowInterviewConfirm(false);
        setShowInterviewSuccess(true);
        // Re-fetch to get updated statuses
        await fetchApplications();
      } catch (err) {
        console.error("Failed to approve interview:", err);
        setShowInterviewConfirm(false);
      }
    }
  };

  // Handle approve application (Owner confirms accept → PENDING_CONFIRMATION → PENDING_REQUEST)
  const handleApprove = async () => {
    if (selectedApplication) {
      try {
        await applicationApi.confirmAccept(Number(selectedApplication.id));
        const newApproved = [...approvedApps, selectedApplication.id];
        setApprovedApps(newApproved);
        saveToStorage(STORAGE_KEYS.APPROVED_APPS, newApproved);
        setShowApproveConfirm(false);
        // Re-fetch to get updated statuses
        await fetchApplications();
      } catch (err) {
        console.error("Failed to confirm accept:", err);
        setShowApproveConfirm(false);
      }
    }
  };

  // Handle reject application (Owner rejects → CANCEL)
  const handleReject = async () => {
    if (selectedApplication) {
      try {
        await applicationApi.rejectApplication(
          Number(selectedApplication.id),
          rejectReason,
        );
        const newRejected = [...rejectedApps, selectedApplication.id];
        setRejectedApps(newRejected);
        saveToStorage(STORAGE_KEYS.REJECTED_APPS, newRejected);
        // Save reject reason data
        const now = new Date();
        const buddhistYear = now.getFullYear() + 543;
        const rejectedDate = `${buddhistYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        // Use the position owner name (logged-in user who performed the action)
        const ownerData = positionInfo?.owner || (positionInfo?.owners && positionInfo.owners.length > 0 ? positionInfo.owners[0] : null);
        const ownerName = ownerData ? `${ownerData.fname || ""} ${ownerData.lname || ""}`.trim() : "เจ้าของหน่วยงาน";
        const newRejectedData = [
          ...rejectedAppsData,
          {
            id: selectedApplication.id,
            reason: rejectReason,
            rejectedBy: ownerName,
            rejectedDate,
          },
        ];
        setRejectedAppsData(newRejectedData);
        localStorage.setItem(
          STORAGE_KEYS.REJECTED_APPS_DATA,
          JSON.stringify(newRejectedData),
        );
        setShowRejectConfirm(false);
        setShowRejectModal(false);
        setRejectReason("");
        // Re-fetch to get updated statuses
        await fetchApplications();
      } catch (err) {
        console.error("Failed to reject:", err);
        setShowRejectConfirm(false);
        setShowRejectModal(false);
        setRejectReason("");
      }
    }
  };

  // Handle document upload and send to HR
  const handleDocUploadAndSend = () => {
    if (selectedApplication && uploadedFileName) {
      const newDocUploaded = [...docUploadedApps, selectedApplication.id];
      setDocUploadedApps(newDocUploaded);
      saveToStorage(STORAGE_KEYS.DOC_UPLOADED_APPS, newDocUploaded);

      // Save uploaded filename to localStorage
      saveFilenameToStorage(selectedApplication.id, uploadedFileName);
      setUploadedFilenames((prev) => ({
        ...prev,
        [selectedApplication.id]: uploadedFileName,
      }));

      setShowUploadConfirm(false);
      setShowFinalSuccess(true);
      setUploadedFileName("");
    }
  };

  // Handle document approval
  const handleDocApprove = () => {
    if (selectedApplication) {
      const newDocApproved = [...docApprovedApps, selectedApplication.id];
      setDocApprovedApps(newDocApproved);
      saveToStorage(STORAGE_KEYS.DOC_APPROVED_APPS, newDocApproved);
    }
  };

  // Handle document rejection
  const handleDocReject = () => {
    if (selectedApplication && docRejectReason.trim()) {
      const newDocRejected = [...docRejectedApps, selectedApplication.id];
      setDocRejectedApps(newDocRejected);
      saveToStorage(STORAGE_KEYS.DOC_REJECTED_APPS, newDocRejected);
      setShowDocRejectModal(false);
      setDocRejectReason("");
    }
  };

  // Helper: determine the effective status category for an app
  const getEffectiveStatusCategory = (
    app: Application,
  ): "pending" | "accepted" | "rejected" | "cancelled" => {
    if (app.status === "rejected") return "rejected";
    if (app.status === "cancelled") return "cancelled";
    if (app.status === "accepted") return "accepted";
    return "pending";
  };

  // Helper: get cancellation data for an app from localStorage
  const getCancellationData = (appId: string) => {
    const fromStorage = cancelledAppsData.find((c) => c.id === appId);
    if (fromStorage) return fromStorage;
    return null;
  };

  // Helper: get education type label (for cancelled panel)
  const getEducationLabel = (education: string): string => {
    const labels: Record<string, string> = {
      high_school: "มัธยมศึกษาตอนปลาย",
      vocational: "ปวช.",
      high_vocational: "ปวส.",
      university: "มหาวิทยาลัย",
    };
    return labels[education] || education;
  };

  // Helper: get mentor info from position data (first mentor added to the position)
  const getMentor = () => {
    const pm = positionInfo?.mentors?.[0];
    if (pm) {
      return {
        name: pm.name || "-",
        email: pm.email || "-",
        phone: pm.phoneNumber || "-",
      };
    }
    // Fallback to application-level mentors
    const m = selectedApplication?.mentors?.[0];
    return {
      name: m ? `${m.fname || ""} ${m.lname || ""}`.trim() || "-" : "-",
      email: m?.email || "-",
      phone: m?.phone || "-",
    };
  };

  // Fetch real application history for a student
  const fetchApplicationHistory = async (app: Application) => {
    if (!app.internId) return;
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const data = await applicationApi.getStudentHistory(app.internId, true);
      setHistoryData(data.filter((h) => String(h.applicationId) !== String(app.id)));
    } catch (error) {
      console.error("Failed to fetch student history:", error);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Helper: format API status to display status
  const getHistoryStatusInfo = (status: AppStatusEnum) => {
    switch (status) {
      case "COMPLETE":
        return { label: "ฝึกงานเสร็จสิ้น", color: "bg-[#DCFAE6] text-[#085D3A] border-[#A9EFC5]" };
      case "CANCEL":
        return { label: "ยกเลิกฝึกงาน", color: "bg-red-50 text-red-600 border-red-200" };
      default:
        return { label: "กำลังดำเนินการ", color: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    }
  };

  // Helper: format date to Thai short format
  const formatHistoryDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const thaiShortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${thaiShortMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  // Helper: get effective detailed status for accepted apps (with localStorage overrides)
  const getAcceptedEffectiveDetailed = (app: Application) => {
    if (docApprovedApps.includes(app.id)) return "doc_passed";
    if (docRejectedApps.includes(app.id)) return "doc_rejected";
    if (docUploadedApps.includes(app.id)) return "doc_sent";
    if (approvedApps.includes(app.id) && app.status !== "accepted")
      return "waiting_analysis_doc";
    return app.detailedStatus;
  };

  // Helper: get accepted sub-status badge
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
          text: "รอ HR ตรวจสอบ",
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

  // Render status timeline for right panel
  const renderStatusTimeline = (app: Application) => {
    const statusCat = getEffectiveStatusCategory(app);

    let completedUpTo = 0;
    let currentStep = 0;

    if (statusCat === "rejected") {
      completedUpTo = 3;
      currentStep = 0;
    } else if (statusCat === "cancelled") {
      const effDetailed = getAcceptedEffectiveDetailed(app);
      if (effDetailed === "doc_passed" || effDetailed === "completed") {
        completedUpTo = 5;
      } else if (
        effDetailed === "doc_sent" ||
        effDetailed === "waiting_send_doc"
      ) {
        completedUpTo = 4;
        currentStep = 5;
      } else {
        completedUpTo = 3;
        currentStep = 4;
      }
    } else if (statusCat === "accepted") {
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
    } else {
      if (interviewedApps.includes(app.id) && app.step === 2) {
        completedUpTo = 2;
        currentStep = 3;
      } else if (app.step >= 3 || app.detailedStatus === "waiting_confirm") {
        completedUpTo = 2;
        currentStep = 3;
      } else if (app.step === 2) {
        completedUpTo = 1;
        currentStep = 2;
      } else {
        completedUpTo = 0;
        currentStep = 1;
      }
    }

    const stepLabels = [
      "รอยื่นเอกสาร",
      "รอสัมภาษณ์",
      "รอการยืนยัน",
      "รอยื่นเอกสารขอความอนุเคราะห์",
      "รอ HR ตรวจสอบ",
    ];

    const mentorName = getMentor().name;
    // Map real action data to step completed info
    const stepStatusMap: AppStatusEnum[] = [
      "PENDING_INTERVIEW",
      "PENDING_CONFIRMATION",
      "PENDING_REQUEST",
      "PENDING_REVIEW",
      "COMPLETE",
    ];

    const formatActionDate = (dateStr: string): string => {
      const d = new Date(dateStr);
      const thaiShortMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const beYear = d.getFullYear() + 543;
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${d.getDate()} ${thaiShortMonths[d.getMonth()]} ${beYear} ${hours}:${minutes}`;
    };

    const getActorLabel = (action: ApplicationStatusAction): string | undefined => {
      if (!action.actor) return undefined;
      const { fname, lname, roleId } = action.actor;
      if (roleId === 3 || (!fname && !lname)) return undefined;
      const name = [fname, lname].filter(Boolean).join(" ");
      return `พนักงาน : ${name}`;
    };

    const stepCompletedInfo: { date: string; operator?: string }[] = stepStatusMap.map((targetStatus) => {
      const action = timelineActions.find((a) => a.newStatus === targetStatus);
      if (!action) return { date: "", operator: undefined };
      return {
        date: formatActionDate(action.createdAt),
        operator: getActorLabel(action),
      };
    });

    return (
      <div className="py-2">
        <div className="relative">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum <= completedUpTo;
            const isCurrent = stepNum === currentStep;
            const isLast = index === stepLabels.length - 1;

            return (
              <div key={index} className="flex">
                {/* Circle + Line column */}
                <div className="flex flex-col items-center w-20 shrink-0">
                  {isCompleted ? (
                    <div className="w-10 h-10 rounded-full bg-[#A80689] flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
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
                    <div className="w-10 h-10 rounded-full border-[3px] border-[#A80689] bg-white shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  )}
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 ${isCompleted ? "bg-[#A80689]" : "bg-gray-200"}`}
                    />
                  )}
                </div>
                {/* Text column */}
                <div
                  className={`ml-4 ${isLast ? "pb-0" : "pb-4"} pt-2 min-h-[3.5rem]`}
                >
                  <p
                    className={`font-bold text-sm leading-snug ${isCompleted || isCurrent ? "text-[#A80689]" : "text-gray-400"}`}
                  >
                    {label}
                  </p>
                  {isCompleted && stepCompletedInfo[index] && (
                    <div className="mt-1 space-y-0.5">
                      {stepCompletedInfo[index].operator && (
                        <p className="text-gray-500 text-xs">
                          {stepCompletedInfo[index].operator}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs">
                        {stepCompletedInfo[index].date}
                      </p>
                    </div>
                  )}
                  {isCurrent && (
                    <p className="text-gray-400 text-xs mt-1">กำลังดำเนินการ</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render right panel content based on selected application step
  const renderRightPanelContent = () => {
    if (!selectedApplication) return null;

    const badge = getStatusBadge(selectedApplication);
    const statusCategory = getEffectiveStatusCategory(selectedApplication);
    const hasDocuments =
      selectedApplication.documents && selectedApplication.documents.length > 0;
    const hasAnalysisDocuments =
      selectedApplication.analysisDocuments &&
      selectedApplication.analysisDocuments.length > 0;

    // === CANCELLED PANEL === (unified layout matching pending/rejected)
    if (statusCategory === "cancelled") {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedApplication.firstName} {selectedApplication.lastName}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowHistoryModal(true); fetchApplicationHistory(selectedApplication); }}
                className="p-2 text-gray-500 rounded-4xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18C6.9 18 5.04167 17.3625 3.425 16.0875C1.80833 14.8125 0.758333 13.1833 0.275 11.2C0.208333 10.95 0.258333 10.7208 0.425 10.5125C0.591667 10.3042 0.816667 10.1833 1.1 10.15C1.36667 10.1167 1.60833 10.1667 1.825 10.3C2.04167 10.4333 2.19167 10.6333 2.275 10.9C2.675 12.4 3.5 13.625 4.75 14.575C6 15.525 7.41667 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H5C5.28333 5 5.52083 5.09583 5.7125 5.2875C5.90417 5.47917 6 5.71667 6 6C6 6.28333 5.90417 6.52083 5.7125 6.7125C5.52083 6.90417 5.28333 7 5 7H1C0.716667 7 0.479167 6.90417 0.2875 6.7125C0.0958333 6.52083 0 6.28333 0 6V2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1C1.28333 1 1.52083 1.09583 1.7125 1.2875C1.90417 1.47917 2 1.71667 2 2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM10 8.6L12.5 11.1C12.6833 11.2833 12.775 11.5167 12.775 11.8C12.775 12.0833 12.6833 12.3167 12.5 12.5C12.3167 12.6833 12.0833 12.775 11.8 12.775C11.5167 12.775 11.2833 12.6833 11.1 12.5L8.3 9.7C8.2 9.6 8.125 9.4875 8.075 9.3625C8.025 9.2375 8 9.10833 8 8.975V5C8 4.71667 8.09583 4.47917 8.2875 4.2875C8.47917 4.09583 8.71667 4 9 4C9.28333 4 9.52083 4.09583 9.7125 4.2875C9.90417 4.47917 10 4.71667 10 5V8.6Z" fill="currentColor" />
                </svg>
              </button>
              <Link
                href={`/owner/dashboard/${selectedApplication.id}?from=applications${positionQueryAmp}`}
                className="p-2 text-gray-500 rounded-4xl hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
          {/* Badge */}
          <div className="flex flex-wrap gap-1 mb-4">
            <span className="bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA] text-sm px-3 py-1 rounded-full">ยกเลิกฝึกงาน</span>
          </div>
          {/* Department */}
          <div className="flex items-center gap-2 text-gray-600 mb-6 border-b mtb-6 pb-4 border-[#CECFD2]">
            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM2 17H18V6H2V17ZM8 4H12V2H8V4Z" fill="#A80689" />
            </svg>
            <span className="text-sm">{positionInfo?.name || selectedApplication?.position || "ตำแหน่งงาน"}</span>
          </div>
          {/* Cancellation reason */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-red-600 mb-2">เหตุผลประกอบการยกเลิกฝึกงาน</p>
                <p className="text-gray-700 text-sm">
                  {(() => { const cancelData = getCancellationData(selectedApplication.id); return cancelData?.reason || selectedApplication.cancellationReason || "เนื่องจากผู้สมัครไม่สามารถปฏิบัติงานได้ตามกำหนดเวลาที่ตกลงไว้ในแผนการฝึกงาน และไม่มีการแจ้งล่วงหน้า ซึ่งทางหน่วยงานพิจารณาแล้วเห็นสมควรให้ยกเลิกการฝึกงาน"; })()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-red-200">
              <div>
                <p className="text-gray-500 text-xs">ผู้ดำเนินการ:</p>
                <p className="text-gray-900 text-sm">
                  {(() => { const cancelData = getCancellationData(selectedApplication.id); const od = positionInfo?.owner || (positionInfo?.owners && positionInfo.owners.length > 0 ? positionInfo.owners[0] : null); const ownerName = od ? `${od.fname || ""} ${od.lname || ""}`.trim() || "-" : "-"; return cancelData?.cancelledBy || selectedApplication.cancelledBy || ownerName; })()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">วันที่ยกเลิก:</p>
                <p className="text-gray-900 text-sm">
                  {formatDateThai((() => { const cancelData = getCancellationData(selectedApplication.id); return cancelData?.cancelledDate || selectedApplication.cancelledDate || selectedApplication.actionDate || ""; })())}
                </p>
              </div>
            </div>
          </div>
          {/* Status Progress Dropdown */}
          <div className="mb-6">
            <button onClick={() => setShowAdditionalInfo(!showAdditionalInfo)} className="w-full flex items-center justify-between py-3 cursor-pointer">
              <span className="text-md font-semibold text-gray-900">สถานะการดำเนินการ</span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAdditionalInfo ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {(() => {
              const totalSteps = 5;
              const completedSteps = Math.min(selectedApplication.step - 1, totalSteps);
              const currentStepLabel = ["รอผู้สมัครยื่นเอกสาร", "รอสัมภาษณ์", "รอการยืนยัน", "รอผู้สมัครยื่นเอกสารขอความอนุเคราะห์", "รอ HR ตรวจสอบ"];
              const currentStepIndex = Math.min(completedSteps, totalSteps - 1);
              const circumference = 2 * Math.PI * 36;
              const progress = (completedSteps / totalSteps) * circumference;
              const summaryStepStatusMap: AppStatusEnum[] = ["PENDING_INTERVIEW", "PENDING_CONFIRMATION", "PENDING_REQUEST", "PENDING_REVIEW", "COMPLETE"];
              const fmtDate = (dateStr: string): string => { const d = new Date(dateStr); const mo = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]; return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear() + 543} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
              const fmtActor = (action: ApplicationStatusAction): string | undefined => { if (!action.actor) return undefined; const { fname, lname, roleId } = action.actor; if (roleId === 3 || (!fname && !lname)) return undefined; return `พนักงาน : ${[fname, lname].filter(Boolean).join(" ")}`; };
              const stepCompletedInfo: { date: string; operator?: string }[] = summaryStepStatusMap.map((targetStatus) => { const action = timelineActions.find((a) => a.newStatus === targetStatus); if (!action) return { date: "" }; return { date: fmtDate(action.createdAt), operator: fmtActor(action) }; });
              return (
                <div className="flex items-center gap-5 mb-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" stroke="#E5E7EB" strokeWidth="5" fill="none" />
                      <circle cx="40" cy="40" r="36" stroke="#A80689" strokeWidth="5" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-700">{completedSteps}/{totalSteps}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{currentStepLabel[currentStepIndex]}</p>
                    {stepCompletedInfo[currentStepIndex - 1]?.date && (
                      <p className="text-gray-400 text-sm">{stepCompletedInfo[currentStepIndex - 1].date}</p>
                    )}
                    {stepCompletedInfo[currentStepIndex - 1]?.operator && (
                      <p className="text-gray-400 text-sm">{stepCompletedInfo[currentStepIndex - 1].operator}</p>
                    )}
                    <p className="text-gray-400 text-sm">กระบวนการสมัครสิ้นสุดแล้ว</p>
                  </div>
                </div>
              );
            })()}
            {showAdditionalInfo && <div className="pb-2">{renderStatusTimeline(selectedApplication)}</div>}
          </div>
          {/* Documents per-type */}
          <div className="mb-6">
            <div className="space-y-4">
              {["Transcript", "Portfolio", "Resume"].map((docType) => {
                const uploadedDoc = selectedApplication.documents?.find((d) => d.type?.toLowerCase() === docType.toLowerCase() || d.name?.toLowerCase().startsWith(docType.toLowerCase()));
                if (!uploadedDoc && docType !== "Transcript") return null;
                return (
                  <div key={docType}>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">{docType}</h5>
                    {uploadedDoc ? (
                      <div className="group flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z" fill="#A80689" /></svg>
                          <span className="text-gray-700">{uploadedDoc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDownloadDocument(uploadedDoc.docFile)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="ดาวน์โหลด">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                          <button onClick={() => handlePreviewDocument(uploadedDoc.docFile)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="ดูเอกสาร">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z" fill="#A80689" /></svg>
                        <span className="text-gray-400">ยังไม่มีเอกสารแนบ</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Personal Info */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">ข้อมูลผู้สมัคร</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-sm">ระยะเวลาการฝึกงาน</span><p className="text-gray-900 text-sm">{formatDateThai(selectedApplication.startDate)} - {formatDateThai(selectedApplication.endDate)}</p></div>
                <div><span className="text-gray-500 text-sm">ชั่วโมงที่ต้องฝึก</span><p className="text-gray-900 text-sm">{selectedApplication.trainingHours} ชั่วโมง</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-sm">อีเมล</span><p className="text-gray-900 text-sm">{selectedApplication.email}</p></div>
                <div><span className="text-gray-500 text-sm">เพศ</span><p className="text-gray-900 text-sm">{selectedApplication.gender === "male" ? "ชาย" : "หญิง"}</p></div>
              </div>
              <div><span className="text-gray-500 text-sm">เบอร์โทร</span><p className="text-gray-900 text-sm">{selectedApplication.phone}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-sm">การศึกษาปัจจุบัน</span><p className="text-gray-900 text-sm">{getEducationLabel(selectedApplication.education)}</p></div>
                <div><span className="text-gray-500 text-sm">ชื่อสถาบัน</span><p className="text-gray-900 text-sm">{selectedApplication.institution}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-sm">คณะ</span><p className="text-gray-900 text-sm">{selectedApplication.faculty || "-"}</p></div>
                <div><span className="text-gray-500 text-sm">สาขา</span><p className="text-gray-900 text-sm">{selectedApplication.major}</p></div>
              </div>
              <div><span className="text-gray-500 text-sm">ทักษะด้านต่าง ๆ ของผู้สมัคร</span><p className="text-gray-900 text-sm">{selectedApplication.skill || "-"}</p></div>
              <div><span className="text-gray-500 text-sm">สิ่งที่คาดหวังจากการฝึกงาน</span><p className="text-gray-900 text-sm">{selectedApplication.expectation}</p></div>
            </div>
          </div>
          {/* Mentor Info Dropdown */}
          <div className="border-t border-gray-100">
            <button onClick={() => setShowMentorInfo(!showMentorInfo)} className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="font-semibold text-gray-900">ข้อมูลพี่เลี้ยง</span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showMentorInfo ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showMentorInfo && (
              <div className="pb-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <div><p className="text-gray-400 text-sm">ชื่อพี่เลี้ยง</p><p className=" text-gray-900 text-sm">{getMentor().name}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <div><p className="text-gray-400 text-sm">อีเมล</p><p className="font-medium text-gray-900 text-sm">{getMentor().email}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <div><p className="text-gray-400 text-sm">เบอร์โทร</p><p className="font-medium text-gray-900 text-sm">{getMentor().phone}</p></div>
                  </div>
                </div>
                <p className="text-red-500 text-sm mt-3">*หมายเหตุ: หากประสงค์ให้ลงนามในเอกสารตอบรับกรุณาติดต่อพี่เลี้ยง</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // === REJECTED PANEL === (matches rejected/page.tsx)
    if (statusCategory === "rejected") {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedApplication.firstName} {selectedApplication.lastName}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowHistoryModal(true); fetchApplicationHistory(selectedApplication); }}
                className="p-2 text-gray-500 rounded-4xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18C6.9 18 5.04167 17.3625 3.425 16.0875C1.80833 14.8125 0.758333 13.1833 0.275 11.2C0.208333 10.95 0.258333 10.7208 0.425 10.5125C0.591667 10.3042 0.816667 10.1833 1.1 10.15C1.36667 10.1167 1.60833 10.1667 1.825 10.3C2.04167 10.4333 2.19167 10.6333 2.275 10.9C2.675 12.4 3.5 13.625 4.75 14.575C6 15.525 7.41667 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H5C5.28333 5 5.52083 5.09583 5.7125 5.2875C5.90417 5.47917 6 5.71667 6 6C6 6.28333 5.90417 6.52083 5.7125 6.7125C5.52083 6.90417 5.28333 7 5 7H1C0.716667 7 0.479167 6.90417 0.2875 6.7125C0.0958333 6.52083 0 6.28333 0 6V2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1C1.28333 1 1.52083 1.09583 1.7125 1.2875C1.90417 1.47917 2 1.71667 2 2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM10 8.6L12.5 11.1C12.6833 11.2833 12.775 11.5167 12.775 11.8C12.775 12.0833 12.6833 12.3167 12.5 12.5C12.3167 12.6833 12.0833 12.775 11.8 12.775C11.5167 12.775 11.2833 12.6833 11.1 12.5L8.3 9.7C8.2 9.6 8.125 9.4875 8.075 9.3625C8.025 9.2375 8 9.10833 8 8.975V5C8 4.71667 8.09583 4.47917 8.2875 4.2875C8.47917 4.09583 8.71667 4 9 4C9.28333 4 9.52083 4.09583 9.7125 4.2875C9.90417 4.47917 10 4.71667 10 5V8.6Z" fill="currentColor" />
                </svg>
              </button>
              <Link
                href={`/owner/dashboard/${selectedApplication.id}?from=applications${positionQueryAmp}`}
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
          {/* Status badge below name */}
          <div className="flex flex-wrap gap-1 mb-4">
            <span className="text-sm px-3 py-1 rounded-full bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA]">
              ไม่ผ่าน
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 mb-6 border-b mtb-6 pb-4 border-[#CECFD2]">
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
              {positionInfo?.name ||
                selectedApplication?.position ||
                "ตำแหน่งงาน"}
            </span>
          </div>

          {/* Rejection Reason Box */}
          {(() => {
            const rejectData = rejectedAppsData.find(
              (a) => a.id === selectedApplication.id,
            );
            const od = positionInfo?.owner || (positionInfo?.owners && positionInfo.owners.length > 0 ? positionInfo.owners[0] : null);
            const ownerName = od ? `${od.fname || ""} ${od.lname || ""}`.trim() || "-" : "-";
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-red-600 mb-2">
                      เหตุผลที่ไม่ผ่านการคัดเลือก
                    </p>
                    <p className="text-gray-700 text-sm">
                      {rejectData?.reason ||
                        selectedApplication.cancellationReason ||
                        "คุณสมบัติไม่ตรงตามที่หน่วยงานกำหนด"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-red-200">
                  <div>
                    <p className="text-gray-500 text-xs">ผู้ดำเนินการ:</p>
                    <p className="text-gray-900 text-sm">
                      {rejectData?.rejectedBy || ownerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">วันที่ดำเนินการ:</p>
                    <p className="text-gray-900 text-sm">
                      {formatDateThai(
                        rejectData?.rejectedDate ||
                        selectedApplication.actionDate ||
                        "",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Status Progress Dropdown - matching pending page layout */}
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
              let completedSteps = 0;
              if (selectedApplication.step >= 4) {
                completedSteps = 3;
              } else if (
                selectedApplication.step >= 3 ||
                selectedApplication.detailedStatus === "waiting_confirm"
              ) {
                completedSteps = 2;
              } else if (selectedApplication.step === 2) {
                completedSteps = 1;
              } else {
                completedSteps = 0;
              }
              const currentStepLabel = [
                "รอผู้สมัครยื่นเอกสาร",
                "รอสัมภาษณ์",
                "รอการยืนยัน",
                "รอผู้สมัครยื่นเอกสารขอความอนุเคราะห์",
                "รอ HR ตรวจสอบ",
              ];
              let currentStepIndex = Math.min(completedSteps, totalSteps - 1);
              const nextStepLabel =
                currentStepIndex + 1 < totalSteps
                  ? currentStepLabel[currentStepIndex + 1]
                  : null;
              const circumference = 2 * Math.PI * 36;
              const progress = (completedSteps / totalSteps) * circumference;

              const summaryStepStatusMap: AppStatusEnum[] = [
                "PENDING_INTERVIEW",
                "PENDING_CONFIRMATION",
                "PENDING_REQUEST",
                "PENDING_REVIEW",
                "COMPLETE",
              ];
              const fmtDate = (dateStr: string): string => {
                const d = new Date(dateStr);
                const mo = ["\u0e21.\u0e04.", "\u0e01.\u0e1e.", "\u0e21\u0e35.\u0e04.", "\u0e40\u0e21.\u0e22.", "\u0e1e.\u0e04.", "\u0e21\u0e34.\u0e22.", "\u0e01.\u0e04.", "\u0e2a.\u0e04.", "\u0e01.\u0e22.", "\u0e15.\u0e04.", "\u0e1e.\u0e22.", "\u0e18.\u0e04."];
                return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear() + 543} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              };
              const fmtActor = (action: ApplicationStatusAction): string | undefined => {
                if (!action.actor) return undefined;
                const { fname, lname, roleId } = action.actor;
                if (roleId === 3 || (!fname && !lname)) return undefined;
                return `\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19 : ${[fname, lname].filter(Boolean).join(" ")}`;
              };
              const stepCompletedInfo: { date: string; operator?: string }[] = summaryStepStatusMap.map((targetStatus) => {
                const action = timelineActions.find((a) => a.newStatus === targetStatus);
                if (!action) return { date: "" };
                return { date: fmtDate(action.createdAt), operator: fmtActor(action) };
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

          {/* Documents Section - per type, matching pending page */}
          <div className="mb-6">
            <div className="space-y-4">
              {["Transcript", "Portfolio", "Resume"].map((docType) => {
                const uploadedDoc = selectedApplication.documents?.find(
                  (d) =>
                    d.type?.toLowerCase() === docType.toLowerCase() ||
                    d.name?.toLowerCase().startsWith(docType.toLowerCase()),
                );
                if (!uploadedDoc && docType !== "Transcript") return null;
                return (
                  <div key={docType}>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">
                      {docType}
                    </h5>
                    {uploadedDoc ? (
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
                          <span className="text-gray-700">
                            {uploadedDoc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadDocument(uploadedDoc.docFile)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="ดาวน์โหลด"
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
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePreviewDocument(uploadedDoc.docFile)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="ดูเอกสาร"
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
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              ข้อมูลผู้สมัคร
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-sm">
                    ระยะเวลาการฝึกงาน
                  </span>
                  <p className="text-gray-900 text-sm">
                    {formatDateThai(selectedApplication.startDate)} -{" "}
                    {formatDateThai(selectedApplication.endDate)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">
                    ชั่วโมงที่ต้องฝึก
                  </span>
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
                  <span className="text-gray-500 text-sm">
                    การศึกษาปัจจุบัน
                  </span>
                  <p className="text-gray-900 text-sm">
                    {getEducationLabel(selectedApplication.education)}
                  </p>
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
                  {selectedApplication.skill || "-"}
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

          {/* Mentor Info Dropdown */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => setShowMentorInfo(!showMentorInfo)}
              className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">
                ข้อมูลพี่เลี้ยง
              </span>
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
                      className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
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
                      <p className=" text-gray-900 text-sm">
                        {getMentor().name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
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
                      <p className="font-medium text-gray-900 text-sm">
                        {getMentor().email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
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
                      <p className="font-medium text-gray-900 text-sm">
                        {getMentor().phone}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-red-500 text-sm mt-3">
                  *หมายเหตุ:
                  หากประสงค์ให้ลงนามในเอกสารตอบรับกรุณาติดต่อพี่เลี้ยง
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // === ACCEPTED PANEL === (unified layout matching pending/rejected)
    if (statusCategory === "accepted") {
      const effectiveDetailed =
        getAcceptedEffectiveDetailed(selectedApplication);
      const isDocPassed =
        effectiveDetailed === "doc_passed" || effectiveDetailed === "completed";
      const isDocRejected = effectiveDetailed === "doc_rejected";
      const acceptedSubBadge = getAcceptedSubBadge(effectiveDetailed || "");

      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Name + external link */}
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedApplication.firstName} {selectedApplication.lastName}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowHistoryModal(true); fetchApplicationHistory(selectedApplication); }}
                className="p-2 text-gray-500 rounded-4xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18C6.9 18 5.04167 17.3625 3.425 16.0875C1.80833 14.8125 0.758333 13.1833 0.275 11.2C0.208333 10.95 0.258333 10.7208 0.425 10.5125C0.591667 10.3042 0.816667 10.1833 1.1 10.15C1.36667 10.1167 1.60833 10.1667 1.825 10.3C2.04167 10.4333 2.19167 10.6333 2.275 10.9C2.675 12.4 3.5 13.625 4.75 14.575C6 15.525 7.41667 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H5C5.28333 5 5.52083 5.09583 5.7125 5.2875C5.90417 5.47917 6 5.71667 6 6C6 6.28333 5.90417 6.52083 5.7125 6.7125C5.52083 6.90417 5.28333 7 5 7H1C0.716667 7 0.479167 6.90417 0.2875 6.7125C0.0958333 6.52083 0 6.28333 0 6V2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1C1.28333 1 1.52083 1.09583 1.7125 1.2875C1.90417 1.47917 2 1.71667 2 2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM10 8.6L12.5 11.1C12.6833 11.2833 12.775 11.5167 12.775 11.8C12.775 12.0833 12.6833 12.3167 12.5 12.5C12.3167 12.6833 12.0833 12.775 11.8 12.775C11.5167 12.775 11.2833 12.6833 11.1 12.5L8.3 9.7C8.2 9.6 8.125 9.4875 8.075 9.3625C8.025 9.2375 8 9.10833 8 8.975V5C8 4.71667 8.09583 4.47917 8.2875 4.2875C8.47917 4.09583 8.71667 4 9 4C9.28333 4 9.52083 4.09583 9.7125 4.2875C9.90417 4.47917 10 4.71667 10 5V8.6Z" fill="currentColor" />
                </svg>
              </button>
              <Link
                href={`/owner/dashboard/${selectedApplication.id}?from=applications${positionQueryAmp}`}
                className="p-2 text-gray-500 rounded-4xl hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>
          {/* Status badges */}
          <div className="flex flex-wrap gap-1 mb-4">
            <span className="text-sm px-3 py-1 rounded-full bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]">
              รับเข้าฝึกงาน
            </span>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${acceptedSubBadge.color}`}>
              {acceptedSubBadge.text}
            </span>
          </div>
          {/* Department */}
          <div className="flex items-center gap-2 text-gray-600 mb-6 border-b mtb-6 pb-4 border-[#CECFD2]">
            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM2 17H18V6H2V17ZM8 4H12V2H8V4Z" fill="#A80689" />
            </svg>
            <span className="text-sm">{positionInfo?.name || selectedApplication?.position || "ตำแหน่งงาน"}</span>
          </div>
          {/* Cancel button */}
          {isDocPassed && (
            <button
              onClick={() => { setCancelReason(""); setShowCancelModal(true); }}
              className="w-full flex items-center justify-center gap-2 bg-red-600 border-2 border-red-600 text-white py-3 rounded-lg hover:bg-red-700 hover:text-red-100 transition-colors font-medium mb-6 cursor-pointer"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.4167 5.77083L14.25 6.91667C14.0972 7.06944 13.9063 7.14931 13.6771 7.15625C13.4479 7.16319 13.25 7.08333 13.0833 6.91667C12.9306 6.76389 12.8542 6.56944 12.8542 6.33333C12.8542 6.09722 12.9306 5.90278 13.0833 5.75L14.2292 4.58333L13.0833 3.4375C12.9306 3.28472 12.8542 3.09375 12.8542 2.86458C12.8542 2.63542 12.9306 2.4375 13.0833 2.27083C13.25 2.10417 13.4479 2.02083 13.6771 2.02083C13.9063 2.02083 14.1042 2.10417 14.2708 2.27083L15.4167 3.41667L16.5625 2.25C16.7153 2.08333 16.9062 2 17.1354 2C17.3646 2 17.5625 2.08333 17.7292 2.25C17.8958 2.41667 17.9792 2.61458 17.9792 2.84375C17.9792 3.07292 17.8958 3.27083 17.7292 3.4375L16.5833 4.58333L17.75 5.75C17.9167 5.91667 17.9965 6.11111 17.9896 6.33333C17.9826 6.55556 17.8958 6.75 17.7292 6.91667C17.5625 7.06944 17.3681 7.14931 17.1458 7.15625C16.9236 7.16319 16.7292 7.08333 16.5625 6.91667L15.4167 5.77083ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM0 11.6667V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V11.6667C13.3333 12.125 13.1701 12.5174 12.8438 12.8438C12.5174 13.1701 12.125 13.3333 11.6667 13.3333H1.66667C1.20833 13.3333 0.815972 13.1701 0.489583 12.8438C0.163194 12.5174 0 12.125 0 11.6667ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z" fill="CurrentColor" />
              </svg>
              ยกเลิกฝึกงาน
            </button>
          )}
          {/* Document rejection reason (if applicable) */}
          {isDocRejected && selectedApplication.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-600 mb-1">เหตุผลที่เอกสารไม่ผ่าน</p>
                  <p className="text-gray-700 text-sm">{selectedApplication.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}
          {/* Status Progress Dropdown */}
          <div className="mb-6">
            <button onClick={() => setShowAdditionalInfo(!showAdditionalInfo)} className="w-full flex items-center justify-between py-3 cursor-pointer">
              <span className="text-md font-semibold text-gray-900">สถานะการดำเนินการ</span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAdditionalInfo ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {(() => {
              const totalSteps = 5;
              const completedSteps = Math.min(selectedApplication.step - 1, totalSteps);
              const currentStepLabel = ["รอผู้สมัครยื่นเอกสาร", "รอสัมภาษณ์", "รอการยืนยัน", "รอผู้สมัครยื่นเอกสารขอความอนุเคราะห์", "รอ HR ตรวจสอบ"];
              const currentStepIndex = Math.min(completedSteps, totalSteps - 1);
              const isAllCompleted = completedSteps >= totalSteps;
              const nextStepLabel = currentStepIndex + 1 < totalSteps && !isAllCompleted ? currentStepLabel[currentStepIndex + 1] : null;
              const circumference = 2 * Math.PI * 36;
              const progress = (completedSteps / totalSteps) * circumference;
              const summaryStepStatusMap: AppStatusEnum[] = ["PENDING_INTERVIEW", "PENDING_CONFIRMATION", "PENDING_REQUEST", "PENDING_REVIEW", "COMPLETE"];
              const fmtDate = (dateStr: string): string => { const d = new Date(dateStr); const mo = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]; return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear() + 543} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
              const fmtActor = (action: ApplicationStatusAction): string | undefined => { if (!action.actor) return undefined; const { fname, lname, roleId } = action.actor; if (roleId === 3 || (!fname && !lname)) return undefined; return `พนักงาน : ${[fname, lname].filter(Boolean).join(" ")}`; };
              const stepCompletedInfo: { date: string; operator?: string }[] = summaryStepStatusMap.map((targetStatus) => { const action = timelineActions.find((a) => a.newStatus === targetStatus); if (!action) return { date: "" }; return { date: fmtDate(action.createdAt), operator: fmtActor(action) }; });
              return (
                <div className="flex items-center gap-5 mb-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="36" stroke="#E5E7EB" strokeWidth="5" fill="none" />
                      <circle cx="40" cy="40" r="36" stroke="#A80689" strokeWidth="5" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-700">{completedSteps}/{totalSteps}</span>
                  </div>
                  <div>
                    {isAllCompleted ? (
                      <>
                        <p className="font-bold text-gray-900">การตรวจสอบเสร็จสิ้น</p>
                        {stepCompletedInfo[4]?.operator && (<p className="text-gray-400 text-sm">{stepCompletedInfo[4].operator}</p>)}
                        <p className="text-gray-400 text-sm">{stepCompletedInfo[4]?.date}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-gray-900">{currentStepLabel[currentStepIndex]}</p>
                        {stepCompletedInfo[currentStepIndex - 1]?.date && (
                          <p className="text-gray-400 text-sm">{stepCompletedInfo[currentStepIndex - 1].date}</p>
                        )}
                        {stepCompletedInfo[currentStepIndex - 1]?.operator && (
                          <p className="text-gray-400 text-sm">{stepCompletedInfo[currentStepIndex - 1].operator}</p>
                        )}
                        <p className="text-gray-400 text-sm">กำลังดำเนินการ</p>
                        {nextStepLabel && (<p className="text-gray-400 text-sm">ขั้นตอนถัดไป : {nextStepLabel}</p>)}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
            {showAdditionalInfo && <div className="pb-2">{renderStatusTimeline(selectedApplication)}</div>}
          </div>
          {/* Documents per-type */}
          <div className="mb-6">
            <div className="space-y-4">
              {["Transcript", "Portfolio", "Resume"].map((docType) => {
                const uploadedDoc = selectedApplication.documents?.find((d) => d.type?.toLowerCase() === docType.toLowerCase() || d.name?.toLowerCase().startsWith(docType.toLowerCase()));
                if (!uploadedDoc && docType !== "Transcript") return null;
                return (
                  <div key={docType}>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">{docType}</h5>
                    {uploadedDoc ? (
                      <div className="group flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z" fill="#A80689" /></svg>
                          <span className="text-gray-700">{uploadedDoc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDownloadDocument(uploadedDoc.docFile)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="ดาวน์โหลด">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                          <button onClick={() => handlePreviewDocument(uploadedDoc.docFile)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="ดูเอกสาร">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 16H11C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14H5C4.71667 14 4.47917 14.0958 4.2875 14.2875C4.09583 14.4792 4 14.7167 4 15C4 15.2833 4.09583 15.5208 4.2875 15.7125C4.47917 15.9042 4.71667 16 5 16ZM5 12H11C11.2833 12 11.5208 11.9042 11.7125 11.7125C11.9042 11.5208 12 11.2833 12 11C12 10.7167 11.9042 10.4792 11.7125 10.2875C11.5208 10.0958 11.2833 10 11 10H5C4.71667 10 4.47917 10.0958 4.2875 10.2875C4.09583 10.4792 4 10.7167 4 11C4 11.2833 4.09583 11.5208 4.2875 11.7125C4.47917 11.9042 4.71667 12 5 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.69583 0.05 9.9375 0.15C10.1792 0.25 10.3917 0.391667 10.575 0.575L15.425 5.425C15.6083 5.60833 15.75 5.82083 15.85 6.0625C15.95 6.30417 16 6.55833 16 6.825V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 6V2H2V18H14V7H10C9.71667 7 9.47917 6.90417 9.2875 6.7125C9.09583 6.52083 9 6.28333 9 6Z" fill="#A80689" /></svg>
                        <span className="text-gray-400">ยังไม่มีเอกสารแนบ</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Personal Info */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">ข้อมูลผู้สมัคร</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-sm">ระยะเวลาการฝึกงาน</span><p className="text-gray-900 text-sm">{formatDateThai(selectedApplication.startDate)} - {formatDateThai(selectedApplication.endDate)}</p></div>
                <div><span className="text-gray-500 text-sm">ชั่วโมงที่ต้องฝึก</span><p className="text-gray-900 text-sm">{selectedApplication.trainingHours} ชั่วโมง</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-sm">อีเมล</span><p className="text-gray-900 text-sm">{selectedApplication.email}</p></div>
                <div><span className="text-gray-500 text-sm">เพศ</span><p className="text-gray-900 text-sm">{selectedApplication.gender === "male" ? "ชาย" : "หญิง"}</p></div>
              </div>
              <div><span className="text-gray-500 text-sm">เบอร์โทร</span><p className="text-gray-900 text-sm">{selectedApplication.phone}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-sm">การศึกษาปัจจุบัน</span><p className="text-gray-900 text-sm">{getEducationLabel(selectedApplication.education)}</p></div>
                <div><span className="text-gray-500 text-sm">ชื่อสถาบัน</span><p className="text-gray-900 text-sm">{selectedApplication.institution}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500 text-sm">คณะ</span><p className="text-gray-900 text-sm">{selectedApplication.faculty || "-"}</p></div>
                <div><span className="text-gray-500 text-sm">สาขา</span><p className="text-gray-900 text-sm">{selectedApplication.major}</p></div>
              </div>
              <div><span className="text-gray-500 text-sm">ทักษะด้านต่าง ๆ ของผู้สมัคร</span><p className="text-gray-900 text-sm">{selectedApplication.skill || "-"}</p></div>
              <div><span className="text-gray-500 text-sm">สิ่งที่คาดหวังจากการฝึกงาน</span><p className="text-gray-900 text-sm">{selectedApplication.expectation}</p></div>
            </div>
          </div>
          {/* Mentor Info Dropdown */}
          <div className="border-t border-gray-100">
            <button onClick={() => setShowMentorInfo(!showMentorInfo)} className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="font-semibold text-gray-900">ข้อมูลพี่เลี้ยง</span>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${showMentorInfo ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showMentorInfo && (
              <div className="pb-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <div><p className="text-gray-400 text-sm">ชื่อพี่เลี้ยง</p><p className=" text-gray-900 text-sm">{getMentor().name}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <div><p className="text-gray-400 text-sm">อีเมล</p><p className="font-medium text-gray-900 text-sm">{getMentor().email}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <div><p className="text-gray-400 text-sm">เบอร์โทร</p><p className="font-medium text-gray-900 text-sm">{getMentor().phone}</p></div>
                  </div>
                </div>
                <p className="text-red-500 text-sm mt-3">*หมายเหตุ: หากประสงค์ให้ลงนามในเอกสารตอบรับกรุณาติดต่อพี่เลี้ยง</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // === PENDING PANEL === (matches pending/page.tsx, default behavior)
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Header with name and external link */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedApplication.firstName} {selectedApplication.lastName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowHistoryModal(true); fetchApplicationHistory(selectedApplication); }}
              className="p-2 text-gray-500 rounded-4xl hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18C6.9 18 5.04167 17.3625 3.425 16.0875C1.80833 14.8125 0.758333 13.1833 0.275 11.2C0.208333 10.95 0.258333 10.7208 0.425 10.5125C0.591667 10.3042 0.816667 10.1833 1.1 10.15C1.36667 10.1167 1.60833 10.1667 1.825 10.3C2.04167 10.4333 2.19167 10.6333 2.275 10.9C2.675 12.4 3.5 13.625 4.75 14.575C6 15.525 7.41667 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H5C5.28333 5 5.52083 5.09583 5.7125 5.2875C5.90417 5.47917 6 5.71667 6 6C6 6.28333 5.90417 6.52083 5.7125 6.7125C5.52083 6.90417 5.28333 7 5 7H1C0.716667 7 0.479167 6.90417 0.2875 6.7125C0.0958333 6.52083 0 6.28333 0 6V2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1C1.28333 1 1.52083 1.09583 1.7125 1.2875C1.90417 1.47917 2 1.71667 2 2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM10 8.6L12.5 11.1C12.6833 11.2833 12.775 11.5167 12.775 11.8C12.775 12.0833 12.6833 12.3167 12.5 12.5C12.3167 12.6833 12.0833 12.775 11.8 12.775C11.5167 12.775 11.2833 12.6833 11.1 12.5L8.3 9.7C8.2 9.6 8.125 9.4875 8.075 9.3625C8.025 9.2375 8 9.10833 8 8.975V5C8 4.71667 8.09583 4.47917 8.2875 4.2875C8.47917 4.09583 8.71667 4 9 4C9.28333 4 9.52083 4.09583 9.7125 4.2875C9.90417 4.47917 10 4.71667 10 5V8.6Z" fill="currentColor" />
              </svg>
            </button>
            <Link
              href={`/owner/dashboard/${selectedApplication.id}?from=applications${positionQueryAmp}`}
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
        {/* Status badge below name */}
        <div className="flex flex-wrap gap-1 mb-4">
          <span className={`text-sm px-3 py-1 rounded-full ${badge.color}`}>
            {badge.text}
          </span>
        </div>

        {/* Department */}
        <div className="flex items-center gap-2 text-gray-600 mb-6 border-b mtb-6 pb-4 border-[#CECFD2]">
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
            {positionInfo?.name ||
              selectedApplication?.position ||
              "ตำแหน่งงาน"}
          </span>
        </div>

        {/* Action buttons based on step */}
        {selectedApplication.step === 2 &&
          !interviewedApps.includes(selectedApplication.id) && (
            <button
              onClick={() => setShowInterviewConfirm(true)}
              className="flex items-center justify-center gap-2 bg-primary-600 text-white py-3 border border-primary-600 rounded-lg hover:bg-primary-700 hover:text-white transition-colors w-full font-medium cursor-pointer mb-6"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.16667 9.83333L5.375 8.04167C5.22222 7.88889 5.02778 7.8125 4.79167 7.8125C4.55556 7.8125 4.36111 7.88889 4.20833 8.04167C4.05556 8.19444 3.97917 8.38889 3.97917 8.625C3.97917 8.86111 4.05556 9.05556 4.20833 9.20833L6.58333 11.5833C6.75 11.75 6.94444 11.8333 7.16667 11.8333C7.38889 11.8333 7.58333 11.75 7.75 11.5833L12.4583 6.875C12.6111 6.72222 12.6875 6.52778 12.6875 6.29167C12.6875 6.05556 12.6111 5.86111 12.4583 5.70833C12.3056 5.55556 12.1111 5.47917 11.875 5.47917C11.6389 5.47917 11.4444 5.55556 11.2917 5.70833L7.16667 9.83333ZM8.33333 16.6667C7.18056 16.6667 6.09722 16.4479 5.08333 16.0104C4.06944 15.5729 3.1875 14.9792 2.4375 14.2292C1.6875 13.4792 1.09375 12.5972 0.65625 11.5833C0.21875 10.5694 0 9.48611 0 8.33333C0 7.18056 0.21875 6.09722 0.65625 5.08333C1.09375 4.06944 1.6875 3.1875 2.4375 2.4375C3.1875 1.6875 4.06944 1.09375 5.08333 0.65625C6.09722 0.21875 7.18056 0 8.33333 0C9.48611 0 10.5694 0.21875 11.5833 0.65625C12.5972 1.09375 13.4792 1.6875 14.2292 2.4375C14.9792 3.1875 15.5729 4.06944 16.0104 5.08333C16.4479 6.09722 16.6667 7.18056 16.6667 8.33333C16.6667 9.48611 16.4479 10.5694 16.0104 11.5833C15.5729 12.5972 14.9792 13.4792 14.2292 14.2292C13.4792 14.9792 12.5972 15.5729 11.5833 16.0104C10.5694 16.4479 9.48611 16.6667 8.33333 16.6667ZM8.33333 15C10.1944 15 11.7708 14.3542 13.0625 13.0625C14.3542 11.7708 15 10.1944 15 8.33333C15 6.47222 14.3542 4.89583 13.0625 3.60417C11.7708 2.3125 10.1944 1.66667 8.33333 1.66667C6.47222 1.66667 4.89583 2.3125 3.60417 3.60417C2.3125 4.89583 1.66667 6.47222 1.66667 8.33333C1.66667 10.1944 2.3125 11.7708 3.60417 13.0625C4.89583 14.3542 6.47222 15 8.33333 15Z"
                  fill="CurrentColor"
                />
              </svg>
              ยืนยันผลการสัมภาษณ์
            </button>
          )}

        {(selectedApplication.step === 3 ||
          (selectedApplication.step === 2 &&
            interviewedApps.includes(selectedApplication.id))) &&
          !approvedApps.includes(selectedApplication.id) &&
          !rejectedApps.includes(selectedApplication.id) &&
          selectedApplication.status !== "rejected" && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => {
                  setRejectReason("");
                  setShowRejectModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 border-2 bg-red-600 border-red-600 text-white   py-3 rounded-lg hover:bg-red-700 hover:text-white transition-colors font-medium cursor-pointer"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.33333 9.5L10.75 11.9167C10.9028 12.0694 11.0972 12.1458 11.3333 12.1458C11.5694 12.1458 11.7639 12.0694 11.9167 11.9167C12.0694 11.7639 12.1458 11.5694 12.1458 11.3333C12.1458 11.0972 12.0694 10.9028 11.9167 10.75L9.5 8.33333L11.9167 5.91667C12.0694 5.76389 12.1458 5.56944 12.1458 5.33333C12.1458 5.09722 12.0694 4.90278 11.9167 4.75C11.7639 4.59722 11.5694 4.52083 11.3333 4.52083C11.0972 4.52083 10.9028 4.59722 10.75 4.75L8.33333 7.16667L5.91667 4.75C5.76389 4.59722 5.56944 4.52083 5.33333 4.52083C5.09722 4.52083 4.90278 4.59722 4.75 4.75C4.59722 4.90278 4.52083 5.09722 4.52083 5.33333C4.52083 5.56944 4.59722 5.76389 4.75 5.91667L7.16667 8.33333L4.75 10.75C4.59722 10.9028 4.52083 11.0972 4.52083 11.3333C4.52083 11.5694 4.59722 11.7639 4.75 11.9167C4.90278 12.0694 5.09722 12.1458 5.33333 12.1458C5.56944 12.1458 5.76389 12.0694 5.91667 11.9167L8.33333 9.5ZM8.33333 16.6667C7.18056 16.6667 6.09722 16.4479 5.08333 16.0104C4.06944 15.5729 3.1875 14.9792 2.4375 14.2292C1.6875 13.4792 1.09375 12.5972 0.65625 11.5833C0.21875 10.5694 0 9.48611 0 8.33333C0 7.18056 0.21875 6.09722 0.65625 5.08333C1.09375 4.06944 1.6875 3.1875 2.4375 2.4375C3.1875 1.6875 4.06944 1.09375 5.08333 0.65625C6.09722 0.21875 7.18056 0 8.33333 0C9.48611 0 10.5694 0.21875 11.5833 0.65625C12.5972 1.09375 13.4792 1.6875 14.2292 2.4375C14.9792 3.1875 15.5729 4.06944 16.0104 5.08333C16.4479 6.09722 16.6667 7.18056 16.6667 8.33333C16.6667 9.48611 16.4479 10.5694 16.0104 11.5833C15.5729 12.5972 14.9792 13.4792 14.2292 14.2292C13.4792 14.9792 12.5972 15.5729 11.5833 16.0104C10.5694 16.4479 9.48611 16.6667 8.33333 16.6667ZM8.33333 15C10.1944 15 11.7708 14.3542 13.0625 13.0625C14.3542 11.7708 15 10.1944 15 8.33333C15 6.47222 14.3542 4.89583 13.0625 3.60417C11.7708 2.3125 10.1944 1.66667 8.33333 1.66667C6.47222 1.66667 4.89583 2.3125 3.60417 3.60417C2.3125 4.89583 1.66667 6.47222 1.66667 8.33333C1.66667 10.1944 2.3125 11.7708 3.60417 13.0625C4.89583 14.3542 6.47222 15 8.33333 15Z"
                    fill="CurrentColor"
                  />
                </svg>
                ไม่รับเข้าฝึกงาน
              </button>
              <button
                onClick={() => setShowApproveConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 border border-green-600 transition-colors font-medium cursor-pointer"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.16667 9.83333L5.375 8.04167C5.22222 7.88889 5.02778 7.8125 4.79167 7.8125C4.55556 7.8125 4.36111 7.88889 4.20833 8.04167C4.05556 8.19444 3.97917 8.38889 3.97917 8.625C3.97917 8.86111 4.05556 9.05556 4.20833 9.20833L6.58333 11.5833C6.75 11.75 6.94444 11.8333 7.16667 11.8333C7.38889 11.8333 7.58333 11.75 7.75 11.5833L12.4583 6.875C12.6111 6.72222 12.6875 6.52778 12.6875 6.29167C12.6875 6.05556 12.6111 5.86111 12.4583 5.70833C12.3056 5.55556 12.1111 5.47917 11.875 5.47917C11.6389 5.47917 11.4444 5.55556 11.2917 5.70833L7.16667 9.83333ZM8.33333 16.6667C7.18056 16.6667 6.09722 16.4479 5.08333 16.0104C4.06944 15.5729 3.1875 14.9792 2.4375 14.2292C1.6875 13.4792 1.09375 12.5972 0.65625 11.5833C0.21875 10.5694 0 9.48611 0 8.33333C0 7.18056 0.21875 6.09722 0.65625 5.08333C1.09375 4.06944 1.6875 3.1875 2.4375 2.4375C3.1875 1.6875 4.06944 1.09375 5.08333 0.65625C6.09722 0.21875 7.18056 0 8.33333 0C9.48611 0 10.5694 0.21875 11.5833 0.65625C12.5972 1.09375 13.4792 1.6875 14.2292 2.4375C14.9792 3.1875 15.5729 4.06944 16.0104 5.08333C16.4479 6.09722 16.6667 7.18056 16.6667 8.33333C16.6667 9.48611 16.4479 10.5694 16.0104 11.5833C15.5729 12.5972 14.9792 13.4792 14.2292 14.2292C13.4792 14.9792 12.5972 15.5729 11.5833 16.0104C10.5694 16.4479 9.48611 16.6667 8.33333 16.6667ZM8.33333 15C10.1944 15 11.7708 14.3542 13.0625 13.0625C14.3542 11.7708 15 10.1944 15 8.33333C15 6.47222 14.3542 4.89583 13.0625 3.60417C11.7708 2.3125 10.1944 1.66667 8.33333 1.66667C6.47222 1.66667 4.89583 2.3125 3.60417 3.60417C2.3125 4.89583 1.66667 6.47222 1.66667 8.33333C1.66667 10.1944 2.3125 11.7708 3.60417 13.0625C4.89583 14.3542 6.47222 15 8.33333 15Z"
                    fill="CurrentColor"
                  />
                </svg>
                รับเข้าฝึกงาน
              </button>
            </div>
          )}

        {/* Status Progress Dropdown - matching pending page layout */}
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
            let completedSteps = 0;
            if (
              interviewedApps.includes(selectedApplication.id) &&
              selectedApplication.step === 2
            ) {
              completedSteps = 2;
            } else if (
              selectedApplication.step >= 3 ||
              selectedApplication.detailedStatus === "waiting_confirm"
            ) {
              completedSteps = 2;
            } else if (selectedApplication.step === 2) {
              completedSteps = 1;
            } else {
              completedSteps = 0;
            }
            const currentStepLabel = [
              "รอผู้สมัครยื่นเอกสาร",
              "รอสัมภาษณ์",
              "รอการยืนยัน",
              "รอผู้สมัครยื่นเอกสารขอความอนุเคราะห์",
              "รอ HR ตรวจสอบ",
            ];
            let currentStepIndex = 0;
            if (
              interviewedApps.includes(selectedApplication.id) &&
              selectedApplication.step === 2
            ) {
              currentStepIndex = 2;
            } else if (
              selectedApplication.step >= 3 ||
              selectedApplication.detailedStatus === "waiting_confirm"
            ) {
              currentStepIndex = 2;
            } else if (selectedApplication.step === 2) {
              currentStepIndex = 1;
            } else {
              currentStepIndex = 0;
            }
            const nextStepLabel =
              currentStepIndex + 1 < totalSteps
                ? currentStepLabel[currentStepIndex + 1]
                : null;
            const circumference = 2 * Math.PI * 36;
            const progress = (completedSteps / totalSteps) * circumference;

            const summaryStepStatusMap: AppStatusEnum[] = [
              "PENDING_INTERVIEW",
              "PENDING_CONFIRMATION",
              "PENDING_REQUEST",
              "PENDING_REVIEW",
              "COMPLETE",
            ];
            const fmtDate = (dateStr: string): string => {
              const d = new Date(dateStr);
              const mo = ["\u0e21.\u0e04.", "\u0e01.\u0e1e.", "\u0e21\u0e35.\u0e04.", "\u0e40\u0e21.\u0e22.", "\u0e1e.\u0e04.", "\u0e21\u0e34.\u0e22.", "\u0e01.\u0e04.", "\u0e2a.\u0e04.", "\u0e01.\u0e22.", "\u0e15.\u0e04.", "\u0e1e.\u0e22.", "\u0e18.\u0e04."];
              return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear() + 543} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            };
            const fmtActor = (action: ApplicationStatusAction): string | undefined => {
              if (!action.actor) return undefined;
              const { fname, lname, roleId } = action.actor;
              if (roleId === 3 || (!fname && !lname)) return undefined;
              return `\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19 : ${[fname, lname].filter(Boolean).join(" ")}`;
            };
            const stepCompletedInfo: { date: string; operator?: string }[] = summaryStepStatusMap.map((targetStatus) => {
              const action = timelineActions.find((a) => a.newStatus === targetStatus);
              if (!action) return { date: "" };
              return { date: fmtDate(action.createdAt), operator: fmtActor(action) };
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

        {/* Documents Section - moved before ข้อมูลผู้สมัคร to match pending page */}
        <div className="mb-6">
          <div className="space-y-4">
            {["Transcript", "Portfolio", "Resume"].map((docType) => {
              const uploadedDoc = selectedApplication.documents?.find(
                (d) =>
                  d.type?.toLowerCase() === docType.toLowerCase() ||
                  d.name?.toLowerCase().startsWith(docType.toLowerCase()),
              );
              if (!uploadedDoc && docType !== "Transcript") return null;
              return (
                <div key={docType}>
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">
                    {docType}
                  </h5>
                  {uploadedDoc ? (
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
                        <span className="text-gray-700">
                          {uploadedDoc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadDocument(uploadedDoc.docFile)}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="ดาวน์โหลด"
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
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePreviewDocument(uploadedDoc.docFile)}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="ดูเอกสาร"
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
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
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
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            ข้อมูลผู้สมัคร
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 text-sm">
                  ระยะเวลาการฝึกงาน
                </span>
                <p className="text-gray-900 text-sm">
                  {formatDateThai(selectedApplication.startDate)} -{" "}
                  {formatDateThai(selectedApplication.endDate)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">
                  ชั่วโมงที่ต้องฝึก
                </span>
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
                <span className="text-gray-500 text-sm">
                  การศึกษาปัจจุบัน
                </span>
                <p className="text-gray-900 text-sm">
                  {getEducationLabel(selectedApplication.education)}
                </p>
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
                {selectedApplication.skill || "-"}
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

        {/* Expectation Section */}
        {/* <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-2">
            สิ่งที่คาดหวังจากการฝึกงาน
          </h4>
          <p className="text-sm text-gray-600">
            {selectedApplication.expectation}
          </p>
        </div> */}

        {/* Analysis Documents Section - Only for steps 4-7 or approved apps */}
        {(selectedApplication.step >= 4 ||
          approvedApps.includes(selectedApplication.id)) && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900">
                  เอกสารขอความอนุเคราะห์
                </h4>
                {/* Show status badge based on effective step */}
                {docUploadedApps.includes(selectedApplication.id) && (
                  <span className="text-sm px-3 py-1 rounded-full bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]">
                    ส่งเอกสารแล้ว
                  </span>
                )}
                {!docUploadedApps.includes(selectedApplication.id) &&
                  approvedApps.includes(selectedApplication.id) &&
                  (selectedApplication.step >= 5 ||
                    (selectedApplication.analysisDocuments &&
                      selectedApplication.analysisDocuments.length > 0)) && (
                    <button className="text-sm px-3 py-1 rounded-full bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FEDF89]">
                      รอส่งเอกสาร
                    </button>
                  )}
                {!docUploadedApps.includes(selectedApplication.id) &&
                  selectedApplication.step === 5 &&
                  !approvedApps.includes(selectedApplication.id) &&
                  !docApprovedApps.includes(selectedApplication.id) &&
                  !docRejectedApps.includes(selectedApplication.id) && (
                    <button className="text-sm px-3 py-1 rounded-full bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FEDF89]">
                      รอส่งเอกสาร
                    </button>
                  )}
                {!docUploadedApps.includes(selectedApplication.id) &&
                  (selectedApplication.step === 7 ||
                    docApprovedApps.includes(selectedApplication.id)) && (
                    <span className="text-sm px-3 py-1 rounded-full bg-[#DCFAE6] text-[#085D3A] font-semibold border border-[#A9EFC5]">
                      ส่งเอกสารแล้ว
                    </span>
                  )}
                {!docUploadedApps.includes(selectedApplication.id) &&
                  selectedApplication.step === 6 &&
                  selectedApplication.detailedStatus === "doc_rejected" && (
                    <span className="text-sm px-3 py-1 rounded-full bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA]">
                      เอกสารไม่ผ่าน
                    </span>
                  )}
                {!docUploadedApps.includes(selectedApplication.id) &&
                  docRejectedApps.includes(selectedApplication.id) && (
                    <span className="text-sm px-3 py-1 rounded-full bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA]">
                      เอกสารไม่ผ่าน
                    </span>
                  )}
                {!docUploadedApps.includes(selectedApplication.id) &&
                  selectedApplication.step === 4 &&
                  !approvedApps.includes(selectedApplication.id) && (
                    <span className="text-sm px-3 py-1 rounded-full bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FEDF89]">
                      รอเอกสารขอความอนุเคราะห์
                    </span>
                  )}
                {!docUploadedApps.includes(selectedApplication.id) &&
                  approvedApps.includes(selectedApplication.id) &&
                  selectedApplication.step < 5 &&
                  !(
                    selectedApplication.analysisDocuments &&
                    selectedApplication.analysisDocuments.length > 0
                  ) && (
                    <span className="text-sm px-3 py-1 rounded-full bg-[#FEF0C7] text-[#7A2E0E] font-semibold border border-[#FEDF89]">
                      รอเอกสารขอความอนุเคราะห์
                    </span>
                  )}
              </div>

              {hasAnalysisDocuments && (
                <>
                  {selectedApplication.analysisDocuments!.map((doc, index) => (
                    <button
                      key={index}
                      className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full border mb-3 ${doc.status === "rejected" ||
                        docRejectedApps.includes(selectedApplication.id)
                        ? "bg-red-50 border-red-200 text-red-600"
                        : doc.status === "approved" ||
                          docApprovedApps.includes(selectedApplication.id)
                          ? "bg-green-50 border-green-200 text-green-600"
                          : "bg-green-50 border-green-200 text-green-600"
                        }`}
                    >
                      <div
                        className={`flex items-center gap-2 ${doc.status === "rejected" || docRejectedApps.includes(selectedApplication.id) ? "text-red-600" : "text-green-600"}`}
                      >
                        {doc.status === "rejected" ||
                          docRejectedApps.includes(selectedApplication.id) ? (
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        ) : (
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        )}
                        <span className="text-sm">
                          {doc.status === "rejected" ||
                            docRejectedApps.includes(selectedApplication.id)
                            ? "ไม่ต้องการให้กองงานเซ็นเอกสาร"
                            : "ต้องการให้กองงานเซ็นเอกสาร"}
                        </span>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Request analysis document button - always show */}
              <button
                onClick={() => {
                  if (
                    !isWaitingAnalysisDoc ||
                    docUploadedApps.includes(selectedApplication.id)
                  ) {
                    setShowDocumentPopup(true);
                  }
                }}
                disabled={
                  isWaitingAnalysisDoc &&
                  !docUploadedApps.includes(selectedApplication.id)
                }
                className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg w-full justify-center text-sm font-medium transition-colors
        ${isWaitingAnalysisDoc &&
                    !docUploadedApps.includes(selectedApplication.id)
                    ? "bg-primary-600 text-white border border-gray-300 cursor-not-allowed opacity-50"
                    : "bg-primary-600 text-white border border-primary-600 hover:bg-white hover:text-primary-600 cursor-pointer"
                  }
    `}
              >
                <svg
                  width="11"
                  height="14"
                  viewBox="0 0 11 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.33333 10.6667H7.33333C7.52222 10.6667 7.68056 10.6028 7.80833 10.475C7.93611 10.3472 8 10.1889 8 10C8 9.81111 7.93611 9.65278 7.80833 9.525C7.68056 9.39722 7.52222 9.33333 7.33333 9.33333H3.33333C3.14444 9.33333 2.98611 9.39722 2.85833 9.525C2.73056 9.65278 2.66667 9.81111 2.66667 10C2.66667 10.1889 2.73056 10.3472 2.85833 10.475C2.98611 10.6028 3.14444 10.6667 3.33333 10.6667ZM3.33333 8H7.33333C7.52222 8 7.68056 7.93611 7.80833 7.80833C7.93611 7.68056 8 7.52222 8 7.33333C8 7.14444 7.93611 6.98611 7.80833 6.85833C7.68056 6.73056 7.52222 6.66667 7.33333 6.66667H3.33333C3.14444 6.66667 2.98611 6.73056 2.85833 6.85833C2.73056 6.98611 2.66667 7.14444 2.66667 7.33333C2.66667 7.52222 2.73056 7.68056 2.85833 7.80833C2.98611 7.93611 3.14444 8 3.33333 8ZM1.33333 13.3333C0.966667 13.3333 0.652778 13.2028 0.391667 12.9417C0.130556 12.6806 0 12.3667 0 12V1.33333C0 0.966667 0.130556 0.652778 0.391667 0.391667C0.652778 0.130556 0.966667 0 1.33333 0H6.11667C6.29444 0 6.46389 0.0333333 6.625 0.1C6.78611 0.166667 6.92778 0.261111 7.05 0.383333L10.2833 3.61667C10.4056 3.73889 10.5 3.88056 10.5667 4.04167C10.6333 4.20278 10.6667 4.37222 10.6667 4.55V12C10.6667 12.3667 10.5361 12.6806 10.275 12.9417C10.0139 13.2028 9.7 13.3333 9.33333 13.3333H1.33333ZM6 4V1.33333H1.33333V12H9.33333V4.66667H6.66667C6.47778 4.66667 6.31944 4.60278 6.19167 4.475C6.06389 4.34722 6 4.18889 6 4Z"
                    fill="currentColor"
                  />
                </svg>
                เอกสารขอความอนุเคราะห์
              </button>

              {/* Document Request Popup */}
              {showDocumentPopup && selectedApplication && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 relative">
                    {/* Close Button */}
                    <button
                      onClick={() => {
                        setShowDocumentPopup(false);
                        setUploadedFileName("");
                        setShowUploadSuccess(false);
                      }}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
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

                    {/* Upload Success Toast */}
                    {showUploadSuccess && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 z-10">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                            <svg
                              className="w-6 h-6 text-green-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-900 font-medium">
                            อัปโหลดเอกสารเสร็จสิ้น
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-primary-600 mb-1">
                        <svg
                          width="20"
                          height="24"
                          viewBox="0 0 20 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6 16H14C14.2833 16 14.5208 15.9042 14.7125 15.7125C14.9042 15.5208 15 15.2833 15 15C15 14.7167 14.9042 14.4792 14.7125 14.2875C14.5208 14.0958 14.2833 14 14 14H6C5.71667 14 5.47917 14.0958 5.2875 14.2875C5.09583 14.4792 5 14.7167 5 15C5 15.2833 5.09583 15.5208 5.2875 15.7125C5.47917 15.9042 5.71667 16 6 16ZM6 12H14C14.2833 12 14.5208 11.9042 14.7125 11.7125C14.9042 11.5208 15 11.2833 15 11C15 10.7167 14.9042 10.4792 14.7125 10.2875C14.5208 10.0958 14.2833 10 14 10H6C5.71667 10 5.47917 10.0958 5.2875 10.2875C5.09583 10.4792 5 10.7167 5 11C5 11.2833 5.09583 11.5208 5.2875 11.7125C5.47917 11.9042 5.71667 12 6 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H11.175C11.4417 0 11.6958 0.05 11.9375 0.15C12.1792 0.25 12.3917 0.391667 12.575 0.575L17.425 5.425C17.6083 5.60833 17.75 5.82083 17.85 6.0625C17.95 6.30417 18 6.55833 18 6.825V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM11 6V2H2V18H16V7H12C11.7167 7 11.4792 6.90417 11.2875 6.7125C11.0958 6.52083 11 6.28333 11 6Z"
                            fill="#A80689"
                          />
                        </svg>
                        <h3 className="text-lg font-semibold">
                          เอกสารขอความอนุเคราะห์
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm">
                        ดาวน์โหลดเอกสารขอความอนุเคราะห์ เซ็นลายเซ็น แล้วอัปโหลดให้
                        HR
                      </p>
                    </div>

                    {/* User Info Box */}
                    <div className="bg-primary-50 rounded-lg p-4 mb-6">
                      <p className="font-semibold text-gray-900">
                        {selectedApplication.firstName}{" "}
                        {selectedApplication.lastName}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {selectedApplication.position || selectedApplication.department || "-"}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {selectedApplication.institution}
                      </p>
                    </div>

                    {/* Step 1: Download */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          1
                        </span>
                        <h4 className="font-medium text-gray-900">
                          ดาวน์โหลดเอกสารขอความอนุเคราะห์
                        </h4>
                      </div>
                      <div className="group flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-primary-50 hover:border-primary-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M6 16H14C14.2833 16 14.5208 15.9042 14.7125 15.7125C14.9042 15.5208 15 15.2833 15 15C15 14.7167 14.9042 14.4792 14.7125 14.2875C14.5208 14.0958 14.2833 14 14 14H6C5.71667 14 5.47917 14.0958 5.2875 14.2875C5.09583 14.4792 5 14.7167 5 15C5 15.2833 5.09583 15.5208 5.2875 15.7125C5.47917 15.9042 5.71667 16 6 16ZM6 12H14C14.2833 12 14.5208 11.9042 14.7125 11.7125C14.9042 11.5208 15 11.2833 15 11C15 10.7167 14.9042 10.4792 14.7125 10.2875C14.5208 10.0958 14.2833 10 14 10H6C5.71667 10 5.47917 10.0958 5.2875 10.2875C5.09583 10.4792 5 10.7167 5 11C5 11.2833 5.09583 11.5208 5.2875 11.7125C5.47917 11.9042 5.71667 12 6 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H11.175C11.4417 0 11.6958 0.05 11.9375 0.15C12.1792 0.25 12.3917 0.391667 12.575 0.575L17.425 5.425C17.6083 5.60833 17.75 5.82083 17.85 6.0625C17.95 6.30417 18 6.55833 18 6.825V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM11 6V2H2V18H16V7H12C11.7167 7 11.4792 6.90417 11.2875 6.7125C11.0958 6.52083 11 6.28333 11 6Z"
                              fill="#A80689"
                            />
                          </svg>
                          <span className="text-gray-700">
                            เอกสารขอความอนุเคราะห์.PDF
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleDownloadDocument(
                                selectedApplication.analysisDocuments?.[0]
                                  ?.docFile,
                              )
                            }
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="ดาวน์โหลด"
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
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handlePreviewDocument(
                                selectedApplication.analysisDocuments?.[0]
                                  ?.docFile,
                              )
                            }
                            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                            title="ดูเอกสาร"
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
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Upload */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          2
                        </span>
                        <h4 className="font-medium text-gray-900">
                          อัปโหลดเอกสารที่เซ็นแล้ว
                        </h4>
                      </div>

                      {/* Show uploaded file if already uploaded in localStorage OR if mock data has doc_sent/doc_rejected/doc_passed status */}
                      {(docUploadedApps.includes(selectedApplication.id) &&
                        uploadedFilenames[selectedApplication.id]) ||
                        selectedApplication.detailedStatus === "doc_sent" ||
                        selectedApplication.detailedStatus === "doc_rejected" ||
                        selectedApplication.detailedStatus === "doc_passed" ? (
                        <div className="group flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-primary-50 hover:border-primary-600 transition-colors">
                          <div className="flex items-center gap-3">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 16H14C14.2833 16 14.5208 15.9042 14.7125 15.7125C14.9042 15.5208 15 15.2833 15 15C15 14.7167 14.9042 14.4792 14.7125 14.2875C14.5208 14.0958 14.2833 14 14 14H6C5.71667 14 5.47917 14.0958 5.2875 14.2875C5.09583 14.4792 5 14.7167 5 15C5 15.2833 5.09583 15.5208 5.2875 15.7125C5.47917 15.9042 5.71667 16 6 16ZM6 12H14C14.2833 12 14.5208 11.9042 14.7125 11.7125C14.9042 11.5208 15 11.2833 15 11C15 10.7167 14.9042 10.4792 14.7125 10.2875C14.5208 10.0958 14.2833 10 14 10H6C5.71667 10 5.47917 10.0958 5.2875 10.2875C5.09583 10.4792 5 10.7167 5 11C5 11.2833 5.09583 11.5208 5.2875 11.7125C5.47917 11.9042 5.71667 12 6 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H11.175C11.4417 0 11.6958 0.05 11.9375 0.15C12.1792 0.25 12.3917 0.391667 12.575 0.575L17.425 5.425C17.6083 5.60833 17.75 5.82083 17.85 6.0625C17.95 6.30417 18 6.55833 18 6.825V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM11 6V2H2V18H16V7H12C11.7167 7 11.4792 6.90417 11.2875 6.7125C11.0958 6.52083 11 6.28333 11 6Z"
                                fill="#A80689"
                              />
                            </svg>
                            <span className="text-gray-700">
                              {uploadedFilenames[selectedApplication.id] ||
                                "เอกสารขอความอนุเคราะห์.PDF"}
                            </span>
                          </div>
                          <button className="text-gray-500 hover:text-primary-600 transition-colors">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 19.9998C5.45 19.9998 4.97917 19.804 4.5875 19.4123C4.19583 19.0206 4 18.5498 4 17.9998V15.9998C4 15.7165 4.09583 15.479 4.2875 15.2873C4.47917 15.0956 4.71667 14.9998 5 14.9998C5.28333 14.9998 5.52083 15.0956 5.7125 15.2873C5.90417 15.479 6 15.7165 6 15.9998V17.9998H18V15.9998C18 15.7165 18.0958 15.479 18.2875 15.2873C18.4792 15.0956 18.7167 14.9998 19 14.9998C19.2833 14.9998 19.5208 15.0956 19.7125 15.2873C19.9042 15.479 20 15.7165 20 15.9998V17.9998C20 18.5498 19.8042 19.0206 19.4125 19.4123C19.0208 19.804 18.55 19.9998 18 19.9998H6ZM11 7.8498L9.125 9.7248C8.925 9.9248 8.6875 10.0206 8.4125 10.0123C8.1375 10.004 7.9 9.8998 7.7 9.6998C7.51667 9.4998 7.42083 9.26647 7.4125 8.9998C7.40417 8.73314 7.5 8.4998 7.7 8.2998L11.3 4.6998C11.4 4.5998 11.5083 4.52897 11.625 4.4873C11.7417 4.44564 11.8667 4.4248 12 4.4248C12.1333 4.4248 12.2583 4.44564 12.375 4.4873C12.4917 4.52897 12.6 4.5998 12.7 4.6998L16.3 8.2998C16.5 8.4998 16.5958 8.73314 16.5875 8.9998C16.5792 9.26647 16.4833 9.4998 16.3 9.6998C16.1 9.8998 15.8625 10.004 15.5875 10.0123C15.3125 10.0206 15.075 9.9248 14.875 9.7248L13 7.8498V14.9998C13 15.2831 12.9042 15.5206 12.7125 15.7123C12.5208 15.904 12.2833 15.9998 12 15.9998C11.7167 15.9998 11.4792 15.904 11.2875 15.7123C11.0958 15.5206 11 15.2831 11 14.9998V7.8498Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-primary-50 hover:border-primary-600 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 16H14C14.2833 16 14.5208 15.9042 14.7125 15.7125C14.9042 15.5208 15 15.2833 15 15C15 14.7167 14.9042 14.4792 14.7125 14.2875C14.5208 14.0958 14.2833 14 14 14H6C5.71667 14 5.47917 14.0958 5.2875 14.2875C5.09583 14.4792 5 14.7167 5 15C5 15.2833 5.09583 15.5208 5.2875 15.7125C5.47917 15.9042 5.71667 16 6 16ZM6 12H14C14.2833 12 14.5208 11.9042 14.7125 11.7125C14.9042 11.5208 15 11.2833 15 11C15 10.7167 14.9042 10.4792 14.7125 10.2875C14.5208 10.0958 14.2833 10 14 10H6C5.71667 10 5.47917 10.0958 5.2875 10.2875C5.09583 10.4792 5 10.7167 5 11C5 11.2833 5.09583 11.5208 5.2875 11.7125C5.47917 11.9042 5.71667 12 6 12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H11.175C11.4417 0 11.6958 0.05 11.9375 0.15C12.1792 0.25 12.3917 0.391667 12.575 0.575L17.425 5.425C17.6083 5.60833 17.75 5.82083 17.85 6.0625C17.95 6.30417 18 6.55833 18 6.825V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM11 6V2H2V18H16V7H12C11.7167 7 11.4792 6.90417 11.2875 6.7125C11.0958 6.52083 11 6.28333 11 6Z"
                                fill="#A80689"
                              />
                            </svg>
                            <span className="text-gray-700">
                              {uploadedFileName || "Choose File"}
                            </span>
                          </div>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-gray-400"
                          >
                            <path
                              d="M6 19.9998C5.45 19.9998 4.97917 19.804 4.5875 19.4123C4.19583 19.0206 4 18.5498 4 17.9998V15.9998C4 15.7165 4.09583 15.479 4.2875 15.2873C4.47917 15.0956 4.71667 14.9998 5 14.9998C5.28333 14.9998 5.52083 15.0956 5.7125 15.2873C5.90417 15.479 6 15.7165 6 15.9998V17.9998H18V15.9998C18 15.7165 18.0958 15.479 18.2875 15.2873C18.4792 15.0956 18.7167 14.9998 19 14.9998C19.2833 14.9998 19.5208 15.0956 19.7125 15.2873C19.9042 15.479 20 15.7165 20 15.9998V17.9998C20 18.5498 19.8042 19.0206 19.4125 19.4123C19.0208 19.804 18.55 19.9998 18 19.9998H6ZM11 7.8498L9.125 9.7248C8.925 9.9248 8.6875 10.0206 8.4125 10.0123C8.1375 10.004 7.9 9.8998 7.7 9.6998C7.51667 9.4998 7.42083 9.26647 7.4125 8.9998C7.40417 8.73314 7.5 8.4998 7.7 8.2998L11.3 4.6998C11.4 4.5998 11.5083 4.52897 11.625 4.4873C11.7417 4.44564 11.8667 4.4248 12 4.4248C12.1333 4.4248 12.2583 4.44564 12.375 4.4873C12.4917 4.52897 12.6 4.5998 12.7 4.6998L16.3 8.2998C16.5 8.4998 16.5958 8.73314 16.5875 8.9998C16.5792 9.26647 16.4833 9.4998 16.3 9.6998C16.1 9.8998 15.8625 10.004 15.5875 10.0123C15.3125 10.0206 15.075 9.9248 14.875 9.7248L13 7.8498V14.9998C13 15.2831 12.9042 15.5206 12.7125 15.7123C12.5208 15.904 12.2833 15.9998 12 15.9998C11.7167 15.9998 11.4792 15.904 11.2875 15.7123C11.0958 15.5206 11 15.2831 11 14.9998V7.8498Z"
                              fill="currentColor"
                            />
                          </svg>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setUploadedFileName(file.name);
                                setShowUploadSuccess(true);
                                setTimeout(
                                  () => setShowUploadSuccess(false),
                                  2000,
                                );
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Upload and Send Button - only show if not already uploaded */}
                    {!docUploadedApps.includes(selectedApplication.id) && (
                      <button
                        onClick={() => {
                          if (uploadedFileName) {
                            setShowUploadConfirm(true);
                          }
                        }}
                        disabled={!uploadedFileName}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${uploadedFileName
                          ? "bg-primary-600 text-white hover:bg-primary-700 cursor-pointer"
                          : "bg-primary-200 text-white cursor-not-allowed"
                          }`}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6 19.9998C5.45 19.9998 4.97917 19.804 4.5875 19.4123C4.19583 19.0206 4 18.5498 4 17.9998V15.9998C4 15.7165 4.09583 15.479 4.2875 15.2873C4.47917 15.0956 4.71667 14.9998 5 14.9998C5.28333 14.9998 5.52083 15.0956 5.7125 15.2873C5.90417 15.479 6 15.7165 6 15.9998V17.9998H18V15.9998C18 15.7165 18.0958 15.479 18.2875 15.2873C18.4792 15.0956 18.7167 14.9998 19 14.9998C19.2833 14.9998 19.5208 15.0956 19.7125 15.2873C19.9042 15.479 20 15.7165 20 15.9998V17.9998C20 18.5498 19.8042 19.0206 19.4125 19.4123C19.0208 19.804 18.55 19.9998 18 19.9998H6ZM11 7.8498L9.125 9.7248C8.925 9.9248 8.6875 10.0206 8.4125 10.0123C8.1375 10.004 7.9 9.8998 7.7 9.6998C7.51667 9.4998 7.42083 9.26647 7.4125 8.9998C7.40417 8.73314 7.5 8.4998 7.7 8.2998L11.3 4.6998C11.4 4.5998 11.5083 4.52897 11.625 4.4873C11.7417 4.44564 11.8667 4.4248 12 4.4248C12.1333 4.4248 12.2583 4.44564 12.375 4.4873C12.4917 4.52897 12.6 4.5998 12.7 4.6998L16.3 8.2998C16.5 8.4998 16.5958 8.73314 16.5875 8.9998C16.5792 9.26647 16.4833 9.4998 16.3 9.6998C16.1 9.8998 15.8625 10.004 15.5875 10.0123C15.3125 10.0206 15.075 9.9248 14.875 9.7248L13 7.8498V14.9998C13 15.2831 12.9042 15.5206 12.7125 15.7123C12.5208 15.904 12.2833 15.9998 12 15.9998C11.7167 15.9998 11.4792 15.904 11.2875 15.7123C11.0958 15.5206 11 15.2831 11 14.9998V7.8498Z"
                            fill="currentColor"
                          />
                        </svg>
                        อัปโหลดและส่งให้ HR
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Confirm Modal */}
              {showUploadConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                  <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
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
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      ยืนยันการอัปโหลด
                    </h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowUploadConfirm(false)}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        ย้อนกลับ
                      </button>
                      <button
                        onClick={handleDocUploadAndSend}
                        className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Success Modal */}
              {showFinalSuccess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                  <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
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
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      อัปโหลดเอกสารเรียบร้อยแล้ว
                    </h3>
                    <button
                      onClick={() => {
                        setShowFinalSuccess(false);
                        setShowDocumentPopup(false);
                      }}
                      className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                    >
                      ตกลง
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection reason if doc rejected */}
              {(selectedApplication.step === 6 ||
                docRejectedApps.includes(selectedApplication.id)) &&
                selectedApplication.rejectionReason && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      เอกสารไม่ผ่านเพราะ:
                    </p>

                    <div className="bg-white border border-gray-300 rounded-lg p-4 min-h-28 hover:border-primary-600 transition-colors">
                      <p className="text-sm font-medium text-red-600">
                        {selectedApplication.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}

        {/* Additional Info Dropdown */}
        {/* <div className="border-t border-gray-100 mt-6">
          <button
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">
              ข้อมูลเพิ่มเติมผู้สมัคร
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

          {showAdditionalInfo && (
            <div className="pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">การศึกษาปัจจุบัน</p>
                  <p className="font-medium text-gray-900">{getEducationLabel(selectedApplication.education)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">ชื่อสถาบัน</p>
                  <p className="font-medium text-gray-900">
                    {selectedApplication.institution}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">คณะ</p>
                  <p className="font-medium text-gray-900">
                    เทคโนโลยีและการจัดการอุตสาหกรรม
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">สาขา</p>
                  <p className="font-medium text-gray-900">
                    {selectedApplication.major}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">
                  ทักษะด้านต่าง ๆ ของผู้สมัคร
                </p>
                <p className="text-gray-900 text-sm">
                  {selectedApplication.skill || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">
                  สิ่งที่คาดหวังจากการฝึกงาน
                </p>
                <p className="text-gray-900 text-sm">
                  {selectedApplication.expectation ||
                    "คาดหวังได้เรียนรู้การทำงานจริงด้าน UX/UI และพัฒนาทักษะการออกแบบเพื่อนำไปใช้งานในอนาคต"}
                </p>
              </div>
            </div>
          )}
        </div> */}
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
                    className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
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
                    <p className=" text-gray-900 text-sm">
                      {getMentor().name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
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
                    <p className="font-medium text-gray-900 text-sm">
                      {getMentor().email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0"
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
                    <p className="font-medium text-gray-900 text-sm">
                      {getMentor().phone}
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 5rem)" }}
        >
          <VideoLoading message="กำลังโหลดข้อมูลใบสมัคร..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <OwnerNavbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <Link
            href="/owner/announcements"
            className="text-gray-500 hover:text-primary-600"
          >
            รายละเอียดประกาศและผู้สมัคร
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-primary-600 font-medium">ใบสมัครทั้งหมด</span>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ใบสมัครทั้งหมด</h1>
          <p className="text-gray-600">
            ติดตามใบสมัครทั้งหมด {tabCounts.all} รายการ
          </p>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Link
            href={`/owner/dashboard/applications${positionId ? `?positionId=${positionId}` : ''}`}
            className="bg-primary-50 rounded-xl border border-l-5 border-primary-600 p-4 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="text-primary-600 mb-2">
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
            <p className="text-2xl font-bold text-primary-600">
              {tabCounts.all}
            </p>
            <p className="text-gray-500 text-sm">ใบสมัครทั้งหมด</p>
          </Link>
          <Link
            href={`/owner/dashboard/pending${positionId ? `?positionId=${positionId}` : ''}`}
            className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-primary-600 hover:shadow-md transition-all"
          >
            <div className="text-primary-600 mb-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 9.6V6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6V9.975C9 10.1083 9.025 10.2375 9.075 10.3625C9.125 10.4875 9.2 10.6 9.3 10.7L12.6 14C12.7833 14.1833 13.0167 14.275 13.3 14.275C13.5833 14.275 13.8167 14.1833 14 14C14.1833 13.8167 14.275 13.5833 14.275 13.3C14.275 13.0167 14.1833 12.7833 14 12.6L11 9.6ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2167 18 14.1042 17.2208 15.6625 15.6625C17.2208 14.1042 18 12.2167 18 10C18 7.78333 17.2208 5.89583 15.6625 4.3375C14.1042 2.77917 12.2167 2 10 2C7.78333 2 5.89583 2.77917 4.3375 4.3375C2.77917 5.89583 2 7.78333 2 10C2 12.2167 2.77917 14.1042 4.3375 15.6625C5.89583 17.2208 7.78333 18 10 18Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {tabCounts.waiting_document +
                tabCounts.waiting_interview +
                tabCounts.waiting_confirm}
            </p>
            <p className="text-gray-500 text-sm">สถานะรอ</p>
          </Link>
          <Link
            href={`/owner/dashboard/accepted${positionId ? `?positionId=${positionId}` : ''}`}
            className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-primary-600 hover:shadow-md transition-all"
          >
            <div className="text-primary-600 mb-2">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {tabCounts.accepted}
            </p>
            <p className="text-gray-500 text-sm">สถานะรับเข้าฝึกงาน</p>
          </Link>
          <Link
            href={`/owner/dashboard/rejected${positionId ? `?positionId=${positionId}` : ''}`}
            className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-primary-600 hover:shadow-md transition-all"
          >
            <div className="text-primary-600 mb-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 11.4L12.9 14.3C13.0833 14.4833 13.3167 14.575 13.6 14.575C13.8833 14.575 14.1167 14.4833 14.3 14.3C14.4833 14.1167 14.575 13.8833 14.575 13.6C14.575 13.3167 14.4833 13.0833 14.3 12.9L11.4 10L14.3 7.1C14.4833 6.91667 14.575 6.68333 14.575 6.4C14.575 6.11667 14.4833 5.88333 14.3 5.7C14.1167 5.51667 13.8833 5.425 13.6 5.425C13.3167 5.425 13.0833 5.51667 12.9 5.7L10 8.6L7.1 5.7C6.91667 5.51667 6.68333 5.425 6.4 5.425C6.11667 5.425 5.88333 5.51667 5.7 5.7C5.51667 5.88333 5.425 6.11667 5.425 6.4C5.425 6.68333 5.51667 6.91667 5.7 7.1L8.6 10L5.7 12.9C5.51667 13.0833 5.425 13.3167 5.425 13.6C5.425 13.8833 5.51667 14.1167 5.7 14.3C5.88333 14.4833 6.11667 14.575 6.4 14.575C6.68333 14.575 6.91667 14.4833 7.1 14.3L10 11.4ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {tabCounts.rejected}
            </p>
            <p className="text-gray-500 text-sm">สถานะไม่ผ่าน</p>
          </Link>
          <Link
            href={`/owner/dashboard/cancelled${positionId ? `?positionId=${positionId}` : ''}`}
            className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-primary-600 hover:shadow-md transition-all"
          >
            <div className="text-primary-600 mb-2">
              <svg
                width="22"
                height="16"
                viewBox="0 0 22 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.5 6.925L17.1 8.3C16.9167 8.48333 16.6875 8.57917 16.4125 8.5875C16.1375 8.59583 15.9 8.5 15.7 8.3C15.5167 8.11667 15.425 7.88333 15.425 7.6C15.425 7.31667 15.5167 7.08333 15.7 6.9L17.075 5.5L15.7 4.125C15.5167 3.94167 15.425 3.7125 15.425 3.4375C15.425 3.1625 15.5167 2.925 15.7 2.725C15.9 2.525 16.1375 2.425 16.4125 2.425C16.6875 2.425 16.925 2.525 17.125 2.725L18.5 4.1L19.875 2.7C20.0583 2.5 20.2875 2.4 20.5625 2.4C20.8375 2.4 21.075 2.5 21.275 2.7C21.475 2.9 21.575 3.1375 21.575 3.4125C21.575 3.6875 21.475 3.925 21.275 4.125L19.9 5.5L21.3 6.9C21.5 7.1 21.5958 7.33333 21.5875 7.6C21.5792 7.86667 21.475 8.1 21.275 8.3C21.075 8.48333 20.8417 8.57917 20.575 8.5875C20.3083 8.59583 20.075 8.5 19.875 8.3L18.5 6.925ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 14V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {tabCounts.cancelled}
            </p>
            <p className="text-gray-500 text-sm">สถานะยกเลิกฝึกงาน</p>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-0 mb-6 border-b border-gray-200">
          <button
            onClick={() => { setTabLoading(true); setActiveTab("all"); setTimeout(() => setTabLoading(false), 300); }}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "all"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            ทั้งหมด ({tabCounts.all})
          </button>
          <button
            onClick={() => { setTabLoading(true); setActiveTab("waiting_document"); setTimeout(() => setTabLoading(false), 300); }}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "waiting_document"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            รอยื่นเอกสาร ({tabCounts.waiting_document})
          </button>
          <button
            onClick={() => { setTabLoading(true); setActiveTab("waiting_interview"); setTimeout(() => setTabLoading(false), 300); }}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "waiting_interview"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            รอสัมภาษณ์ ({tabCounts.waiting_interview})
          </button>
          <button
            onClick={() => { setTabLoading(true); setActiveTab("waiting_confirm"); setTimeout(() => setTabLoading(false), 300); }}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "waiting_confirm"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            รอการยืนยัน ({tabCounts.waiting_confirm})
          </button>
          <button
            onClick={() => { setTabLoading(true); setActiveTab("accepted"); setTimeout(() => setTabLoading(false), 300); }}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "accepted"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            รับเข้าฝึกงาน ({tabCounts.accepted})
          </button>
          <button
            onClick={() => { setTabLoading(true); setActiveTab("rejected"); setTimeout(() => setTabLoading(false), 300); }}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "rejected"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            ไม่ผ่าน ({tabCounts.rejected})
          </button>
          <button
            onClick={() => { setTabLoading(true); setActiveTab("cancelled"); setTimeout(() => setTabLoading(false), 300); }}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "cancelled"
              ? "border-primary-600 text-primary-600 bg-primary-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            ยกเลิกฝึกงาน ({tabCounts.cancelled})
          </button>
        </div>

        {/* Search & Filter Section (below tabs) */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
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
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedInstitutions.length ===
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
                      // Show category if its label matches or any of its schools match
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
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedInstitutions.includes(cat.id)
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
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedSchools.includes(school)
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
        {tabLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Applications List */}
            <div className="space-y-4">
              {paginatedApplications.length > 0 ? (
                paginatedApplications.map((app) => {
                  const badge = getStatusBadge(app);
                  const cardCategory = getEffectiveStatusCategory(app);

                  // === Cancelled card layout (matches cancelled/page.tsx) ===
                  if (cardCategory === "cancelled") {
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApplication(app)}
                        className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${selectedApplication?.id === app.id
                          ? "border-primary-600"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="mb-1">
                          <span className="font-semibold text-gray-900">
                            {app.firstName} {app.lastName}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span className="bg-[#FEE4E2] text-[#912018] font-semibold border border-[#FECDCA] text-sm px-3 py-1 rounded-full">
                            ยกเลิกฝึกงาน
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg
                              width="14"
                              height="13"
                              viewBox="0 0 14 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1.33333 12.6667C0.966667 12.6667 0.652778 12.5361 0.391667 12.275C0.130556 12.0139 0 11.7 0 11.3333V4C0 3.63333 0.130556 3.31944 0.391667 3.05833C0.652778 2.79722 0.966667 2.66667 1.33333 2.66667H4V1.33333C4 0.966667 4.13056 0.652778 4.39167 0.391667C4.65278 0.130556 4.96667 0 5.33333 0H8C8.36667 0 8.68056 0.130556 8.94167 0.391667C9.20278 0.652778 9.33333 0.966667 9.33333 1.33333V2.66667H12C12.3667 2.66667 12.6806 2.79722 12.9417 3.05833C13.2028 3.31944 13.3333 3.63333 13.3333 4V11.3333C13.3333 11.7 13.2028 12.0139 12.9417 12.275C12.6806 12.5361 12.3667 12.6667 12 12.6667H1.33333ZM1.33333 11.3333H12V4H1.33333V11.3333ZM5.33333 2.66667H8V1.33333H5.33333V2.66667Z"
                                fill="#A80689"
                              />
                            </svg>
                            {positionInfo?.name ||
                              selectedApplication?.position ||
                              "ตำแหน่งงาน"}
                          </div>
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

                          <span>{app.department}</span>
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

                            <span>{app.institution}</span>
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
                                d="M7.33333 6.4V4C7.33333 3.81111 7.26944 3.65278 7.14167 3.525C7.01389 3.39722 6.85556 3.33333 6.66667 3.33333C6.47778 3.33333 6.31944 3.39722 6.19167 3.525C6.06389 3.65278 6 3.81111 6 4V6.65C6 6.73889 6.01667 6.825 6.05 6.90833C6.08333 6.99167 6.13333 7.06667 6.2 7.13333L8.4 9.33333C8.52222 9.45555 8.67778 9.51667 8.86667 9.51667C9.05556 9.51667 9.21111 9.45555 9.33333 9.33333C9.45555 9.21111 9.51667 9.05556 9.51667 8.86667C9.51667 8.67778 9.45555 8.52222 9.33333 8.4L7.33333 6.4ZM6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45555 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0C7.58889 0 8.45555 0.175 9.26667 0.525C10.0778 0.875 10.7833 1.35 11.3833 1.95C11.9833 2.55 12.4583 3.25556 12.8083 4.06667C13.1583 4.87778 13.3333 5.74444 13.3333 6.66667C13.3333 7.58889 13.1583 8.45555 12.8083 9.26667C12.4583 10.0778 11.9833 10.7833 11.3833 11.3833C10.7833 11.9833 10.0778 12.4583 9.26667 12.8083C8.45555 13.1583 7.58889 13.3333 6.66667 13.3333ZM6.66667 12C8.14444 12 9.40278 11.4806 10.4417 10.4417C11.4806 9.40278 12 8.14444 12 6.66667C12 5.18889 11.4806 3.93056 10.4417 2.89167C9.40278 1.85278 8.14444 1.33333 6.66667 1.33333C5.18889 1.33333 3.93056 1.85278 2.89167 2.89167C1.85278 3.93056 1.33333 5.18889 1.33333 6.66667C1.33333 8.14444 1.85278 9.40278 2.89167 10.4417C3.93056 11.4806 5.18889 12 6.66667 12Z"
                                fill="#A80689"
                              />
                            </svg>

                            <span>
                              ระยะเวลาการฝึกงาน: {formatDateThai(app.startDate)} -{" "}
                              {formatDateThai(app.endDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // === Default card layout (pending, accepted, rejected) ===
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApplication(app)}
                      className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${selectedApplication?.id === app.id
                        ? "border-primary-600 shadow-md"
                        : "border-gray-100 hover:border-gray-300"
                        }`}
                    >
                      <div className="mb-1">
                        <span className="font-semibold text-gray-900">
                          {app.firstName} {app.lastName}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span
                          className={`text-sm px-3 py-1 rounded-full ${badge.color}`}
                        >
                          {badge.text}
                        </span>
                        {"secondary" in badge && badge.secondary && (
                          <span
                            className={`text-sm px-3 py-1 rounded-full ${badge.secondaryColor}`}
                          >
                            {badge.secondary}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg
                            width="14"
                            height="13"
                            viewBox="0 0 14 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1.33333 12.6667C0.966667 12.6667 0.652778 12.5361 0.391667 12.275C0.130556 12.0139 0 11.7 0 11.3333V4C0 3.63333 0.130556 3.31944 0.391667 3.05833C0.652778 2.79722 0.966667 2.66667 1.33333 2.66667H4V1.33333C4 0.966667 4.13056 0.652778 4.39167 0.391667C4.65278 0.130556 4.96667 0 5.33333 0H8C8.36667 0 8.68056 0.130556 8.94167 0.391667C9.20278 0.652778 9.33333 0.966667 9.33333 1.33333V2.66667H12C12.3667 2.66667 12.6806 2.79722 12.9417 3.05833C13.2028 3.31944 13.3333 3.63333 13.3333 4V11.3333C13.3333 11.7 13.2028 12.0139 12.9417 12.275C12.6806 12.5361 12.3667 12.6667 12 12.6667H1.33333ZM1.33333 11.3333H12V4H1.33333V11.3333ZM5.33333 2.66667H8V1.33333H5.33333V2.66667Z"
                              fill="#A80689"
                            />
                          </svg>
                          {positionInfo?.name ||
                            selectedApplication?.position ||
                            "ตำแหน่งงาน"}
                        </div>
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
                              d="M7.33333 6.4V4C7.33333 3.81111 7.26944 3.65278 7.14167 3.525C7.01389 3.39722 6.85556 3.33333 6.66667 3.33333C6.47778 3.33333 6.31944 3.39722 6.19167 3.525C6.06389 3.65278 6 3.81111 6 4V6.65C6 6.73889 6.01667 6.825 6.05 6.90833C6.08333 6.99167 6.13333 7.06667 6.2 7.13333L8.4 9.33333C8.52222 9.45555 8.67778 9.51667 8.86667 9.51667C9.05556 9.51667 9.21111 9.45555 9.33333 9.33333C9.45555 9.21111 9.51667 9.05556 9.51667 8.86667C9.51667 8.67778 9.45555 8.52222 9.33333 8.4L7.33333 6.4ZM6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45555 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0C7.58889 0 8.45555 0.175 9.26667 0.525C10.0778 0.875 10.7833 1.35 11.3833 1.95C11.9833 2.55 12.4583 3.25556 12.8083 4.06667C13.1583 4.87778 13.3333 5.74444 13.3333 6.66667C13.3333 7.58889 13.1583 8.45555 12.8083 9.26667C12.4583 10.0778 11.9833 10.7833 11.3833 11.3833C10.7833 11.9833 10.0778 12.4583 9.26667 12.8083C8.45555 13.1583 7.58889 13.3333 6.66667 13.3333ZM6.66667 12C8.14444 12 9.40278 11.4806 10.4417 10.4417C11.4806 9.40278 12 8.14444 12 6.66667C12 5.18889 11.4806 3.93056 10.4417 2.89167C9.40278 1.85278 8.14444 1.33333 6.66667 1.33333C5.18889 1.33333 3.93056 1.85278 2.89167 2.89167C1.85278 3.93056 1.33333 5.18889 1.33333 6.66667C1.33333 8.14444 1.85278 9.40278 2.89167 10.4417C3.93056 11.4806 5.18889 12 6.66667 12Z"
                              fill="#A80689"
                            />
                          </svg>
                          ระยะเวลาที่ต้องฝึก: {formatDateThai(app.startDate)} -{" "}
                          {formatDateThai(app.endDate)}
                        </div>
                      </div>

                      {/* Step Progress - Hide when rejected or cancelled */}
                      {cardCategory !== "rejected" &&
                        (cardCategory as string) !== "cancelled" && (
                          <div className="mt-2 pt-2">
                            <div className="flex items-center gap-2 bg-primary-50  rounded-lg px-3 py-2">
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
                                ขั้นตอนที่ {getEffectiveStep(app).step} -
                              </span>
                              <span className="text-primary-600 text-sm">
                                {getEffectiveStep(app).stepDescription}
                              </span>
                            </div>
                          </div>
                        )}
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
                    <p className="text-gray-700 font-semibold text-base mt-2">ไม่พบใบสมัคร</p>
                    <p className="text-gray-400 text-sm">ขณะนี้ยังไม่มีผู้สมัครสำหรับประกาศนี้<br />กรุณาตรวจสอบอีกครั้งภายหลัง</p>
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
                        className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === page
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
                      disabled={currentPage === totalPages || totalPages === 0}
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
            <div className="lg:sticky lg:top-[6rem] h-fit max-h-[calc(100vh-5rem)] overflow-y-auto">
              {renderRightPanelContent()}
            </div>
          </div>
        )}
      </div>

      {/* Interview Confirmation Popup */}
      {showInterviewConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            {/* Green Checkmark Icon */}
            <div className="flex items-center justify-center mx-auto mb-6">
              <svg width="70" height="70" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="45" height="45" rx="22.5" fill="#DCFAE6" />
                <path d="M20.1654 25.5007L16.582 21.9173C16.2765 21.6118 15.8876 21.459 15.4154 21.459C14.9431 21.459 14.5543 21.6118 14.2487 21.9173C13.9431 22.2229 13.7904 22.6118 13.7904 23.084C13.7904 23.5562 13.9431 23.9451 14.2487 24.2507L18.9987 29.0007C19.332 29.334 19.7209 29.5007 20.1654 29.5007C20.6098 29.5007 20.9987 29.334 21.332 29.0007L30.7487 19.584C31.0543 19.2784 31.207 18.8895 31.207 18.4173C31.207 17.9451 31.0543 17.5562 30.7487 17.2507C30.4431 16.9451 30.0543 16.7923 29.582 16.7923C29.1098 16.7923 28.7209 16.9451 28.4154 17.2507L20.1654 25.5007ZM22.4987 39.1673C20.1931 39.1673 18.0265 38.7298 15.9987 37.8548C13.9709 36.9798 12.207 35.7923 10.707 34.2923C9.20703 32.7923 8.01953 31.0284 7.14453 29.0007C6.26953 26.9729 5.83203 24.8062 5.83203 22.5007C5.83203 20.1951 6.26953 18.0284 7.14453 16.0007C8.01953 13.9729 9.20703 12.209 10.707 10.709C12.207 9.20898 13.9709 8.02148 15.9987 7.14648C18.0265 6.27148 20.1931 5.83398 22.4987 5.83398C24.8043 5.83398 26.9709 6.27148 28.9987 7.14648C31.0265 8.02148 32.7904 9.20898 34.2904 10.709C35.7904 12.209 36.9779 13.9729 37.8529 16.0007C38.7279 18.0284 39.1654 20.1951 39.1654 22.5007C39.1654 24.8062 38.7279 26.9729 37.8529 29.0007C36.9779 31.0284 35.7904 32.7923 34.2904 34.2923C32.7904 35.7923 31.0265 36.9798 28.9987 37.8548C26.9709 38.7298 24.8043 39.1673 22.4987 39.1673Z" fill="#17B26A" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-8">
              ยืนยันการสัมภาษณ์
            </h3>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowInterviewConfirm(false)}
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleConfirmInterview}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:text-white border-2 border-green-600 transition-colors cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Success Popup */}
      {showInterviewSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            {/* Green Checkmark Icon */}
            <div className="rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="70" height="70" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="45" height="45" rx="22.5" fill="#DCFAE6" />
                <path d="M20.1654 25.5007L16.582 21.9173C16.2765 21.6118 15.8876 21.459 15.4154 21.459C14.9431 21.459 14.5543 21.6118 14.2487 21.9173C13.9431 22.2229 13.7904 22.6118 13.7904 23.084C13.7904 23.5562 13.9431 23.9451 14.2487 24.2507L18.9987 29.0007C19.332 29.334 19.7209 29.5007 20.1654 29.5007C20.6098 29.5007 20.9987 29.334 21.332 29.0007L30.7487 19.584C31.0543 19.2784 31.207 18.8895 31.207 18.4173C31.207 17.9451 31.0543 17.5562 30.7487 17.2507C30.4431 16.9451 30.0543 16.7923 29.582 16.7923C29.1098 16.7923 28.7209 16.9451 28.4154 17.2507L20.1654 25.5007ZM22.4987 39.1673C20.1931 39.1673 18.0265 38.7298 15.9987 37.8548C13.9709 36.9798 12.207 35.7923 10.707 34.2923C9.20703 32.7923 8.01953 31.0284 7.14453 29.0007C6.26953 26.9729 5.83203 24.8062 5.83203 22.5007C5.83203 20.1951 6.26953 18.0284 7.14453 16.0007C8.01953 13.9729 9.20703 12.209 10.707 10.709C12.207 9.20898 13.9709 8.02148 15.9987 7.14648C18.0265 6.27148 20.1931 5.83398 22.4987 5.83398C24.8043 5.83398 26.9709 6.27148 28.9987 7.14648C31.0265 8.02148 32.7904 9.20898 34.2904 10.709C35.7904 12.209 36.9779 13.9729 37.8529 16.0007C38.7279 18.0284 39.1654 20.1951 39.1654 22.5007C39.1654 24.8062 38.7279 26.9729 37.8529 29.0007C36.9779 31.0284 35.7904 32.7923 34.2904 34.2923C32.7904 35.7923 31.0265 36.9798 28.9987 37.8548C26.9709 38.7298 24.8043 39.1673 22.4987 39.1673Z" fill="#17B26A" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ยืนยันการสัมภาษณ์
            </h3>
            <p className="text-gray-600 mb-8">เรียบร้อยแล้ว</p>
            <button
              onClick={() => setShowInterviewSuccess(false)}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Approve Confirmation Popup */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 text-center">
            {/* Green Checkmark Icon */}
            <div className="flex justify-center mb-4">
              <svg width="70" height="70" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="45" height="45" rx="22.5" fill="#DCFAE6" />
                <path d="M20.1654 25.5007L16.582 21.9173C16.2765 21.6118 15.8876 21.459 15.4154 21.459C14.9431 21.459 14.5543 21.6118 14.2487 21.9173C13.9431 22.2229 13.7904 22.6118 13.7904 23.084C13.7904 23.5562 13.9431 23.9451 14.2487 24.2507L18.9987 29.0007C19.332 29.334 19.7209 29.5007 20.1654 29.5007C20.6098 29.5007 20.9987 29.334 21.332 29.0007L30.7487 19.584C31.0543 19.2784 31.207 18.8895 31.207 18.4173C31.207 17.9451 31.0543 17.5562 30.7487 17.2507C30.4431 16.9451 30.0543 16.7923 29.582 16.7923C29.1098 16.7923 28.7209 16.9451 28.4154 17.2507L20.1654 25.5007ZM22.4987 39.1673C20.1931 39.1673 18.0265 38.7298 15.9987 37.8548C13.9709 36.9798 12.207 35.7923 10.707 34.2923C9.20703 32.7923 8.01953 31.0284 7.14453 29.0007C6.26953 26.9729 5.83203 24.8062 5.83203 22.5007C5.83203 20.1951 6.26953 18.0284 7.14453 16.0007C8.01953 13.9729 9.20703 12.209 10.707 10.709C12.207 9.20898 13.9709 8.02148 15.9987 7.14648C18.0265 6.27148 20.1931 5.83398 22.4987 5.83398C24.8043 5.83398 26.9709 6.27148 28.9987 7.14648C31.0265 8.02148 32.7904 9.20898 34.2904 10.709C35.7904 12.209 36.9779 13.9729 37.8529 16.0007C38.7279 18.0284 39.1654 20.1951 39.1654 22.5007C39.1654 24.8062 38.7279 26.9729 37.8529 29.0007C36.9779 31.0284 35.7904 32.7923 34.2904 34.2923C32.7904 35.7923 31.0265 36.9798 28.9987 37.8548C26.9709 38.7298 24.8043 39.1673 22.4987 39.1673Z" fill="#17B26A" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ยืนยันการรับเข้าฝึกงาน
            </h3>
            <p className="text-gray-600 mb-6">
                คุณต้องการรับ{" "}
                <span className="font-semibold">
                  {selectedApplication?.firstName} {selectedApplication?.lastName}
                </span>{" "}
                เข้าฝึกงานใช่หรือไม่?
              </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal (Step 1) */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => setShowRejectModal(false)}
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
                  width="20"
                  height="20"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.33333 9.5L10.75 11.9167C10.9028 12.0694 11.0972 12.1458 11.3333 12.1458C11.5694 12.1458 11.7639 12.0694 11.9167 11.9167C12.0694 11.7639 12.1458 11.5694 12.1458 11.3333C12.1458 11.0972 12.0694 10.9028 11.9167 10.75L9.5 8.33333L11.9167 5.91667C12.0694 5.76389 12.1458 5.56944 12.1458 5.33333C12.1458 5.09722 12.0694 4.90278 11.9167 4.75C11.7639 4.59722 11.5694 4.52083 11.3333 4.52083C11.0972 4.52083 10.9028 4.59722 10.75 4.75L8.33333 7.16667L5.91667 4.75C5.76389 4.59722 5.56944 4.52083 5.33333 4.52083C5.09722 4.52083 4.90278 4.59722 4.75 4.75C4.59722 4.90278 4.52083 5.09722 4.52083 5.33333C4.52083 5.56944 4.59722 5.76389 4.75 5.91667L7.16667 8.33333L4.75 10.75C4.59722 10.9028 4.52083 11.0972 4.52083 11.3333C4.52083 11.5694 4.59722 11.7639 4.75 11.9167C4.90278 12.0694 5.09722 12.1458 5.33333 12.1458C5.56944 12.1458 5.76389 12.0694 5.91667 11.9167L8.33333 9.5ZM8.33333 16.6667C7.18056 16.6667 6.09722 16.4479 5.08333 16.0104C4.06944 15.5729 3.1875 14.9792 2.4375 14.2292C1.6875 13.4792 1.09375 12.5972 0.65625 11.5833C0.21875 10.5694 0 9.48611 0 8.33333C0 7.18056 0.21875 6.09722 0.65625 5.08333C1.09375 4.06944 1.6875 3.1875 2.4375 2.4375C3.1875 1.6875 4.06944 1.09375 5.08333 0.65625C6.09722 0.21875 7.18056 0 8.33333 0C9.48611 0 10.5694 0.21875 11.5833 0.65625C12.5972 1.09375 13.4792 1.6875 14.2292 2.4375C14.9792 3.1875 15.5729 4.06944 16.0104 5.08333C16.4479 6.09722 16.6667 7.18056 16.6667 8.33333C16.6667 9.48611 16.4479 10.5694 16.0104 11.5833C15.5729 12.5972 14.9792 13.4792 14.2292 14.2292C13.4792 14.9792 12.5972 15.5729 11.5833 16.0104C10.5694 16.4479 9.48611 16.6667 8.33333 16.6667Z"
                    fill="#F04438"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ปฏิเสธการรับเข้าฝึกงาน
                </h3>
                <p className="text-gray-500 text-sm">
                  คุณกำลังดำเนินการปฏิเสธรับเข้าฝึกงานของ
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
                เหตุผลที่ไม่ผ่านการคัดเลือก{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="กรุณาระบุเหตุผลที่ชัดเจน..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim()) setShowRejectConfirm(true);
                }}
                disabled={!rejectReason.trim()}
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
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Popup (Step 2) */}
      {showRejectConfirm && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              ปฏิเสธรับเข้าฝึกงาน
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer font-medium"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer font-medium"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Internship Modal */}
      {showCancelModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 relative">
            {/* Close button */}
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
            {/* Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
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
            {/* Reason input */}
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
            {/* Action buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (cancelReason.trim()) {
                    setShowCancelConfirm(true);
                  }
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
            {/* Red X Icon */}
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
                  // Save cancellation to localStorage
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

      {/* Document Rejection Modal */}
      {showDocRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              เอกสารไม่ผ่าน
            </h3>
            <p className="text-gray-600 mb-4">
              กรุณาระบุเหตุผลที่เอกสารไม่ผ่าน
            </p>
            <textarea
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 resize-none"
              placeholder="ระบุเหตุผล..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDocRejectModal(false);
                  setDocRejectReason("");
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDocReject}
                disabled={!docRejectReason.trim()}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
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

                {/* History list */}
                <div className="overflow-y-auto flex-1 space-y-4">
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
                      <p className="text-gray-500 text-sm">กำลังโหลดประวัติ...</p>
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
                    historyData.map((item) => {
                      const statusInfo = getHistoryStatusInfo(item.applicationStatus);
                      return (
                        <div
                          key={item.applicationId}
                          className="border border-gray-200 rounded-xl overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3.75 6H14.25V4.5H3.75V6ZM3.75 16.5C3.3375 16.5 2.98438 16.3531 2.69063 16.0594C2.39688 15.7656 2.25 15.4125 2.25 15V4.5C2.25 4.0875 2.39688 3.73438 2.69063 3.44063C2.98438 3.14688 3.3375 3 3.75 3H4.5V2.25C4.5 2.0375 4.57188 1.85938 4.71563 1.71562C4.85938 1.57187 5.0375 1.5 5.25 1.5C5.4625 1.5 5.64062 1.57187 5.78438 1.71562C5.92813 1.85938 6 2.0375 6 2.25V3H12V2.25C12 2.0375 12.0719 1.85938 12.2156 1.71562C12.3594 1.57187 12.5375 1.5 12.75 1.5C12.9625 1.5 13.1406 1.57187 13.2844 1.71562C13.4281 1.85938 13.5 2.0375 13.5 2.25V3H14.25C14.6625 3 15.0156 3.14688 15.3094 3.44063C15.6031 3.73438 15.75 4.0875 15.75 4.5V8.00625C15.75 8.21875 15.6781 8.39687 15.5344 8.54062C15.3906 8.68437 15.2125 8.75625 15 8.75625C14.7875 8.75625 14.6094 8.68437 14.4656 8.54062C14.3219 8.39687 14.25 8.21875 14.25 8.00625V7.5H3.75V15H8.1C8.3125 15 8.49062 15.0719 8.63437 15.2156C8.77812 15.3594 8.85 15.5375 8.85 15.75C8.85 15.9625 8.77812 16.1406 8.63437 16.2844C8.49062 16.4281 8.3125 16.5 8.1 16.5H3.75ZM13.5 17.25C12.4625 17.25 11.5781 16.8844 10.8469 16.1531C10.1156 15.4219 9.75 14.5375 9.75 13.5C9.75 12.4625 10.1156 11.5781 10.8469 10.8469C11.5781 10.1156 12.4625 9.75 13.5 9.75C14.5375 9.75 15.4219 10.1156 16.1531 10.8469C16.8844 11.5781 17.25 12.4625 17.25 13.5C17.25 14.5375 16.8844 15.4219 16.1531 16.1531C15.4219 16.8844 14.5375 17.25 13.5 17.25ZM13.875 13.35V11.625C13.875 11.525 13.8375 11.4375 13.7625 11.3625C13.6875 11.2875 13.6 11.25 13.5 11.25C13.4 11.25 13.3125 11.2875 13.2375 11.3625C13.1625 11.4375 13.125 11.525 13.125 11.625V13.3313C13.125 13.4313 13.1438 13.5281 13.1812 13.6219C13.2188 13.7156 13.275 13.8 13.35 13.875L14.4938 15.0187C14.5688 15.0938 14.6563 15.1313 14.7563 15.1313C14.8563 15.1313 14.9437 15.0938 15.0187 15.0187C15.0938 14.9437 15.1313 14.8563 15.1313 14.7563C15.1313 14.6563 15.0938 14.5688 15.0187 14.4938L13.875 13.35Z" fill="#98A2B3" />
                                </svg>
                                <span>{formatHistoryDate(item.createdAt)}</span>
                              </div>
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusInfo.color}`}>
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
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 15C10.2833 15 10.5208 14.9042 10.7125 14.7125C10.9042 14.5208 11 14.2833 11 14V10C11 9.71667 10.9042 9.47917 10.7125 9.2875C10.5208 9.09583 10.2833 9 10 9C9.71667 9 9.47917 9.09583 9.2875 9.2875C9.09583 9.47917 9 9.71667 9 10V14C9 14.2833 9.09583 14.5208 9.2875 14.7125C9.47917 14.9042 9.71667 15 10 15ZM10 7C10.2833 7 10.5208 6.90417 10.7125 6.7125C10.9042 6.52083 11 6.28333 11 6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6C9 6.28333 9.09583 6.52083 9.2875 6.7125C9.47917 6.90417 9.71667 7 10 7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20Z" fill="#D92D20" />
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
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

    </div>
  );
}

export default function AllApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
