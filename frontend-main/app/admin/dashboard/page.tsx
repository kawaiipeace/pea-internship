"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import AdminNavbar from "@/components/ui/AdminNavbar";
import { applicationApi, AllStudentsHistoryItem } from "@/services/api";

type AdminDocStatus =
  | "pending_upload"
  | "pending_review"
  | "approved"
  | "rejected";
type YearOption = { year: number; label: string };

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

export default function AdminDashboardPage() {
  const [applications, setApplications] = useState<AllStudentsHistoryItem[]>(
    [],
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const all = await fetchAllStudentsHistory();
      setApplications(all);

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

  const monthlySeries = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    filteredByYear.forEach((item) => {
      const date = safeDate(item.createdAt);
      if (!date) return;
      counts[date.getMonth()] += 1;
    });
    return counts;
  }, [filteredByYear]);

  const institutionTypeStats = useMemo(() => {
    const map = new Map<string, number>();

    filteredByYear.forEach((item) => {
      const key = item.institutionType || "อื่นๆ";
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    const labelMap: Record<string, string> = {
      UNIVERSITY: "มหาวิทยาลัย",
      VOCATIONAL: "อาชีวะ",
      SCHOOL: "มัธยม",
      OTHERS: "อื่นๆ",
      อื่นๆ: "อื่นๆ",
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
    const map = new Map<string, number>();
    filteredByYear.forEach((item) => {
      const key = getInstitutionDisplayName(item);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return topN(Array.from(map.entries()), 5);
  }, [filteredByYear]);

  const topUnits = useMemo(() => {
    const map = new Map<string, number>();
    filteredByYear.forEach((item) => {
      const key = item.positionName || "ไม่ระบุหน่วยงาน";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return topN(Array.from(map.entries()), 10);
  }, [filteredByYear]);

  const topMajors = useMemo(() => {
    const map = new Map<string, number>();
    filteredByYear.forEach((item) => {
      const key = item.major || "ไม่ระบุสาขา";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return topN(Array.from(map.entries()), 5);
  }, [filteredByYear]);

  const stats = useMemo(() => {
    const totalApplicants = filteredByYear.length;
    const openedUnits = new Set(
      filteredByYear.map((item) => item.departmentId).filter((v) => v !== null),
    ).size;
    const allPositions = new Set(
      filteredByYear.map((item) => item.positionId).filter((v) => v !== null),
    ).size;
    const joinedInstitutions = new Set(
      filteredByYear
        .map((item) => getInstitutionDisplayName(item))
        .filter((v) => !!v),
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
      openedUnits,
      allPositions,
      joinedInstitutions,
      pendingReview,
      approved,
      rejected,
    };
  }, [filteredByYear]);

  const maxMonthly = Math.max(...monthlySeries, 1);
  const totalPie = institutionTypeStats.reduce(
    (sum, [, value]) => sum + value,
    0,
  );

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
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" />
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
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 20h16M6 18V8m4 10V6m4 12V10m4 8V4" />
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
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M8 6h8M8 12h8M8 18h8M4 6h.01M4 12h.01M4 18h.01" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-700">
              {stats.allPositions}
            </p>
            <p className="text-sm text-gray-500 mt-1">ตำแหน่งฝึกงานทั้งหมด</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-300 p-5">
            <div className="text-primary-600 mb-2">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-700">
              {stats.joinedInstitutions}
            </p>
            <p className="text-sm text-gray-500 mt-1">สถาบันที่เข้าร่วม</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-300 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              จำนวนผู้สมัครฝึกงาน
            </h2>
          </div>

          <div className="grid grid-cols-12 gap-3 min-h-[290px] items-end bg-[#FDF7FD] rounded-xl px-4 py-4">
            {monthlySeries.map((value, index) => {
              const height = Math.max(6, (value / maxMonthly) * 180);
              const isPeak = value === maxMonthly && value > 0;

              return (
                <div
                  key={THAI_MONTH_SHORT[index]}
                  className="col-span-1 flex flex-col items-center gap-2"
                >
                  <div className="text-[10px] text-gray-500">{value}</div>
                  <div
                    className={`w-full rounded-t-md ${isPeak ? "bg-primary-700" : "bg-primary-300"}`}
                    style={{ height: `${height}px` }}
                    title={`${THAI_MONTH_SHORT[index]}: ${value} รายการ`}
                  />
                  <div className="text-[11px] text-gray-500">
                    {THAI_MONTH_SHORT[index]}
                  </div>
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
                  <div className="flex-shrink-0">
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
                              />
                            );
                          },
                        );
                      })()}
                    </svg>
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
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
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
            <h3 className="text-xl font-semibold text-gray-800">
              สถาบันที่สมัครมากที่สุด
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              จัดอันดับ {topInstitutions.length}{" "}
              สถาบันที่มีผู้สมัครเข้ามามากที่สุด
            </p>

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
                        className="h-full bg-gradient-to-r from-primary-300 to-primary-600 rounded-full"
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
              {topMajors.slice(0, 3).map(([major, count], index) => (
                <div
                  key={major}
                  className="rounded-lg border border-gray-200 bg-primary-50 p-3 text-center"
                >
                  <div className="text-[10px] text-gray-500 mb-1">
                    อันดับ {index + 1}
                  </div>
                  <div
                    className="text-sm font-semibold text-gray-700 truncate"
                    title={major}
                  >
                    {major}
                  </div>
                  <div className="text-primary-700 font-bold mt-2">{count}</div>
                </div>
              ))}

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
