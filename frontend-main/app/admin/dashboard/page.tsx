"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import AdminNavbar from "@/components/ui/AdminNavbar";
import {
  applicationApi,
  departmentApi,
  AllStudentsHistoryItem,
  Department,
} from "@/services/api";

type AdminDocStatus =
  | "pending_upload"
  | "pending_review"
  | "approved"
  | "rejected";
type YearOption = { year: number; label: string };
type ChartMainTab = "applicants" | "interns";
type InternChartStatusTab = "all" | "active" | "completed";
type InstitutionTypeFilter =
  | "all"
  | "UNIVERSITY"
  | "VOCATIONAL"
  | "SCHOOL"
  | "OTHERS";

const THAI_MONTH_SHORT = [
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
const PIE_COLORS = ["#A855F7", "#C026D3", "#7C3AED", "#E879F9", "#D1D5DB"];

const APPLICANT_COUNTABLE_STATUSES = new Set([
  "PENDING_DOCUMENT",
  "PENDING_INTERVIEW",
  "PENDING_CONFIRMATION",
  "PENDING_REQUEST",
  "PENDING_REVIEW",
  "COMPLETE",
  "CANCEL",
  "ABORT",
]);

const INSTITUTION_TYPE_FILTER_OPTIONS: Array<{
  value: InstitutionTypeFilter;
  label: string;
}> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "UNIVERSITY", label: "มหาวิทยาลัย" },
  { value: "VOCATIONAL", label: "ปวช. / ปวส." },
  { value: "SCHOOL", label: "มัธยมศึกษาตอนปลาย" },
  { value: "OTHERS", label: "อื่น ๆ" },
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
  return "pending_upload";
}

function toThaiYear(year: number): number {
  return year + 543;
}

function safeDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function topN(entries: [string, number][], n: number): [string, number][] {
  return [...entries].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function getInstitutionDisplayName(item: AllStudentsHistoryItem): string {
  const rawNote = (item.studentNote || "").trim();
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

  return item.institutionName?.trim() || "ไม่ระบุสถาบัน";
}

function getApplicantKey(item: AllStudentsHistoryItem): string {
  if (item.studentUserId) return `uid:${item.studentUserId}`;
  if (item.email) return `email:${item.email.toLowerCase()}`;
  if (item.phoneNumber) return `phone:${item.phoneNumber}`;

  const fullName = `${item.fname || ""}|${item.lname || ""}`.toLowerCase();
  if (fullName !== "|") return `name:${fullName}`;

  return `app:${item.applicationId}`;
}

function normalizeInstitutionType(
  type: string | null,
): Exclude<InstitutionTypeFilter, "all"> {
  const normalized = (type || "OTHERS").toUpperCase();
  if (normalized === "UNIVERSITY") return "UNIVERSITY";
  if (normalized === "VOCATIONAL" || normalized === "HIGH_VOCATIONAL") {
    return "VOCATIONAL";
  }
  if (normalized === "SCHOOL") return "SCHOOL";
  return "OTHERS";
}

async function fetchAllStudentsHistory(
  limitPerPage = 500,
): Promise<AllStudentsHistoryItem[]> {
  let page = 1;
  let hasNext = true;
  const all: AllStudentsHistoryItem[] = [];

  while (hasNext) {
    const res = await applicationApi.getAllStudentsHistory({
      includeCanceled: true,
      page,
      limit: limitPerPage,
    });

    all.push(...res.data);
    hasNext = res.meta.hasNextPage;
    page += 1;
  }

  return all;
}

async function fetchAllDepartments(limitPerPage = 100): Promise<Department[]> {
  let page = 1;
  let hasNext = true;
  const all: Department[] = [];

  while (hasNext) {
    const res = await departmentApi.getDepartments(page, limitPerPage);
    all.push(...res.data);
    hasNext = res.meta.hasNextPage;
    page += 1;
  }

  return all;
}

export default function AdminDashboardPage() {
  const [applications, setApplications] = useState<AllStudentsHistoryItem[]>(
    [],
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMainTab, setChartMainTab] = useState<ChartMainTab>("applicants");
  const [internChartStatusTab, setInternChartStatusTab] =
    useState<InternChartStatusTab>("all");
  const [departmentsById, setDepartmentsById] = useState<
    Record<number, string>
  >({});
  const [hoveredEduSliceIndex, setHoveredEduSliceIndex] = useState<
    number | null
  >(null);
  const [institutionTypeFilter, setInstitutionTypeFilter] =
    useState<InstitutionTypeFilter>("all");
  const [showInstitutionTypeDropdown, setShowInstitutionTypeDropdown] =
    useState(false);
  const institutionTypeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        institutionTypeDropdownRef.current &&
        !institutionTypeDropdownRef.current.contains(target)
      ) {
        setShowInstitutionTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [all, departments] = await Promise.all([
        fetchAllStudentsHistory(),
        fetchAllDepartments(),
      ]);

      setApplications(all);
      setDepartmentsById(
        departments.reduce<Record<number, string>>((acc, dept) => {
          acc[dept.id] =
            dept.deptFull || dept.deptShort || `หน่วยงาน ${dept.id}`;
          return acc;
        }, {}),
      );

      const years = all
        .map((item) => safeDate(item.createdAt)?.getFullYear() ?? null)
        .filter((year): year is number => year !== null);

      if (years.length > 0) {
        const latestYear = Math.max(...years);
        setSelectedYear((prev) => prev ?? latestYear);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const yearOptions: YearOption[] = useMemo(() => {
    const years = Array.from(
      new Set(
        applications
          .map((item) => safeDate(item.createdAt)?.getFullYear() ?? null)
          .filter((year): year is number => year !== null),
      ),
    ).sort((a, b) => b - a);

    return years.map((year) => ({ year, label: `${toThaiYear(year)}` }));
  }, [applications]);

  const filteredByYear = useMemo(() => {
    if (!selectedYear) return applications;
    return applications.filter(
      (item) => safeDate(item.createdAt)?.getFullYear() === selectedYear,
    );
  }, [applications, selectedYear]);

  const applicantMonthlySeries = useMemo(() => {
    const monthlyApplicantSets = Array.from(
      { length: 12 },
      () => new Set<string>(),
    );

    filteredByYear.forEach((item) => {
      const date = safeDate(item.createdAt);
      if (!date) return;

      const month = date.getMonth();
      monthlyApplicantSets[month].add(getApplicantKey(item));
    });

    return monthlyApplicantSets.map((set) => set.size);
  }, [filteredByYear]);

  const internMonthlySeries = useMemo(() => {
    const activeSets = Array.from({ length: 12 }, () => new Set<string>());
    const completedSets = Array.from({ length: 12 }, () => new Set<string>());

    filteredByYear.forEach((item) => {
      const date = safeDate(item.createdAt);
      if (!date) return;

      const month = date.getMonth();
      const applicantKey = getApplicantKey(item);

      if (item.studentInternshipStatus === "ACTIVE") {
        activeSets[month].add(applicantKey);
      }
      if (item.studentInternshipStatus === "COMPLETE") {
        completedSets[month].add(applicantKey);
      }
    });

    return {
      active: activeSets.map((set) => set.size),
      completed: completedSets.map((set) => set.size),
    };
  }, [filteredByYear]);

  const institutionTypeStats = useMemo(() => {
    const map = new Map<string, number>();

    filteredByYear.forEach((item) => {
      const key = normalizeInstitutionType(item.institutionType);
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    const labelMap: Record<string, string> = {
      UNIVERSITY: "มหาวิทยาลัย",
      VOCATIONAL: "ปวช. / ปวส.",
      SCHOOL: "มัธยมศึกษาตอนปลาย",
      OTHERS: "อื่น ๆ",
    };

    return topN(
      Array.from(map.entries()).map(([key, value]) => [
        labelMap[key] ?? key,
        value,
      ]),
      5,
    );
  }, [filteredByYear]);

  const topInstitutions = useMemo(() => {
    const map = new Map<string, Set<string>>();

    filteredByYear
      .filter((item) => {
        if (institutionTypeFilter === "all") return true;
        return (
          normalizeInstitutionType(item.institutionType) ===
          institutionTypeFilter
        );
      })
      .forEach((item) => {
        const key = getInstitutionDisplayName(item);
        if (!map.has(key)) {
          map.set(key, new Set<string>());
        }
        map.get(key)!.add(getApplicantKey(item));
      });

    return topN(
      Array.from(map.entries()).map(([name, applicantSet]) => [
        name,
        applicantSet.size,
      ]),
      10,
    );
  }, [filteredByYear, institutionTypeFilter]);

  const topUnits = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filteredByYear.forEach((item) => {
      const key = item.departmentId
        ? departmentsById[item.departmentId] || `หน่วยงาน ${item.departmentId}`
        : "ไม่ระบุหน่วยงาน";
      if (!map.has(key)) {
        map.set(key, new Set<string>());
      }
      map.get(key)!.add(getApplicantKey(item));
    });
    return topN(
      Array.from(map.entries()).map(([unitName, applicantSet]) => [
        unitName,
        applicantSet.size,
      ]),
      10,
    );
  }, [filteredByYear, departmentsById]);

  const topMajors = useMemo(() => {
    const map = new Map<string, number>();
    filteredByYear.forEach((item) => {
      const key = item.major || "ไม่ระบุสาขา";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return topN(Array.from(map.entries()), 5);
  }, [filteredByYear]);

  const stats = useMemo(() => {
    const totalApplicants = new Set(
      filteredByYear
        .filter((item) =>
          APPLICANT_COUNTABLE_STATUSES.has(item.applicationStatus),
        )
        .map((item) => getApplicantKey(item)),
    ).size;
    const totalInterns = filteredByYear.filter(
      (item) => item.applicationStatus === "COMPLETE",
    ).length;
    const openedUnits = new Set(
      filteredByYear.map((item) => item.departmentId).filter((v) => v !== null),
    ).size;
    const allPositions = new Set(
      filteredByYear.map((item) => item.positionId).filter((v) => v !== null),
    ).size;
    const pendingReview = filteredByYear.filter(
      (item) => getDocStatus(item) === "pending_review",
    ).length;
    const approved = filteredByYear.filter(
      (item) => getDocStatus(item) === "approved",
    ).length;
    const rejected = filteredByYear.filter(
      (item) => getDocStatus(item) === "rejected",
    ).length;

    return {
      totalApplicants,
      totalInterns,
      openedUnits,
      allPositions,
      pendingReview,
      approved,
      rejected,
    };
  }, [filteredByYear]);

  const chartTitle =
    chartMainTab === "applicants"
      ? "จำนวนผู้สมัครฝึกงาน"
      : internChartStatusTab === "all"
        ? "จำนวนนักศึกษาฝึกงาน (ทั้งหมด)"
        : internChartStatusTab === "active"
          ? "จำนวนนักศึกษาฝึกงาน (กำลังฝึกงาน)"
          : "จำนวนนักศึกษาฝึกงาน (ฝึกงานเสร็จสิ้น)";

  const maxMonthly =
    chartMainTab === "applicants"
      ? Math.max(...applicantMonthlySeries, 1)
      : internChartStatusTab === "all"
        ? Math.max(
            ...internMonthlySeries.active,
            ...internMonthlySeries.completed,
            1,
          )
        : internChartStatusTab === "active"
          ? Math.max(...internMonthlySeries.active, 1)
          : Math.max(...internMonthlySeries.completed, 1);

  const monthlySeries =
    chartMainTab === "applicants"
      ? applicantMonthlySeries
      : internChartStatusTab === "active"
        ? internMonthlySeries.active
        : internMonthlySeries.completed;

  const totalPie = institutionTypeStats.reduce(
    (sum, [, value]) => sum + value,
    0,
  );
  const selectedInstitutionTypeFilterLabel =
    INSTITUTION_TYPE_FILTER_OPTIONS.find(
      (option) => option.value === institutionTypeFilter,
    )?.label || "ทั้งหมด";

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
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ด</h1>
            <p className="text-gray-500 text-sm mt-1">ภาพรวมระบบของการสมัคร</p>
          </div>

          <div className="w-full md:w-44 relative">
            <select
              value={selectedYear ?? ""}
              onChange={(event) =>
                setSelectedYear(Number(event.target.value) || null)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-700 appearance-none 
             focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
            >
              {yearOptions.map((option) => (
                <option key={option.year} value={option.year}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="text-primary-600 mb-2">
              <svg
                width="24"
                height="12"
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
            <p className="text-3xl font-bold text-gray-700">
              {stats.totalApplicants}
            </p>
            <p className="text-sm text-gray-500 mt-1">ผู้สมัครทั้งหมด</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="text-primary-600 mb-2">
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
            <p className="text-3xl font-bold text-gray-700">
              {stats.totalInterns}
            </p>
            <p className="text-sm text-gray-500 mt-1">นักศึกษาฝึกงานทั้งหมด</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="text-primary-600 mb-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.5 14.8V12.5C15.5 12.3667 15.45 12.25 15.35 12.15C15.25 12.05 15.1333 12 15 12C14.8667 12 14.75 12.05 14.65 12.15C14.55 12.25 14.5 12.3667 14.5 12.5V14.8C14.5 14.9333 14.525 15.0583 14.575 15.175C14.625 15.2917 14.7 15.4 14.8 15.5L16.325 17.025C16.425 17.125 16.5417 17.175 16.675 17.175C16.8083 17.175 16.925 17.125 17.025 17.025C17.125 16.925 17.175 16.8083 17.175 16.675C17.175 16.5417 17.125 16.425 17.025 16.325L15.5 14.8ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979167 18 1.45 18 2V7C18 7.28333 17.9042 7.52083 17.7125 7.7125C17.5208 7.90417 17.2833 8 17 8C16.7167 8 16.4792 7.90417 16.2875 7.7125C16.0958 7.52083 16 7.28333 16 7V2H2V16H7C7.28333 16 7.52083 16.0958 7.7125 16.2875C7.90417 16.4792 8 16.7167 8 17C8 17.2833 7.90417 17.5208 7.7125 17.7125C7.52083 17.9042 7.28333 18 7 18H2ZM2 16V2V8.075V8V16ZM4 13C4 13.2833 4.09583 13.5208 4.2875 13.7125C4.47917 13.9042 4.71667 14 5 14H7.075C7.35833 14 7.59583 13.9042 7.7875 13.7125C7.97917 13.5208 8.075 13.2833 8.075 13C8.075 12.7167 7.97917 12.4792 7.7875 12.2875C7.59583 12.0958 7.35833 12 7.075 12H5C4.71667 12 4.47917 12.0958 4.2875 12.2875C4.09583 12.4792 4 12.7167 4 13ZM4 9C4 9.28333 4.09583 9.52083 4.2875 9.7125C4.47917 9.90417 4.71667 10 5 10H10C10.2833 10 10.5208 9.90417 10.7125 9.7125C10.9042 9.52083 11 9.28333 11 9C11 8.71667 10.9042 8.47917 10.7125 8.2875C10.5208 8.09583 10.2833 8 10 8H5C4.71667 8 4.47917 8.09583 4.2875 8.2875C4.09583 8.47917 4 8.71667 4 9ZM4 5C4 5.28333 4.09583 5.52083 4.2875 5.7125C4.47917 5.90417 4.71667 6 5 6H13C13.2833 6 13.5208 5.90417 13.7125 5.7125C13.9042 5.52083 14 5.28333 14 5C14 4.71667 13.9042 4.47917 13.7125 4.2875C13.5208 4.09583 13.2833 4 13 4H5C4.71667 4 4.47917 4.09583 4.2875 4.2875C4.09583 4.47917 4 4.71667 4 5ZM15 20C13.6167 20 12.4375 19.5125 11.4625 18.5375C10.4875 17.5625 10 16.3833 10 15C10 13.6167 10.4875 12.4375 11.4625 11.4625C12.4375 10.4875 13.6167 10 15 10C16.3833 10 17.5625 10.4875 18.5375 11.4625C19.5125 12.4375 20 13.6167 20 15C20 16.3833 19.5125 17.5625 18.5375 18.5375C17.5625 19.5125 16.3833 20 15 20Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-700">
              {stats.openedUnits}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              หน่วยงานที่เปิดรับฝึกงาน
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="text-primary-600 mb-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 14V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
                  fill="#A80689"
                />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-700">
              {stats.allPositions}
            </p>
            <p className="text-sm text-gray-500 mt-1">ตำแหน่งฝึกงานทั้งหมด</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-300 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {chartTitle}
            </h2>

            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="inline-flex items-center rounded-2xl bg-gray-100 p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setChartMainTab("applicants")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    chartMainTab === "applicants"
                      ? "bg-white text-gray-800 shadow-sm cursor-pointer"
                      : "text-gray-500 cursor-pointer"
                  }`}
                >
                  <svg
                    width="22"
                    height="16"
                    viewBox="0 0 22 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
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
                  onClick={() => setChartMainTab("interns")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    chartMainTab === "interns"
                      ? "bg-white text-gray-800 shadow-sm cursor-pointer"
                      : "text-gray-500 cursor-pointer"
                  }`}
                >
                  <svg
                    width="24"
                    height="12"
                    viewBox="0 0 24 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 12C0.716667 12 0.479167 11.9042 0.2875 11.7125C0.0958333 11.5208 0 11.2833 0 11V10.425C0 9.70833 0.366667 9.125 1.1 8.675C1.83333 8.225 2.8 8 4 8C4.21667 8 4.425 8.00417 4.625 8.0125C4.825 8.02083 5.01667 8.04167 5.2 8.075C4.96667 8.425 4.79167 8.79167 4.675 9.175C4.55833 9.55833 4.5 9.95833 4.5 10.375V12H1ZM7 12C6.71667 12 6.47917 11.9042 6.2875 11.7125C6.09583 11.5208 6 11.2833 6 11V10.375C6 9.84167 6.14583 9.35417 6.4375 8.9125C6.72917 8.47083 7.14167 8.08333 7.675 7.75C8.20833 7.41667 8.84583 7.16667 9.5875 7C10.3292 6.83333 11.1333 6.75 12 6.75C12.8833 6.75 13.6958 6.83333 14.4375 7C15.1792 7.16667 15.8167 7.41667 16.35 7.75C16.8833 8.08333 17.2917 8.47083 17.575 8.9125C17.8583 9.35417 18 9.84167 18 10.375V11C18 11.2833 17.9042 11.5208 17.7125 11.7125C17.5208 11.9042 17.2833 12 17 12H7ZM19.5 12V10.375C19.5 9.94167 19.4458 9.53333 19.3375 9.15C19.2292 8.76667 19.0667 8.40833 18.85 8.075C19.0333 8.04167 19.2208 8.02083 19.4125 8.0125C19.6042 8.00417 19.8 8 20 8C21.2 8 22.1667 8.22083 22.9 8.6625C23.6333 9.10417 24 9.69167 24 10.425V11C24 11.2833 23.9042 11.5208 23.7125 11.7125C23.5208 11.9042 23.2833 12 23 12H19.5ZM8.125 10H15.9C15.7333 9.66667 15.2708 9.375 14.5125 9.125C13.7542 8.875 12.9167 8.75 12 8.75C11.0833 8.75 10.2458 8.875 9.4875 9.125C8.72917 9.375 8.275 9.66667 8.125 10ZM4 7C3.45 7 2.97917 6.80417 2.5875 6.4125C2.19583 6.02083 2 5.55 2 5C2 4.43333 2.19583 3.95833 2.5875 3.575C2.97917 3.19167 3.45 3 4 3C4.56667 3 5.04167 3.19167 5.425 3.575C5.80833 3.95833 6 4.43333 6 5C6 5.55 5.80833 6.02083 5.425 6.4125C5.04167 6.80417 4.56667 7 4 7ZM20 7C19.45 7 18.9792 6.80417 18.5875 6.4125C18.1958 6.02083 18 5.55 18 5C18 4.43333 18.1958 3.95833 18.5875 3.575C18.9792 3.19167 19.45 3 20 3C20.5667 3 21.0417 3.19167 21.425 3.575C21.8083 3.95833 22 4.43333 22 5C22 5.55 21.8083 6.02083 21.425 6.4125C21.0417 6.80417 20.5667 7 20 7ZM12 6C11.1667 6 10.4583 5.70833 9.875 5.125C9.29167 4.54167 9 3.83333 9 3C9 2.15 9.29167 1.4375 9.875 0.8625C10.4583 0.2875 11.1667 0 12 0C12.85 0 13.5625 0.2875 14.1375 0.8625C14.7125 1.4375 15 2.15 15 3C15 3.83333 14.7125 4.54167 14.1375 5.125C13.5625 5.70833 12.85 6 12 6ZM12 4C12.2833 4 12.5208 3.90417 12.7125 3.7125C12.9042 3.52083 13 3.28333 13 3C13 2.71667 12.9042 2.47917 12.7125 2.2875C12.5208 2.09583 12.2833 2 12 2C11.7167 2 11.4792 2.09583 11.2875 2.2875C11.0958 2.47917 11 2.71667 11 3C11 3.28333 11.0958 3.52083 11.2875 3.7125C11.4792 3.90417 11.7167 4 12 4Z"
                      fill="#61646C"
                    />
                  </svg>
                  นักศึกษาฝึกงานทั้งหมด
                </button>
              </div>

              {chartMainTab === "interns" && (
                <>
                  <div className="inline-flex items-center rounded-2xl bg-gray-100 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setInternChartStatusTab("all")}
                      className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
                        internChartStatusTab === "all"
                          ? "bg-white text-gray-800 shadow-sm cursor-pointer"
                          : "text-gray-500 cursor-pointer"
                      }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={() => setInternChartStatusTab("active")}
                      className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
                        internChartStatusTab === "active"
                          ? "bg-white text-gray-800 shadow-sm cursor-pointer"
                          : "text-gray-500 cursor-pointer"
                      }`}
                    >
                      กำลังฝึกงาน
                    </button>
                    <button
                      type="button"
                      onClick={() => setInternChartStatusTab("completed")}
                      className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
                        internChartStatusTab === "completed"
                          ? "bg-white text-gray-800 shadow-sm cursor-pointer"
                          : "text-gray-500 cursor-pointer"
                      }`}
                    >
                      ฝึกงานเสร็จสิ้น
                    </button>
                  </div>

                  {internChartStatusTab === "all" && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 rounded-md bg-[#F59E0B]" />
                        กำลังฝึกงาน
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 rounded-md bg-[#3B82F6]" />
                        ฝึกงานเสร็จสิ้น
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 min-h-[290px] items-end bg-[#FDF7FD] rounded-xl px-4 py-4">
            {THAI_MONTH_SHORT.map((monthLabel, index) => {
              const value = monthlySeries[index] || 0;
              const height = Math.max(6, (value / maxMonthly) * 180);
              const isPeak = value === maxMonthly && value > 0;

              return (
                <div
                  key={monthLabel}
                  className="col-span-1 flex flex-col items-center gap-2"
                >
                  <div className="text-[10px] text-gray-500">
                    {chartMainTab === "interns" &&
                    internChartStatusTab === "all"
                      ? (internMonthlySeries.active[index] || 0) +
                        (internMonthlySeries.completed[index] || 0)
                      : value}
                  </div>

                  {chartMainTab === "interns" &&
                  internChartStatusTab === "all" ? (
                    <div
                      className="w-full flex items-end justify-center gap-1"
                      style={{ height: "180px" }}
                    >
                      <div
                        className="w-[40%] rounded-t-md bg-[#F59E0B]"
                        style={{
                          height: `${Math.max(6, ((internMonthlySeries.active[index] || 0) / maxMonthly) * 180)}px`,
                        }}
                        title={`${monthLabel} (กำลังฝึกงาน): ${internMonthlySeries.active[index] || 0} รายการ`}
                      />
                      <div
                        className="w-[40%] rounded-t-md bg-[#3B82F6]"
                        style={{
                          height: `${Math.max(6, ((internMonthlySeries.completed[index] || 0) / maxMonthly) * 180)}px`,
                        }}
                        title={`${monthLabel} (ฝึกงานเสร็จสิ้น): ${internMonthlySeries.completed[index] || 0} รายการ`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-full rounded-t-md ${
                        chartMainTab === "applicants"
                          ? isPeak
                            ? "bg-primary-700"
                            : "bg-primary-300"
                          : internChartStatusTab === "active"
                            ? "bg-[#F59E0B]"
                            : "bg-[#3B82F6]"
                      }`}
                      style={{ height: `${height}px` }}
                      title={`${monthLabel}: ${value} รายการ`}
                    />
                  )}

                  <div className="text-[11px] text-gray-500">{monthLabel}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              ระดับการศึกษา
            </h3>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {institutionTypeStats.length === 0 ? (
                <p className="text-gray-500">ไม่มีข้อมูลในปีที่เลือก</p>
              ) : (
                <>
                  {/* SVG Pie Chart */}
                  <div className="shrink-0 relative">
                    <svg
                      width="400"
                      height="320"
                      viewBox="0 0 320 320"
                      className="max-w-full h-auto"
                    >
                      {(() => {
                        const total = institutionTypeStats.reduce(
                          (sum, [, v]) => sum + v,
                          0,
                        );
                        const cx = 160;
                        const cy = 160;
                        const r = 140;

                        if (total <= 0) {
                          return (
                            <circle cx={cx} cy={cy} r={r} fill="#E5E7EB" />
                          );
                        }

                        // SVG arc path cannot draw full 360 in one segment.
                        // Handle single-slice 100% explicitly.
                        if (institutionTypeStats.length === 1) {
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={r}
                              fill={PIE_COLORS[0]}
                              opacity={
                                hoveredEduSliceIndex === null ||
                                hoveredEduSliceIndex === 0
                                  ? 1
                                  : 0.35
                              }
                              onMouseEnter={() => setHoveredEduSliceIndex(0)}
                              onMouseLeave={() => setHoveredEduSliceIndex(null)}
                            />
                          );
                        }

                        let cumAngle = -Math.PI / 2; // start from top

                        return institutionTypeStats.map(
                          ([label, value], index) => {
                            const angle = (value / total) * 2 * Math.PI;
                            const x1 = cx + r * Math.cos(cumAngle);
                            const y1 = cy + r * Math.sin(cumAngle);
                            cumAngle += angle;
                            const x2 = cx + r * Math.cos(cumAngle);
                            const y2 = cy + r * Math.sin(cumAngle);
                            const largeArc = angle > Math.PI ? 1 : 0;

                            const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                            return (
                              <path
                                key={label}
                                d={path}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                opacity={
                                  hoveredEduSliceIndex === null ||
                                  hoveredEduSliceIndex === index
                                    ? 1
                                    : 0.35
                                }
                                style={{
                                  transition: "opacity 0.2s",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={() =>
                                  setHoveredEduSliceIndex(index)
                                }
                                onMouseLeave={() =>
                                  setHoveredEduSliceIndex(null)
                                }
                              />
                            );
                          },
                        );
                      })()}
                    </svg>
                    {hoveredEduSliceIndex !== null &&
                      institutionTypeStats[hoveredEduSliceIndex] && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded-2xl px-4 py-3 shadow-md min-w-[170px] text-center pointer-events-none">
                          <p className="text-gray-800 text-sm">
                            {institutionTypeStats[hoveredEduSliceIndex][0]}{" "}
                            {Math.round(
                              (institutionTypeStats[hoveredEduSliceIndex][1] /
                                totalPie) *
                                100,
                            )}
                            %
                          </p>
                          <p className="text-gray-900 text-[34px] leading-none font-semibold mt-2">
                            {institutionTypeStats[hoveredEduSliceIndex][1]}
                          </p>
                          <p className="text-gray-700 text-sm mt-1">คน</p>
                        </div>
                      )}
                  </div>

                  {/* Legend */}
                  <div className="space-y-2 text-sm w-full">
                    {institutionTypeStats.map(([label, value], index) => {
                      const percent =
                        totalPie === 0
                          ? 0
                          : Math.round((value / totalPie) * 100);
                      return (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="inline-flex items-center gap-2 text-gray-700">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[index % PIE_COLORS.length],
                              }}
                            />
                            {label}
                          </span>
                          <span className="text-gray-500">{percent}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  สถาบันที่สมัครมากที่สุด
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  จัดอันดับ 10 อันดับ สถาบันที่สมัครเข้ามามากที่สุด
                </p>
              </div>

              <div className="relative" ref={institutionTypeDropdownRef}>
                <button
                  type="button"
                  onClick={() =>
                    setShowInstitutionTypeDropdown((prev) => !prev)
                  }
                  className="min-w-[220px] inline-flex items-center justify-between gap-3 rounded-2xl border border-gray-300 bg-white px-5 py-3 text-gray-600 cursor-pointer"
                >
                  <span className="text-base">
                    {selectedInstitutionTypeFilterLabel}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${showInstitutionTypeDropdown ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
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

                {showInstitutionTypeDropdown && (
                  <div className="absolute right-0 mt-2 w-full bg-white border border-gray-300 rounded-2xl shadow-lg z-20 py-2">
                    {INSTITUTION_TYPE_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setInstitutionTypeFilter(option.value);
                          setShowInstitutionTypeDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-primary-600 text-white">
                  <tr>
                    <th className="px-3 py-2 text-xs text-left">ลำดับ</th>
                    <th className="px-3 py-2 text-xs text-center">
                      ชื่อสถาบัน
                    </th>
                    <th className="px-3 py-2 text-xs text-right">
                      จำนวนผู้สมัคร
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topInstitutions.map(([name, count], index) => (
                    <tr key={name} className="border-t border-gray-200">
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {name}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-right">
                        {count}
                      </td>
                    </tr>
                  ))}

                  {topInstitutions.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-sm text-gray-400"
                      >
                        ไม่มีข้อมูล
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <h3 className="text-xl font-semibold text-gray-800">
              หน่วยงานที่สมัครมากที่สุด
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              จัดอันดับ 10 หน่วยงานที่มีผู้สมัครเข้ามามากที่สุด
            </p>

            <div className="space-y-3">
              {topUnits.map(([name, count]) => {
                const max = topUnits[0]?.[1] ?? 1;
                const width = (count / max) * 100;

                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate pr-2">{name}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-primary-300 to-primary-600 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              

              {topUnits.length === 0 && (
                <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <h3 className="text-xl font-semibold text-gray-800">
              สาขาที่สมัครมากที่สุด
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              จัดอันดับ {topMajors.length} สาขาที่มีผู้สมัครเข้ามามากที่สุด
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {(() => {
                const topThree = topMajors
                  .slice(0, 3)
                  .map(([major, count], index) => ({
                    major,
                    count,
                    rank: index + 1,
                  }));
                const orderedTopThree =
                  topThree.length === 3
                    ? [topThree[1], topThree[0], topThree[2]]
                    : topThree;

                return orderedTopThree.map((item, index) => (
                  <div
                    key={item.major}
                    className={`rounded-lg border border-gray-200 bg-primary-50 p-3 text-center ${
                      orderedTopThree.length === 1 && index === 0
                        ? "col-start-2"
                        : ""
                    }`}
                  >
                    <div className="text-[10px] text-gray-500 mb-1">
                      อันดับ {item.rank}
                    </div>
                    <div
                      className="text-sm font-semibold text-gray-700 truncate"
                      title={item.major}
                    >
                      {item.major}
                    </div>
                    <div className="text-primary-700 font-bold mt-2">
                      {item.count}
                    </div>
                  </div>
                ));
              })()}

              {topMajors.length === 0 && (
                <div className="col-span-3 text-sm text-gray-400">
                  ไม่มีข้อมูล
                </div>
              )}
            </div>

            <div className="space-y-2">
              {topMajors.map(([major, count], index) => (
                <div
                  key={major}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                >
                  <span className="text-sm text-gray-600">
                    {index + 1}. {major}
                  </span>
                  <span className="text-sm font-semibold text-primary-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
