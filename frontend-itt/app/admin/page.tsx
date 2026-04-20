'use client';

import React, { useState } from 'react';
import IconUser from '@/components/icon/icon-user';
import IconCalendar from '@/components/icon/icon-calendar';
import IconClock from '@/components/icon/icon-clock';
import IconCalendarClock from '@/components/icon/icon-calendar-clock';
import IconSearch from '@/components/icon/icon-search';
import IconExport from '@/components/icon/icon-export';
import IconArrowBackward from '@/components/icon/icon-arrow-backward';
import IconArrowForward from '@/components/icon/icon-arrow-forward';

interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    value: string;
    label: string;
}

const StatCard = ({ icon, iconBg, value, label }: StatCardProps) => (
    <div className="panel flex flex-col gap-2 rounded-xl border border-white-light bg-white p-5 shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>{icon}</div>
        <span className="text-2xl font-bold text-gray-800 dark:text-white">{value}</span>
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
    const pct = isOther ? 18 : (value / max) * 100;
    return (
        <div className="flex items-center gap-3">
            <span className="w-14 text-right text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <div className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700" style={{ height: '10px' }}>
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: isOther ? '#d1d5db' : color,
                    }}
                />
            </div>
            {!isOther && <span className="w-6 text-xs font-medium text-gray-600 dark:text-gray-300">{value}</span>}
        </div>
    );
};

// ── Top-unit Widget ───────────────────────────────────────────────────────────
interface TopUnitItem {
    name: string;
    value: number;
}

interface TopUnitWidgetProps {
    title: string;
    subtitle: string;
    axisLabel: string;
    color: string;
    items: TopUnitItem[];
}

const TopUnitWidget = ({ title, subtitle, axisLabel, color, items }: TopUnitWidgetProps) => {
    const max = Math.max(...items.map((i) => i.value));
    const axis = [0, 1, 2, 3, 4, 5, 6];

    return (
        <div className="panel rounded-xl border border-white-light bg-white p-5 shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3>
            <p className="mb-4 text-xs text-gray-400">{subtitle}</p>

            <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                    <BarRow key={i} label={item.name} value={item.value} max={max} color={color} />
                ))}
                <BarRow label="อื่นๆ" value={0} max={max} color={color} isOther />
            </div>

            {/* Axis */}
            <div className="mt-3 flex justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                {axis.map((v) => (
                    <span key={v} className="text-xs text-gray-400">
                        {v}
                    </span>
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

// ── Status Tag ────────────────────────────────────────────────────────────────
const statusStyle: Record<string, string> = {
    อยู่ระหว่างการฝึกงาน: 'bg-warning/10 text-warning',
    'สิ้นสุดการฝึกงาน': 'bg-gray-100 text-gray-500',
};

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
            <div className="h-full rounded-full" style={{ width: `${(done / total) * 100}%`, backgroundColor: color }} />
        </div>
        {note && (
            <span className="text-xs" style={{ color: noteColor }}>
                {note}
            </span>
        )}
    </div>
);

// ── Student Row ───────────────────────────────────────────────────────────────
interface StudentRowProps {
    name: string;
    nickname: string;
    role: string;
    unit: string;
    attendanceDays: number;
    attendanceLate: number;
    attendanceLeave: number;
    attendanceAbsent: number;
    hoursDone: number;
    hoursTotal: number;
    hoursColor: string;
    hoursNote?: string;
    hoursNoteColor?: string;
    status: string;
}

const StudentRow = ({
    name,
    nickname,
    role,
    unit,
    attendanceDays,
    attendanceLate,
    attendanceLeave,
    attendanceAbsent,
    hoursDone,
    hoursTotal,
    hoursColor,
    hoursNote,
    hoursNoteColor,
    status,
}: StudentRowProps) => {
    const initials = name.charAt(0);
    const avatarColors = ['bg-primary/20 text-primary', 'bg-success/20 text-success', 'bg-warning/20 text-warning', 'bg-danger/20 text-danger', 'bg-secondary/20 text-secondary'];
    const colorIndex = name.charCodeAt(0) % avatarColors.length;

    return (
        <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-[#1b2e4b] dark:hover:bg-[#1b2e4b]/50">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${avatarColors[colorIndex]}`}>{initials}</div>
                    <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                            {name} <span className="text-gray-400">({nickname})</span>
                        </p>
                        <p className="text-xs text-gray-400">{role}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">{unit}</td>
            <td className="px-4 py-3">
                <div className="flex gap-1 justify-center">
                    <AttendanceBadge count={attendanceDays} type="มา" />
                    <AttendanceBadge count={attendanceLate} type="สาย" />
                    <AttendanceBadge count={attendanceLeave} type="ลา" />
                    <AttendanceBadge count={attendanceAbsent} type="ขาด" />
                </div>
            </td>
            <td className="px-4 py-3 min-w-[160px]">
                <HoursBar done={hoursDone} total={hoursTotal} color={hoursColor} note={hoursNote} noteColor={hoursNoteColor} />
            </td>
            <td className="px-4 py-3 text-center">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusStyle[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
            </td>
        </tr>
    );
};

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const leaveTopUnits: TopUnitItem[] = [
    { name: 'กอพ.1', value: 6 },
    { name: 'กอพ.1', value: 5 },
    { name: 'กอพ.1', value: 4 },
    { name: 'กอพ.1', value: 2 },
    { name: 'กอพ.1', value: 1 },
];

const lateTopUnits: TopUnitItem[] = [
    { name: 'กอพ.1', value: 6 },
    { name: 'กอพ.1', value: 5 },
    { name: 'กอพ.1', value: 3 },
    { name: 'กอพ.1', value: 2 },
    { name: 'กอพ.1', value: 1 },
];

const absentTopUnits: TopUnitItem[] = [
    { name: 'กอพ.1', value: 6 },
    { name: 'กอพ.1', value: 5 },
    { name: 'กอพ.1', value: 3 },
    { name: 'กอพ.1', value: 2 },
    { name: 'กอพ.1', value: 1 },
];

const students = [
    {
        name: 'สมใจ ใฝ่ฝัน',
        nickname: 'ใจฝัน',
        role: 'นักออกแบบ UX/UI',
        unit: 'กอพ. 1',
        attendanceDays: 56,
        attendanceLate: 2,
        attendanceLeave: 3,
        attendanceAbsent: 1,
        hoursDone: 420,
        hoursTotal: 560,
        hoursColor: '#9333ea',
        hoursNote: '⏱ เหลืออีก 26 วัน',
        hoursNoteColor: '#6b7280',
        status: 'อยู่ระหว่างการฝึกงาน',
    },
    {
        name: 'สมหมาย สายเสมอ',
        nickname: 'นาย',
        role: 'Fronted Developer',
        unit: 'กอพ. 1',
        attendanceDays: 56,
        attendanceLate: 2,
        attendanceLeave: 3,
        attendanceAbsent: 1,
        hoursDone: 560,
        hoursTotal: 560,
        hoursColor: '#22c55e',
        hoursNote: '✅ สิ้นสุดการฝึกงาน',
        hoursNoteColor: '#22c55e',
        status: 'อยู่ระหว่างการฝึกงาน',
    },
    {
        name: 'สมนึก คึกคะนอง',
        nickname: 'นึก',
        role: 'Fronted Developer',
        unit: 'กอพ. 1',
        attendanceDays: 56,
        attendanceLate: 2,
        attendanceLeave: 3,
        attendanceAbsent: 1,
        hoursDone: 420,
        hoursTotal: 560,
        hoursColor: '#9333ea',
        hoursNote: '⏱ เหลืออีก 26 วัน',
        hoursNoteColor: '#6b7280',
        status: 'อยู่ระหว่างการฝึกงาน',
    },
    {
        name: 'สมชาย ลำฝัน',
        nickname: 'ชาย',
        role: 'นักออกแบบ UX/UI',
        unit: 'กอพ. 1',
        attendanceDays: 56,
        attendanceLate: 2,
        attendanceLeave: 3,
        attendanceAbsent: 1,
        hoursDone: 540,
        hoursTotal: 560,
        hoursColor: '#f97316',
        hoursNote: '✅ สิ้นสุดการฝึกงาน',
        hoursNoteColor: '#22c55e',
        status: 'อยู่ระหว่างการฝึกงาน',
    },
    {
        name: 'สมศรี สตรีไทย',
        nickname: 'เฟิร์น',
        role: 'นักออกแบบ UX/UI',
        unit: 'กอพ. 1',
        attendanceDays: 56,
        attendanceLate: 2,
        attendanceLeave: 3,
        attendanceAbsent: 1,
        hoursDone: 550,
        hoursTotal: 560,
        hoursColor: '#22c55e',
        hoursNote: '📅 เหลืออีก 7 วัน',
        hoursNoteColor: '#6b7280',
        status: 'อยู่ระหว่างการฝึกงาน',
    },
];

// ── MONTHS ────────────────────────────────────────────────────────────────────
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// ── PAGE ──────────────────────────────────────────────────────────────────────
const AdminDashboardPage = () => {
    const now = new Date();
    const [monthIdx, setMonthIdx] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear() + 543); // Buddhist era
    const [search, setSearch] = useState('');
    const [timeRange, setTimeRange] = useState('');

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

    const filteredStudents = students.filter(
        (s) =>
            s.name.includes(search) ||
            s.nickname.includes(search) ||
            s.unit.toLowerCase().includes(search.toLowerCase()) ||
            s.role.toLowerCase().includes(search.toLowerCase()),
    );

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
                    <button onClick={prevMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                        <IconArrowBackward className="h-4 w-4" />
                    </button>
                    <span className="min-w-[90px] text-center text-sm font-medium text-gray-700 dark:text-gray-200">
                        {MONTHS_TH[monthIdx]} {year}
                    </span>
                    <button onClick={nextMonth} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                        <IconArrowForward className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={<IconUser className="h-5 w-5 text-success" />}
                    iconBg="bg-success/10"
                    value="1110"
                    label="อยู่ระหว่างฝึกงานทั้งหมด"
                />
                <StatCard
                    icon={<IconCalendar className="h-5 w-5 text-info" />}
                    iconBg="bg-info/10"
                    value="2 %"
                    label="อัตราการลา"
                />
                <StatCard
                    icon={<IconClock className="h-5 w-5 text-warning" />}
                    iconBg="bg-warning/10"
                    value="5 %"
                    label="อัตราการสาย"
                />
                <StatCard
                    icon={<IconCalendarClock className="h-5 w-5 text-danger" />}
                    iconBg="bg-danger/10"
                    value="1 %"
                    label="อัตราการขาด"
                />
            </div>

            {/* ── Top Unit Charts ── */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "ลา" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการลาสูงสุด"
                    axisLabel="อัตราการลา (%)"
                    color="#3b82f6"
                    items={leaveTopUnits}
                />
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "มาสาย" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการมาสายสูงสุด"
                    axisLabel="อัตราการสาย (%)"
                    color="#f59e0b"
                    items={lateTopUnits}
                />
                <TopUnitWidget
                    title='หน่วยงานที่มีนักศึกษา "ขาด" สูงสุด'
                    subtitle="5 อันดับ หน่วยงานที่มีอัตราการขาดสูงสุด"
                    axisLabel="อัตราการขาด (%)"
                    color="#ef4444"
                    items={absentTopUnits}
                />
            </div>

            {/* ── Student Table ── */}
            <div className="panel rounded-xl border border-white-light bg-white shadow-sm dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                {/* Table Header */}
                <div className="border-b border-gray-100 p-5 dark:border-[#1b2e4b]">
                    <h2 className="text-base font-semibold text-gray-800 dark:text-white">รายชื่อนักศึกษา</h2>
                    <p className="text-sm text-gray-400">แสดงภาพรวมข้อมูลการฝึกงานของนักศึกษารายบุคคล</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 p-5 sm:flex-row">
                    {/* Search */}
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <IconSearch className="h-4 w-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="พิมพ์ชื่อ ตำแหน่ง มหาวิทยาลัย หรือกองที่ต้องการค้นหา..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none dark:border-[#253b5c] dark:bg-[#0e1726] dark:text-gray-200"
                        />
                    </div>
                    {/* Time Range */}
                    <select
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
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">หน่วยงาน</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">สถิติการมาฝึกงาน</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">ชั่วโมงทำงาน</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">สถานะการฝึกงาน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((s, i) => (
                                <StudentRow key={i} {...s} />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-5 sm:flex-row dark:border-[#1b2e4b]">
                    {/* Export */}
                    <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                        <IconExport className="h-4 w-4" />
                        ส่งออกตาราง
                    </button>

                    {/* Pagination */}
                    <div className="flex items-center gap-1">
                        <button className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 dark:border-[#253b5c] dark:hover:bg-[#1b2e4b]">
                            <IconArrowBackward className="h-4 w-4" />
                        </button>
                        {[1, 2, '...', 9, 10].map((page, i) => (
                            <button
                                key={i}
                                className={`min-w-[32px] rounded border px-2 py-1 text-sm transition-colors ${
                                    page === 1
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-[#253b5c] dark:hover:bg-[#1b2e4b]'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button className="rounded border border-gray-200 px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 dark:border-[#253b5c] dark:hover:bg-[#1b2e4b]">
                            <IconArrowForward className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;