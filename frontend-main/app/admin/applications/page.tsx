"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  applicationApi,
  departmentApi,
  AllStudentsHistoryItem,
  AppStatusEnum,
} from "@/services/api";

type ActiveTab = "pending_upload" | "pending_review" | "approved" | "rejected";

type AdminDocStatus =
  | "pending_upload"
  | "pending_review"
  | "approved"
  | "rejected";

type ApprovedInternStatusFilter =
  | "all"
  | "awaiting"
  | "active"
  | "completed"
  | "cancelled";

const APPROVED_STATUS_FILTER_OPTIONS: Array<{
  value: ApprovedInternStatusFilter;
  label: string;
}> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "awaiting", label: "รอเริ่มฝึกงาน" },
  { value: "active", label: "อยู่ระหว่างฝึกงาน" },
  { value: "completed", label: "ฝึกงานเสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิกฝึกงาน" },
];

function getDocStatus(app: AllStudentsHistoryItem): AdminDocStatus {
  if (app.applicationStatus === "PENDING_REQUEST") {
    const anyInvalid = app.documents.some(
      (d) => d.validationStatus === "INVALID",
    );
    if (anyInvalid) return "rejected";
    return "pending_upload";
  }
  if (app.applicationStatus === "PENDING_REVIEW") {
    const anyInvalid = app.documents.some(
      (d) => d.validationStatus === "INVALID",
    );
    if (anyInvalid) return "rejected";

    const allVerified =
      app.documents.length > 0 &&
      app.documents.every((d) => d.validationStatus === "VERIFIED");
    if (allVerified) return "approved";

    return "pending_review";
  }
  if (app.applicationStatus === "COMPLETE") return "approved";
  if (app.applicationStatus === "CANCEL") return "approved";
  return "pending_upload";
}

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

const thaiMonthsShort = [
  "ม.ค",
  "ก.พ",
  "มี.ค",
  "เม.ย",
  "พ.ค",
  "มิ.ย",
  "ก.ค",
  "ส.ค",
  "ก.ย",
  "ต.ค",
  "พ.ย",
  "ธ.ค",
];

function toDateOnly(dateString?: string | null): Date | null {
  if (!dateString) return null;

  const datePart = dateString.split("T")[0]?.trim();
  const plainMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  let parsedDate: Date;
  if (plainMatch) {
    const [, year, month, day] = plainMatch;
    parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  } else {
    parsedDate = new Date(dateString);
  }

  if (Number.isNaN(parsedDate.getTime())) return null;
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

function parseISODate(value?: string | null): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortThaiDate(dateString?: string | null): string {
  const d = toDateOnly(dateString);
  if (!d) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = thaiMonthsShort[d.getMonth()];
  const buddhistYear = d.getFullYear() + 543;

  return `${day} ${month} ${buddhistYear}`;
}

function getApprovedInternStatus(
  app: AllStudentsHistoryItem,
): Exclude<ApprovedInternStatusFilter, "all"> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const startDate = toDateOnly(app.infoStartDate || app.profileStartDate);
  const endDate = toDateOnly(app.infoEndDate || app.profileEndDate);

  if (app.applicationStatus === "CANCEL") return "cancelled";
  if (app.studentInternshipStatus === "CANCEL") return "cancelled";
  if (app.studentInternshipStatus === "AWAITING") return "awaiting";
  if (app.studentInternshipStatus === "COMPLETE") return "completed";

  if (endDate && now.getTime() > endDate.getTime()) return "completed";

  const isActiveByPeriod =
    !!startDate &&
    !!endDate &&
    now.getTime() >= startDate.getTime() &&
    now.getTime() <= endDate.getTime();

  if (app.studentInternshipStatus === "ACTIVE" || isActiveByPeriod) {
    return "active";
  }

  return "active";
}

function formatDateThai(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateRange(
  startStr: string | null,
  endStr: string | null,
): string {
  if (!startStr || !endStr) return "-";
  return `${formatDateThai(startStr)} - ${formatDateThai(endStr)}`;
}

function formatShortBuddhistDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = toDateOnly(dateStr);
  if (!d) return "";
  const day = d.getDate();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const buddhistYear = (d.getFullYear() + 543) % 100;
  const yearStr = String(buddhistYear).padStart(2, "0");
  return `${day}/${month}/${yearStr}`;
}

function formatShortDateRange(
  startStr: string | null,
  endStr: string | null,
): string {
  if (!startStr || !endStr) return "-";
  const s = formatShortBuddhistDate(startStr);
  const e = formatShortBuddhistDate(endStr);
  if (!s || !e) return "-";
  return `${s}-${e}`;
}

function getInstitutionDisplayName(app: AllStudentsHistoryItem): string {
  const rawNote = (app.studentNote || "").trim();
  if (rawNote) {
    const institutionFromNote = rawNote
      .split("|")
      .map((part) => part.trim())
      .find((part) => part.startsWith("สถานศึกษา:"));
    if (institutionFromNote) {
      const name = institutionFromNote.replace("สถานศึกษา:", "").trim();
      if (name) return name;
    }
  }

  return app.institutionName?.trim() || "-";
}

function getBadge(app: AllStudentsHistoryItem, tab: ActiveTab) {
  if (tab === "pending_upload") {
    return {
      text: "รออัปโหลดเอกสาร",
      className: "bg-gray-100 text-gray-700 border border-gray-300",
    };
  }

  if (tab === "pending_review") {
    return {
      text: "รอตรวจเอกสาร",
      className: "bg-[#FEF0C7] text-[#7A2E0E] border border-[#FEDF89]",
    };
  }

  if (tab === "approved") {
    if (app.applicationStatus === "CANCEL") {
      return {
        text: "ยกเลิกฝึกงาน",
        className: "bg-[#FEE4E2] text-[#B42318] border border-[#FECDCA]",
      };
    }
    if (app.studentInternshipStatus === "CANCEL") {
      return {
        text: "ยกเลิกฝึกงาน",
        className: "bg-[#FEE4E2] text-[#B42318] border border-[#FECDCA]",
      };
    }
    if (app.studentInternshipStatus === "AWAITING") {
      return {
        text: "รอเริ่มฝึกงาน",
        className: "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]",
      };
    }
    if (app.studentInternshipStatus === "COMPLETE") {
      return {
        text: "ฝึกงานเสร็จสิ้น",
        className: "bg-[#DCFAE6] text-[#085D3A] border border-[#A9EFC5]",
      };
    }
    if (app.infoEndDate && new Date(app.infoEndDate) <= new Date()) {
      return {
        text: "ฝึกงานเสร็จสิ้น",
        className: "bg-[#DCFAE6] text-[#085D3A] border border-[#A9EFC5]",
      };
    }

    return {
      text: "อยู่ระหว่างฝึกงาน",
      className: "bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]",
    };
  }

  return {
    text: "เอกสารไม่ผ่าน",
    className: "bg-[#FEE4E2] text-[#912018] border border-[#FECDCA]",
  };
}

export default function AdminApplicationsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <span className="ml-3 text-gray-500">กำลังโหลด...</span>
          </div>
        </div>
      }
    >
      <AdminApplicationsPage />
    </Suspense>
  );
}

function AdminApplicationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as ActiveTab | null;
  const activeTab: ActiveTab =
    tabParam === "pending_upload" ||
    tabParam === "pending_review" ||
    tabParam === "approved" ||
    tabParam === "rejected"
      ? tabParam
      : "pending_upload";

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [applications, setApplications] = useState<AllStudentsHistoryItem[]>(
    [],
  );
  const [deptMap, setDeptMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedApprovedStartDate, setSelectedApprovedStartDate] =
    useState("");
  const [selectedApprovedEndDate, setSelectedApprovedEndDate] = useState("");
  const [draftApprovedStartDate, setDraftApprovedStartDate] = useState("");
  const [draftApprovedEndDate, setDraftApprovedEndDate] = useState("");
  const [selectedApprovedStatusFilter, setSelectedApprovedStatusFilter] =
    useState<ApprovedInternStatusFilter>("all");
  const [showApprovedDateDropdown, setShowApprovedDateDropdown] =
    useState(false);
  const [showApprovedStatusDropdown, setShowApprovedStatusDropdown] =
    useState(false);
  const [approvedDateViewMonth, setApprovedDateViewMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const approvedDateDropdownRef = useRef<HTMLDivElement>(null);
  const approvedStatusDropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const htmlEl = document.documentElement;
    const previousScrollbarGutter = htmlEl.style.scrollbarGutter;

    // Keep scrollbar gutter reserved to prevent page shift when dropdown opens.
    htmlEl.style.scrollbarGutter = "stable";

    return () => {
      htmlEl.style.scrollbarGutter = previousScrollbarGutter;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        approvedDateDropdownRef.current &&
        !approvedDateDropdownRef.current.contains(target)
      ) {
        setShowApprovedDateDropdown(false);
      }

      if (
        approvedStatusDropdownRef.current &&
        !approvedStatusDropdownRef.current.contains(target)
      ) {
        setShowApprovedStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const setActiveTab = (tab: ActiveTab) => {
    router.push(`/admin/applications?tab=${tab}`);
    setCurrentPage(1);
    setSearchQuery("");
    setSelectedApprovedStartDate("");
    setSelectedApprovedEndDate("");
    setDraftApprovedStartDate("");
    setDraftApprovedEndDate("");
    setSelectedApprovedStatusFilter("all");
    setShowApprovedDateDropdown(false);
    setShowApprovedStatusDropdown(false);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqRes, revRes, compRes, cancelRes] = await Promise.all([
        applicationApi.getAllStudentsHistory({
          limit: 500,
          status: "PENDING_REQUEST" as AppStatusEnum,
        }),
        applicationApi.getAllStudentsHistory({
          limit: 500,
          status: "PENDING_REVIEW" as AppStatusEnum,
        }),
        applicationApi.getAllStudentsHistory({
          limit: 500,
          status: "COMPLETE" as AppStatusEnum,
        }),
        applicationApi.getAllStudentsHistory({
          limit: 500,
          status: "CANCEL" as AppStatusEnum,
          includeCanceled: true,
        }),
      ]);
      const allApps = [...reqRes.data, ...revRes.data, ...compRes.data, ...cancelRes.data];
      setApplications(allApps);

      // Collect unique departmentIds that need lookup
      const deptIds = new Set<number>();
      for (const a of allApps) {
        if (a.departmentId != null) deptIds.add(a.departmentId);
      }

      // Fetch each department by its deptSap
      const map: Record<string, string> = {};
      await Promise.all(
        Array.from(deptIds).map(async (id) => {
          const dept = await departmentApi.getDepartmentByDeptSap(id);
          if (dept) {
            const name = dept.deptFull || dept.deptShort;
            if (name) {
              map[String(id)] = name;
            }
          }
        })
      );
      setDeptMap(map);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const stats = useMemo(() => {
    const pendingUpload = applications.filter(
      (a) => getDocStatus(a) === "pending_upload",
    ).length;
    const pendingReview = applications.filter(
      (a) => getDocStatus(a) === "pending_review",
    ).length;
    const approved = applications.filter(
      (a) => getDocStatus(a) === "approved",
    ).length;
    const rejected = applications.filter(
      (a) => getDocStatus(a) === "rejected",
    ).length;
    return { pendingUpload, pendingReview, approved, rejected };
  }, [applications]);

  // Filter by active tab
  const filtered = useMemo(() => {
    let result = [...applications];
    if (activeTab === "pending_upload") {
      result = result.filter((a) => getDocStatus(a) === "pending_upload");
    } else if (activeTab === "pending_review") {
      result = result.filter((a) => getDocStatus(a) === "pending_review");
    } else if (activeTab === "approved") {
      result = result.filter((a) => getDocStatus(a) === "approved");
    } else if (activeTab === "rejected") {
      result = result.filter((a) => getDocStatus(a) === "rejected");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((app) =>
        `${app.fname || ""} ${app.lname || ""}`.toLowerCase().includes(q),
      );
    }

    if (activeTab === "approved") {
      const filterStart = parseISODate(selectedApprovedStartDate);
      const filterEnd = parseISODate(selectedApprovedEndDate);

      result = result.filter((app) => {
        const appStatus = getApprovedInternStatus(app);
        const matchStatus =
          selectedApprovedStatusFilter === "all"
            ? true
            : appStatus === selectedApprovedStatusFilter;

        const internshipStart = toDateOnly(
          app.infoStartDate || app.profileStartDate,
        );
        const internshipEnd =
          toDateOnly(app.infoEndDate || app.profileEndDate) || internshipStart;

        const matchDateRange = (() => {
          if (!filterStart && !filterEnd) return true;
          if (!internshipStart || !internshipEnd) return false;

          const normalizedFilterStart = filterStart || filterEnd;
          const normalizedFilterEnd = filterEnd || filterStart;
          if (!normalizedFilterStart || !normalizedFilterEnd) return false;

          return (
            internshipStart.getTime() <= normalizedFilterEnd.getTime() &&
            internshipEnd.getTime() >= normalizedFilterStart.getTime()
          );
        })();

        return matchStatus && matchDateRange;
      });
    }

    return result;
  }, [
    applications,
    searchQuery,
    activeTab,
    selectedApprovedStatusFilter,
    selectedApprovedStartDate,
    selectedApprovedEndDate,
  ]);

  useEffect(() => {
    if (activeTab === "approved") {
      setCurrentPage(1);
    }
  }, [
    activeTab,
    selectedApprovedStatusFilter,
    selectedApprovedStartDate,
    selectedApprovedEndDate,
  ]);

  const selectedApprovedStatusFilterLabel =
    selectedApprovedStatusFilter === "all"
      ? "สถานะ"
      : APPROVED_STATUS_FILTER_OPTIONS.find(
          (option) => option.value === selectedApprovedStatusFilter,
        )?.label || "สถานะ";

  const getApprovedStartDateDisplayText = () => {
    if (!selectedApprovedStartDate && !selectedApprovedEndDate) {
      return "วันที่เริ่มฝึกงาน";
    }

    if (selectedApprovedStartDate && selectedApprovedEndDate) {
      if (selectedApprovedStartDate === selectedApprovedEndDate) {
        return formatShortThaiDate(selectedApprovedStartDate);
      }
      return `${formatShortThaiDate(selectedApprovedStartDate)} - ${formatShortThaiDate(selectedApprovedEndDate)}`;
    }

    if (selectedApprovedStartDate) {
      return formatShortThaiDate(selectedApprovedStartDate);
    }

    return formatShortThaiDate(selectedApprovedEndDate);
  };

  const openApprovedDateDropdown = () => {
    const selectedDate =
      parseISODate(selectedApprovedStartDate) ||
      parseISODate(selectedApprovedEndDate);
    const base = selectedDate || new Date();
    setDraftApprovedStartDate(selectedApprovedStartDate);
    setDraftApprovedEndDate(selectedApprovedEndDate);
    setApprovedDateViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setShowApprovedDateDropdown(true);
  };

  const approvedDateWeekdayLabels = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const approvedDateCells = useMemo(() => {
    const year = approvedDateViewMonth.getFullYear();
    const month = approvedDateViewMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { date: Date; inCurrentMonth: boolean }[] = [];

    for (let i = startWeekDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        inCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inCurrentMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (startWeekDay + daysInMonth) + 1;
      cells.push({
        date: new Date(year, month + 1, nextDay),
        inCurrentMonth: false,
      });
    }

    return cells;
  }, [approvedDateViewMonth]);

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
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1, totalPages);
    }
    return pages.filter((p, i, arr) => arr.indexOf(p) === i);
  };

  const pageTitle =
    activeTab === "pending_upload"
      ? "รออัปโหลดเอกสาร"
      : activeTab === "pending_review"
        ? "รอตรวจเอกสาร"
        : activeTab === "approved"
          ? "เอกสารผ่าน"
          : "เอกสารไม่ผ่าน";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{pageTitle}</h1>
        <p className="text-gray-500 mb-6">
          ค้นหาใบสมัครสถานะ{pageTitle}ได้ {filtered.length} รายการ
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div
            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${activeTab === "pending_upload" ? "border-l-4 border-gray-600 ring-1 ring-gray-600" : "border-gray-300 hover:border-gray-600/60"}`}
            onClick={() => setActiveTab("pending_upload")}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-5 h-5 ${
                  activeTab === "pending_upload"
                    ? "text-gray-600"
                    : "text-primary-600"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 16V8M12 8L9 11M12 8L15 11"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 15.5V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V15.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <p
              className={`text-2xl font-bold leading-tight ${
                activeTab === "pending_upload"
                  ? "text-gray-600"
                  : "text-primary-600"
              }`}
            >
              {stats.pendingUpload} รายการ
            </p>
            <span className="text-sm text-gray-600">รออัปโหลดเอกสาร</span>
          </div>

          <div
            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${activeTab === "pending_review" ? "border-l-4 border-[#F79009] ring-1 ring-[#F79009]" : "border-gray-300 hover:border-[#F79009]/60"}`}
            onClick={() => setActiveTab("pending_review")}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-5 h-5 ${
                  activeTab === "pending_review"
                    ? "text-[#F79009]"
                    : "text-primary-600"
                }`}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.125 7.25V5C8.125 4.82292 8.0651 4.67448 7.94531 4.55469C7.82552 4.4349 7.67708 4.375 7.5 4.375C7.32292 4.375 7.17448 4.4349 7.05469 4.55469C6.9349 4.67448 6.875 4.82292 6.875 5V7.48438C6.875 7.56771 6.89062 7.64844 6.92187 7.72656C6.95312 7.80469 7 7.875 7.0625 7.9375L9.125 10C9.23958 10.1146 9.38542 10.1719 9.5625 10.1719C9.73958 10.1719 9.88542 10.1146 10 10C10.1146 9.88542 10.1719 9.73958 10.1719 9.5625C10.1719 9.38542 10.1146 9.23958 10 9.125L8.125 7.25ZM7.5 13.75C6.63542 13.75 5.82292 13.5859 5.0625 13.2578C4.30208 12.9297 3.64062 12.4844 3.07812 11.9219C2.51562 11.3594 2.07031 10.6979 1.74219 9.9375C1.41406 9.17708 1.25 8.36458 1.25 7.5C1.25 6.63542 1.41406 5.82292 1.74219 5.0625C2.07031 4.30208 2.51562 3.64062 3.07812 3.07812C3.64062 2.51562 4.30208 2.07031 5.0625 1.74219C5.82292 1.41406 6.63542 1.25 7.5 1.25C8.36458 1.25 9.17708 1.41406 9.9375 1.74219C10.6979 2.07031 11.3594 2.51562 11.9219 3.07812C12.4844 3.64062 12.9297 4.30208 13.2578 5.0625C13.5859 5.82292 13.75 6.63542 13.75 7.5C13.75 8.36458 13.5859 9.17708 13.2578 9.9375C12.9297 10.6979 12.4844 11.3594 11.9219 11.9219C11.3594 12.4844 10.6979 12.9297 9.9375 13.2578C9.17708 13.5859 8.36458 13.75 7.5 13.75ZM7.5 12.5C8.88542 12.5 10.0651 12.013 11.0391 11.0391C12.013 10.0651 12.5 8.88542 12.5 7.5C12.5 6.11458 12.013 4.9349 11.0391 3.96094C10.0651 2.98698 8.88542 2.5 7.5 2.5C6.11458 2.5 4.9349 2.98698 3.96094 3.96094C2.98698 4.9349 2.5 6.11458 2.5 7.5C2.5 8.88542 2.98698 10.0651 3.96094 11.0391C4.9349 12.013 6.11458 12.5 7.5 12.5Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <p
              className={`text-2xl font-bold leading-tight ${
                activeTab === "pending_review"
                  ? "text-[#F79009]"
                  : "text-primary-600"
              }`}
            >
              {stats.pendingReview} รายการ
            </p>
            <span className="text-sm text-gray-600">รอตรวจเอกสาร</span>
          </div>

          <div
            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${activeTab === "approved" ? "border-l-4 border-[#12B76A] ring-1 ring-[#12B76A]" : "border-gray-300 hover:border-[#12B76A]/60"}`}
            onClick={() => setActiveTab("approved")}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-5 h-5 ${
                  activeTab === "approved"
                    ? "text-[#12B76A]"
                    : "text-primary-600"
                }`}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.375 7.375L4.03125 6.03125C3.91667 5.91667 3.77083 5.85938 3.59375 5.85938C3.41667 5.85938 3.27083 5.91667 3.15625 6.03125C3.04167 6.14583 2.98438 6.29167 2.98438 6.46875C2.98438 6.64583 3.04167 6.79167 3.15625 6.90625L4.9375 8.6875C5.0625 8.8125 5.20833 8.875 5.375 8.875C5.54167 8.875 5.6875 8.8125 5.8125 8.6875L9.34375 5.15625C9.45833 5.04167 9.51563 4.89583 9.51563 4.71875C9.51563 4.54167 9.45833 4.39583 9.34375 4.28125C9.22917 4.16667 9.08333 4.10938 8.90625 4.10938C8.72917 4.10938 8.58333 4.16667 8.46875 4.28125L5.375 7.375ZM6.25 12.5C5.38542 12.5 4.57292 12.3359 3.8125 12.0078C3.05208 11.6797 2.39062 11.2344 1.82812 10.6719C1.26562 10.1094 0.820313 9.44792 0.492188 8.6875C0.164062 7.92708 0 7.11458 0 6.25C0 5.38542 0.164062 4.57292 0.492188 3.8125C0.820313 3.05208 1.26562 2.39062 1.82812 1.82812C2.39062 1.26562 3.05208 0.820313 3.8125 0.492188C4.57292 0.164062 5.38542 0 6.25 0C7.11458 0 7.92708 0.164062 8.6875 0.492188C9.44792 0.820313 10.1094 1.26562 10.6719 1.82812C11.2344 2.39062 11.6797 3.05208 12.0078 3.8125C12.3359 4.57292 12.5 5.38542 12.5 6.25C12.5 7.11458 12.3359 7.92708 12.0078 8.6875C11.6797 9.44792 11.2344 10.1094 10.6719 10.6719C10.1094 11.2344 9.44792 11.6797 8.6875 12.0078C7.92708 12.3359 7.11458 12.5 6.25 12.5ZM6.25 11.25C7.64583 11.25 8.82813 10.7656 9.79688 9.79688C10.7656 8.82813 11.25 7.64583 11.25 6.25C11.25 4.85417 10.7656 3.67188 9.79688 2.70313C8.82813 1.73438 7.64583 1.25 6.25 1.25C4.85417 1.25 3.67188 1.73438 2.70313 2.70313C1.73438 3.67188 1.25 4.85417 1.25 6.25C1.25 7.64583 1.73438 8.82813 2.70313 9.79688C3.67188 10.7656 4.85417 11.25 6.25 11.25Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            <p
              className={`text-2xl font-bold leading-tight ${
                activeTab === "approved" ? "text-[#12B76A]" : "text-primary-600"
              }`}
            >
              {stats.approved} รายการ
            </p>
            <span className="text-sm text-gray-600">เอกสารผ่าน</span>
          </div>

          <div
            className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${
              activeTab === "rejected"
                ? "border-l-4 border-[#F04438] ring-1 ring-[#F04438]"
                : "border-gray-300 hover:border-[#F04438]/60"
            }`}
            onClick={() => setActiveTab("rejected")}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-5 h-5 ${
                  activeTab === "rejected"
                    ? "text-[#F04438]"
                    : "text-primary-600"
                }`}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.25 7.125L8.0625 8.9375C8.17708 9.05208 8.32292 9.10937 8.5 9.10937C8.67708 9.10937 8.82292 9.05208 8.9375 8.9375C9.05208 8.82292 9.10937 8.67708 9.10937 8.5C9.10937 8.32292 9.05208 8.17708 8.9375 8.0625L7.125 6.25L8.9375 4.4375C9.05208 4.32292 9.10937 4.17708 9.10937 4C9.10937 3.82292 9.05208 3.67708 8.9375 3.5625C8.82292 3.44792 8.67708 3.39063 8.5 3.39063C8.32292 3.39063 8.17708 3.44792 8.0625 3.5625L6.25 5.375L4.4375 3.5625C4.32292 3.44792 4.17708 3.39063 4 3.39063C3.82292 3.39063 3.67708 3.44792 3.5625 3.5625C3.44792 3.67708 3.39063 3.82292 3.39063 4C3.39063 4.17708 3.44792 4.32292 3.5625 4.4375L5.375 6.25L3.5625 8.0625C3.44792 8.17708 3.39063 8.32292 3.39063 8.5C3.39063 8.67708 3.44792 8.82292 3.5625 8.9375C3.67708 9.05208 3.82292 9.10937 4 9.10937C4.17708 9.10937 4.32292 9.05208 4.4375 8.9375L6.25 7.125Z"
                    fill="currentColor"
                  />
                  <path
                    d="M6.25 12.5C5.38542 12.5 4.57292 12.3359 3.8125 12.0078C3.05208 11.6797 2.39062 11.2344 1.82812 10.6719C1.26562 10.1094 0.820313 9.44792 0.492188 8.6875C0.164062 7.92708 0 7.11458 0 6.25C0 5.38542 0.164062 4.57292 0.492188 3.8125C0.820313 3.05208 1.26562 2.39062 1.82812 1.82812C2.39062 1.26562 3.05208 0.820313 3.8125 0.492188C4.57292 0.164062 5.38542 0 6.25 0C7.11458 0 7.92708 0.164062 8.6875 0.492188C9.44792 0.820313 10.1094 1.26562 10.6719 1.82812C11.2344 2.39062 11.6797 3.05208 12.0078 3.8125C12.3359 4.57292 12.5 5.38542 12.5 6.25C12.5 7.11458 12.3359 7.92708 12.0078 8.6875C11.6797 9.44792 11.2344 10.1094 10.6719 10.6719C10.1094 11.2344 9.44792 11.6797 8.6875 12.0078C7.92708 12.3359 7.11458 12.5 6.25 12.5Z"
                    stroke="currentColor"
                  />
                </svg>
              </div>
            </div>

            <p
              className={`text-2xl font-bold leading-tight ${
                activeTab === "rejected" ? "text-[#F04438]" : "text-primary-600"
              }`}
            >
              {stats.rejected} รายการ
            </p>

            <span className="text-sm text-gray-600">เอกสารไม่ผ่าน</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-300 overflow-visible">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div
              className={
                activeTab === "approved"
                  ? "grid grid-cols-1 md:grid-cols-3 gap-3"
                  : "relative max-w-sm"
              }
            >
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              {activeTab === "approved" && (
                <>
                  <div className="relative" ref={approvedDateDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        if (showApprovedDateDropdown) {
                          setShowApprovedDateDropdown(false);
                          return;
                        }
                        setShowApprovedStatusDropdown(false);
                        openApprovedDateDropdown();
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white flex items-center justify-between cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                      <span
                        className={`truncate ${selectedApprovedStartDate || selectedApprovedEndDate ? "text-gray-700" : "text-gray-500"}`}
                      >
                        {getApprovedStartDateDisplayText()}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        <svg
                          className="w-5 h-5 text-gray-500"
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
                        {(selectedApprovedStartDate ||
                          selectedApprovedEndDate) && (
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApprovedStartDate("");
                              setSelectedApprovedEndDate("");
                              setDraftApprovedStartDate("");
                              setDraftApprovedEndDate("");
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="ล้างช่วงวันที่"
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

                    {showApprovedDateDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3">
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() =>
                              setApprovedDateViewMonth(
                                (prev) =>
                                  new Date(
                                    prev.getFullYear(),
                                    prev.getMonth() - 1,
                                    1,
                                  ),
                              )
                            }
                            className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                            aria-label="เดือนก่อนหน้า"
                          >
                            ←
                          </button>
                          <div className="text-lg font-semibold text-gray-800">
                            {thaiMonths[approvedDateViewMonth.getMonth()]}{" "}
                            {approvedDateViewMonth.getFullYear() + 543}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setApprovedDateViewMonth(
                                (prev) =>
                                  new Date(
                                    prev.getFullYear(),
                                    prev.getMonth() + 1,
                                    1,
                                  ),
                              )
                            }
                            className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                            aria-label="เดือนถัดไป"
                          >
                            →
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {approvedDateWeekdayLabels.map((label) => (
                            <div
                              key={label}
                              className="text-center text-gray-500 text-xs font-medium py-1.5"
                            >
                              {label}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {approvedDateCells.map(({ date, inCurrentMonth }) => {
                            const iso = toISODate(date);
                            const hasStart = !!draftApprovedStartDate;
                            const hasEnd = !!draftApprovedEndDate;
                            const isStart = draftApprovedStartDate === iso;
                            const isEnd = draftApprovedEndDate === iso;
                            const isInRange =
                              hasStart &&
                              hasEnd &&
                              iso > draftApprovedStartDate &&
                              iso < draftApprovedEndDate;

                            return (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => {
                                  if (
                                    !draftApprovedStartDate ||
                                    draftApprovedEndDate
                                  ) {
                                    setDraftApprovedStartDate(iso);
                                    setDraftApprovedEndDate("");
                                  } else if (iso < draftApprovedStartDate) {
                                    setDraftApprovedEndDate(
                                      draftApprovedStartDate,
                                    );
                                    setDraftApprovedStartDate(iso);
                                  } else {
                                    setDraftApprovedEndDate(iso);
                                  }

                                  if (!inCurrentMonth) {
                                    setApprovedDateViewMonth(
                                      new Date(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        1,
                                      ),
                                    );
                                  }
                                }}
                                className={`h-8 rounded-md text-xs font-medium transition ${
                                  isStart || isEnd
                                    ? "bg-primary-600 text-white"
                                    : isInRange
                                      ? "bg-gray-100 text-gray-700"
                                      : inCurrentMonth
                                        ? "text-gray-700 hover:bg-gray-100"
                                        : "text-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftApprovedStartDate("");
                              setDraftApprovedEndDate("");
                            }}
                            className="py-2.5 rounded-lg border border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100 transition font-medium text-sm"
                          >
                            เคลียร์
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const normalizedEndDate =
                                draftApprovedEndDate || draftApprovedStartDate;
                              setSelectedApprovedStartDate(
                                draftApprovedStartDate,
                              );
                              setSelectedApprovedEndDate(normalizedEndDate);
                              setShowApprovedDateDropdown(false);
                            }}
                            className="py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition font-medium text-sm"
                          >
                            ตกลง
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={approvedStatusDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!showApprovedStatusDropdown) {
                          setShowApprovedDateDropdown(false);
                        }
                        setShowApprovedStatusDropdown((prev) => !prev);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white flex items-center justify-between cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                      <span
                        className={`truncate ${selectedApprovedStatusFilter === "all" ? "text-gray-500" : "text-gray-700"}`}
                      >
                        {selectedApprovedStatusFilterLabel}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${showApprovedStatusDropdown ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {showApprovedStatusDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                        {APPROVED_STATUS_FILTER_OPTIONS.map((option) => {
                          const isActive =
                            selectedApprovedStatusFilter === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSelectedApprovedStatusFilter(option.value);
                                setShowApprovedStatusDropdown(false);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                isActive
                                  ? "bg-primary-50 text-primary-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-600 text-white">
                  <th className="px-4 py-3 text-left text-base font-semibold">
                    ลำดับ
                  </th>
                  <th className="px-4 py-3 text-left text-base font-semibold">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-4 py-3 text-left text-base font-semibold">
                    เบอร์โทรศัพท์
                  </th>
                  {activeTab !== "rejected" && (
                    <th className="px-4 py-3 text-left text-base font-semibold">
                      สถานะผู้สมัคร
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-base font-semibold">
                    ชื่อสถาบัน
                  </th>
                  <th className="px-4 py-3 text-left text-base font-semibold">
                    หน่วยงาน
                  </th>
                  {activeTab === "rejected" && (
                    <th className="px-4 py-3 text-left text-base font-semibold">
                      วันที่ตรวจ
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-base font-semibold">
                    ระยะเวลาฝึกงาน
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      ไม่พบรายการ
                    </td>
                  </tr>
                ) : (
                  paginated.map((app, index) => {
                    const badge =
                      activeTab !== "rejected"
                        ? getBadge(app, activeTab)
                        : null;
                    return (
                      <tr
                        key={app.applicationId}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() =>
                          router.push(`/admin/dashboard/${app.applicationId}`)
                        }
                      >
                        <td className="px-4 py-4 text-sm text-gray-800">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-800 font-medium">
                          {app.fname} {app.lname}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {app.phoneNumber || "-"}
                        </td>
                        {activeTab !== "rejected" && badge && (
                          <td className="px-4 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {getInstitutionDisplayName(app)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {(app.departmentId != null && deptMap[String(app.departmentId)]) || "-"}
                        </td>
                        {activeTab === "rejected" && (
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {formatDateThai(app.updatedAt)}
                          </td>
                        )}
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatShortDateRange(
                            app.infoStartDate || app.profileStartDate,
                            app.infoEndDate || app.profileEndDate,
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200">
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 px-2 py-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() =>
                    typeof page === "number" && setCurrentPage(page)
                  }
                  disabled={page === "..."}
                  className={`min-w-[32px] h-8 rounded-lg text-sm ${page === currentPage ? "bg-primary-600 text-white" : page === "..." ? "text-gray-400 cursor-default" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </main>
    </div>
  );
}
