'use client';

import React, { useState, useEffect, useCallback } from 'react';
import IconUser from '@/components/icon/icon-user';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';
import IconCalendarClock from '@/components/icon/icon-calendar-clock';
import IconSearch from '@/components/icon/icon-search';
import IconExport from '@/components/icon/icon-export';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconArrowForward from '@/components/icon/icon-arrow-forward';
import axiosInstance from '@/api/axios';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface DashboardStats {
    totalActive: number;
    leaveRate: number;
    lateRate: number;
    absentRate: number;
}

interface TopUnitItem {
    name: string;
    value: number;
}

interface TopUnits {
    leaveTop: TopUnitItem[];
    lateTop: TopUnitItem[];
    absentTop: TopUnitItem[];
}

interface StudentData {
    id: string;
    fullName: string;
    image: string | null;
    positionName: string;
    todayStatus: { text: string; code: string };
    statistics: { present: number; late: number; leave: number; absent: number };
    workHours: { accumulated: number; goal: number };
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    value: string;
    label: string;
    isLoading?: boolean;
}

const StatCard = ({ icon, iconBg, value, label, isLoading }: StatCardProps) => (
    <div className="panel flex flex-col gap-2 rounded-xl border border-white-light bg-white p-5 shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>{icon}</div>
        {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        ) : (
            <span className="text-2xl font-bold text-gray-800 dark:text-white">{value}</span>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    </div>
);

// ── Bar Chart Row ─────────────────────────────────────────────────────────────
interface BarRowProps {
    label: string;
    value: number;
    max: number;
    color: string;
    isOther?: boolean;
}

const BarRow = ({ label, value, max, color, isOther }: BarRowProps) => {
    const pct = isOther ? 8 : max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="w-16 truncate text-right text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <div className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700" style={{ height: '10px' }}>
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: isOther ? '#d1d5db' : color }}
                />
            </div>
            {!isOther && <span className="w-6 text-xs font-medium text-gray-600 dark:text-gray-300">{value}</span>}
        </div>
    );
};

// ── Top-unit Widget ───────────────────────────────────────────────────────────
interface TopUnitWidgetProps {
    title: string;
    subtitle: string;
    axisLabel: string;
    color: string;
    items: TopUnitItem[];
    isLoading?: boolean;
}

const TopUnitWidget = ({ title, subtitle, axisLabel, color, items, isLoading }: TopUnitWidgetProps) => {
    const max = items.length > 0 ? Math.max(...items.map((i) => i.value)) : 0;
    const axis = [0, 1, 2, 3, 4, 5, 6];

    return (
        <div className="panel rounded-xl border border-white-light bg-white p-5 shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3>
            <p className="mb-4 text-xs text-gray-400">{subtitle}</p>

            <div className="flex flex-col gap-2">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="h-3 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="h-2.5 flex-1 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                        </div>
                    ))
                ) : items.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-3">ไม่มีข้อมูลในเดือนนี้</p>
                ) : (
                    <>
                        {items.map((item, i) => (
                            <BarRow key={i} label={item.name} value={item.value} max={max} color={color} />
                        ))}
                        <BarRow label="อื่นๆ" value={0} max={max} color={color} isOther />
                    </>
                )}
            </div>

            {/* Axis */}
            <div className="mt-3 flex justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                {axis.map((v) => (
                    <span key={v} className="text-xs text-gray-400">{v}</span>
                ))}
            </div>
            <p className="mt-1 text-center text-xs text-gray-400">{axisLabel}</p>
        </div>
    );
};

// ── Student Badge ─────────────────────────────────────────────────────────────
interface AttendanceBadgeProps {
    count: number;
    type: 'มา' | 'สาย' | 'ลา' | 'ขาด';
}

const colors: Record<string, string> = {
    มา: 'bg-success/10 text-success border-success/30',
    สาย: 'bg-warning/10 text-warning border-warning/30',
    ลา: 'bg-info/10 text-info border-info/30',
    ขาด: 'bg-danger/10 text-danger border-danger/30',
};

const AttendanceBadge = ({ count, type }: AttendanceBadgeProps) => (
    <div className={`flex flex-col items-center rounded-lg border px-2 py-1 text-center ${colors[type]}`}>
        <span className="text-sm font-bold">{count}</span>
        <span className="text-[10px]">{type}</span>
    </div>
);

// ── Progress Bar ──────────────────────────────────────────────────────────────
interface HoursBarProps {
    done: number;
    total: number;
    color: string;
    note?: string;
    noteColor?: string;
}

const HoursBar = ({ done, total, color, note, noteColor }: HoursBarProps) => (
    <div className="flex flex-col gap-1">
        <span className="text-sm font-bold" style={{ color }}>
            {done}
            <span className="text-xs font-normal text-gray-400">/{total} ชั่วโมง</span>
        </span>
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (done / total) * 100)}%`, backgroundColor: color }} />
        </div>
        {note && (
            <span className="text-xs" style={{ color: noteColor }}>{note}</span>
        )}
    </div>
);

// ── Status Tag ────────────────────────────────────────────────────────────────
const statusStyle: Record<string, string> = {
    ACTIVE: 'bg-warning/10 text-warning',
    COMPLETE: 'bg-gray-100 text-gray-500',
};

const statusLabel: Record<string, string> = {
    ACTIVE: 'อยู่ระหว่างการฝึกงาน',
    COMPLETE: 'สิ้นสุดการฝึกงาน',
};

// ── Student Row ───────────────────────────────────────────────────────────────
interface StudentRowProps extends StudentData {}

const StudentRow = ({ fullName, positionName, statistics, workHours }: StudentRowProps) => {
    const nameParts = fullName.split(' (');
    const mainName = nameParts[0] ?? fullName;
    const nickname = nameParts[1]?.replace(')', '') ?? '';

    const avatarColors = ['bg-primary/20 text-primary', 'bg-success/20 text-success', 'bg-warning/20 text-warning', 'bg-danger/20 text-danger', 'bg-secondary/20 text-secondary'];
    const colorIndex = mainName.charCodeAt(0) % avatarColors.length;

    const { accumulated, goal } = workHours;
    const pct = goal > 0 ? (accumulated / goal) * 100 : 0;
    let hoursColor = '#9333ea'; // purple default
    let hoursNote = '';
    let hoursNoteColor = '#6b7280';

    if (pct >= 100) {
        hoursColor = '#22c55e';
        hoursNote = '✅ สิ้นสุดการฝึกงาน';
        hoursNoteColor = '#22c55e';
    } else if (pct >= 90) {
        hoursColor = '#f97316';
        hoursNote = '📅 ใกล้สิ้นสุดการฝึกงาน';
    } else {
        hoursNote = '';
    }

    return (
        <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-[#1b2e4b] dark:hover:bg-[#1b2e4b]/50">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${avatarColors[colorIndex]}`}>
                        {mainName.charAt(0)}
                    </div>
                    <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                            {mainName}
                            {nickname && <span className="text-gray-400"> ({nickname})</span>}
                        </p>
                        <p className="text-xs text-gray-400">{positionName}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex gap-1 justify-center">
                    <AttendanceBadge count={statistics.present} type="มา" />
                    <AttendanceBadge count={statistics.late} type="สาย" />
                    <AttendanceBadge count={statistics.leave} type="ลา" />
                    <AttendanceBadge count={statistics.absent} type="ขาด" />
                </div>
            </td>
            <td className="px-4 py-3 min-w-[160px]">
                <HoursBar done={accumulated} total={goal} color={hoursColor} note={hoursNote} noteColor={hoursNoteColor} />
            </td>
            <td className="px-4 py-3 text-center">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${pct >= 100 ? 'bg-gray-100 text-gray-500' : 'bg-warning/10 text-warning'}`}>
                    {pct >= 100 ? 'สิ้นสุดการฝึกงาน' : 'อยู่ระหว่างการฝึกงาน'}
                </span>
            </td>
        </tr>
    );
};

// ── MONTHS ────────────────────────────────────────────────────────────────────
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
// Christian year → Thai Buddhist era offset
const BE_OFFSET = 543;

// ── PAGE ──────────────────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
    const now = new Date();
    const [monthIdx, setMonthIdx] = useState(now.getMonth());          // 0-based
    const [year, setYear] = useState(now.getFullYear());               // CE year for API
    const [search, setSearch] = useState('');
    const [timeRange, setTimeRange] = useState('');
    const [page, setPage] = useState(1);

    // Data states
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [topUnits, setTopUnits] = useState<TopUnits | null>(null);
    const [students, setStudents] = useState<StudentData[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);

    // Loading states
    const [statsLoading, setStatsLoading] = useState(true);
    const [topUnitsLoading, setTopUnitsLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(true);

    // ── Fetch dashboard stats + top-units when month/year changes ─────────────
    useEffect(() => {
        const ceMonth = monthIdx + 1;   // convert 0-based to 1-based

        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const res = await axiosInstance.get('/admin-dashboard/stats', {
                    params: { month: ceMonth, year },
                });
                setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setStatsLoading(false);
            }
        };

        const fetchTopUnits = async () => {
            setTopUnitsLoading(true);
            try {
                const res = await axiosInstance.get('/admin-dashboard/top-units', {
                    params: { month: ceMonth, year },
                });
                setTopUnits(res.data);
            } catch (err) {
                console.error('Failed to fetch top units:', err);
            } finally {
                setTopUnitsLoading(false);
            }
        };

        fetchStats();
        fetchTopUnits();
    }, [monthIdx, year]);

    // ── Fetch student list when search / timeRange / page changes ─────────────
    const fetchStudents = useCallback(async () => {
        setStudentsLoading(true);
        try {
            const params: Record<string, unknown> = {
                viewType: 'ALL',
                page,
                limit: 10,
            };
            if (search) params.search = search;

            // Map timeRange to startDate/endDate
            if (timeRange === 'week') {
                const d = new Date();
                const dayOfWeek = d.getDay();
                const monday = new Date(d);
                monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                params.startDate = monday.toISOString().split('T')[0];
                params.endDate = sunday.toISOString().split('T')[0];
            } else if (timeRange === 'month') {
                const d = new Date();
                const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
                const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                params.startDate = firstDay.toISOString().split('T')[0];
                params.endDate = lastDay.toISOString().split('T')[0];
            } else if (timeRange === 'quarter') {
                const d = new Date();
                const quarter = Math.floor(d.getMonth() / 3);
                const firstDay = new Date(d.getFullYear(), quarter * 3, 1);
                const lastDay = new Date(d.getFullYear(), quarter * 3 + 3, 0);
                params.startDate = firstDay.toISOString().split('T')[0];
                params.endDate = lastDay.toISOString().split('T')[0];
            }

            const res = await axiosInstance.get('/mentor/students', { params });
            setStudents(res.data.data ?? []);
            setMeta(res.data.meta ?? null);
        } catch (err) {
            console.error('Failed to fetch students:', err);
            setStudents([]);
        } finally {
            setStudentsLoading(false);
        }
    }, [search, timeRange, page]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, timeRange]);

    // ── Month navigation ──────────────────────────────────────────────────────
    const prevMonth = () => {
        if (monthIdx === 0) {
            setMonthIdx(11);
            setYear((y) => y - 1);
        } else {
            setMonthIdx((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (monthIdx === 11) {
            setMonthIdx(0);
            setYear((y) => y + 1);
        } else {
            setMonthIdx((m) => m + 1);
        }
    };

    // ── Export CSV ────────────────────────────────────────────────────────────
    const handleExport = () => {
        const BOM = '\uFEFF';
        let csv = BOM + 'ชื่อ-นามสกุล,ตำแหน่ง,มา,สาย,ลา,ขาด,ชั่วโมงสะสม,ชั่วโมงทั้งหมด\n';
        for (const s of students) {
            const parts = s.fullName.split(' (');
            const name = parts[0] ?? s.fullName;
            csv += `"${name}","${s.positionName}",${s.statistics.present},${s.statistics.late},${s.statistics.leave},${s.statistics.absent},${s.workHours.accumulated},${s.workHours.goal}\n`;
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `นักศึกษา_${MONTHS_TH[monthIdx]}_${year + BE_OFFSET}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // ── Build pagination pages ────────────────────────────────────────────────
    const totalPages = meta?.totalPages ?? 0;
    const buildPages = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | '...')[] = [1];
        if (page > 3) pages.push('...');
        for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) pages.push(p);
        if (page < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-4 md:p-6">
            {/* ── Header ── */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">แดชบอร์ด</h1>
                    <p className="text-sm text-gray-400">แสดงภาพรวมข้อมูลการฝึกงานของนักศึกษา</p>
                </div>

                {/* Month Picker */}
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                    <button
                        id="prev-month-btn"
                        onClick={prevMonth}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    >
                        <IconArrowBackward className="h-4 w-4" />
                    </button>
                    <span className="min-w-[90px] text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                        {MONTHS_TH[monthIdx]} {year + BE_OFFSET}
                    </span>
                    <button
                        id="next-month-btn"
                        onClick={nextMonth}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    >
                        <IconArrowForward className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={<IconUser className="h-5 w-5 text-success" />}
                    iconBg="bg-success/10"
                    value={stats ? stats.totalActive.toLocaleString() : '—'}
                    label="อยู่ระหว่างฝึกงานทั้งหมด"
                    isLoading={statsLoading}
                />
                <StatCard
                    icon={<IconCalendar className="h-5 w-5 text-info" />}
                    iconBg="bg-info/10"
                    value={stats ? `${stats.leaveRate} %` : '—'}
                    label="อัตราการลา"
                    isLoading={statsLoading}
                />
                <StatCard
                    icon={<IconClock className="h-5 w-5 text-warning" />}
                    iconBg="bg-warning/10"
                    value={stats ? `${stats.lateRate} %` : '—'}
                    label="อัตราการสาย"
                    isLoading={statsLoading}
                />
                <StatCard
                    icon={<IconCalendarClock className="h-5 w-5 text-danger" />}
                    iconBg="bg-danger/10"
                    value={stats ? `${stats.absentRate} %` : '—'}
                    label="อัตราการขาด"
                    isLoading={statsLoading}
                />
            </div>

            {/* ── Top Unit Charts ── */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "ลา" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการลาสูงสุด"
                    axisLabel="จำนวนครั้ง"
                    color="#3b82f6"
                    items={topUnits?.leaveTop ?? []}
                    isLoading={topUnitsLoading}
                />
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "มาสาย" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการมาสายสูงสุด"
                    axisLabel="จำนวนครั้ง"
                    color="#f59e0b"
                    items={topUnits?.lateTop ?? []}
                    isLoading={topUnitsLoading}
                />
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "ขาด" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการขาดสูงสุด"
                    axisLabel="จำนวนครั้ง"
                    color="#ef4444"
                    items={topUnits?.absentTop ?? []}
                    isLoading={topUnitsLoading}
                />
            </div>

            {/* ── Student Table ── */}
            <div className="panel rounded-xl border border-white-light bg-white shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                {/* Table Header */}
                <div className="border-b border-gray-100 p-5 dark:border-[#1b2e4b]">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white">รายชื่อนักศึกษา</h2>
                    <p className="text-sm text-gray-400">
                        แสดงภาพรวมข้อมูลการฝึกงานของนักศึกษารายบุคคล
                        {meta && <span className="ml-2 text-xs text-gray-400">({meta.total} คน)</span>}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 p-5 sm:flex-row">
                    {/* Search */}
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <IconSearch className="h-4 w-4" />
                        </span>
                        <input
                            id="student-search-input"
                            type="text"
                            placeholder="พิมพ์ชื่อ ตำแหน่ง มหาวิทยาลัย หรือกองที่ต้องการค้นหา..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none dark:border-[#253b5c] dark:bg-[#0e1726] dark:text-gray-200"
                        />
                    </div>
                    {/* Time Range */}
                    <select
                        id="time-range-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="form-select rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 focus:border-primary focus:outline-none dark:border-[#253b5c] dark:bg-[#0e1726] dark:text-gray-200"
                    >
                        <option value="">เลือกช่วงเวลาที่ต้องการดู...</option>
                        <option value="week">สัปดาห์นี้</option>
                        <option value="month">เดือนนี้</option>
                        <option value="quarter">ไตรมาสนี้</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 dark:border-[#1b2e4b] dark:bg-[#0e1726]/50">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">นักศึกษา</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">สถิติการมาฝึกงาน</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">ชั่วโมงทำงาน</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">สถานะการฝึกงาน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-[#1b2e4b]">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                                                <div className="flex flex-col gap-1">
                                                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-1">
                                                {[...Array(4)].map((_, j) => (
                                                    <div key={j} className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-8 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="mx-auto h-6 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                                        </td>
                                    </tr>
                                ))
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-10 text-center text-gray-400">
                                        {search ? 'ไม่พบนักศึกษาที่ค้นหา' : 'ไม่มีข้อมูลนักศึกษา'}
                                    </td>
                                </tr>
                            ) : (
                                students.map((s) => <StudentRow key={s.id} {...s} />)
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-5 sm:flex-row dark:border-[#1b2e4b]">
                    {/* Export */}
                    <button
                        id="export-table-btn"
                        onClick={handleExport}
                        disabled={students.length === 0}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-40"
                    >
                        <IconExport className="h-4 w-4" />
                        ส่งออกตาราง
                    </button>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                id="prev-page-btn"
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-[#253b5c] dark:hover:bg-[#1b2e4b]"
                            >
                                <IconArrowBackward className="h-4 w-4" />
                            </button>

                            {buildPages().map((p, i) => (
                                <button
                                    key={i}
                                    id={typeof p === 'number' ? `page-btn-${p}` : undefined}
                                    disabled={p === '...'}
                                    onClick={() => typeof p === 'number' && setPage(p)}
                                    className={`min-w-[32px] rounded border px-2 py-1 text-sm transition-colors ${
                                        p === page
                                            ? 'border-primary bg-primary text-white'
                                            : 'border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-default dark:border-[#253b5c] dark:hover:bg-[#1b2e4b]'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                id="next-page-btn"
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 dark:border-[#253b5c] dark:hover:bg-[#1b2e4b]"
                            >
                                <IconArrowForward className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;