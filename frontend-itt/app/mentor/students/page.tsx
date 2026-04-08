'use client';
import { useEffect, useState, useMemo } from 'react';
import { Pagination } from '@mantine/core';
import IconSearch from '@/components/icon/icon-search';
import IconCaretDown from '@/components/icon/icon-caret-down';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconFile from '@/components/icon/icon-file';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconClock from '@/components/icon/icon-clock';
import IconShare from '@/components/icon/icon-share';
import IconExport from '@/components/icon/icon-export';
import Flatpickr from 'react-flatpickr';
import Dropdown from '@/components/dropdown';
import IconMinus from '@/components/icon/icon-minus';

import { useRouter } from 'next/navigation';

const StudentsPage = () => {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [5, 10, 20, 50];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [dateRange, setDateRange] = useState<any>('');
    const [expandedCats, setExpandedCats] = useState<string[]>([]);
    const [selectedSchools, setSelectedSchools] = useState<string[]>([]);

    const items = [
        {
            id: 1,
            name: 'สมใจ ใฝ่ฝัน (ใจฝัน)',
            role: 'นักออกแบบ UX/UI',
            university: 'มหาวิทยาลัยธรรมศาสตร์',
            status: 'ปกติ',
            avatar: '/assets/images/profile-1.jpeg',
            attendance: { present: 56, late: 2, leave: 3, absent: 1 },
            progress: { current: 420, total: 560, percent: 75 },
            statusMessage: 'เหลืออีก 26 วันก่อนสิ้นสุดการฝึกงาน',
            statusType: 'remaining',
            consideration: '',
        },
        {
            id: 2,
            name: 'สมหมาย สายเสมอ (มาย)',
            role: 'Fronted Developer',
            university: 'มหาวิทยาลัยเกษตรศาสตร์',
            status: 'สาย',
            avatar: '/assets/images/profile-2.jpeg',
            attendance: { present: 56, late: 2, leave: 3, absent: 1 },
            progress: { current: 555, total: 560, percent: 99 },
            statusMessage: 'สิ้นสุดการฝึกงาน',
            statusType: 'ended',
            consideration: 'รออนุมัติการฝึกงาน',
        },
        {
            id: 3,
            name: 'สมนึก คึกคะนอง (นิค)',
            role: 'Fronted Developer',
            university: 'มหาวิทยาลัยเกษตรศาสตร์',
            status: 'ปกติ',
            avatar: '/assets/images/profile-3.jpeg',
            attendance: { present: 56, late: 2, leave: 3, absent: 1 },
            progress: { current: 420, total: 560, percent: 75 },
            statusMessage: 'เหลืออีก 26 วันก่อนสิ้นสุดการฝึกงาน',
            statusType: 'remaining',
            consideration: '',
        },
        {
            id: 4,
            name: 'สมชาย ลำฝัน (ชาย)',
            role: 'นักออกแบบ UX/UI',
            university: 'โรงเรียนสวนกุหลาบ',
            status: 'ลา',
            avatar: '/assets/images/profile-4.jpeg',
            attendance: { present: 56, late: 2, leave: 3, absent: 1 },
            progress: { current: 540, total: 560, percent: 96 },
            statusMessage: 'สิ้นสุดการฝึกงาน',
            statusType: 'ended',
            consideration: 'ชดเชยวันทำงาน 2 วัน',
            considerationType: 'compensation',
        },
        {
            id: 5,
            name: 'สมศรี สตรีไทย (เฟิร์น)',
            role: 'นักออกแบบ UX/UI',
            university: 'โรงเรียนหอวัง',
            status: 'ปกติ',
            avatar: '/assets/images/profile-5.jpeg',
            attendance: { present: 56, late: 2, leave: 3, absent: 1 },
            progress: { current: 558, total: 560, percent: 99 },
            statusMessage: 'วันสุดท้ายของการฝึกงาน',
            statusType: 'last-day',
            consideration: 'รออนุมัติการฝึกงาน',
        },
    ];

    const filteredItems = useMemo(() => {
        let result = [...items];
        if (selectedSchools.length > 0) {
            result = result.filter((item) => selectedSchools.includes(item.university));
        }
        return result;
    }, [selectedSchools]);

    const records = useMemo(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        return filteredItems.slice(from, to);
    }, [page, pageSize, filteredItems]);

    const flatpickrOptions = useMemo(() => ({
        mode: 'range' as const,
        dateFormat: 'd/m/Y',
        closeOnSelect: false,
        disableMobile: true,
        locale: {
            rangeSeparator: ' - ',
        },
        onReady: (_selectedDates: Date[], _dateStr: string, instance: any) => {
            instance._okClicked = false;
            const calendarContainer = instance.calendarContainer;
            if (calendarContainer.querySelector('.custom-btn-container')) return;

            const btnContainer = document.createElement('div');
            btnContainer.classList.add('custom-btn-container');
            btnContainer.style.cssText =
                'display:flex;justify-content:center;gap:12px;padding:12px;border-top:1px solid #E5E7EB;background:#fff;border-bottom-left-radius:8px;border-bottom-right-radius:8px;';

            const clearBtn = document.createElement('button');
            clearBtn.textContent = 'Clear';
            clearBtn.type = 'button';
            clearBtn.style.cssText =
                'flex:1;padding:12px;border-radius:24px;border:1px solid #E5E7EB;background:#fff;color:#4B5563;font-weight:600;font-size:18px;cursor:pointer;';
            clearBtn.addEventListener('click', () => {
                instance.clear();
                setDateRange('');
            });

            const okBtn = document.createElement('button');
            okBtn.textContent = 'Ok';
            okBtn.type = 'button';
            okBtn.style.cssText =
                'flex:1;padding:12px;border-radius:24px;border:none;background:#A80689;color:#fff;font-weight:600;font-size:18px;cursor:pointer;';
            okBtn.addEventListener('click', () => {
                instance._okClicked = true;
                instance.close();
            });

            btnContainer.appendChild(clearBtn);
            btnContainer.appendChild(okBtn);
            calendarContainer.appendChild(btnContainer);
        },
    }), []);

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'ปกติ':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#E4FFEE] border border-[#75E0A7] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#079455] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>check</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">เข้างานปกติ</span>
                    </div>
                );
            case 'ลากิจ':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#EEEFFF] border border-[#1A3CFF]/50 w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#1A3CFF] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>business_center</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลากิจ</span>
                    </div>
                );
            case 'ลาป่วย':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FFEFF3] border border-[#FF1A7D]/50 w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#FF1A7D] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>health_cross</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลาป่วย</span>
                    </div>
                );
            case 'ไม่ลงเวลาออก':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#F0F1F1] border border-[#94969C] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#85888E] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>hourglass_disabled</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ไม่ลงเวลาออก</span>
                    </div>
                );
            case 'ลา':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#EFF8FF] border border-[#1AB3FF]/50 w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#1AB3FF] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>lab_profile</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลา</span>
                    </div>
                );
            case 'ขาด':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#fef2f2] border border-[#fee2e2] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#ef4444] text-white rounded-full shrink-0 shadow-sm">
                            <IconXCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ขาด</span>
                    </div>
                );
            case 'สาย':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FFF9E5] border border-[#FFCA5F] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#FDB022] text-white rounded-full shrink-0 shadow-sm transition-transform">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>schedule</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">สาย</span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-[24px] font-bold text-[#000000]">นักศึกษาในความดูแล</h1>
                <p className="text-[16px] font-normal text-[#61646C]">แสดงภาพรวมข้อมูลการฝึกงานของนักศึกษาในความดูแล</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-[328px] h-[36px]">
                    <span className="absolute inset-y-0 left-[12px] flex items-center text-[#667085] pointer-events-none">
                        <span className="material-symbols-outlined select-none text-[20px]">search</span>
                    </span>
                    <input
                        type="text"
                        placeholder="พิมพ์ชื่อหรือตำแหน่งที่ต้องการค้นหา..."
                        className="w-full h-full pl-[42px] pr-[12px] bg-white border border-[#CECFD2] rounded-[5px] outline-none text-[14px] text-[#101828] placeholder:text-[#61646C] transition-all"
                    />
                </div>

                <div className="relative w-[348px] h-[36px]">
                    <Flatpickr
                        value={dateRange}
                        options={flatpickrOptions}
                        className="w-full h-full px-[12px] bg-white border border-[#CECFD2] rounded-[5px] outline-none text-[14px] text-[#101828] placeholder:text-[#61646C]"
                        placeholder="เลือกช่วงเวลาที่ต้องการดู..."
                        onChange={(date) => setDateRange(date)}
                    />
                    {dateRange && (
                        <button
                            type="button"
                            onClick={() => setDateRange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-danger"
                        >
                            <IconXCircle className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="panel p-0 border-[#CECFD2] border-[1px] shadow-sm overflow-hidden rounded-xl">
                <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full border-collapse table-auto min-w-[1100px]">
                        <thead className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                            <tr>
                                <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">นักศึกษา</th>
                                <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">สถานะวันนี้</th>
                                <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">สถิติการมาฝึกงาน</th>
                                <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">ชั่วโมงทำงาน</th>
                                <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">ผลการพิจารณา</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2F4F7]">
                            {records.map((student) => (
                                <tr 
                                    key={student.id} 
                                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/mentor/students/${student.id}`)}
                                >
                                    <td className="py-4 px-6 text-left">
                                        <div className="flex items-center gap-4">
                                            <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-[#E5E7EB] shrink-0" 
                                                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${student.name}&background=random` }} 
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#111827] text-[14px] whitespace-nowrap">{student.name}</span>
                                                <span className="text-[12px] text-[#9ca3af] whitespace-nowrap font-medium">{student.role}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex justify-center">
                                            <div className="w-[124px] flex justify-start">
                                                {renderStatusBadge(student.status)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center text-center">
                                        <div className="flex justify-center gap-2">
                                            {/* มา */}
                                            <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                                                <span className="text-[18px] font-bold text-[#079455] leading-none">{student.attendance.present}</span>
                                                <span className="text-[11px] text-[#61646C] font-medium mt-0">มา</span>
                                            </div>
                                            {/* สาย */}
                                            <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                                                <span className="text-[18px] font-bold text-[#FDB022] leading-none">{student.attendance.late}</span>
                                                <span className="text-[11px] text-[#61646C] font-medium mt-0">สาย</span>
                                            </div>
                                            {/* ลา */}
                                            <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                                                <span className="text-[18px] font-bold text-[#1A3CFF] leading-none">{student.attendance.leave}</span>
                                                <span className="text-[11px] text-[#61646C] font-medium mt-0">ลา</span>
                                            </div>
                                            {/* ขาด */}
                                            <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                                                <span className="text-[18px] font-bold text-[#D92D20] leading-none">{student.attendance.absent}</span>
                                                <span className="text-[11px] text-[#61646C] font-medium mt-0">ขาด</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto">
                                            <div className="flex items-center justify-end px-1 mb-1">
                                                <span className="text-[10px] text-[#9ca3af] font-medium uppercase tracking-wider">
                                                    <b className="text-[#a80689] text-[14px]">{student.progress.current}</b>
                                                    / {student.progress.total} ชั่วโมง
                                                </span>
                                            </div>
                                            <div className="w-full h-[14px] bg-[#f3f4f6] rounded-full overflow-hidden shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                                                <div 
                                                    className="h-full bg-[#A80689] rounded-full transition-all duration-700 shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.3),inset_0px_1px_2px_rgba(255,255,255,0.3)]"
                                                    style={{ width: `${student.progress.percent}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 px-1 mt-1">
                                                <span 
                                                    className="material-symbols-outlined select-none" 
                                                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: (student.statusType === 'ended' || student.statusType === 'last-day') ? '#B42318' : '#85888E' }}
                                                >
                                                    schedule
                                                </span>
                                                <span className={`text-[10px] font-normal ${
                                                    student.statusType === 'ended' ? 'text-[#D92D20]' : 
                                                    student.statusType === 'last-day' ? 'text-[#D92D20]' : 'text-[#6b7280]'
                                                }`}>
                                                    {student.statusMessage}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex flex-col items-center justify-center w-full min-h-[40px]">
                                            <span className={`font-semibold text-[10px] whitespace-nowrap ${
                                                student.considerationType === 'compensation' ? 'text-[#ef4444]' : 'text-[#6b7280]'
                                            }`}>
                                                {student.consideration}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-8 pb-10 gap-6 px-2">
                <button className="flex items-center  text-[#A80689] font-bold text-[14px] ">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg text-[#A80689]">
                        <span className="material-symbols-outlined select-none text-[24px]">ios_share</span>
                    </div>
                    ส่งออกตาราง
                </button>

                <div className="flex items-center border border-[#CECFD2] rounded-full overflow-hidden bg-white shadow-sm">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="w-11 h-10 flex items-center justify-center text-[#000000] border-r border-[#CECFD2] disabled:opacity-30 disabled:bg-gray-50/50"
                    >
                        <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                    </button>
                    
                    {Array.from({ length: Math.ceil(filteredItems.length / pageSize) }).map((_, index) => {
                        const pageNum = index + 1;
                        return (
                            <button 
                                key={pageNum}
                                onClick={() => setPage(pageNum)} 
                                className={`w-11 h-10 flex items-center justify-center text-[14px] font-medium transition-all border-r border-[#CECFD2] ${page === pageNum ? 'bg-[#E4E7EC] text-[#1F2937]' : 'text-[#6B7280] hover:bg-gray-50'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setPage(Math.min(Math.ceil(filteredItems.length / pageSize), page + 1))}
                        disabled={page >= Math.ceil(filteredItems.length / pageSize)}
                        className="w-11 h-10 flex items-center justify-center text-[#000] font-bold hover:bg-gray-50 transition-colors disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentsPage;
