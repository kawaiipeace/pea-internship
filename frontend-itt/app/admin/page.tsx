'use client';

import React, { useState, useEffect, useCallback } from 'react';
import IconUser from '@/components/icon/icon-user';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';
import IconSearch from '@/components/icon/icon-search';
import IconExport from '@/components/icon/icon-export';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconArrowForward from '@/components/icon/icon-arrow-forward';
import IconFileText from '@/components/icon/icon-file-text';
import axiosInstance from '@/api/axios';
import ImageWithAuth from '@/components/ImageWithAuth';
import { useRouter } from 'next/navigation';

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
    unitName?: string;
    todayStatus: { text: string; code: string };
    statistics: { present: number; late: number; leave: number; absent: number };
    workHours: { accumulated: number; goal: number; remainingDays?: number };
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface StatCardProps {
    icon: React.ReactNode;
    value: string;
    label: string;
    isLoading?: boolean;
    valueColor: string;
}

interface BarRowProps {
    label: string;
    value: number;
    max: number;
    color: string;
    isOther?: boolean;
}

interface TopUnitWidgetProps {
    title: string;
    subtitle: string;
    axisLabel: string;
    color: string;
    items: TopUnitItem[];
    isLoading?: boolean;
}

interface AttendanceBadgeProps {
    count: number;
    type: 'มา' | 'สาย' | 'ลา' | 'ขาด';
}

interface StudentRowProps extends StudentData { }

interface HoursBarProps {
    done: number;
    total: number;
    color: string;
    note?: string;
    icon?: React.ReactNode;
}

const StatCard = ({ icon, value, label, isLoading, valueColor }: StatCardProps) => (
    <div className="panel flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex h-8 w-8 items-center justify-start">{icon}</div>
        <div>
            {isLoading ? (
                <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
            ) : (
                <h2 className={`text-3xl font-bold ${valueColor}`}>{value}</h2>
            )}
            <p className="mt-2 text-[15px] font-bold text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    </div>
);

const BarRow = ({ label, value, max, color, isOther }: BarRowProps) => {
    const pct = isOther ? 8 : max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-3 py-1">
            <span className="w-14 truncate text-right text-sm font-medium text-gray-400 dark:text-gray-500">{label}</span>
            <div className="flex-1 rounded-full bg-gray-100 dark:bg-gray-800" style={{ height: '14px' }}>
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: isOther ? '#d1d5db' : color,
                        boxShadow: isOther ? 'none' : `0 0 12px ${color}66`
                    }}
                />
            </div>
        </div>
    );
};


const TopUnitWidget = ({ title, subtitle, axisLabel, color, items, isLoading }: TopUnitWidgetProps) => {
    const max = items.length > 0 ? Math.max(...items.map((i) => i.value)) : 0;
    const axis = [0, 1, 2, 3, 4, 5, 6];

    return (
        <div className="panel rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
            <p className="mb-6 text-xs text-gray-400">{subtitle}</p>

            <div className="flex flex-col gap-3">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="h-4 w-12 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                            <div className="h-3.5 flex-1 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
                        </div>
                    ))
                ) : items.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-10">ไม่มีข้อมูลในเดือนนี้</p>
                ) : (
                    <>
                        {items.slice(0, 5).map((item, i) => (
                            <BarRow key={i} label={item.name} value={item.value} max={max} color={color} />
                        ))}
                        
                    </>
                )}
            </div>

            {/* Axis */}
            <div className="mt-6 flex border-t border-gray-50 pt-3 dark:border-gray-700/50">
                <div className="w-14 shrink-0" /> {/* Match label width */}
                <div className="ml-3 flex flex-1 justify-between"> {/* Match gap-3 */}
                    {axis.map((v) => (
                        <span key={v} className="text-xs font-medium text-gray-400">{v}</span>
                    ))}
                </div>
            </div>
            <p className="mt-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{axisLabel} (%)</p>
        </div>
    );
};


// สมมติว่านี่คือ Props เดิมที่คุณมีอยู่
interface StudentRowProps {
    id: string;
    fullName: string;
    positionName: string;
    unitName?: string;
    statistics: {
        present: number;
        late: number;
        leave: number;
        absent: number;
    };
    workHours: {
        accumulated: number;
        goal: number;
        remainingDays?: number;
    };
}

const StudentRow = ({ id, fullName, positionName, unitName, statistics, workHours }: StudentRowProps) => {
    const nameParts = fullName.split(' (');
    const mainName = nameParts[0] ?? fullName;
    const nickname = nameParts[1]?.replace(')', '') ?? '';
    const router = useRouter();

    const { accumulated, goal, remainingDays } = workHours;

    let hoursNote = '';
    const isEnded = remainingDays === 0 || (goal > 0 && accumulated >= goal);
    
    if (isEnded) {
        hoursNote = 'สิ้นสุดการฝึกงาน';
    } else if (remainingDays !== undefined) {
        hoursNote = `เหลืออีก ${remainingDays} วัน`;
    }

    // คำนวณเปอร์เซ็นต์สำหรับ Progress bar
    const progressPercent = goal > 0 ? Math.min((accumulated / goal) * 100, 100) : 0;

    return (
        <tr 
            className="hover:bg-gray-50/50 transition-colors cursor-pointer border-b border-[#F2F4F7] dark:border-[#1b2e4b] dark:hover:bg-[#1b2e4b]/50" 
            onClick={() => router.push(`/admin/${id}`)}
        >
            {/* 1. นักศึกษา */}
            <td className="py-4 px-6 text-left">
                <div className="flex items-center gap-4">
                    <ImageWithAuth
                        userId={id}
                        className="w-12 h-12 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                        fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`}
                    />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#111827] text-[14px] whitespace-nowrap">
                                {mainName}
                            </span>
                            {nickname && (
                                <span className="font-bold text-[#000000] text-[14px] whitespace-nowrap">
                                    ({nickname})
                                </span>
                            )}
                        </div>
                        <span className="text-[12px] text-[#9ca3af] whitespace-nowrap font-medium">
                            {positionName}
                        </span>
                    </div>
                </div>
            </td>

            {/* 2. สถานะวันนี้ / สังกัด (ใช้ข้อมูล unitName เดิมของคุณ) */}
            <td className="py-4 px-6">
                <div className="flex justify-center">
                    <div className="w-[124px] flex justify-center lg:justify-start">
                        <span className="text-[16px] font-bold text-[#111827]">{unitName}</span>
                    </div>
                </div>
            </td>

            {/* 3. สถิติการมาฝึกงาน */}
            <td className="py-4 px-6 text-center">
                <div className="flex justify-center gap-2">
                    {/* มา */}
                    <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                        <span className="text-[18px] font-bold text-[#079455] leading-none">{statistics.present}</span>
                        <span className="text-[11px] text-[#61646C] font-medium mt-0">มา</span>
                    </div>
                    {/* สาย */}
                    <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                        <span className="text-[18px] font-bold text-[#FDB022] leading-none">{statistics.late}</span>
                        <span className="text-[11px] text-[#61646C] font-medium mt-0">สาย</span>
                    </div>
                    {/* ลา */}
                    <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                        <span className="text-[18px] font-bold text-[#0FA3ED] leading-none">{statistics.leave}</span>
                        <span className="text-[11px] text-[#61646C] font-medium mt-0">ลา</span>
                    </div>
                    {/* ขาด */}
                    <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                        <span className="text-[18px] font-bold text-[#D92D20] leading-none">{statistics.absent}</span>
                        <span className="text-[11px] text-[#61646C] font-medium mt-0">ขาด</span>
                    </div>
                </div>
            </td>

            {/* 4. ชั่วโมงทำงาน */}
            <td className="py-4 px-6">
                <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto">
                    <div className="flex items-center justify-end px-1 mb-1">
                        <span className="text-[10px] text-[#9ca3af] font-medium uppercase tracking-wider">
                            <b className="text-[#a80689] text-[14px]">{accumulated}</b>
                            / {goal} ชั่วโมง
                        </span>
                    </div>
                    <div className="w-full h-[14px] bg-[#f3f4f6] rounded-full overflow-hidden shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                        <div
                            className="h-full bg-[#A80689] rounded-full transition-all duration-700 shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.3),inset_0px_1px_2px_rgba(255,255,255,0.3)]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-2 px-1 mt-1">
                        <span
                            className="material-symbols-outlined select-none"
                            style={{ 
                                fontVariationSettings: "'FILL' 1", 
                                fontSize: '20px', 
                                color: isEnded ? '#B42318' : '#85888E' 
                            }}
                        >
                            schedule
                        </span>
                        <span className={`text-[12px] font-normal ${isEnded ? 'text-[#D92D20]' : 'text-[#6b7280]'}`}>
                            {hoursNote}
                        </span>
                    </div>
                </div>
            </td>

            {/* 5. ผลการพิจารณา (แทนที่ด้วย Badge เดิมของคุณให้เข้ากับ Layout) */}
            <td className="py-4 px-6 text-center">
                <div className="flex flex-col items-center justify-center w-full min-h-[40px]">
                    <span className="inline-block rounded-xl px-5 py-2 text-[14px] font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA] whitespace-nowrap">
                        อยู่ระหว่างการฝึกงาน
                    </span>
                </div>
            </td>
        </tr>
    );
};
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const BE_OFFSET = 543;

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

            // Date Range logic
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
            } else {
                // DEFAULT: Use global month/year picker
                const monthStr = (monthIdx + 1).toString().padStart(2, '0');
                const firstDay = `${year}-${monthStr}-01`;
                const lastDayNum = new Date(year, monthIdx + 1, 0).getDate();
                const lastDay = `${year}-${monthStr}-${lastDayNum.toString().padStart(2, '0')}`;
                params.startDate = firstDay;
                params.endDate = lastDay;
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
    }, [search, timeRange, page, monthIdx, year]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Reset page when any filter changes
    useEffect(() => {
        setPage(1);
    }, [search, timeRange, monthIdx, year]);

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
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">แดชบอร์ด</h1>
                        <p className="text-sm font-medium text-gray-400">แสดงภาพรวมข้อมูลการฝึกงานของนักศึกษา</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Month Picker */}
                    <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                        <button
                            id="prev-month-btn"
                            onClick={prevMonth}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-primary transition-colors dark:hover:bg-gray-800"
                        >
                            <IconArrowBackward className="h-4 w-4" />
                        </button>
                        <span className="min-w-[120px] text-center text-sm font-bold text-gray-700 dark:text-gray-200">
                            {MONTHS_TH[monthIdx]} {year + BE_OFFSET}
                        </span>
                        <button
                            id="next-month-btn"
                            onClick={nextMonth}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-primary transition-colors dark:hover:bg-gray-800"
                        >
                            <IconArrowForward className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={<IconUser className="h-7 w-7 text-[#17B26A]" />}
                    value={stats ? stats.totalActive.toLocaleString() : '—'}
                    label="อยู่ระหว่างฝึกงานทั้งหมด"
                    isLoading={statsLoading}
                    valueColor="text-[#17B26A]"
                />
                <StatCard
                    icon={<IconFileText className="h-7 w-7 text-[#1AB3FF]" />}
                    value={stats ? `${stats.leaveRate} %` : '—'}
                    label="อัตราการลา"
                    isLoading={statsLoading}
                    valueColor="text-[#1AB3FF]"
                />
                <StatCard
                    icon={<IconClock className="h-7 w-7 text-[#FDB022]" />}
                    value={stats ? `${stats.lateRate} %` : '—'}
                    label="อัตราการสาย"
                    isLoading={statsLoading}
                    valueColor="text-[#FDB022]"
                />
                <StatCard
                    icon={<IconCalendar className="h-7 w-7 text-[#D92D20]" />}
                    value={stats ? `${stats.absentRate} %` : '—'}
                    label="อัตราการขาด"
                    isLoading={statsLoading}
                    valueColor="text-[#D92D20]"
                />
            </div>

            {/* ── Top Unit Charts ── */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "ลา" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการลาสูงสุด"
                    axisLabel="อัตราการลา"
                    color="#3b82f6"
                    items={topUnits?.leaveTop ?? []}
                    isLoading={topUnitsLoading}
                />
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "มาสาย" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการมาสายสูงสุด"
                    axisLabel="อัตราการสาย"
                    color="#f59e0b"
                    items={topUnits?.lateTop ?? []}
                    isLoading={topUnitsLoading}
                />
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "ขาด" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการขาดสูงสุด"
                    axisLabel="อัตราการขาด"
                    color="#ef4444"
                    items={topUnits?.absentTop ?? []}
                    isLoading={topUnitsLoading}
                />
            </div>

            {/* ── Student Table ── */}
            {/* ── Student Table Section ── */}
            <div className="mb-6">
                <h2 className="text-[24px] font-bold text-[#111827] mb-1">รายชื่อนักศึกษา</h2>
                <p className="text-[14px] font-normal text-[#61646C]">
                    แสดงภาพรวมข้อมูลการฝึกงานของนักศึกษารายบุคคล
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6 lg:flex-row">
                {/* Search */}
                <div className="relative flex-[2.5]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                        <IconSearch className="h-5 w-5" />
                    </span>
                    <input
                        id="student-search-input"
                        type="text"
                        placeholder="พิมพ์ชื่อ ตำแหน่ง มหาวิทยาลัย กอง ชื่อพี่เลี้ยงหรือรหัสพนักงานพี่เลี้ยงที่ต้องการค้นหา..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-input w-full rounded-[10px] border border-[#E5E7EB] bg-white py-3 pl-11 pr-4 text-[14px] font-medium text-gray-700 placeholder:text-[#9CA3AF] focus:border-primary focus:outline-none dark:border-[#253b5c] dark:bg-[#0e1726] dark:text-gray-200 shadow-sm"
                    />
                </div>
                {/* Time Range */}
                <div className="flex-1">
                    <select
                        id="time-range-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className={`form-select w-full rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-medium focus:border-primary focus:outline-none dark:border-[#253b5c] dark:bg-[#0e1726] shadow-sm ${timeRange ? 'text-gray-700 dark:text-gray-200' : 'text-[#9CA3AF]'
                            }`}
                    >
                        <option value="">เลือกช่วงเวลาที่ต้องการดู...</option>
                        <option value="week">สัปดาห์นี้</option>
                        <option value="month">เดือนนี้</option>
                        <option value="quarter">ไตรมาสนี้</option>
                    </select>
                </div>
            </div>

            <div className="panel p-0 border-[#E5E7EB] border-[1px] shadow-sm overflow-hidden rounded-[12px] bg-white">
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                                <th className="px-6 py-5 text-left text-[14px] font-normal text-[#111827]">นักศึกษา</th>
                                <th className="px-4 py-5 text-left text-[14px] font-normal text-[#111827]">หน่วยงาน</th>
                                <th className="px-4 py-5 text-center text-[14px] font-normal text-[#111827]">สถิติการมาฝึกงาน</th>
                                <th className="px-4 py-5 text-center text-[14px] font-normal text-[#111827]">ชั่วโมงทำงาน</th>
                                <th className="px-4 py-5 text-center text-[14px] font-normal text-[#111827]">สถานะการฝึกงาน</th>
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
                                    <td colSpan={5} className="py-20 text-center text-gray-400">
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
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-base font-bold text-[#A80689] hover:bg-[#A80689]/5 transition-colors disabled:opacity-40"
                    >
                        <IconExport className="h-6 w-6" />
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
                                    className={`min-w-[40px] rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${p === page
                                            ? 'border-gray-300 bg-[#F2F4F7] text-gray-800'
                                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-default dark:border-[#253b5c] dark:bg-[#0e1726] dark:hover:bg-[#1b2e4b]'
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