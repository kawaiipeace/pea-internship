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
            role: 'ออกแบบ UX/UI สำหรับ web application',
            university: 'มหาวิทยาลัยธรรมศาสตร์',
            status: 'ปกติ',
            avatar: '/assets/images/profile-1.jpeg',
            attendance: { present: 56, late: 4, leave: 3, absent: 2 },
            progress: { current: 420, total: 560, percent: 75 },
            daysLeft: 15,
        },
        {
            id: 2,
            name: 'สมหมาย สายเสมอ (มาย)',
            role: 'Frontend developer',
            university: 'มหาวิทยาลัยเกษตรศาสตร์',
            status: 'ลา',
            avatar: '/assets/images/profile-2.jpeg',
            attendance: { present: 54, late: 6, leave: 4, absent: 0 },
            progress: { current: 416, total: 560, percent: 74 },
            daysLeft: 15,
        },
        {
            id: 3,
            name: 'สมนึก คึกคะนอง (นิค)',
            role: 'Frontend developer',
            university: 'มหาวิทยาลัยเกษตรศาสตร์',
            status: 'ลา',
            avatar: '/assets/images/profile-3.jpeg',
            attendance: { present: 50, late: 2, leave: 4, absent: 8 },
            progress: { current: 358, total: 560, percent: 63 },
            daysLeft: 15,
        },
        {
            id: 4,
            name: 'สมชาย ลำฝัน (ชาย)',
            role: 'Frontend developer',
            university: 'โรงเรียนสวนกุหลาบ',
            status: 'ขาด',
            avatar: '/assets/images/profile-4.jpeg',
            attendance: { present: 16, late: 0, leave: 0, absent: 1 },
            progress: { current: 112, total: 140, percent: 80, finished: true },
            daysLeft: 2,
            needsCompensation: true,
        },
        {
            id: 5,
            name: 'สมศรี สตรีไทย (เฟิร์น)',
            role: 'Frontend developer',
            university: 'โรงเรียนหอวัง',
            status: 'สาย',
            avatar: '/assets/images/profile-5.jpeg',
            attendance: { present: 16, late: 1, leave: 0, absent: 0 },
            progress: { current: 140, total: 140, percent: 100, finished: true },
            daysLeft: 0,
            isFinished: true,
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
                    <div className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-[#F0FDF4] border border-[#86EFAC] w-max">
                        <div className="w-7 h-7 flex items-center justify-center bg-[#16A34A] text-white rounded-full shrink-0 shadow-sm">
                            <IconCircleCheck className="w-4 h-4" />
                        </div>
                        <span className="text-[#6B7280] font-medium text-[14px] whitespace-nowrap">เข้างานปกติ</span>
                    </div>
                );
            case 'ลา':
                return (
                    <div className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-[#F0F9FF] border border-[#7DD3FC] w-max">
                        <div className="w-7 h-7 flex items-center justify-center bg-[#0EA5E9] text-white rounded-full shrink-0 shadow-sm">
                            <IconFile className="w-4 h-4" />
                        </div>
                        <span className="text-[#6B7280] font-medium text-[14px] whitespace-nowrap">ลา</span>
                    </div>
                );
            case 'ขาด':
                return (
                    <div className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] w-max">
                        <div className="w-7 h-7 flex items-center justify-center bg-[#DC2626] text-white rounded-full shrink-0 shadow-sm">
                            <IconXCircle className="w-4 h-4" />
                        </div>
                        <span className="text-[#6B7280] font-medium text-[14px] whitespace-nowrap">ขาด</span>
                    </div>
                );
            case 'สาย':
                return (
                    <div className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-[#FEFCE8] border border-[#FDE047] w-max">
                        <div className="w-7 h-7 flex items-center justify-center bg-[#F59E0B] text-white rounded-full shrink-0 shadow-sm">
                            <IconClock className="w-4 h-4" />
                        </div>
                        <span className="text-[#6B7280] font-medium text-[14px] whitespace-nowrap">สาย</span>
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
                                <th className="py-5 px-6 text-left text-[#6B7280] font-semibold text-[15px] whitespace-nowrap">ชื่อนักศึกษา</th>
                                <th className="py-5 px-6 text-center text-[#6B7280] font-semibold text-[15px] whitespace-nowrap">สถานะในวันนี้</th>
                                <th className="py-5 px-6 text-center text-[#6B7280] font-semibold text-[15px] whitespace-nowrap">การมา (นับจากวันที่เริ่มฝึก)</th>
                                <th className="py-5 px-6 text-center text-[#6B7280] font-semibold text-[15px] whitespace-nowrap">ความก้าวหน้า (ชั่วโมง)</th>
                                <th className="py-5 px-6 text-center text-[#6B7280] font-semibold text-[15px] whitespace-nowrap">วันฝึกที่เหลือ</th>
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
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-[#111827] text-[16px] whitespace-nowrap">{student.name}</span>
                                                <span className="text-[13px] text-[#6B7280] whitespace-nowrap">{student.role}</span>
                                                <span className="text-[13px] text-[#9CA3AF] font-medium whitespace-nowrap">{student.university}</span>
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
                                                <div className="w-12 h-12 flex flex-col items-center justify-center border-2 border-[#10B981] bg-[#10B981]/5 rounded-lg">
                                                    <span className="text-[17px] font-bold text-[#10B981] leading-none">{student.attendance.present}</span>
                                                </div>
                                                <span className="text-[12px] text-[#6B7280] font-medium px-1">มา</span>
                                            </div>
                                            {/* สาย */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`w-12 h-12 flex flex-col items-center justify-center border-2 bg-white rounded-lg transition-colors ${student.attendance.late > 0 ? 'border-[#F79009] bg-[#F79009]/5' : 'border-[#E5E7EB]'}`}>
                                                    <span className={`text-[17px] font-bold leading-none ${student.attendance.late > 0 ? 'text-[#F79009]' : 'text-[#9CA3AF]'}`}>{student.attendance.late}</span>
                                                </div>
                                                <span className="text-[12px] text-[#6B7280] font-medium px-1">สาย</span>
                                            </div>
                                            {/* ลา */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-12 h-12 flex flex-col items-center justify-center border-2 border-[#E5E7EB] bg-white rounded-lg">
                                                    <span className="text-[17px] font-bold text-[#9CA3AF] leading-none">{student.attendance.leave}</span>
                                                </div>
                                                <span className="text-[12px] text-[#6B7280] font-medium px-1">ลา</span>
                                            </div>
                                            {/* ขาด */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`w-12 h-12 flex flex-col items-center justify-center border-2 bg-white rounded-lg transition-colors ${student.attendance.absent > 0 ? 'border-[#F04438] bg-[#F04438]/5' : 'border-[#E5E7EB]'}`}>
                                                    <span className={`text-[17px] font-bold leading-none ${student.attendance.absent > 0 ? 'text-[#F04438]' : 'text-[#9CA3AF]'}`}>{student.attendance.absent}</span>
                                                </div>
                                                <span className="text-[12px] text-[#6B7280] font-medium px-1">ขาด</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex flex-col gap-2 w-full max-w-[240px] mx-auto">
                                            <div className="flex flex-col gap-1.5 w-full">
                                                <div className="flex items-center justify-between px-1">
                                                    <span className="text-[12px] font-bold text-[#6B7280] whitespace-nowrap">{student.progress.current} / {student.progress.total} ชั่วโมง</span>
                                                    <span className="text-[12px] font-bold text-[#6B7280] whitespace-nowrap">{student.progress.percent} %</span>
                                                </div>
                                                <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden shrink-0 border border-[#E5E7EB]/50">
                                                    <div 
                                                        className="h-full bg-[#FDBAF0] rounded-full transition-all duration-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                                                        style={{ width: `${student.progress.percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {student.progress.finished && (
                                                <div className="w-full h-9 mt-1 bg-[#A80689] rounded-xl flex items-center justify-center text-white text-[14px] font-bold shadow-lg shadow-[#A80689]/20 hover:opacity-90 transition-all cursor-pointer whitespace-nowrap">
                                                    การผ่านฝึกงาน
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex flex-col items-center justify-center w-full">
                                            {student.isFinished ? (
                                                <span className="text-[#F04438] font-bold text-[16px] whitespace-nowrap">สิ้นสุดวันฝึกแล้ว</span>
                                            ) : student.needsCompensation ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[#F04438] font-bold text-[20px] whitespace-nowrap">{student.daysLeft} วัน</span>
                                                    <button className="px-5 py-2 border-2 border-[#A80689] text-[#A80689] rounded-xl text-[13px] font-bold hover:bg-[#A80689] hover:text-white transition-all shadow-sm whitespace-nowrap">
                                                        ชดเชยวันทำงาน
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[#4B5563] font-bold text-[16px] whitespace-nowrap">{student.daysLeft} วัน</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-6 pb-10 gap-6">
                <button className="flex items-center justify-center sm:justify-start gap-2 text-[#A80689] font-bold text-[15px] hover:opacity-80 transition-opacity w-full sm:w-auto py-3 sm:py-0 border border-[#A80689]/20 sm:border-none rounded-xl sm:rounded-none bg-[#A80689]/5 sm:bg-transparent">
                    <IconExport className="w-5 h-5 stroke-[2.5px]" />
                    ส่งออกตาราง
                </button>

                <div className="flex flex-row items-center justify-center w-full sm:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="flex items-center justify-center w-10 h-10 bg-white border border-[#E5E7EB] rounded-l-lg text-[#4B5563] hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    {Array.from({ length: Math.ceil(filteredItems.length / pageSize) || 1 }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`flex items-center justify-center w-10 h-10 border-y border-r border-[#E5E7EB] text-[14px] font-medium transition-colors focus:z-10 cursor-pointer ${
                                page === p
                                    ? 'bg-[#F8FAFC] text-[#111827]'
                                    : 'bg-white text-[#4B5563] hover:bg-gray-50'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(Math.min(Math.ceil(filteredItems.length / pageSize) || 1, page + 1))}
                        disabled={page === (Math.ceil(filteredItems.length / pageSize) || 1)}
                        className="flex items-center justify-center w-10 h-10 bg-white border-y border-r border-[#E5E7EB] rounded-r-lg text-[#4B5563] hover:bg-gray-50 focus:z-10 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentsPage;
