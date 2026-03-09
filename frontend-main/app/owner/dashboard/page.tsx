"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import OwnerNavbar from "../../components/ui/OwnerNavbar";
import VideoLoading from "../../components/ui/VideoLoading";
import {
  positionApi,
  userApi,
  departmentApi,
  applicationApi,
  AllStudentsHistoryItem,
  AppStatusEnum,
} from "../../services/api";
import { AnnouncementStats } from "../../types/announcement";

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
const STATUS_MAP: Record<AppStatusEnum, { label: string; color: string }> = {
  PENDING_DOCUMENT: { label: "รอรับเอกสาร", color: "#F97316" },
  PENDING_INTERVIEW: { label: "รอสัมภาษณ์", color: "#FACC15" },
  PENDING_CONFIRMATION: { label: "รอการยืนยัน", color: "#60A5FA" },
  PENDING_REQUEST: { label: "รอเอกสารขอความอนุเคราะห์", color: "#8B5CF6" },
  PENDING_REVIEW: { label: "รอตรวจเอกสาร", color: "#14B8A6" },
  COMPLETE: { label: "รับเข้าฝึกงาน", color: "#22C55E" },
  CANCEL: { label: "ยกเลิก/ไม่ผ่าน", color: "#9CA3AF" },
};

export default function OwnerDashboard() {
  const currentYear = new Date().getFullYear() + 543; // Buddhist Era
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // API-based stats
  const [apiStats, setApiStats] = useState<AnnouncementStats>({
    totalAnnouncements: 0,
    totalOpenPositions: 0,
    totalApplicants: 0,
  });
  const [departmentName, setDepartmentName] = useState("");
  const [positionNames, setPositionNames] = useState<string[]>([]);
  const [allApps, setAllApps] = useState<AllStudentsHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Client-only rendering to avoid hydration mismatch on SVG paths
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Tooltip states
  const [hoveredStatus, setHoveredStatus] = useState<number | null>(null);
  const [hoveredEdu, setHoveredEdu] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Position list pagination
  const [posPage, setPosPage] = useState(1);
  const posPerPage = 2;

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const userProfile = await userApi.getUserProfile();
        const departmentId = userProfile?.departmentId;

        if (departmentId) {
          const dept = await departmentApi.getDepartmentById(departmentId);
          if (dept?.deptFull || dept?.deptShort) {
            setDepartmentName(dept.deptFull || dept.deptShort || "");
          }
        }

        const response = await positionApi.getPositions({
          limit: 100,
          department: departmentId || undefined,
        });
        const positions = response.data || [];

        const totalPositions = positions.reduce(
          (sum, p) => sum + (p.positionCount || 0),
          0,
        );

        // ดึงชื่อตำแหน่ง (position name) จาก API
        const names = positions.map((p) => p.name || "ตำแหน่งไม่ระบุ");
        setPositionNames(names);

        // ดึงข้อมูลใบสมัครทั้งหมดจาก API
        const appsRes = await applicationApi.getAllStudentsHistory({ limit: 500, includeCanceled: true });
        const apps = appsRes.data || [];
        setAllApps(apps);

        setApiStats({
          totalAnnouncements: positions.length,
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

  // Monthly data from real applications
  const monthlyData = useMemo(() => {
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
    const counts: Record<string, number> = {};
    allApps.forEach((app) => {
      const status = app.applicationStatus as AppStatusEnum;
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, value]) => ({
        label: STATUS_MAP[status as AppStatusEnum]?.label || status,
        value,
        color: STATUS_MAP[status as AppStatusEnum]?.color || "#6B7280",
      }))
      .filter((d) => d.value > 0);
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
    // Group applications by positionId
    const posMap = new Map<number, { name: string; total: number; accepted: number }>();
    allApps.forEach((app) => {
      if (!app.positionId) return;
      if (!posMap.has(app.positionId)) {
        posMap.set(app.positionId, { name: app.positionName || `ตำแหน่ง #${app.positionId}`, total: 0, accepted: 0 });
      }
      const entry = posMap.get(app.positionId)!;
      entry.total++;
      if (app.applicationStatus === "COMPLETE") entry.accepted++;
    });
    const result = Array.from(posMap.values());
    return result.length > 0 ? result : positionNames.map((name) => ({ name, total: 0, accepted: 0 }));
  }, [allApps, positionNames]);

  const maxPositionTotal = Math.max(...positionData.map((d) => d.total), 1);

  // Pagination for position list
  const totalPosPages = Math.ceil(positionData.length / posPerPage);
  const currentPosData = positionData.slice(
    (posPage - 1) * posPerPage,
    posPage * posPerPage,
  );

  // Helper: create SVG arc path for pie slices
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number): string => {
    const start = {
      x: cx + r * Math.cos((startAngle - 90) * Math.PI / 180),
      y: cy + r * Math.sin((startAngle - 90) * Math.PI / 180),
    };
    const end = {
      x: cx + r * Math.cos((endAngle - 90) * Math.PI / 180),
      y: cy + r * Math.sin((endAngle - 90) * Math.PI / 180),
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
    if (!mounted || total === 0) return <div className="rounded-full bg-gray-200" style={{ width: size, height: size }} />;

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
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((slice) => (
              <path
                key={slice.index}
                d={describeArc(center, center, pieRadius, slice.startAngle, slice.endAngle - 0.5)}
                fill={slice.color}
                opacity={hovered === null || hovered === slice.index ? 1 : 0.4}
                style={{ transition: "opacity 0.2s", cursor: "pointer" }}
                onMouseEnter={() => onHover(slice.index)}
                onMouseLeave={() => onHover(null)}
              />
            ))}
          </svg>
          {hovered !== null && data[hovered] && (
            <div className="absolute z-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap"
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <div className="font-semibold">{data[hovered].label}</div>
              <div>{data[hovered].value} คน ({Math.round((data[hovered].value / total) * 100)}%)</div>
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
          <circle cx={center} cy={center} r={radius - strokeWidth / 2 + 2} fill="white" />
        </svg>
        {hovered !== null && data[hovered] && (
          <div className="absolute z-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <div className="font-semibold">{data[hovered].label}</div>
            <div>{data[hovered].value} คน ({Math.round((data[hovered].value / total) * 100)}%)</div>
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
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 5rem)" }}>
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
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
            <div className="text-primary-600">
              <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.979167 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM2 17H18V6H2V17ZM8 4H12V2H8V4Z" fill="#A80689" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">{apiStats.totalAnnouncements}</p>
              <p className="text-gray-500 text-sm">ประกาศทั้งหมด</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
            <div className="text-primary-600">
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V13.2ZM20 16H17.45C17.6333 15.7 17.7708 15.3792 17.8625 15.0375C17.9542 14.6958 18 14.35 18 14V13C18 12.2667 17.7958 11.5625 17.3875 10.8875C16.9792 10.2125 16.4 9.63333 15.65 9.15C16.5 9.25 17.3 9.42083 18.05 9.6625C18.8 9.90417 19.5 10.2 20.15 10.55C20.75 10.8833 21.2083 11.2542 21.525 11.6625C21.8417 12.0708 22 12.5167 22 13V14C22 14.55 21.8042 15.0208 21.4125 15.4125C21.0208 15.8042 20.55 16 20 16ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM18 4C18 5.1 17.6083 6.04167 16.825 6.825C16.0417 7.60833 15.1 8 14 8C13.8167 8 13.5833 7.97917 13.3 7.9375C13.0167 7.89583 12.7833 7.85 12.6 7.8C13.05 7.26667 13.3958 6.675 13.6375 6.025C13.8792 5.375 14 4.7 14 4C14 3.3 13.8792 2.625 13.6375 1.975C13.3958 1.325 13.05 0.733333 12.6 0.2C12.8333 0.116667 13.0667 0.0625 13.3 0.0375C13.5333 0.0125 13.7667 0 14 0C15.1 0 16.0417 0.391667 16.825 1.175C17.6083 1.95833 18 2.9 18 4ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#A80689" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">{apiStats.totalOpenPositions}</p>
              <p className="text-gray-500 text-sm">ตำแหน่งว่างทั้งหมด</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
            <div className="text-primary-600">
              <svg width="26" height="16" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12C0.716667 12 0.479167 11.9042 0.2875 11.7125C0.0958333 11.5208 0 11.2833 0 11V10.425C0 9.70833 0.366667 9.125 1.1 8.675C1.83333 8.225 2.8 8 4 8C4.21667 8 4.425 8.00417 4.625 8.0125C4.825 8.02083 5.01667 8.04167 5.2 8.075C4.96667 8.425 4.79167 8.79167 4.675 9.175C4.55833 9.55833 4.5 9.95833 4.5 10.375V12H1ZM7 12C6.71667 12 6.47917 11.9042 6.2875 11.7125C6.09583 11.5208 6 11.2833 6 11V10.375C6 9.84167 6.14583 9.35417 6.4375 8.9125C6.72917 8.47083 7.14167 8.08333 7.675 7.75C8.20833 7.41667 8.84583 7.16667 9.5875 7C10.3292 6.83333 11.1333 6.75 12 6.75C12.8833 6.75 13.6958 6.83333 14.4375 7C15.1792 7.16667 15.8167 7.41667 16.35 7.75C16.8833 8.08333 17.2917 8.47083 17.575 8.9125C17.8583 9.35417 18 9.84167 18 10.375V11C18 11.2833 17.9042 11.5208 17.7125 11.7125C17.5208 11.9042 17.2833 12 17 12H7ZM19.5 12V10.375C19.5 9.94167 19.4458 9.53333 19.3375 9.15C19.2292 8.76667 19.0667 8.40833 18.85 8.075C19.0333 8.04167 19.2208 8.02083 19.4125 8.0125C19.6042 8.00417 19.8 8 20 8C21.2 8 22.1667 8.22083 22.9 8.6625C23.6333 9.10417 24 9.69167 24 10.425V11C24 11.2833 23.9042 11.5208 23.7125 11.7125C23.5208 11.9042 23.2833 12 23 12H19.5ZM8.125 10H15.9C15.7333 9.66667 15.2708 9.375 14.5125 9.125C13.7542 8.875 12.9167 8.75 12 8.75C11.0833 8.75 10.2458 8.875 9.4875 9.125C8.72917 9.375 8.275 9.66667 8.125 10ZM4 7C3.45 7 2.97917 6.80417 2.5875 6.4125C2.19583 6.02083 2 5.55 2 5C2 4.43333 2.19583 3.95833 2.5875 3.575C2.97917 3.19167 3.45 3 4 3C4.56667 3 5.04167 3.19167 5.425 3.575C5.80833 3.95833 6 4.43333 6 5C6 5.55 5.80833 6.02083 5.425 6.4125C5.04167 6.80417 4.56667 7 4 7ZM20 7C19.45 7 18.9792 6.80417 18.5875 6.4125C18.1958 6.02083 18 5.55 18 5C18 4.43333 18.1958 3.95833 18.5875 3.575C18.9792 3.19167 19.45 3 20 3C20.5667 3 21.0417 3.19167 21.425 3.575C21.8083 3.95833 22 4.43333 22 5C22 5.55 21.8083 6.02083 21.425 6.4125C21.0417 6.80417 20.5667 7 20 7ZM12 6C11.1667 6 10.4583 5.70833 9.875 5.125C9.29167 4.54167 9 3.83333 9 3C9 2.15 9.29167 1.4375 9.875 0.8625C10.4583 0.2875 11.1667 0 12 0C12.85 0 13.5625 0.2875 14.1375 0.8625C14.7125 1.4375 15 2.15 15 3C15 3.83333 14.7125 4.54167 14.1375 5.125C13.5625 5.70833 12.85 6 12 6ZM12 4C12.2833 4 12.5208 3.90417 12.7125 3.7125C12.9042 3.52083 13 3.28333 13 3C13 2.71667 12.9042 2.47917 12.7125 2.2875C12.5208 2.09583 12.2833 2 12 2C11.7167 2 11.4792 2.09583 11.2875 2.2875C11.0958 2.47917 11 2.71667 11 3C11 3.28333 11.0958 3.52083 11.2875 3.7125C11.4792 3.90417 11.7167 4 12 4Z" fill="#A80689" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">{apiStats.totalApplicants}</p>
              <p className="text-gray-500 text-sm">ผู้สมัครทั้งหมด</p>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Status Donut + Education Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* สถานะใบสมัคร - Donut Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">สถานะใบสมัคร</h3>
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
                    style={{ backgroundColor: hoveredStatus === i ? `${d.color}15` : "transparent" }}
                    onMouseEnter={() => setHoveredStatus(i)}
                    onMouseLeave={() => setHoveredStatus(null)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">ระดับการศึกษา</h3>
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
                    style={{ backgroundColor: hoveredEdu === i ? `${d.color}15` : "transparent" }}
                    onMouseEnter={() => setHoveredEdu(i)}
                    onMouseLeave={() => setHoveredEdu(null)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
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
          <h3 className="text-lg font-bold text-gray-900 mb-6">จำนวนผู้สมัครฝึกงาน ปี {selectedYear}</h3>
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
                    opacity: d.count > 0
                      ? (hoveredMonth === i ? 1 : (hoveredMonth === null ? (i === peakMonthIndex ? 1 : 0.7) : 0.4))
                      : 0.3,
                    transition: "opacity 0.2s, height 0.3s",
                  }}
                />
                <span
                  className={`text-xs mt-2 whitespace-nowrap ${i === peakMonthIndex ? "text-primary-600 font-bold" : "text-gray-500"
                    }`}
                >
                  {d.month}
                </span>
              </div>
            ))}
          </div>
          {peakMonthIndex >= 0 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              ช่วงเวลาที่มีผู้สมัครมากที่สุด: {monthlyData[peakMonthIndex].monthFull}
            </p>
          )}
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
                  <span className="text-sm text-gray-700 w-40 shrink-0 truncate" title={d.name}>
                    {d.name}
                  </span>
                  <div className="flex-1 relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary-600 rounded-full transition-all"
                      style={{ width: `${(d.accepted / maxPositionTotal) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-10 text-right shrink-0">
                    {d.accepted}/{d.total}
                  </span>
                </div>
              ))}
              {positionData.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              แสดง {(posPage - 1) * posPerPage + 1}-{Math.min(posPage * posPerPage, positionData.length)} จากทั้งหมด {positionData.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPosPage(Math.max(1, posPage - 1))}
                disabled={posPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {(() => {
                const maxVisiblePages = 10;
                let startPage = Math.max(1, posPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPosPages, startPage + maxVisiblePages - 1);
                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setPosPage(i)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-sm ${i === posPage
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
              <button
                onClick={() => setPosPage(Math.min(totalPosPages, posPage + 1))}
                disabled={posPage === totalPosPages}
                className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
