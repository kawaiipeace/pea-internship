"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import OwnerNavbar from "@/components/ui/OwnerNavbar";
import VideoLoading from "@/components/ui/VideoLoading";
import {
  positionApi,
  userApi,
  departmentApi,
  applicationApi,
  AllStudentsHistoryItem,
  AppStatusEnum,
  type Position,
} from "@/services/api";
import { AnnouncementStats } from "@/types/announcement";

// Thai month names (short)
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

const thaiMonthsFull = [
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

const toDateOnly = (dateString?: string | null): Date | null => {
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
};

const formatShortThaiDate = (dateString?: string | null): string => {
  const d = toDateOnly(dateString);
  if (!d) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const buddhistYearShort = String((d.getFullYear() + 543) % 100).padStart(
    2,
    "0",
  );

  return `${day}/${month}/${buddhistYearShort}`;
};

const parseLocalDateOnly = (raw?: string | null): Date | null => {
  if (!raw) return null;
  return toDateOnly(raw);
};

const parseISODate = (value?: string | null): Date | null => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
};

const toISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type InternTableStatus =
  | "awaiting"
  | "active"
  | "completed"
  | "cancelled"
  | "accepted";

type InternStatusFilter = "all" | "awaiting" | "active" | "cancelled";

const INTERN_STATUS_FILTER_OPTIONS: Array<{
  value: InternStatusFilter;
  label: string;
}> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "awaiting", label: "รอเริ่มฝึกงาน" },
  { value: "active", label: "อยู่ระหว่างฝึกงาน" },
  { value: "cancelled", label: "ยกเลิกฝึกงาน" },
];

type InternTableRow = {
  id: number;
  fullName: string;
  positionName: string;
  periodText: string;
  startDate: Date | null;
  endDate: Date | null;
  statusLabel: string;
  statusType: InternTableStatus;
};

// Institution type mapping for education chart
const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  UNIVERSITY: "มหาวิทยาลัย",
  VOCATIONAL: "ปวส./ปวช.",
  SCHOOL: "มัธยมศึกษาตอนปลาย",
  OTHERS: "อื่น ๆ",
};
const INSTITUTION_TYPE_COLORS: Record<string, string> = {
  UNIVERSITY: "#3B82F6",
  VOCATIONAL: "#F59E0B",
  SCHOOL: "#22C55E",
  OTHERS: "#4ADE80",
};

// Status mapping for donut chart
type StatusChartKey = AppStatusEnum | "INTERNSHIP_CANCELLED";

const STATUS_MAP: Record<StatusChartKey, { label: string; color: string }> = {
  PENDING_DOCUMENT: { label: "รอรับเอกสาร", color: "#F7AF1D" },
  PENDING_INTERVIEW: { label: "รอสัมภาษณ์", color: "#ECD17E" },
  PENDING_CONFIRMATION: { label: "รอการยืนยัน", color: "#F28C00" },
  PENDING_REQUEST: { label: "รอเอกสารขอความอนุเคราะห์", color: "#8B5CF6" },
  PENDING_REVIEW: { label: "รอตรวจเอกสาร", color: "#14B8A6" },
  COMPLETE: { label: "รับเข้าฝึกงาน", color: "#0E9F58" },
  CANCEL: { label: "ยกเลิกฝึกงาน", color: "#C02116" },
  ABORT: { label: "ยกเลิกการสมัคร", color: "#9CA3AF" },
  REJECTED: { label: "ไม่ผ่าน", color: "#FF2D2D" },
  INTERNSHIP_CANCELLED: { label: "ยกเลิกฝึกงาน", color: "#FF2D2D" },
};

export default function OwnerDashboard() {
  const currentYear = new Date().getFullYear() + 543; // Buddhist Era
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthlyChartMode, setMonthlyChartMode] = useState<
    "applicants" | "interns"
  >("applicants");

  // API-based stats
  const [apiStats, setApiStats] = useState<AnnouncementStats>({
    totalAnnouncements: 0,
    totalOpenPositions: 0,
    totalApplicants: 0,
  });
  const [departmentName, setDepartmentName] = useState("");
  const [positionNames, setPositionNames] = useState<string[]>([]);
  const [allApps, setAllApps] = useState<AllStudentsHistoryItem[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Client-only rendering to avoid hydration mismatch on SVG paths
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Tooltip states
  const [hoveredStatus, setHoveredStatus] = useState<number | null>(null);
  const [hoveredEdu, setHoveredEdu] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Position list pagination
  const [posPage, setPosPage] = useState(1);
  const posPerPage = 2;

  // Intern list table states
  const [internSearch, setInternSearch] = useState("");
  const [internPositionSearch, setInternPositionSearch] = useState("");
  const [selectedInternTrainingStartDate, setSelectedInternTrainingStartDate] =
    useState("");
  const [selectedInternTrainingEndDate, setSelectedInternTrainingEndDate] =
    useState("");
  const [draftInternTrainingStartDate, setDraftInternTrainingStartDate] =
    useState("");
  const [draftInternTrainingEndDate, setDraftInternTrainingEndDate] =
    useState("");
  const [selectedInternStatusFilter, setSelectedInternStatusFilter] =
    useState<InternStatusFilter>("all");
  const [showInternPeriodDropdown, setShowInternPeriodDropdown] =
    useState(false);
  const [showInternStatusDropdown, setShowInternStatusDropdown] =
    useState(false);
  const [internTrainingDateViewMonth, setInternTrainingDateViewMonth] =
    useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [internPage, setInternPage] = useState(1);
  const internsPerPage = 5;
  const internPeriodDropdownRef = useRef<HTMLDivElement>(null);
  const internStatusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        internPeriodDropdownRef.current &&
        !internPeriodDropdownRef.current.contains(target)
      ) {
        setShowInternPeriodDropdown(false);
      }
      if (
        internStatusDropdownRef.current &&
        !internStatusDropdownRef.current.contains(target)
      ) {
        setShowInternStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const userProfile = await userApi.getUserProfile();
        const departmentId = userProfile?.departmentId;

        if (departmentId) {
          const dept = await departmentApi.getDepartmentByDeptSap(departmentId);
          if (dept?.deptFull || dept?.deptShort) {
            setDepartmentName(dept.deptFull || dept.deptShort || "");
          }
        }

        const response = await positionApi.getPositions({
          limit: 100,
          department: departmentId || undefined,
        });
        const positionsList = response.data || [];
        setPositions(positionsList);

        // นับตำแหน่งที่ยังเปิดรับสมัครและยังไม่เต็ม โดยนับแต่ละตำแหน่งเป็น 1
        const totalPositions = positionsList.filter((p) => {
          if (p.recruitmentStatus !== "OPEN") return false;
          if (p.positionCount === null || p.positionCount === 0) return true; // ไม่จำกัด
          const accepted = p.acceptedCount ?? 0;
          return p.positionCount - accepted > 0;
        }).length;

        // ดึงชื่อตำแหน่ง (position name) จาก API
        const names = positionsList.map((p) => p.name || "ตำแหน่งไม่ระบุ");
        setPositionNames(names);

        // ดึงข้อมูลใบสมัครทั้งหมดจาก API
        const appsRes = await applicationApi.getAllStudentsHistory({
          limit: 500,
          includeCanceled: true,
        });
        const allAppsRaw = appsRes.data || [];

        // กรองเฉพาะใบสมัครที่อยู่ใน position ของ department นี้
        const deptPositionIds = new Set(positionsList.map((p) => p.id));
        const apps = allAppsRaw.filter(
          (app) => app.positionId && deptPositionIds.has(app.positionId),
        );
        setAllApps(apps);

        setApiStats({
          totalAnnouncements: positionsList.length,
          totalOpenPositions: totalPositions,
          totalApplicants: apps.length,
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  // Year options derived from real data
  const ownerYearOptions = useMemo(() => {
    const yearsSet = new Set(
      allApps.map((app) => new Date(app.createdAt).getFullYear() + 543),
    );
    yearsSet.add(currentYear);
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [allApps, currentYear]);

  // Year-filtered applicant count for stats card
  const yearFilteredApplicantsCount = useMemo(() => {
    const ce = selectedYear - 543;
    return allApps.filter((app) => new Date(app.createdAt).getFullYear() === ce)
      .length;
  }, [allApps, selectedYear]);

  // Year-filtered intern count for stats card
  const yearFilteredInternsCount = useMemo(() => {
    const ce = selectedYear - 543;
    return allApps.filter(
      (app) =>
        app.applicationStatus === "COMPLETE" &&
        new Date(app.createdAt).getFullYear() === ce,
    ).length;
  }, [allApps, selectedYear]);

  // Monthly data: all applicants
  const monthlyApplicantsData = useMemo(() => {
    const selectedCE = selectedYear - 543;
    const counts = Array(12).fill(0);
    allApps.forEach((app) => {
      const d = new Date(app.createdAt);
      if (d.getFullYear() === selectedCE) {
        counts[d.getMonth()]++;
      }
    });
    return Array.from({ length: 12 }, (_, i) => ({
      month: thaiMonthsShort[i],
      monthFull: thaiMonthsFull[i],
      count: counts[i],
    }));
  }, [allApps, selectedYear]);

  // Monthly data: interns who were accepted and had documents passed.
  // In current workflow this maps to COMPLETE status.
  const monthlyInternsData = useMemo(() => {
    const selectedCE = selectedYear - 543;
    const counts = Array(12).fill(0);
    allApps.forEach((app) => {
      if (app.applicationStatus !== "COMPLETE") return;
      const d = new Date(app.createdAt);
      if (d.getFullYear() === selectedCE) {
        counts[d.getMonth()]++;
      }
    });
    return Array.from({ length: 12 }, (_, i) => ({
      month: thaiMonthsShort[i],
      monthFull: thaiMonthsFull[i],
      count: counts[i],
    }));
  }, [allApps, selectedYear]);

  const monthlyData =
    monthlyChartMode === "applicants"
      ? monthlyApplicantsData
      : monthlyInternsData;

  const maxMonthly = Math.max(...monthlyData.map((d) => d.count), 1);

  const peakMonthIndex = useMemo(() => {
    let maxCount = 0;
    let maxIdx = 0;
    monthlyData.forEach((d, i) => {
      if (d.count > maxCount) {
        maxCount = d.count;
        maxIdx = i;
      }
    });
    return maxCount > 0 ? maxIdx : -1;
  }, [monthlyData]);

  // Status distribution for donut chart (from real data)
  const statusData = useMemo(() => {
    const counts: Partial<Record<StatusChartKey, number>> = {};
    allApps.forEach((app) => {
      if (app.applicationStatus === "ABORT") {
        counts.ABORT = (counts.ABORT || 0) + 1;
        return;
      }

      const isInternshipCancelled =
        app.studentInternshipStatus === "CANCEL" ||
        (app.applicationStatus === "CANCEL" && app.isActive === false);

      if (isInternshipCancelled) {
        counts.INTERNSHIP_CANCELLED = (counts.INTERNSHIP_CANCELLED || 0) + 1;
        return;
      }

      const status = app.applicationStatus as StatusChartKey;
      counts[status] = (counts[status] || 0) + 1;
    });

    const statusOrder: StatusChartKey[] = [
      "REJECTED",
      "CANCEL",
      "INTERNSHIP_CANCELLED",
      "PENDING_REQUEST",
      "COMPLETE",
      "PENDING_INTERVIEW",
      "PENDING_DOCUMENT",
      "PENDING_CONFIRMATION",
      "PENDING_REVIEW",
      "ABORT",
    ];

    return statusOrder
      .filter((status) => (counts[status] || 0) > 0)
      .map((status) => ({
        label: STATUS_MAP[status].label,
        value: counts[status] || 0,
        color: STATUS_MAP[status].color,
      }));
  }, [allApps]);

  // Education level distribution (from real data)
  const educationData = useMemo(() => {
    const counts: Record<string, number> = {};
    allApps.forEach((app) => {
      const instType = app.institutionType || "OTHERS";
      counts[instType] = (counts[instType] || 0) + 1;
    });
    const order = ["UNIVERSITY", "VOCATIONAL", "SCHOOL", "OTHERS"];
    return order
      .filter((key) => counts[key] > 0)
      .map((key) => ({
        label: INSTITUTION_TYPE_LABELS[key] || key,
        value: counts[key],
        color: INSTITUTION_TYPE_COLORS[key] || "#6B7280",
      }));
  }, [allApps]);

  // Position acceptance data - from real applications
  const positionData = useMemo(() => {
    // Build positionCount map from positions state
    const positionCountMap = new Map<number, number | null>(
      positions.map((p) => [p.id, p.positionCount ?? null]),
    );
    // Group applications by positionId
    const posMap = new Map<
      number,
      {
        name: string;
        total: number;
        accepted: number;
        positionCount: number | null;
      }
    >();
    allApps.forEach((app) => {
      if (!app.positionId) return;
      if (!posMap.has(app.positionId)) {
        posMap.set(app.positionId, {
          name: app.positionName || `ตำแหน่ง #${app.positionId}`,
          total: 0,
          accepted: 0,
          positionCount: positionCountMap.get(app.positionId) ?? null,
        });
      }
      const entry = posMap.get(app.positionId)!;
      entry.total++;
      // นับว่า "รับแล้ว" ถ้าสถานะอยู่ใน accepted group (เหมือน applicationMapper)
      if (
        ["PENDING_REQUEST", "PENDING_REVIEW", "COMPLETE"].includes(
          app.applicationStatus,
        )
      ) {
        entry.accepted++;
      }
    });
    const result = Array.from(posMap.values());
    return result.length > 0
      ? result
      : positionNames.map((name) => ({
          name,
          total: 0,
          accepted: 0,
          positionCount: null,
        }));
  }, [allApps, positionNames, positions]);

  const maxAccepted = Math.max(...positionData.map((d) => d.accepted), 1);

  const internTableData = useMemo<InternTableRow[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const buildInternRow = (
      app: AllStudentsHistoryItem,
    ): InternTableRow | null => {
      const startDate = toDateOnly(app.infoStartDate || app.profileStartDate);
      const endDate = toDateOnly(app.infoEndDate || app.profileEndDate);
      const fullName = `${app.fname || ""} ${app.lname || ""}`.trim() || "-";
      const positionName = app.positionName || "ตำแหน่งไม่ระบุ";
      const periodText = `${formatShortThaiDate(app.infoStartDate || app.profileStartDate)} - ${formatShortThaiDate(app.infoEndDate || app.profileEndDate)}`;

      const internshipCancelled =
        app.studentInternshipStatus === "CANCEL" ||
        (app.applicationStatus === "CANCEL" && app.isActive === false);

      if (internshipCancelled) {
        return {
          id: app.applicationId,
          fullName,
          positionName,
          periodText,
          startDate,
          endDate,
          statusLabel: "ยกเลิกฝึกงาน",
          statusType: "cancelled" as const,
        };
      }

      // Accepted + document passed flow for this dashboard view.
      if (app.applicationStatus !== "COMPLETE") return null;

      const isAwaiting = app.studentInternshipStatus === "AWAITING";
      if (isAwaiting) {
        return {
          id: app.applicationId,
          fullName,
          positionName,
          periodText,
          startDate,
          endDate,
          statusLabel: "รอเริ่มฝึกงาน",
          statusType: "awaiting" as const,
        };
      }

      const isActiveByPeriod =
        !!startDate &&
        !!endDate &&
        now.getTime() >= startDate.getTime() &&
        now.getTime() <= endDate.getTime();
      const isActiveByStatus = app.studentInternshipStatus === "ACTIVE";
      if (isActiveByPeriod || isActiveByStatus) {
        return {
          id: app.applicationId,
          fullName,
          positionName,
          periodText,
          startDate,
          endDate,
          statusLabel: "อยู่ระหว่างฝึกงาน",
          statusType: "active" as const,
        };
      }

      const isCompleted =
        app.studentInternshipStatus === "COMPLETE" ||
        (!!endDate && now.getTime() > endDate.getTime());
      if (isCompleted) {
        return {
          id: app.applicationId,
          fullName,
          positionName,
          periodText,
          startDate,
          endDate,
          statusLabel: "ฝึกงานเสร็จสิ้น",
          statusType: "completed" as const,
        };
      }

      return {
        id: app.applicationId,
        fullName,
        positionName,
        periodText,
        startDate,
        endDate,
        statusLabel: "รับเข้าฝึกงาน",
        statusType: "accepted" as const,
      };
    };

    const latestNonCancelledByUser = new Map<
      string,
      { row: InternTableRow; createdAt: number }
    >();
    const cancelledEntries: Array<{
      userKey: string;
      row: InternTableRow;
      createdAt: number;
    }> = [];
    const usersWithCancelled = new Set<string>();

    allApps.forEach((app) => {
      const row = buildInternRow(app);
      if (!row) return;

      const userKey =
        app.studentUserId ||
        app.email ||
        app.phoneNumber ||
        `${app.fname || ""}-${app.lname || ""}` ||
        `app-${app.applicationId}`;
      const createdAt = new Date(app.createdAt).getTime() || 0;

      if (row.statusType === "cancelled") {
        // Keep every cancelled internship row (do not dedupe).
        cancelledEntries.push({ userKey, row, createdAt });
        usersWithCancelled.add(userKey);
        return;
      }

      const existing = latestNonCancelledByUser.get(userKey);
      if (!existing) {
        latestNonCancelledByUser.set(userKey, { row, createdAt });
        return;
      }

      // Keep the latest non-cancelled row for each user.
      if (createdAt > existing.createdAt) {
        latestNonCancelledByUser.set(userKey, { row, createdAt });
      }
    });

    const nonCancelledEntries = Array.from(latestNonCancelledByUser.entries())
      .filter(([userKey]) => !usersWithCancelled.has(userKey))
      .map(([, entry]) => entry);

    return [...cancelledEntries, ...nonCancelledEntries]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((entry) => entry.row);
  }, [allApps]);

  const filteredInternTableData = useMemo(() => {
    const nameKeyword = internSearch.trim().toLowerCase();
    const positionKeyword = internPositionSearch.trim().toLowerCase();
    const filterStart = parseISODate(selectedInternTrainingStartDate);
    const filterEnd = parseISODate(selectedInternTrainingEndDate);

    return internTableData.filter((row) => {
      const matchName = nameKeyword
        ? row.fullName.toLowerCase().includes(nameKeyword)
        : true;
      const matchPosition = positionKeyword
        ? row.positionName.toLowerCase().includes(positionKeyword)
        : true;
      const matchPeriod = (() => {
        if (!filterStart && !filterEnd) return true;
        if (!row.startDate || !row.endDate) return false;
        if (filterStart && row.endDate.getTime() < filterStart.getTime())
          return false;
        if (filterEnd && row.startDate.getTime() > filterEnd.getTime())
          return false;
        return true;
      })();

      const matchStatus =
        selectedInternStatusFilter === "all"
          ? true
          : row.statusType === selectedInternStatusFilter;

      return matchName && matchPosition && matchPeriod && matchStatus;
    });
  }, [
    internSearch,
    internPositionSearch,
    selectedInternTrainingStartDate,
    selectedInternTrainingEndDate,
    selectedInternStatusFilter,
    internTableData,
  ]);

  useEffect(() => {
    setInternPage(1);
  }, [
    internSearch,
    internPositionSearch,
    selectedInternTrainingStartDate,
    selectedInternTrainingEndDate,
    selectedInternStatusFilter,
  ]);

  const selectedInternStatusFilterLabel =
    selectedInternStatusFilter === "all"
      ? "สถานะ"
      : INTERN_STATUS_FILTER_OPTIONS.find(
          (option) => option.value === selectedInternStatusFilter,
        )?.label || "สถานะ";

  const getInternTrainingDateDisplayText = () => {
    if (!selectedInternTrainingStartDate && !selectedInternTrainingEndDate)
      return "ระยะเวลาฝึกงาน";
    if (selectedInternTrainingStartDate && selectedInternTrainingEndDate) {
      if (selectedInternTrainingStartDate === selectedInternTrainingEndDate) {
        return formatShortThaiDate(selectedInternTrainingStartDate);
      }
      return `${formatShortThaiDate(selectedInternTrainingStartDate)} - ${formatShortThaiDate(selectedInternTrainingEndDate)}`;
    }
    if (selectedInternTrainingStartDate)
      return formatShortThaiDate(selectedInternTrainingStartDate);
    return formatShortThaiDate(selectedInternTrainingEndDate);
  };

  const openInternTrainingDateDropdown = () => {
    const selectedDate =
      parseISODate(selectedInternTrainingStartDate) ||
      parseISODate(selectedInternTrainingEndDate);
    const base = selectedDate || new Date();
    setDraftInternTrainingStartDate(selectedInternTrainingStartDate);
    setDraftInternTrainingEndDate(selectedInternTrainingEndDate);
    setInternTrainingDateViewMonth(
      new Date(base.getFullYear(), base.getMonth(), 1),
    );
    setShowInternPeriodDropdown(true);
  };

  const internTrainingDateWeekdayLabels = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const internTrainingDateCells = useMemo(() => {
    const year = internTrainingDateViewMonth.getFullYear();
    const month = internTrainingDateViewMonth.getMonth();

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
  }, [internTrainingDateViewMonth]);

  const totalInternPages = Math.max(
    1,
    Math.ceil(filteredInternTableData.length / internsPerPage),
  );
  const currentInternPage = Math.min(internPage, totalInternPages);
  const currentInternRows = filteredInternTableData.slice(
    (currentInternPage - 1) * internsPerPage,
    currentInternPage * internsPerPage,
  );

  const totalCurrentInterns = useMemo(
    () =>
      internTableData.filter(
        (row) =>
          row.statusType === "accepted" ||
          row.statusType === "awaiting" ||
          row.statusType === "active",
      ).length,
    [internTableData],
  );

  const getInternStatusBadgeClass = (statusType: InternTableStatus) => {
    switch (statusType) {
      case "awaiting":
        return "bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]";
      case "active":
        return "bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]";
      case "completed":
        return "bg-[#DCFAE6] text-[#085D3A] border-[#A9EFC5]";
      case "cancelled":
        return "bg-[#FEE4E2] text-[#B42318] border-[#FECDCA]";
      default:
        return "bg-[#EEF2F6] text-[#344054] border-[#D0D5DD]";
    }
  };

  // Pagination for position list
  const totalPosPages = Math.ceil(positionData.length / posPerPage);
  const currentPosData = positionData.slice(
    (posPage - 1) * posPerPage,
    posPage * posPerPage,
  );

  // Helper: create SVG arc path for pie slices
  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
  ): string => {
    const start = {
      x: cx + r * Math.cos(((startAngle - 90) * Math.PI) / 180),
      y: cy + r * Math.sin(((startAngle - 90) * Math.PI) / 180),
    };
    const end = {
      x: cx + r * Math.cos(((endAngle - 90) * Math.PI) / 180),
      y: cy + r * Math.sin(((endAngle - 90) * Math.PI) / 180),
    };
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  // SVG Chart component — supports both donut (stroke-based) and full pie (path-based)
  const ChartComponent = ({
    data,
    hovered,
    onHover,
    size = 180,
    strokeWidth = 32,
    mode = "donut",
  }: {
    data: { label: string; value: number; color: string }[];
    hovered: number | null;
    onHover: (i: number | null) => void;
    size?: number;
    strokeWidth?: number;
    mode?: "donut" | "pie";
  }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!mounted || total === 0)
      return (
        <div
          className="rounded-full bg-gray-200"
          style={{ width: size, height: size }}
        />
      );

    const center = size / 2;

    if (mode === "pie") {
      // Full filled pie chart using path arcs
      const pieRadius = size / 2 - 2;
      let currentAngle = 0;
      const slices = data.map((d, i) => {
        const sliceAngle = (d.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        currentAngle = endAngle;
        return { ...d, startAngle, endAngle, index: i };
      });

      return (
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((slice) => (
              <path
                key={slice.index}
                d={describeArc(
                  center,
                  center,
                  pieRadius,
                  slice.startAngle,
                  slice.endAngle - 0.5,
                )}
                fill={slice.color}
                opacity={hovered === null || hovered === slice.index ? 1 : 0.4}
                style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                onMouseEnter={() => onHover(slice.index)}
                onMouseLeave={() => onHover(null)}
              />
            ))}
          </svg>
          {hovered !== null && data[hovered] && (
            <div
              className="absolute z-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="font-semibold">{data[hovered].label}</div>
              <div>
                {data[hovered].value} คน (
                {Math.round((data[hovered].value / total) * 100)}%)
              </div>
            </div>
          )}
        </div>
      );
    }

    // Donut mode (stroke-based circles)
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let cumulativePercent = 0;
    const segments = data.map((d, i) => {
      const percent = d.value / total;
      const dashArray = percent * circumference;
      const dashOffset = -cumulativePercent * circumference;
      cumulativePercent += percent;
      return { ...d, dashArray, dashOffset, index: i };
    });

    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg) => (
            <circle
              key={seg.index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
              strokeDashoffset={seg.dashOffset}
              transform={`rotate(-90 ${center} ${center})`}
              opacity={hovered === null || hovered === seg.index ? 1 : 0.4}
              style={{ transition: "opacity 0.2s", cursor: "pointer" }}
              onMouseEnter={() => onHover(seg.index)}
              onMouseLeave={() => onHover(null)}
            />
          ))}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 + 2}
            fill="white"
          />
        </svg>
        {hovered !== null && data[hovered] && (
          <div
            className="absolute z-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="font-semibold">{data[hovered].label}</div>
            <div>
              {data[hovered].value} คน (
              {Math.round((data[hovered].value / total) * 100)}%)
            </div>
          </div>
        )}
      </div>
    );
  };

  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);
  const educationTotal = educationData.reduce((s, d) => s + d.value, 0);
  const getPercent = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OwnerNavbar />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 5rem)" }}
        >
          <VideoLoading message="กำลังโหลดข้อมูลแดชบอร์ด..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OwnerNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Row */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-black">
              แดชบอร์ด {departmentName}
            </h1>
            <p className="text-gray-500 mt-1">ภาพรวมของการรับสมัคร</p>
          </div>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                e.currentTarget.blur();
              }}
              className="appearance-none bg-white border-2 border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm cursor-pointer transition focus:outline-none focus:border-primary-600 focus:ring-0"
            >
              {ownerYearOptions.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
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
                {apiStats.totalAnnouncements}
              </p>
              <p className="text-gray-500 text-sm">ประกาศทั้งหมด</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
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
                {apiStats.totalOpenPositions}
              </p>
              <p className="text-gray-500 text-sm">ตำแหน่งว่างทั้งหมด</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
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
                {yearFilteredApplicantsCount}
              </p>
              <p className="text-gray-500 text-sm">ผู้สมัครทั้งหมด</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
            <div className="text-primary-600">
              <svg
                width="22"
                height="16"
                viewBox="0 0 22 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.55 5.175L20.075 1.625C20.275 1.425 20.5125 1.325 20.7875 1.325C21.0625 1.325 21.3 1.425 21.5 1.625C21.7 1.825 21.8 2.0625 21.8 2.3375C21.8 2.6125 21.7 2.85 21.5 3.05L17.25 7.3C17.05 7.5 16.8167 7.6 16.55 7.6C16.2833 7.6 16.05 7.5 15.85 7.3L13.725 5.175C13.525 4.975 13.425 4.7375 13.425 4.4625C13.425 4.1875 13.525 3.95 13.725 3.75C13.925 3.55 14.1583 3.45 14.425 3.45C14.6917 3.45 14.925 3.55 15.125 3.75L16.55 5.175ZM5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8C6.9 8 5.95833 7.60833 5.175 6.825ZM0 14V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6C8.55 6 9.02083 5.80417 9.4125 5.4125Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">
                {yearFilteredInternsCount}
              </p>
              <p className="text-gray-500 text-sm">นักศึกษาฝึกงานทั้งหมด</p>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Status Donut + Education Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* สถานะใบสมัคร - Donut Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              สถานะใบสมัคร
            </h3>
            <div className="flex items-center gap-6">
              <ChartComponent
                data={statusData}
                hovered={hoveredStatus}
                onHover={setHoveredStatus}
                size={180}
                strokeWidth={32}
                mode="donut"
              />
              <div className="space-y-2 flex-1">
                {statusData.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 transition-colors"
                    style={{
                      backgroundColor:
                        hoveredStatus === i ? `${d.color}15` : "transparent",
                    }}
                    onMouseEnter={() => setHoveredStatus(i)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs text-gray-600">
                      {d.label} {getPercent(d.value, statusTotal)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ระดับการศึกษา - Pie Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              ระดับการศึกษา
            </h3>
            <div className="flex items-center gap-6">
              <ChartComponent
                data={educationData}
                hovered={hoveredEdu}
                onHover={setHoveredEdu}
                size={180}
                mode="pie"
              />
              <div className="space-y-2 flex-1">
                {educationData.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 transition-colors"
                    style={{
                      backgroundColor:
                        hoveredEdu === i ? `${d.color}15` : "transparent",
                    }}
                    onMouseEnter={() => setHoveredEdu(i)}
                    onMouseLeave={() => setHoveredEdu(null)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs text-gray-600">
                      {d.label} ({getPercent(d.value, educationTotal)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* จำนวนผู้สมัครฝึกงาน - Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-gray-900">
              {monthlyChartMode === "applicants"
                ? "จำนวนผู้สมัครฝึกงาน"
                : "จำนวนนักศึกษาฝึกงาน"}{" "}
              ปี {selectedYear}
            </h3>
            <div className="inline-flex items-center rounded-2xl bg-gray-100 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => setMonthlyChartMode("applicants")}
                className={`px-4 py-2 text-sm rounded-xl transition-colors border flex items-center gap-2.5 cursor-pointer ${
                  monthlyChartMode === "applicants"
                    ? "bg-white border-gray-200 text-gray-700"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg
                  width="22"
                  height="16"
                  viewBox="0 0 22 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path
                    d="M16.55 5.175L20.075 1.625C20.275 1.425 20.5125 1.325 20.7875 1.325C21.0625 1.325 21.3 1.425 21.5 1.625C21.7 1.825 21.8 2.0625 21.8 2.3375C21.8 2.6125 21.7 2.85 21.5 3.05L17.25 7.3C17.05 7.5 16.8167 7.6 16.55 7.6C16.2833 7.6 16.05 7.5 15.85 7.3L13.725 5.175C13.525 4.975 13.425 4.7375 13.425 4.4625C13.425 4.1875 13.525 3.95 13.725 3.75C13.925 3.55 14.1583 3.45 14.425 3.45C14.6917 3.45 14.925 3.55 15.125 3.75L16.55 5.175ZM5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8C6.9 8 5.95833 7.60833 5.175 6.825ZM0 14V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6C8.55 6 9.02083 5.80417 9.4125 5.4125Z"
                    fill="#61646C"
                  />
                </svg>
                ผู้สมัครทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setMonthlyChartMode("interns")}
                className={`px-4 py-2 text-sm rounded-xl transition-colors border flex items-center gap-2.5 cursor-pointer ${
                  monthlyChartMode === "interns"
                    ? "bg-white border-gray-200 text-gray-700"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg
                  width="24"
                  height="12"
                  viewBox="0 0 24 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path
                    d="M1 12C0.716667 12 0.479167 11.9042 0.2875 11.7125C0.0958333 11.5208 0 11.2833 0 11V10.425C0 9.70833 0.366667 9.125 1.1 8.675C1.83333 8.225 2.8 8 4 8C4.21667 8 4.425 8.00417 4.625 8.0125C4.825 8.02083 5.01667 8.04167 5.2 8.075C4.96667 8.425 4.79167 8.79167 4.675 9.175C4.55833 9.55833 4.5 9.95833 4.5 10.375V12H1ZM7 12C6.71667 12 6.47917 11.9042 6.2875 11.7125C6.09583 11.5208 6 11.2833 6 11V10.375C6 9.84167 6.14583 9.35417 6.4375 8.9125C6.72917 8.47083 7.14167 8.08333 7.675 7.75C8.20833 7.41667 8.84583 7.16667 9.5875 7C10.3292 6.83333 11.1333 6.75 12 6.75C12.8833 6.75 13.6958 6.83333 14.4375 7C15.1792 7.16667 15.8167 7.41667 16.35 7.75C16.8833 8.08333 17.2917 8.47083 17.575 8.9125C17.8583 9.35417 18 9.84167 18 10.375V11C18 11.2833 17.9042 11.5208 17.7125 11.7125C17.5208 11.9042 17.2833 12 17 12H7ZM19.5 12V10.375C19.5 9.94167 19.4458 9.53333 19.3375 9.15C19.2292 8.76667 19.0667 8.40833 18.85 8.075C19.0333 8.04167 19.2208 8.02083 19.4125 8.0125C19.6042 8.00417 19.8 8 20 8C21.2 8 22.1667 8.22083 22.9 8.6625C23.6333 9.10417 24 9.69167 24 10.425V11C24 11.2833 23.9042 11.5208 23.7125 11.7125C23.5208 11.9042 23.2833 12 23 12H19.5ZM8.125 10H15.9C15.7333 9.66667 15.2708 9.375 14.5125 9.125C13.7542 8.875 12.9167 8.75 12 8.75C11.0833 8.75 10.2458 8.875 9.4875 9.125C8.72917 9.375 8.275 9.66667 8.125 10ZM4 7C3.45 7 2.97917 6.80417 2.5875 6.4125C2.19583 6.02083 2 5.55 2 5C2 4.43333 2.19583 3.95833 2.5875 3.575C2.97917 3.19167 3.45 3 4 3C4.56667 3 5.04167 3.19167 5.425 3.575C5.80833 3.95833 6 4.43333 6 5C6 5.55 5.80833 6.02083 5.425 6.4125C5.04167 6.80417 4.56667 7 4 7ZM20 7C19.45 7 18.9792 6.80417 18.5875 6.4125C18.1958 6.02083 18 5.55 18 5C18 4.43333 18.1958 3.95833 18.5875 3.575C18.9792 3.19167 19.45 3 20 3C20.5667 3 21.0417 3.19167 21.425 3.575C21.8083 3.95833 22 4.43333 22 5C22 5.55 21.8083 6.02083 21.425 6.4125C21.0417 6.80417 20.5667 7 20 7ZM12 6C11.1667 6 10.4583 5.70833 9.875 5.125C9.29167 4.54167 9 3.83333 9 3C9 2.15 9.29167 1.4375 9.875 0.8625C10.4583 0.2875 11.1667 0 12 0C12.85 0 13.5625 0.2875 14.1375 0.8625C14.7125 1.4375 15 2.15 15 3C15 3.83333 14.7125 4.54167 14.1375 5.125C13.5625 5.70833 12.85 6 12 6ZM12 4C12.2833 4 12.5208 3.90417 12.7125 3.7125C12.9042 3.52083 13 3.28333 13 3C13 2.71667 12.9042 2.47917 12.7125 2.2875C12.5208 2.09583 12.2833 2 12 2C11.7167 2 11.4792 2.09583 11.2875 2.2875C11.0958 2.47917 11 2.71667 11 3C11 3.28333 11.0958 3.52083 11.2875 3.7125C11.4792 3.90417 11.7167 4 12 4Z"
                    fill="#61646C"
                  />
                </svg>
                นักศึกษาฝึกงานทั้งหมด
              </button>
            </div>
          </div>
          <div className="flex items-end gap-3 h-56 relative">
            {monthlyData.map((d, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full relative group"
                onMouseEnter={() => setHoveredMonth(i)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {/* Tooltip */}
                {hoveredMonth === i && d.count > 0 && (
                  <div className="absolute -top-2 z-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap transform -translate-y-full">
                    <div className="font-semibold">{d.monthFull}</div>
                    <div>{d.count} คน</div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
                  </div>
                )}
                <div
                  className="w-full rounded-t-md transition-all cursor-pointer"
                  style={{
                    height: `${d.count > 0 ? (d.count / maxMonthly) * 100 : 2}%`,
                    backgroundColor: d.count > 0 ? "#A80689" : "#E5E7EB",
                    minHeight: d.count > 0 ? "8px" : "2px",
                    opacity:
                      d.count > 0
                        ? hoveredMonth === i
                          ? 1
                          : hoveredMonth === null
                            ? i === peakMonthIndex
                              ? 1
                              : 0.7
                            : 0.4
                        : 0.3,
                    transition: "opacity 0.2s, height 0.3s",
                  }}
                />
                <span
                  className={`text-xs mt-2 whitespace-nowrap ${
                    i === peakMonthIndex
                      ? "text-primary-600 font-bold"
                      : "text-gray-500"
                  }`}
                >
                  {d.month}
                </span>
              </div>
            ))}
          </div>
          {peakMonthIndex >= 0 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              ช่วงเวลาที่มี
              {monthlyChartMode === "applicants"
                ? "ผู้สมัคร"
                : "นักศึกษาฝึกงาน"}
              มากที่สุด: {monthlyData[peakMonthIndex].monthFull}
            </p>
          )}
        </div>

        {/* รายการรายชื่อนักศึกษาฝึกงาน */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            รายการรายชื่อนักศึกษาฝึกงาน
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="relative">
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
                value={internSearch}
                onChange={(e) => setInternSearch(e.target.value)}
                placeholder="ข้อมูลผู้สมัคร..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 shadow-sm hover:border-primary-600 outline-none text-gray-700 bg-white text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition"
              />
            </div>

            <div className="relative">
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
                value={internPositionSearch}
                onChange={(e) => setInternPositionSearch(e.target.value)}
                placeholder="ตำแหน่ง..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 shadow-sm hover:border-primary-600 outline-none text-gray-700 bg-white text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition"
              />
            </div>

            <div className="relative" ref={internPeriodDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  if (showInternPeriodDropdown) {
                    setShowInternPeriodDropdown(false);
                    return;
                  }
                  setShowInternStatusDropdown(false);
                  openInternTrainingDateDropdown();
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 shadow-sm hover:border-primary-600 outline-none text-gray-700 bg-white flex items-center justify-between cursor-pointer text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition"
              >
                <span
                  className={`truncate ${selectedInternTrainingStartDate || selectedInternTrainingEndDate ? "text-gray-700" : "text-gray-500"}`}
                >
                  {getInternTrainingDateDisplayText()}
                </span>
                <div className="flex items-center gap-2 ml-2">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {(selectedInternTrainingStartDate ||
                    selectedInternTrainingEndDate) && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInternTrainingStartDate("");
                        setSelectedInternTrainingEndDate("");
                        setDraftInternTrainingStartDate("");
                        setDraftInternTrainingEndDate("");
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

              {showInternPeriodDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        setInternTrainingDateViewMonth(
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
                      {thaiMonthsFull[internTrainingDateViewMonth.getMonth()]}{" "}
                      {internTrainingDateViewMonth.getFullYear() + 543}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setInternTrainingDateViewMonth(
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
                    {internTrainingDateWeekdayLabels.map((label) => (
                      <div
                        key={label}
                        className="text-center text-gray-500 text-xs font-medium py-1.5"
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {internTrainingDateCells.map(({ date, inCurrentMonth }) => {
                      const iso = toISODate(date);
                      const hasStart = !!draftInternTrainingStartDate;
                      const hasEnd = !!draftInternTrainingEndDate;
                      const isStart = draftInternTrainingStartDate === iso;
                      const isEnd = draftInternTrainingEndDate === iso;
                      const isInRange =
                        hasStart &&
                        hasEnd &&
                        iso > draftInternTrainingStartDate &&
                        iso < draftInternTrainingEndDate;

                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => {
                            if (
                              !draftInternTrainingStartDate ||
                              draftInternTrainingEndDate
                            ) {
                              setDraftInternTrainingStartDate(iso);
                              setDraftInternTrainingEndDate("");
                            } else if (iso < draftInternTrainingStartDate) {
                              setDraftInternTrainingEndDate(
                                draftInternTrainingStartDate,
                              );
                              setDraftInternTrainingStartDate(iso);
                            } else {
                              setDraftInternTrainingEndDate(iso);
                            }

                            if (!inCurrentMonth) {
                              setInternTrainingDateViewMonth(
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
                        setDraftInternTrainingStartDate("");
                        setDraftInternTrainingEndDate("");
                      }}
                      className="py-2.5 rounded-lg border border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100 transition font-medium text-sm"
                    >
                      เคลียร์
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const normalizedEndDate =
                          draftInternTrainingEndDate ||
                          draftInternTrainingStartDate;
                        setSelectedInternTrainingStartDate(
                          draftInternTrainingStartDate,
                        );
                        setSelectedInternTrainingEndDate(normalizedEndDate);
                        setShowInternPeriodDropdown(false);
                      }}
                      className="py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition font-medium text-sm"
                    >
                      ตกลง
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={internStatusDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  if (!showInternStatusDropdown) {
                    setShowInternPeriodDropdown(false);
                  }
                  setShowInternStatusDropdown((prev) => !prev);
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 shadow-sm hover:border-primary-600 outline-none text-gray-700 bg-white flex items-center justify-between cursor-pointer text-sm focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition"
              >
                <span
                  className={`truncate ${selectedInternStatusFilter === "all" ? "text-gray-500" : "text-gray-700"}`}
                >
                  {selectedInternStatusFilterLabel}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${showInternStatusDropdown ? "rotate-180" : ""}`}
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

              {showInternStatusDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                  {INTERN_STATUS_FILTER_OPTIONS.map((option) => {
                    const isActive =
                      selectedInternStatusFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedInternStatusFilter(option.value);
                          setShowInternStatusDropdown(false);
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="text-left font-semibold px-4 py-3 rounded-tl-xl">
                    ชื่อ - นามสกุล
                  </th>
                  <th className="text-left font-semibold px-4 py-3">ตำแหน่ง</th>
                  <th className="text-left font-semibold px-4 py-3">
                    ระยะเวลาฝึกงาน
                  </th>
                  <th className="text-left font-semibold px-4 py-3 rounded-tr-xl">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentInternRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      ไม่พบข้อมูลนักศึกษาฝึกงาน
                    </td>
                  </tr>
                ) : (
                  currentInternRows.map((row) => (
                    <tr key={row.id} className="text-gray-900">
                      <td className="px-4 py-4 border-b border-gray-200">
                        {row.fullName}
                      </td>
                      <td className="px-4 py-4 border-b border-gray-200 max-w-70">
                        <span className="line-clamp-2">{row.positionName}</span>
                      </td>
                      <td className="px-4 py-4 border-b border-gray-200">
                        {row.periodText}
                      </td>
                      <td className="px-4 py-4 border-b border-gray-200">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getInternStatusBadgeClass(row.statusType)}`}
                        >
                          {row.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              แสดง{" "}
              {filteredInternTableData.length === 0
                ? 0
                : (currentInternPage - 1) * internsPerPage + 1}
              -
              {Math.min(
                currentInternPage * internsPerPage,
                filteredInternTableData.length,
              )}{" "}
              จากทั้งหมด {filteredInternTableData.length}
            </p>

            <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setInternPage(Math.max(1, currentInternPage - 1))
                }
                disabled={currentInternPage === 1}
                className="w-10 h-9 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: totalInternPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, currentInternPage - 3),
                  Math.max(0, currentInternPage - 3) + 4,
                )
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setInternPage(page)}
                    className={`w-10 h-9 text-sm border-l border-gray-200 ${
                      page === currentInternPage
                        ? "bg-gray-200 text-gray-900 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              <button
                type="button"
                onClick={() =>
                  setInternPage(
                    Math.min(totalInternPages, currentInternPage + 1),
                  )
                }
                disabled={currentInternPage === totalInternPages}
                className="w-10 h-9 border-l border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* การรับเข้าแยกตามตำแหน่ง - Horizontal Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                การรับเข้าแยกตามตำแหน่ง (รับแล้ว)
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-600" />
                <span className="text-xs text-gray-500">รับแล้ว</span>
              </div>
            </div>
            <div className="space-y-4">
              {currentPosData.map((d, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span
                    className="text-sm text-gray-700 w-40 shrink-0 truncate"
                    title={d.name}
                  >
                    {d.name}
                  </span>
                  <div className="flex-1 relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary-600 rounded-full transition-all"
                      style={{ width: `${(d.accepted / maxAccepted) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-10 text-right shrink-0">
                    {d.positionCount === 0 || d.positionCount === null
                      ? d.accepted
                      : `${d.accepted}/${d.positionCount}`}
                  </span>
                </div>
              ))}
              {positionData.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  ยังไม่มีข้อมูล
                </p>
              )}
            </div>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              แสดง {(posPage - 1) * posPerPage + 1}-
              {Math.min(posPage * posPerPage, positionData.length)} จากทั้งหมด{" "}
              {positionData.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPosPage(Math.max(1, posPage - 1))}
                disabled={posPage === 1}
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
              {(() => {
                const maxVisiblePages = 10;
                let startPage = Math.max(
                  1,
                  posPage - Math.floor(maxVisiblePages / 2),
                );
                let endPage = Math.min(
                  totalPosPages,
                  startPage + maxVisiblePages - 1,
                );
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setPosPage(i)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                        i === posPage
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {i}
                    </button>,
                  );
                }
                return pages;
              })()}
              <button
                onClick={() => setPosPage(Math.min(totalPosPages, posPage + 1))}
                disabled={posPage === totalPosPages}
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
          </div>
        </div>
      </div>
    </div>
  );
}
