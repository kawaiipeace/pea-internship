"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import OwnerNavbar from "../../../components/ui/OwnerNavbar";
import {
  Application,
  fetchAllApplications,
  Mentor,
} from "../utils/applicationMapper";
import {
  applicationApi,
  applicationStatusActionsApi,
  positionApi,
  type ApplicationStatusAction,
  type AppStatusEnum,
  type MyApplicationData,
  type Position,
} from "../../../services/api";
import VideoLoading from "../../../components/ui/VideoLoading";

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

// LocalStorage keys (same as applications/page.tsx)
const STORAGE_KEYS = {
  INTERVIEWED_APPS: "pea_interviewed_apps",
  APPROVED_APPS: "pea_approved_apps",
  REJECTED_APPS: "pea_rejected_apps",
  DOC_UPLOADED_APPS: "pea_doc_uploaded_apps",
  DOC_APPROVED_APPS: "pea_doc_approved_apps",
  DOC_REJECTED_APPS: "pea_doc_rejected_apps",
  UPLOADED_FILENAMES: "pea_uploaded_filenames",
  CANCELLED_APPS: "pea_cancelled_apps",
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

// Helper to save to localStorage
const saveToStorage = (key: string, value: string[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

function ApplicationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = params.id as string;
  const fromPage = searchParams.get("from") || "";
  const positionId = searchParams.get("positionId");
  const positionQuery = positionId ? `?positionId=${positionId}` : "";
  const positionQueryAmp = positionId ? `&positionId=${positionId}` : "";

  // Find the application from API
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
    fetchAllApplications()
      .then((apps) => {
        const found = apps.find((app) => app.id === applicationId);
        setApplication(found || null);
      })
      .finally(() => setIsLoading(false));
  }, [applicationId]);

  // Position info for mentor data
  const [positionInfo, setPositionInfo] = useState<Position | null>(null);
  useEffect(() => {
    if (positionId) {
      positionApi
        .getPositionById(Number(positionId))
        .then(setPositionInfo)
        .catch(console.error);
    }
  }, [positionId]);

  // Timeline actions state (real data from API)
  const [timelineActions, setTimelineActions] = useState<
    ApplicationStatusAction[]
  >([]);
  useEffect(() => {
    if (!applicationId) return;
    const appId = Number(applicationId);
    if (!appId || isNaN(appId)) return;
    applicationStatusActionsApi
      .getByApplicationStatusId(appId)
      .then((actions) => {
        setTimelineActions([...actions].reverse());
      })
      .catch((err) => {
        console.error("Failed to fetch timeline actions:", err);
        setTimelineActions([]);
      });
  }, [applicationId]);

  // Mentor states
  const [assignedMentors, setAssignedMentors] = useState<Mentor[]>([]);
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [selectedNewMentorId, setSelectedNewMentorId] = useState<string>("");
  const [editingMentorIndex, setEditingMentorIndex] = useState<number | null>(
    null,
  );
  const [editingMentorTempId, setEditingMentorTempId] = useState<string>("");
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const [showMentorSaveConfirm, setShowMentorSaveConfirm] = useState(false);
  const [showMentorSaveSuccess, setShowMentorSaveSuccess] = useState(false);

  // Application history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<MyApplicationData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<string[]>(
    [],
  );
  const [pendingMentorSaveAction, setPendingMentorSaveAction] = useState<
    (() => void) | null
  >(null);
  const maxMentors = 5;
  const [showInterviewConfirm, setShowInterviewConfirm] = useState(false);
  const [showInterviewSuccess, setShowInterviewSuccess] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showRejectSuccess, setShowRejectSuccess] = useState(false);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showMentorInfo, setShowMentorInfo] = useState(false);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        editDropdownRef.current &&
        !editDropdownRef.current.contains(e.target as Node)
      ) {
        setEditDropdownOpen(false);
      }
      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(e.target as Node)
      ) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // State with localStorage persistence
  const [interviewedApps, setInterviewedApps] = useState<string[]>([]);
  const [approvedApps, setApprovedApps] = useState<string[]>([]);
  const [rejectedApps, setRejectedApps] = useState<string[]>([]);
  const [docUploadedApps, setDocUploadedApps] = useState<string[]>([]);
  const [docApprovedApps, setDocApprovedApps] = useState<string[]>([]);
  const [docRejectedApps, setDocRejectedApps] = useState<string[]>([]);
  const [uploadedFilenames, setUploadedFilenames] = useState<
    Record<string, string>
  >({});
  const [cancelledAppsData, setCancelledAppsData] = useState<
    { id: string; reason: string; cancelledBy: string; cancelledDate: string }[]
  >([]);
  const [rejectedAppsData, setRejectedAppsData] = useState<
    { id: string; reason: string; rejectedBy: string; rejectedDate: string }[]
  >([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setInterviewedApps(getFromStorage(STORAGE_KEYS.INTERVIEWED_APPS));
    setApprovedApps(getFromStorage(STORAGE_KEYS.APPROVED_APPS));
    setRejectedApps(getFromStorage(STORAGE_KEYS.REJECTED_APPS));
    setDocUploadedApps(getFromStorage(STORAGE_KEYS.DOC_UPLOADED_APPS));
    setDocApprovedApps(getFromStorage(STORAGE_KEYS.DOC_APPROVED_APPS));
    setDocRejectedApps(getFromStorage(STORAGE_KEYS.DOC_REJECTED_APPS));
    setUploadedFilenames(getFilenamesFromStorage());
    // Load cancelled apps data
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CANCELLED_APPS);
      if (stored) setCancelledAppsData(JSON.parse(stored));
    } catch {
      /* ignore */
    }
    // Load rejected apps data
    try {
      const storedRejected = localStorage.getItem(
        STORAGE_KEYS.REJECTED_APPS_DATA,
      );
      if (storedRejected) setRejectedAppsData(JSON.parse(storedRejected));
    } catch {
      /* ignore */
    }
  }, []);

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

  // Helper: format API status to display status
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

  // Helper: format date to Thai short format
  const formatHistoryDate = (dateStr: string) => {
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
    return `${d.getDate()} ${thaiShortMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  // Helper: refetch application data after action
  const refetchApplication = () => {
    fetchAllApplications().then((apps) => {
      const found = apps.find((app) => app.id === applicationId);
      setApplication(found || null);
    });
  };

  // Handler: Mark as interviewed (step 2 -> step 3) via API
  const handleMarkInterviewed = async () => {
    if (!application || actionLoading) return;
    setActionLoading(true);
    try {
      await applicationApi.approveInterview(Number(application.id));
      refetchApplication();
    } catch (err) {
      console.error("Failed to approve interview:", err);
      alert("เกิดข้อผิดพลาดในการยืนยันการสัมภาษณ์");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Approve application (step 3 -> step 4) via API
  const handleApprove = async () => {
    if (!application || actionLoading) return;
    setActionLoading(true);
    try {
      await applicationApi.confirmAccept(Number(application.id));
      refetchApplication();
    } catch (err) {
      console.error("Failed to confirm accept:", err);
      alert("เกิดข้อผิดพลาดในการรับเข้าฝึกงาน");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Reject application via API
  const handleReject = async () => {
    if (!application || actionLoading) return;
    setActionLoading(true);
    try {
      await applicationApi.rejectApplication(
        Number(application.id),
        rejectReason,
      );
      setShowRejectConfirm(false);
      setShowRejectModal(false);
      setRejectReason("");
      setShowRejectSuccess(true);
      refetchApplication();
      setTimeout(() => {
        setShowRejectSuccess(false);
      }, 500);
    } catch (err) {
      console.error("Failed to reject application:", err);
      alert("เกิดข้อผิดพลาดในการปฏิเสธผู้สมัคร");
    } finally {
      setActionLoading(false);
    }
  };

  // Derive cancelled app IDs and helper
  const cancelledAppIds = cancelledAppsData.map((a) => a.id);
  const isCancelledViaStorage = application
    ? cancelledAppIds.includes(application.id)
    : false;
  const getCancellationData = () => {
    const data = cancelledAppsData.find((a) => a.id === application?.id);
    if (data)
      return {
        reason: data.reason,
        cancelledBy: data.cancelledBy,
        cancelledDate: data.cancelledDate,
      };
    return {
      reason: application?.cancellationReason,
      cancelledBy: application?.cancelledBy,
      cancelledDate: application?.cancelledDate,
    };
  };

  const getRejectionData = () => {
    const data = rejectedAppsData.find((a) => a.id === application?.id);
    if (data)
      return {
        reason: data.reason,
        rejectedBy: data.rejectedBy,
        rejectedDate: data.rejectedDate,
      };
    return {
      reason: "",
      rejectedBy: "",
      rejectedDate: "",
    };
  };

  // Compute timeline step states
  const getTimelineState = () => {
    let completedUpTo = 0;
    let currentStep = 0;

    if (!application) return { completedUpTo, currentStep };

    if (application.status === "cancelled" || isCancelledViaStorage) {
      if (
        docApprovedApps.includes(application.id) ||
        application.detailedStatus === "doc_passed" ||
        application.detailedStatus === "completed"
      ) {
        completedUpTo = 5;
      } else if (
        docUploadedApps.includes(application.id) ||
        application.detailedStatus === "doc_sent"
      ) {
        completedUpTo = 4;
        currentStep = 5;
      } else {
        completedUpTo = 3;
        currentStep = 4;
      }
    } else if (
      rejectedApps.includes(application.id) ||
      application.status === "rejected"
    ) {
      completedUpTo = 3;
      currentStep = 0;
    } else if (
      docApprovedApps.includes(application.id) ||
      application.detailedStatus === "doc_passed" ||
      application.detailedStatus === "completed"
    ) {
      completedUpTo = 5;
    } else if (
      docUploadedApps.includes(application.id) ||
      application.detailedStatus === "doc_sent" ||
      application.detailedStatus === "waiting_send_doc"
    ) {
      completedUpTo = 4;
      currentStep = 5;
    } else if (
      docRejectedApps.includes(application.id) ||
      application.detailedStatus === "doc_rejected"
    ) {
      completedUpTo = 3;
      currentStep = 4;
    } else if (
      approvedApps.includes(application.id) ||
      application.detailedStatus === "waiting_analysis_doc"
    ) {
      completedUpTo = 3;
      currentStep = 4;
    } else if (
      interviewedApps.includes(application.id) &&
      application.step === 2
    ) {
      completedUpTo = 2;
      currentStep = 3;
    } else if (
      application.step >= 3 ||
      application.detailedStatus === "waiting_confirm"
    ) {
      completedUpTo = 2;
      currentStep = 3;
    } else if (application.step === 2) {
      completedUpTo = 1;
      currentStep = 2;
    } else {
      completedUpTo = 0;
      currentStep = 1;
    }

    return { completedUpTo, currentStep };
  };

  if (isLoading) {
    return <VideoLoading />;
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>ไม่พบข้อมูลใบสมัคร</p>
        </div>
      </div>
    );
  }

  // Helper function to get effective step based on localStorage state
  const getEffectiveStep = () => {
    // If doc approved/passed, move to step 6
    if (
      docApprovedApps.includes(application.id) ||
      application.detailedStatus === "doc_passed" ||
      application.detailedStatus === "completed"
    ) {
      return { step: 6, stepDescription: "รับผู้สมัครฝึกงานเรียบร้อยแล้ว" };
    }
    // If doc uploaded or under HR review, move to step 5
    if (
      docUploadedApps.includes(application.id) ||
      application.detailedStatus === "doc_sent" ||
      application.detailedStatus === "doc_rejected"
    ) {
      return { step: 5, stepDescription: "รอ HR ตรวจสอบความถูกต้องเอกสาร" };
    }
    // If approved, move to step 4
    if (approvedApps.includes(application.id)) {
      return {
        step: 4,
        stepDescription: "รอเอกสารขอความอนุเคราะห์จากผู้สมัคร",
      };
    }
    // If rejected
    if (rejectedApps.includes(application.id)) {
      return { step: 3, stepDescription: "ยืนยันสถานะการสมัคร" };
    }
    // If interviewed (from step 2), move to step 3
    if (interviewedApps.includes(application.id) && application.step === 2) {
      return { step: 3, stepDescription: "ยืนยันสถานะการสมัคร" };
    }
    return {
      step: application.step,
      stepDescription: application.stepDescription,
    };
  };

  // Get effective status badge based on localStorage state
  const getStatusBadge = (): {
    text: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    secondary?: {
      text: string;
      bgColor: string;
      textColor: string;
      borderColor: string;
    };
  } => {
    // Check for cancelled status first (including localStorage cancellation)
    if (application.status === "cancelled" || isCancelledViaStorage) {
      return {
        text: "ยกเลิกฝึกงาน",
        bgColor: "bg-[#FEE4E2]",
        textColor: "text-[#912018] font-semibold",
        borderColor: "border-[#FECDCA]",
      };
    }
    // Check doc approved/passed
    if (
      docApprovedApps.includes(application.id) ||
      application.detailedStatus === "doc_passed" ||
      application.detailedStatus === "completed"
    ) {
      return {
        text: "รับเข้าฝึกงาน",
        bgColor: "bg-[#DCFAE6]",
        textColor: "text-[#085D3A] font-semibold",
        borderColor: "border-[#A9EFC5]",
        secondary: {
          text: "เอกสารผ่าน",
          bgColor: "bg-[#DCFAE6]",
          textColor: "text-[#085D3A] font-semibold",
          borderColor: "border-[#A9EFC5]",
        },
      };
    }
    // Check doc rejected
    if (
      docRejectedApps.includes(application.id) ||
      application.detailedStatus === "doc_rejected"
    ) {
      return {
        text: "รับเข้าฝึกงาน",
        bgColor: "bg-[#DCFAE6]",
        textColor: "text-[#085D3A] font-semibold",
        borderColor: "border-[#A9EFC5]",
        secondary: {
          text: "เอกสารไม่ผ่าน",
          bgColor: "bg-[#FEE4E2]",
          textColor: "text-[#912018] font-semibold",
          borderColor: "border-[#FECDCA]",
        },
      };
    }
    // Check doc uploaded/sent
    if (
      docUploadedApps.includes(application.id) ||
      application.detailedStatus === "doc_sent" ||
      application.detailedStatus === "waiting_send_doc"
    ) {
      return {
        text: "รับเข้าฝึกงาน",
        bgColor: "bg-[#DCFAE6]",
        textColor: "text-[#085D3A] font-semibold",
        borderColor: "border-[#A9EFC5]",
        secondary: {
          text: "รอ HR ตรวจสอบ",
          bgColor: "bg-[#FEF0C7]",
          textColor: "text-[#7A2E0E] font-semibold",
          borderColor: "border-[#FEDF89]",
        },
      };
    }
    // Check if accepted (step 4+ or approved locally) → รอเอกสารขอความอนุเคราะห์
    if (
      approvedApps.includes(application.id) ||
      application.detailedStatus === "waiting_analysis_doc"
    ) {
      return {
        text: "รับเข้าฝึกงาน",
        bgColor: "bg-[#DCFAE6]",
        textColor: "text-[#085D3A] font-semibold",
        borderColor: "border-[#A9EFC5]",
        secondary: {
          text: "รอเอกสารขอความอนุเคราะห์",
          bgColor: "bg-[#FEF0C7]",
          textColor: "text-[#7A2E0E] font-semibold",
          borderColor: "border-[#FEDF89]",
        },
      };
    }
    // Check if accepted status (generic)
    if (application.status === "accepted" && application.step >= 4) {
      return {
        text: "รับเข้าฝึกงาน",
        bgColor: "bg-[#DCFAE6]",
        textColor: "text-[#085D3A] font-semibold",
        borderColor: "border-[#A9EFC5]",
      };
    }
    if (
      rejectedApps.includes(application.id) ||
      application.status === "rejected"
    ) {
      return {
        text: "ไม่ผ่าน",
        bgColor: "bg-[#FEE4E2]",
        textColor: "text-[#912018] font-semibold",
        borderColor: "border-[#FECDCA]",
      };
    }
    if (interviewedApps.includes(application.id) && application.step === 2) {
      return {
        text: "รอการยืนยัน",
        bgColor: "bg-[#FEF0C7]",
        textColor: "text-[#7A2E0E] font-semibold",
        borderColor: "border-[#FEDF89]",
      };
    }

    // Fallback to original status
    const status = application.status as string;
    const detailed = application.detailedStatus;
    switch (status) {
      case "pending":
        return {
          text: "รอยื่นเอกสาร",
          bgColor: "bg-[#FEF0C7]",
          textColor: "text-[#7A2E0E] font-semibold",
          borderColor: "border-[#FEDF89]",
        };
      case "interview":
        return {
          text: "รอสัมภาษณ์",
          bgColor: "bg-[#FEF0C7]",
          textColor: "text-[#7A2E0E] font-semibold",
          borderColor: "border-[#FEDF89]",
        };
      case "reviewing":
        return {
          text: detailed === "waiting_interview" ? "รอสัมภาษณ์" : "รอการยืนยัน",
          bgColor: "bg-[#FEF0C7]",
          textColor: "text-[#7A2E0E] font-semibold",
          borderColor: "border-[#FEDF89]",
        };
      case "accepted":
        return {
          text: "รับเข้าฝึกงาน",
          bgColor: "bg-[#DCFAE6]",
          textColor: "text-[#085D3A] font-semibold",
          borderColor: "border-[#A9EFC5]",
        };
      case "rejected":
        return {
          text: "ไม่ผ่าน",
          bgColor: "bg-[#FEE4E2]",
          textColor: "text-[#912018] font-semibold",
          borderColor: "border-[#FECDCA]",
        };
      case "cancelled":
        return {
          text: "ยกเลิกฝึกงาน",
          bgColor: "bg-[#FEE4E2]",
          textColor: "text-[#912018] font-semibold",
          borderColor: "border-[#FECDCA]",
        };
      default:
        return {
          text: "รอดำเนินการ",
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          borderColor: "border-gray-300",
        };
    }
  };

  const effectiveStep = getEffectiveStep();
  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen bg-gray-50">
      <OwnerNavbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/owner/announcements"
            className="text-gray-500 hover:text-primary-600"
          >
            รายละเอียดประกาศและผู้สมัคร
          </Link>
          {fromPage &&
            (() => {
              const statusMap: Record<string, { label: string; href: string }> =
                {
                  pending: {
                    label: "สถานะรอ",
                    href: `/owner/dashboard/pending${positionQuery}`,
                  },
                  accepted: {
                    label: "สถานะรับเข้าฝึกงาน",
                    href: `/owner/dashboard/accepted${positionQuery}`,
                  },
                  rejected: {
                    label: "สถานะไม่ผ่าน",
                    href: `/owner/dashboard/rejected${positionQuery}`,
                  },
                  cancelled: {
                    label: "สถานะยกเลิกฝึกงาน",
                    href: `/owner/dashboard/cancelled${positionQuery}`,
                  },
                  "near-start": {
                    label: "ใกล้เริ่มฝึกงาน",
                    href: `/owner/dashboard/near-start${positionQuery}`,
                  },
                  applications: {
                    label: "ใบสมัครทั้งหมด",
                    href: `/owner/dashboard/applications${positionQuery}`,
                  },
                  announcements: {
                    label: "รายละเอียดประกาศ",
                    href: "/owner/announcements",
                  },
                };
              const info = statusMap[fromPage];
              if (!info) return null;
              return (
                <>
                  <span className="text-gray-400">&gt;</span>
                  <Link
                    href={info.href}
                    className="text-gray-500 hover:text-primary-600"
                  >
                    {info.label}
                  </Link>
                </>
              );
            })()}
          <span className="text-gray-400">&gt;</span>
          <span className="text-primary-600 font-medium">ดูรายละเอียด</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-xl font-semibold text-gray-900">
                  {application.firstName} {application.lastName}
                </h1>
                <button
                  onClick={() => {
                    setExpandedHistoryItems([]);
                    setShowHistoryModal(true);
                    fetchApplicationHistory(application);
                  }}
                  className="p-2 text-gray-500 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                  title="ประวัติการสมัคร"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 18C6.9 18 5.04167 17.3625 3.425 16.0875C1.80833 14.8125 0.758333 13.1833 0.275 11.2C0.208333 10.95 0.258333 10.7208 0.425 10.5125C0.591667 10.3042 0.816667 10.1833 1.1 10.15C1.36667 10.1167 1.60833 10.1667 1.825 10.3C2.04167 10.4333 2.19167 10.6333 2.275 10.9C2.675 12.4 3.5 13.625 4.75 14.575C6 15.525 7.41667 16 9 16C10.95 16 12.6042 15.3208 13.9625 13.9625C15.3208 12.6042 16 10.95 16 9C16 7.05 15.3208 5.39583 13.9625 4.0375C12.6042 2.67917 10.95 2 9 2C7.85 2 6.775 2.26667 5.775 2.8C4.775 3.33333 3.93333 4.06667 3.25 5H5C5.28333 5 5.52083 5.09583 5.7125 5.2875C5.90417 5.47917 6 5.71667 6 6C6 6.28333 5.90417 6.52083 5.7125 6.7125C5.52083 6.90417 5.28333 7 5 7H1C0.716667 7 0.479167 6.90417 0.2875 6.7125C0.0958333 6.52083 0 6.28333 0 6V2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1C1.28333 1 1.52083 1.09583 1.7125 1.2875C1.90417 1.47917 2 1.71667 2 2V3.35C2.85 2.28333 3.8875 1.45833 5.1125 0.875C6.3375 0.291667 7.63333 0 9 0C10.25 0 11.4208 0.2375 12.5125 0.7125C13.6042 1.1875 14.5542 1.82917 15.3625 2.6375C16.1708 3.44583 16.8125 4.39583 17.2875 5.4875C17.7625 6.57917 18 7.75 18 9C18 10.25 17.7625 11.4208 17.2875 12.5125C16.8125 13.6042 16.1708 14.5542 15.3625 15.3625C14.5542 16.1708 13.6042 16.8125 12.5125 17.2875C11.4208 17.7625 10.25 18 9 18ZM10 8.6L12.5 11.1C12.6833 11.2833 12.775 11.5167 12.775 11.8C12.775 12.0833 12.6833 12.3167 12.5 12.5C12.3167 12.6833 12.0833 12.775 11.8 12.775C11.5167 12.775 11.2833 12.6833 11.1 12.5L8.3 9.7C8.2 9.6 8.125 9.4875 8.075 9.3625C8.025 9.2375 8 9.10833 8 8.975V5C8 4.71667 8.09583 4.47917 8.2875 4.2875C8.47917 4.09583 8.71667 4 9 4C9.28333 4 9.52083 4.09583 9.7125 4.2875C9.90417 4.47917 10 4.71667 10 5V8.6Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`${statusBadge.bgColor} ${statusBadge.textColor} text-sm px-3 py-1 rounded-full`}
                >
                  {statusBadge.text}
                </span>
                {statusBadge.secondary && (
                  <span
                    className={`${statusBadge.secondary.bgColor} ${statusBadge.secondary.textColor} text-sm px-3 py-1 rounded-full`}
                  >
                    {statusBadge.secondary.text}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-600 border-b mtb-6 pb-4 border-[#CECFD2] ">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 21C3.45 21 2.97917 20.8042 2.5875 20.4125C2.19583 20.0208 2 19.55 2 19V8C2 7.45 2.19583 6.97917 2.5875 6.5875C2.97917 6.19583 3.45 6 4 6H8V4C8 3.45 8.19583 2.97917 8.5875 2.5875C8.97917 2.19583 9.45 2 10 2H14C14.55 2 15.0208 2.19583 15.4125 2.5875C15.8042 2.97917 16 3.45 16 4V6H20C20.55 6 21.0208 6.19583 21.4125 6.5875C21.8042 6.97917 22 7.45 22 8V19C22 19.55 21.8042 20.0208 21.4125 20.4125C21.0208 20.8042 20.55 21 20 21H4ZM4 19H20V8H4V19ZM10 6H14V4H10V6Z"
                    fill="#A80689"
                  />
                </svg>

                <span>{application.position || "-"}</span>
              </div>

              {/* Action Buttons based on application status from API */}
              {/* Show "ยืนยันผลการสัมภาษณ์" button for PENDING_INTERVIEW status */}
              {application.detailedStatus === "waiting_interview" && (
                <button
                  onClick={() => setShowInterviewConfirm(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
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

              {/* Show approve/reject buttons for PENDING_CONFIRMATION status */}
              {application.detailedStatus === "waiting_confirm" && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setRejectReason("");
                      setShowRejectModal(true);
                    }}
                    className="flex items-center justify-center gap-2 border-2 bg-red-600 border-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
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
                    ไม่ผ่าน
                  </button>
                  <button
                    onClick={() => setShowApproveConfirm(true)}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700   transition-colors cursor-pointer"
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
                    ผ่าน
                  </button>
                </div>
              )}

              {/* Cancel button (full width) for doc_passed/completed */}
              {(docApprovedApps.includes(application.id) ||
                application.detailedStatus === "doc_passed" ||
                application.detailedStatus === "completed") &&
                application.status !== "cancelled" &&
                !isCancelledViaStorage && (
                  <button
                    onClick={() => {
                      setCancelReason("");
                      setShowCancelModal(true);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 border-2 border-red-600 text-white py-3 rounded-lg hover:bg-red-700 hover:text-red-100 transition-colors font-medium cursor-pointer"
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

              {/* Rejection Reason Box */}
              {(application.status === "rejected" ||
                rejectedApps.includes(application.id)) &&
                (() => {
                  const rejectData = getRejectionData();
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
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
                            {rejectData.reason ||
                              "คุณสมบัติไม่ตรงตามที่หน่วยงานกำหนด"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-red-200">
                        <div>
                          <p className="text-gray-500 text-xs">ผู้ดำเนินการ:</p>
                          <p className="text-gray-900 text-sm">
                            {rejectData.rejectedBy || "นายสมนึก วงค์สวัสดิ"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">
                            วันที่ดำเนินการ:
                          </p>
                          <p className="text-gray-900 text-sm">
                            {formatDateThai(
                              rejectData.rejectedDate || "2568-10-24",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Cancellation Reason Box */}
              {(application.status === "cancelled" || isCancelledViaStorage) &&
                (() => {
                  const cancelData = getCancellationData();
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
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
                            เหตุผลประกอบการยกเลิกฝึกงาน
                          </p>
                          <p className="text-gray-700 text-sm">
                            {cancelData.reason ||
                              "เนื่องจากผู้สมัครไม่สามารถปฏิบัติงานได้ตามกำหนดเวลาที่ตกลงไว้ในแผนการฝึกงาน และไม่มีการแจ้งล่วงหน้า ซึ่งทางหน่วยงานพิจารณาแล้วเห็นสมควรให้ยกเลิกการฝึกงาน"}
                          </p>
                        </div>
                      </div>
                      {/* Operator and Date */}
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-red-200">
                        <div>
                          <p className="text-gray-500 text-xs">ผู้ดำเนินการ:</p>
                          <p className="text-gray-900 text-sm">
                            {cancelData.cancelledBy || "นายมั่นคง ทรงดี"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">วันที่ยกเลิก:</p>
                          <p className="text-gray-900 text-sm">
                            {formatDateThai(
                              cancelData.cancelledDate || "2568-11-15",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Divider */}
              {/* <hr className="my-6 border-[#CECFD2]" /> */}

              {/* Status Progress Section */}
              {(() => {
                const { completedUpTo, currentStep } = getTimelineState();
                const totalSteps = 5;
                const stepLabels = [
                  "รอผู้สมัครยื่นเอกสาร",
                  "รอสัมภาษณ์",
                  "รอการยืนยัน",
                  "รอผู้สมัครยื่นเอกสารขอความอนุเคราะห์",
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
                  const name = [fname, lname].filter(Boolean).join(" ");
                  return `พนักงาน : ${name}`;
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
                const isAllCompleted = completedUpTo >= totalSteps;
                const currentStepIndex = isAllCompleted
                  ? totalSteps - 1
                  : currentStep > 0
                    ? currentStep - 1
                    : completedUpTo;
                const nextStepLabel =
                  currentStepIndex + 1 < totalSteps
                    ? stepLabels[currentStepIndex + 1]
                    : null;
                const circumference = 2 * Math.PI * 36;
                const progress = (completedUpTo / totalSteps) * circumference;

                return (
                  <div>
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
                    <div className="flex items-center gap-5 mb-4">
                      <div className="relative w-20 h-20 shrink-0">
                        <svg
                          className="w-20 h-20 -rotate-90"
                          viewBox="0 0 80 80"
                        >
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
                          {completedUpTo}/{totalSteps}
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
                              {stepLabels[currentStepIndex]}
                            </p>
                            {stepCompletedInfo[currentStepIndex - 1]?.date && (
                              <p className="text-gray-400 text-sm">
                                {stepCompletedInfo[currentStepIndex - 1].date}
                              </p>
                            )}
                            {stepCompletedInfo[currentStepIndex - 1]
                              ?.operator && (
                              <p className="text-gray-400 text-sm">
                                {
                                  stepCompletedInfo[currentStepIndex - 1]
                                    .operator
                                }
                              </p>
                            )}
                            <p className="text-gray-400 text-sm">
                              กำลังดำเนินการ
                            </p>
                            {nextStepLabel && (
                              <p className="text-gray-400 text-sm">
                                ขั้นตอนถัดไป : {nextStepLabel}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {/* Expandable Timeline */}
                    {showAdditionalInfo && (
                      <div className="pb-2">
                        <div className="py-2">
                          <div className="relative">
                            {stepLabels.map((label, index) => {
                              const stepNum = index + 1;
                              const isCompleted = stepNum <= completedUpTo;
                              const isCurrent = stepNum === currentStep;
                              const isLast = index === stepLabels.length - 1;
                              return (
                                <div key={index} className="flex">
                                  <div className="flex flex-col items-center w-10 shrink-0">
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
                                  <div
                                    className={`ml-4 ${isLast ? "pb-0" : "pb-4"} pt-2 min-h-14`}
                                  >
                                    <p
                                      className={`font-bold text-sm leading-snug ${isCompleted || isCurrent ? "text-[#A80689]" : "text-gray-400"}`}
                                    >
                                      {label}
                                    </p>
                                    {isCompleted &&
                                      stepCompletedInfo[index] && (
                                        <div className="mt-1 space-y-0.5">
                                          {stepCompletedInfo[index]
                                            .operator && (
                                            <p className="text-gray-500 text-xs">
                                              {
                                                stepCompletedInfo[index]
                                                  .operator
                                              }
                                            </p>
                                          )}
                                          <p className="text-gray-500 text-xs">
                                            {stepCompletedInfo[index].date}
                                          </p>
                                        </div>
                                      )}
                                    {isCurrent && (
                                      <p className="text-gray-400 text-xs mt-1">
                                        กำลังดำเนินการ
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Divider */}
              <hr className="my-6 border-[#CECFD2]" />

              {/* Documents Section */}
              <div className="space-y-3">
                {["Transcript", "Portfolio", "Resume"].map((docType) => {
                  const doc = application.documents?.find(
                    (d) =>
                      d.type?.toLowerCase() === docType.toLowerCase() ||
                      d.name?.toLowerCase().startsWith(docType.toLowerCase()),
                  );
                  // Hide Portfolio/Resume section entirely if no document uploaded
                  if (!doc && docType !== "Transcript") return null;
                  return (
                    <div key={docType}>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {docType}
                      </p>
                      {doc ? (
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
                            <span className="text-gray-700">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleDownloadDocument(doc.docFile)
                              }
                              className="p-2 text-gray-400 group-hover:text-primary-600 transition-colors cursor-pointer"
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
                              onClick={() => handlePreviewDocument(doc.docFile)}
                              className="p-2 text-gray-400 group-hover:text-primary-600 transition-colors cursor-pointer"
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
                          <span className="text-gray-400">
                            ยังไม่มีเอกสารแนบ
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* เอกสารขอความอนุเคราะห์ - inline in same card */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    เอกสารขอความอนุเคราะห์
                  </p>
                  {(() => {
                    const analysisDoc = application.analysisDocuments?.[0];
                    return analysisDoc ? (
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
                          <span className="text-gray-700 text-sm">
                            {analysisDoc.name || "เอกสารขอความอนุเคราะห์.PDF"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleDownloadDocument(analysisDoc.docFile)
                            }
                            className="p-2 text-gray-400 group-hover:text-primary-600 transition-colors cursor-pointer"
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
                              handlePreviewDocument(analysisDoc.docFile)
                            }
                            className="p-2 text-gray-400 group-hover:text-primary-600 transition-colors cursor-pointer"
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
                    );
                  })()}
                </div>

                {/* เหตุผลที่เอกสารไม่ผ่าน - inline in Documents Card */}
                {(application.detailedStatus === "doc_rejected" ||
                  docRejectedApps.includes(application.id)) &&
                  application.rejectionReason && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        เหตุผลที่เอกสารไม่ผ่าน
                      </p>
                      <div className="bg-red-50 rounded-xl p-4">
                        <p className="text-red-500 text-sm">
                          {application.rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Personal Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ข้อมูลผู้สมัคร
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">
                    ระยะเวลาการฝึกงาน
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDateThai(application.startDate)} -{" "}
                    {formatDateThai(application.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">
                    ชั่วโมงที่ต้องฝึก
                  </p>
                  <p className="font-medium text-gray-900">
                    {application.trainingHours} ชั่วโมง
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">อีเมล</p>
                  <p className="font-medium text-gray-900">
                    {application.email}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">เพศ</p>
                  <p className="font-medium text-gray-900">
                    {application.gender === "male" ? "ชาย" : "หญิง"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-gray-400 text-sm mb-1">เบอร์โทร</p>
                <p className="font-medium text-gray-900">{application.phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">การศึกษาปัจจุบัน</p>
                  <p className="font-medium text-gray-900">มหาวิทยาลัย</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">ชื่อสถาบัน</p>
                  <p className="font-medium text-gray-900">
                    {application.institution}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">คณะ</p>
                  <p className="font-medium text-gray-900">
                    {application.faculty || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">สาขา</p>
                  <p className="font-medium text-gray-900">
                    {application.major}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-gray-400 text-sm mb-1">
                  ทักษะด้านต่าง ๆ ของผู้สมัคร
                </p>
                <p className="font-medium text-gray-900">
                  {application.skill || "-"}
                </p>
              </div>

              <div className="mt-6">
                <p className="text-gray-400 text-sm mb-1">
                  สิ่งที่คาดหวังจากการฝึกงาน
                </p>
                <p className="font-medium text-gray-900">
                  {application.expectation}
                </p>
              </div>
            </div>

            {/* ข้อมูลพี่เลี้ยง Dropdown Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div>
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
                          <p className="text-sm text-gray-900">
                            {positionInfo?.mentors?.[0]?.name ||
                              (application?.mentors?.[0]
                                ? `${application.mentors[0].fname || ""} ${application.mentors[0].lname || ""}`.trim()
                                : "-")}
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
                          <p className="text-sm text-gray-900">
                            {positionInfo?.mentors?.[0]?.email ||
                              application?.mentors?.[0]?.email ||
                              "-"}
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
                          <p className="text-sm text-gray-900">
                            {positionInfo?.mentors?.[0]?.phoneNumber ||
                              application?.mentors?.[0]?.phone ||
                              "-"}
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
            {/* Mentor Cards - each mentor in its own block */}
          </div>
        </div>
      </div>

      {/* Interview Confirmation Popup */}
      {showInterviewConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="flex items-center justify-center mx-auto mb-6">
              <svg
                width="70"
                height="70"
                viewBox="0 0 45 45"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="45" height="45" rx="22.5" fill="#DCFAE6" />
                <path
                  d="M20.1654 25.5007L16.582 21.9173C16.2765 21.6118 15.8876 21.459 15.4154 21.459C14.9431 21.459 14.5543 21.6118 14.2487 21.9173C13.9431 22.2229 13.7904 22.6118 13.7904 23.084C13.7904 23.5562 13.9431 23.9451 14.2487 24.2507L18.9987 29.0007C19.332 29.334 19.7209 29.5007 20.1654 29.5007C20.6098 29.5007 20.9987 29.334 21.332 29.0007L30.7487 19.584C31.0543 19.2784 31.207 18.8895 31.207 18.4173C31.207 17.9451 31.0543 17.5562 30.7487 17.2507C30.4431 16.9451 30.0543 16.7923 29.582 16.7923C29.1098 16.7923 28.7209 16.9451 28.4154 17.2507L20.1654 25.5007ZM22.4987 39.1673C20.1931 39.1673 18.0265 38.7298 15.9987 37.8548C13.9709 36.9798 12.207 35.7923 10.707 34.2923C9.20703 32.7923 8.01953 31.0284 7.14453 29.0007C6.26953 26.9729 5.83203 24.8062 5.83203 22.5007C5.83203 20.1951 6.26953 18.0284 7.14453 16.0007C8.01953 13.9729 9.20703 12.209 10.707 10.709C12.207 9.20898 13.9709 8.02148 15.9987 7.14648C18.0265 6.27148 20.1931 5.83398 22.4987 5.83398C24.8043 5.83398 26.9709 6.27148 28.9987 7.14648C31.0265 8.02148 32.7904 9.20898 34.2904 10.709C35.7904 12.209 36.9779 13.9729 37.8529 16.0007C38.7279 18.0284 39.1654 20.1951 39.1654 22.5007C39.1654 24.8062 38.7279 26.9729 37.8529 29.0007C36.9779 31.0284 35.7904 32.7923 34.2904 34.2923C32.7904 35.7923 31.0265 36.9798 28.9987 37.8548C26.9709 38.7298 24.8043 39.1673 22.4987 39.1673Z"
                  fill="#17B26A"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-8">
              ยืนยันการสัมภาษณ์
            </h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowInterviewConfirm(false)}
                disabled={actionLoading}
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={async () => {
                  await handleMarkInterviewed();
                  setShowInterviewConfirm(false);
                  setShowInterviewSuccess(true);
                  setTimeout(() => {
                    setShowInterviewSuccess(false);
                  }, 2000);
                }}
                disabled={actionLoading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "กำลังดำเนินการ..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Success Popup */}
      {showInterviewSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="rounded-full flex items-center justify-center">
                <svg
                  width="70"
                  height="70"
                  viewBox="0 0 45 45"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="45" height="45" rx="22.5" fill="#DCFAE6" />
                  <path
                    d="M20.1654 25.5007L16.582 21.9173C16.2765 21.6118 15.8876 21.459 15.4154 21.459C14.9431 21.459 14.5543 21.6118 14.2487 21.9173C13.9431 22.2229 13.7904 22.6118 13.7904 23.084C13.7904 23.5562 13.9431 23.9451 14.2487 24.2507L18.9987 29.0007C19.332 29.334 19.7209 29.5007 20.1654 29.5007C20.6098 29.5007 20.9987 29.334 21.332 29.0007L30.7487 19.584C31.0543 19.2784 31.207 18.8895 31.207 18.4173C31.207 17.9451 31.0543 17.5562 30.7487 17.2507C30.4431 16.9451 30.0543 16.7923 29.582 16.7923C29.1098 16.7923 28.7209 16.9451 28.4154 17.2507L20.1654 25.5007ZM22.4987 39.1673C20.1931 39.1673 18.0265 38.7298 15.9987 37.8548C13.9709 36.9798 12.207 35.7923 10.707 34.2923C9.20703 32.7923 8.01953 31.0284 7.14453 29.0007C6.26953 26.9729 5.83203 24.8062 5.83203 22.5007C5.83203 20.1951 6.26953 18.0284 7.14453 16.0007C8.01953 13.9729 9.20703 12.209 10.707 10.709C12.207 9.20898 13.9709 8.02148 15.9987 7.14648C18.0265 6.27148 20.1931 5.83398 22.4987 5.83398C24.8043 5.83398 26.9709 6.27148 28.9987 7.14648C31.0265 8.02148 32.7904 9.20898 34.2904 10.709C35.7904 12.209 36.9779 13.9729 37.8529 16.0007C38.7279 18.0284 39.1654 20.1951 39.1654 22.5007C39.1654 24.8062 38.7279 26.9729 37.8529 29.0007C36.9779 31.0284 35.7904 32.7923 34.2904 34.2923C32.7904 35.7923 31.0265 36.9798 28.9987 37.8548C26.9709 38.7298 24.8043 39.1673 22.4987 39.1673Z"
                    fill="#17B26A"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              ยืนยันการสัมภาษณ์
            </h3>
            <p className="text-lg font-bold text-gray-900">เรียบร้อยแล้ว</p>
          </div>
        </div>
      )}

      {/* Approve Confirmation Popup */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 text-center">
            {/* Green Checkmark Icon */}
            <div className="flex justify-center mb-4">
              <svg
                width="70"
                height="70"
                viewBox="0 0 45 45"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="45" height="45" rx="22.5" fill="#DCFAE6" />
                <path
                  d="M20.1654 25.5007L16.582 21.9173C16.2765 21.6118 15.8876 21.459 15.4154 21.459C14.9431 21.459 14.5543 21.6118 14.2487 21.9173C13.9431 22.2229 13.7904 22.6118 13.7904 23.084C13.7904 23.5562 13.9431 23.9451 14.2487 24.2507L18.9987 29.0007C19.332 29.334 19.7209 29.5007 20.1654 29.5007C20.6098 29.5007 20.9987 29.334 21.332 29.0007L30.7487 19.584C31.0543 19.2784 31.207 18.8895 31.207 18.4173C31.207 17.9451 31.0543 17.5562 30.7487 17.2507C30.4431 16.9451 30.0543 16.7923 29.582 16.7923C29.1098 16.7923 28.7209 16.9451 28.4154 17.2507L20.1654 25.5007ZM22.4987 39.1673C20.1931 39.1673 18.0265 38.7298 15.9987 37.8548C13.9709 36.9798 12.207 35.7923 10.707 34.2923C9.20703 32.7923 8.01953 31.0284 7.14453 29.0007C6.26953 26.9729 5.83203 24.8062 5.83203 22.5007C5.83203 20.1951 6.26953 18.0284 7.14453 16.0007C8.01953 13.9729 9.20703 12.209 10.707 10.709C12.207 9.20898 13.9709 8.02148 15.9987 7.14648C18.0265 6.27148 20.1931 5.83398 22.4987 5.83398C24.8043 5.83398 26.9709 6.27148 28.9987 7.14648C31.0265 8.02148 32.7904 9.20898 34.2904 10.709C35.7904 12.209 36.9779 13.9729 37.8529 16.0007C38.7279 18.0284 39.1654 20.1951 39.1654 22.5007C39.1654 24.8062 38.7279 26.9729 37.8529 29.0007C36.9779 31.0284 35.7904 32.7923 34.2904 34.2923C32.7904 35.7923 31.0265 36.9798 28.9987 37.8548C26.9709 38.7298 24.8043 39.1673 22.4987 39.1673Z"
                  fill="#17B26A"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ยืนยันการรับเข้าฝึกงาน
            </h3>
            <p className="text-gray-600 mb-6">
              คุณต้องการรับ{" "}
              <span className="font-semibold">
                {application.firstName} {application.lastName}
              </span>{" "}
              เข้าฝึกงานใช่หรือไม่?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveConfirm(false)}
                disabled={actionLoading}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  await handleApprove();
                  setShowApproveConfirm(false);
                }}
                disabled={actionLoading}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "กำลังดำเนินการ..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal (Step 1) */}
      {showRejectModal && application && (
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
                    {application.firstName} {application.lastName}
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
                  if (rejectReason.trim()) handleReject();
                }}
                disabled={!rejectReason.trim() || actionLoading}
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
                {actionLoading ? "กำลังดำเนินการ..." : "ยืนยันการปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Success Popup */}
      {showRejectSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
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
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              ปฏิเสธรับเข้าฝึกงาน
            </h3>
            <p className="text-lg font-bold text-gray-900">เรียบร้อยแล้ว</p>
          </div>
        </div>
      )}

      {/* Cancel Internship Modal */}
      {showCancelModal && application && (
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
                    {application.firstName} {application.lastName}
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
                  if (cancelReason.trim() && application) {
                    const existingCancelled = (() => {
                      try {
                        const stored =
                          localStorage.getItem("pea_cancelled_apps");
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
                        (c: { id: string }) => c.id === application.id,
                      )
                    ) {
                      existingCancelled.push({
                        id: application.id,
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
                    setShowCancelModal(false);
                    setCancelReason("");
                    setShowCancelSuccess(true);
                    setTimeout(() => {
                      setShowCancelSuccess(false);
                    }, 500);
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

      {/* Cancel Success Popup */}
      {showCancelSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
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
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              ยกเลิกฝึกงานเรียบร้อยแล้ว
            </h3>
          </div>
        </div>
      )}

      {/* Application History Modal */}
      {showHistoryModal &&
        application &&
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
                        {application.firstName} {application.lastName}
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

export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ApplicationDetailContent />
    </Suspense>
  );
}
