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
import dynamic from 'next/dynamic';
const Flatpickr = dynamic(() => import('react-flatpickr'), { ssr: false });
import 'flatpickr/dist/flatpickr.css';
import '@/styles/flatpickr.css';
import Dropdown from '@/components/dropdown';
import IconMinus from '@/components/icon/icon-minus';

const StudentsPage = () => {
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
                        <span className="text-[#4b5563] font-medium text-[15px] whitespace-nowrap">เข้างานปกติ</span>
                    </div>
                );
            case 'ลา':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#EFF8FF] border border-[#1AB3FF]/50 w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#1AB3FF] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>lab_profile</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[15px] whitespace-nowrap">ลา</span>
                    </div>
                );
            case 'ขาด':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#fef2f2] border border-[#fee2e2] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#ef4444] text-white rounded-full shrink-0 shadow-sm">
                            <IconXCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[#4b5563] font-medium text-[15px] whitespace-nowrap">ขาด</span>
                    </div>
                );
            case 'สาย':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FFF9E5] border border-[#FFCA5F] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#FDB022] text-white rounded-full shrink-0 shadow-sm transition-transform">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>schedule</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[15px] whitespace-nowrap">สาย</span>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">นักศึกษาในความดูแล</h1>
                <p className="text-sm sm:text-base text-[#6B7280]">แสดงภาพรวมข้อมูลการฝึกงานของนักศึกษาในความดูแล</p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative group w-full">
                    <span className="absolute inset-y-0 left-4 flex items-center text-[#9CA3AF] group-focus-within:text-primary transition-colors">
                        <IconSearch className="w-5 h-5" />
                    </span>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อนักศึกษาหรือตำแหน่ง..."
                        className="form-input w-full pl-12 h-12 bg-white border-[#E5E7EB] rounded-lg focus:ring-primary/10 transition-all text-[14px] sm:text-[15px]"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="relative">
                        <Flatpickr
                            value={dateRange}
                            options={flatpickrOptions}
                            className="form-input h-12 bg-white border-[#E5E7EB] rounded-lg text-base pr-10"
                            placeholder="เลือกวันที่ที่ต้องการดู..."
                            onChange={(date) => setDateRange(date)}
                        />
                        {dateRange && (
                            <button
                                type="button"
                                onClick={() => setDateRange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-danger"
                            >
                                <IconXCircle className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Dropdown
                            offset={[0, 5]}
                            placement="bottom-start"
                            btnClassName="w-full"
                            button={
                                <div className="flex items-center justify-between w-full h-12 px-4 bg-white border border-[#E5E7EB] rounded-lg cursor-pointer">
                                    <span className={dateRange ? 'text-[#111827]' : 'text-[#9CA3AF]'}>
                                        ชื่อสถาบันศึกษา
                                    </span>
                                    <IconCaretDown className="w-5 h-5 text-[#9CA3AF]" />
                                </div>
                            }
                        >
                            <div 
                                className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-[90vw] sm:w-[400px] max-w-full py-4"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-4 mb-4">
                                    <div className="relative group">
                                        <span className="absolute inset-y-0 left-4 flex items-center text-[#9CA3AF]">
                                            <IconSearch className="w-5 h-5" />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="ค้นหาชื่อสถาบันศึกษา..."
                                            className="form-input pl-12 h-11 bg-white border-[#E5E7EB] rounded-lg focus:ring-0 focus:border-[#E5E7EB] text-base"
                                        />
                                    </div>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto px-2">
                                    <div 
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-lg mb-1"
                                        onClick={() => {
                                            const allSchools = [
                                                'โรงเรียนหอวัง', 'โรงเรียนสวนกุหลาบ',
                                                'สถาบันนวัตกรรม', 'วิทยาลัยเทคนิค',
                                                'วิทยาลัยเทคโนโลยี', 'วิทยาลัยชุมชน',
                                                'มหาวิทยาลัยธรรมศาสตร์', 'มหาวิทยาลัยเกษตรศาสตร์'
                                            ];
                                            if (selectedSchools.length === allSchools.length) {
                                                setSelectedSchools([]);
                                            } else {
                                                setSelectedSchools(allSchools);
                                            }
                                        }}
                                    >
                                        <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${selectedSchools.length > 0 ? 'bg-[#A80689] border-[#A80689]' : 'border-[#6B7280]'}`}>
                                            {selectedSchools.length > 0 && selectedSchools.length < 8 && <IconMinus className="w-4 h-4 text-white" />}
                                            {selectedSchools.length === 8 && <IconCircleCheck className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-[#4B5563] font-medium text-base">ทั้งหมด ({selectedSchools.length})</span>
                                    </div>

                                    {[
                                        { id: 'high-school', name: 'มัธยมศึกษาตอนปลาย', schools: ['โรงเรียนหอวัง', 'โรงเรียนสวนกุหลาบ'] },
                                        { id: 'vocational-1', name: 'ประกาศนียบัตรวิชาชีพ (ปวช.)', schools: ['สถาบันนวัตกรรม', 'วิทยาลัยเทคนิค'] },
                                        { id: 'vocational-2', name: 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', schools: ['วิทยาลัยเทคโนโลยี', 'วิทยาลัยชุมชน'] },
                                        { id: 'university', name: 'มหาวิทยาลัย', schools: ['มหาวิทยาลัยธรรมศาสตร์', 'มหาวิทยาลัยเกษตรศาสตร์'] }
                                    ].map((cat) => {
                                        const selectedInCat = cat.schools.filter(s => selectedSchools.includes(s));
                                        const isAllSelected = selectedInCat.length === cat.schools.length;
                                        const isPartial = selectedInCat.length > 0 && selectedInCat.length < cat.schools.length;

                                        return (
                                            <div key={cat.id} className="mb-2">
                                                <div 
                                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-lg group"
                                                    onClick={() => {
                                                        setExpandedCats(prev => prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className={`w-6 h-6 rounded flex items-center justify-center border-2 ${selectedInCat.length > 0 ? 'bg-[#A80689] border-[#A80689]' : 'border-[#6B7280]'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isAllSelected) {
                                                                    setSelectedSchools(prev => prev.filter(s => !cat.schools.includes(s)));
                                                                } else {
                                                                    setSelectedSchools(prev => Array.from(new Set([...prev, ...cat.schools])));
                                                                }
                                                            }}
                                                        >
                                                            {isPartial && <IconMinus className="w-4 h-4 text-white" />}
                                                            {isAllSelected && <IconCircleCheck className="w-4 h-4 text-white" />}
                                                        </div>
                                                        <span className="text-[#4B5563] font-medium text-base">{cat.name}</span>
                                                    </div>
                                                    <IconCaretDown className={`w-5 h-5 text-[#9CA3AF] transition-transform ${expandedCats.includes(cat.id) ? '' : '-rotate-90'}`} />
                                                </div>

                                                {expandedCats.includes(cat.id) && (
                                                    <div className="ml-12 mt-1 space-y-1">
                                                        {cat.schools.map(school => (
                                                            <div
                                                                key={school}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer rounded-lg"
                                                                onClick={() => {
                                                                    setSelectedSchools(prev => prev.includes(school) ? prev.filter(s => s !== school) : [...prev, school]);
                                                                }}
                                                            >
                                                                <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${selectedSchools.includes(school) ? 'bg-[#A80689] border-[#A80689]' : 'border-[#6B7280]'}`}>
                                                                    {selectedSchools.includes(school) && <IconCircleCheck className="w-4 h-4 text-white" />}
                                                                </div>
                                                                <span className="text-[#4B5563] text-base">{school}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                </div>
            </div>

            <div className="panel p-0 border-[#E5E7EB] shadow-sm overflow-hidden rounded-xl">
                <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <table className="w-full border-collapse table-auto min-w-[1100px]">
                        <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                            <tr>
                                <th className="py-5 px-6 text-center text-[#111827] font-semibold text-[15px] whitespace-nowrap">นักศึกษา</th>
                                <th className="py-5 px-6 text-center text-[#111827] font-semibold text-[15px] whitespace-nowrap">สถานะวันนี้</th>
                                <th className="py-5 px-6 text-center text-[#111827] font-semibold text-[15px] whitespace-nowrap">สถิติการมาฝึกงาน</th>
                                <th className="py-5 px-6 text-center text-[#111827] font-semibold text-[15px] whitespace-nowrap">ชั่วโมงทำงาน</th>
                                <th className="py-5 px-6 text-center text-[#111827] font-semibold text-[15px] whitespace-nowrap">ผลการพิจารณา</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {records.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6 text-left">
                                        <div className="flex items-center gap-4">
                                            <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover border border-[#E5E7EB] shrink-0" 
                                                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${student.name}&background=random` }} 
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#111827] text-[17px] whitespace-nowrap">{student.name}</span>
                                                <span className="text-[14px] text-[#9ca3af] whitespace-nowrap font-medium">{student.role}</span>
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
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex justify-center gap-2">
                                            {/* มา */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-12 h-12 flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-lg">
                                                    <span className="text-[18px] font-bold text-[#079455] leading-none">{student.attendance.present}</span>
                                                    <span className="text-[11px] text-[#61646C] font-medium mt-0.5">มา</span>
                                                </div>
                                            </div>
                                            {/* สาย */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-12 h-12 flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-lg">
                                                    <span className="text-[18px] font-bold text-[#E2A727] leading-none">{student.attendance.late}</span>
                                                    <span className="text-[11px] text-[#61646C] font-medium mt-0.5">สาย</span>
                                                </div>
                                            </div>
                                            {/* ลา */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-12 h-12 flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-lg">
                                                    <span className="text-[18px] font-bold text-[#0FA3ED] leading-none">{student.attendance.leave}</span>
                                                    <span className="text-[11px] text-[#61646C] font-medium mt-0.5">ลา</span>
                                                </div>
                                            </div>
                                            {/* ขาด */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-12 h-12 flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-lg">
                                                    <span className="text-[18px] font-bold text-[#D92D20] leading-none">{student.attendance.absent}</span>
                                                    <span className="text-[11px] text-[#61646C] font-medium mt-0.5">ขาด</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto">
                                            <div className="flex items-center justify-end px-1 mb-1">
                                                <span className="text-[15px] text-[#9ca3af] font-medium uppercase tracking-wider">
                                                    <b className="text-[#a80689] text-[18px]">{student.progress.current}</b>
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
                                                <div className={`w-5 h-5 flex items-center justify-center rounded-full ${
                                                    student.statusType === 'ended' ? 'bg-[#ef4444]' : 
                                                    student.statusType === 'last-day' ? 'bg-[#f97316]' : 'bg-[#9ca3af]'
                                                } text-white`}>
                                                    <IconClock className="w-3 h-3" />
                                                </div>
                                                <span className={`text-[13px] font-medium ${
                                                    student.statusType === 'ended' ? 'text-[#ef4444]' : 
                                                    student.statusType === 'last-day' ? 'text-[#f97316]' : 'text-[#6b7280]'
                                                }`}>
                                                    {student.statusMessage}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex flex-col items-center justify-center w-full min-h-[40px]">
                                            <span className={`font-semibold text-[15px] whitespace-nowrap ${
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
                <button className="flex items-center gap-2.5 text-[#A80689] font-bold text-[16px] hover:opacity-80 transition-all group">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#A80689]/5 group-hover:bg-[#A80689]/10 transition-colors">
                        <IconExport className="w-6 h-6 stroke-[2.5px]" />
                    </div>
                    ส่งออกตาราง
                </button>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50 disabled:opacity-30 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    
                    <button onClick={() => setPage(1)} className={`w-10 h-10 flex items-center justify-center rounded-lg text-[15px] font-bold transition-all ${page === 1 ? 'bg-[#F1F5F9] text-[#1e293b]' : 'text-[#64748b] hover:bg-gray-50'}`}>1</button>
                    <button onClick={() => setPage(2)} className={`w-10 h-10 flex items-center justify-center rounded-lg text-[15px] font-bold transition-all ${page === 2 ? 'bg-[#F1F5F9] text-[#1e293b]' : 'text-[#64748b] hover:bg-gray-50'}`}>2</button>
                    <div className="w-10 h-10 flex items-center justify-center text-[#94a3b8] font-bold">...</div>
                    <button className="w-10 h-10 flex items-center justify-center rounded-lg text-[15px] font-bold text-[#64748b] hover:bg-gray-50">9</button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-lg text-[15px] font-bold text-[#64748b] hover:bg-gray-50">10</button>

                    <button
                        onClick={() => setPage(page + 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentsPage;
