'use client';
import React, { useState } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Thai } from 'flatpickr/dist/l10n/th.js';

const AttendanceHistoryPage = () => {
    // State for the selected month/year
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 0, 1)); // Default: Jan 2026

    // Shared mock data
    const attendanceRecords = [
        { id: 1, dateFull: '15 มกราคม', dateShort: '15', monthShort: 'ม.ค.', time: '08:30 - 16:30', status: 'เข้างานปกติ' },
        { id: 2, dateFull: '14 มกราคม', dateShort: '14', monthShort: 'ม.ค.', time: '08:30 - 16:30', status: 'สาย' },
        { id: 3, dateFull: '13 มกราคม', dateShort: '13', monthShort: 'ม.ค.', time: '08:30 - 16:30', status: 'ลากิจ' },
        { id: 4, dateFull: '12 มกราคม', dateShort: '12', monthShort: 'ม.ค.', time: '08:30 - 16:30', status: 'ลาป่วย' },
        { id: 5, dateFull: '11 มกราคม', dateShort: '11', monthShort: 'ม.ค.', time: '08:30 - 16:30', status: 'ขาด' },
        { id: 6, dateFull: '7 มกราคม', dateShort: '7', monthShort: 'ม.ค.', time: '08:30 - 16:30', status: 'ไม่ลงเวลาออก' },
    ];

    const getBadge = (status: string) => {
        switch (status) {
            case 'เข้างานปกติ':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-[#E8F9F1] border border-[#CDEEDB] text-[#169145] text-[13px] font-semibold w-fit">
                        <div className="bg-[#169145] text-white rounded-full w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        เข้างานปกติ
                    </div>
                );
            case 'สาย':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-[#FFF4E5] border border-[#FDE5CA] text-[#DF8B11] text-[13px] font-semibold w-fit">
                        <div className="bg-[#E68A00] text-white rounded-full w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        สาย
                    </div>
                );
            case 'ลากิจ':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-[#EAF4FF] border border-[#D3E8FF] text-[#2986FF] text-[13px] font-semibold w-fit">
                        <div className="bg-[#2986FF] text-white rounded-md w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-[10px] h-[10px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        ลากิจ
                    </div>
                );
            case 'ลาป่วย':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-[#EAF4FF] border border-[#D3E8FF] text-[#00AEEF] text-[13px] font-semibold w-fit">
                        <div className="bg-[#00AEEF] text-white rounded-full w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-[11px] h-[11px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        ลาป่วย
                    </div>
                );
            case 'ขาด':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-[#FCEAEA] border border-[#FAD0D0] text-[#DE3A3A] text-[13px] font-semibold w-fit">
                        <div className="bg-[#DE3A3A] text-white rounded-full w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        ขาด
                    </div>
                );
            case 'ไม่ลงเวลาออก':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-[5px] rounded-full bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B7280] text-[13px] font-semibold w-fit">
                        <div className="bg-[#9CA3AF] text-white rounded-[4px] w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-[10px] h-[10px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        ไม่ลงเวลาออก
                    </div>
                );
            default:
                return null;
        }
    };

    const SummaryCard = ({ title, value, type }: { title: string, value: string, type: string }) => {
        let bgColor = '';
        let iconBg = '';
        let icon = null;

        if (type === 'normal') {
            bgColor = 'bg-[#EAFAF3]';
            iconBg = 'bg-[#169145]'; // green
            icon = <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
        } else if (type === 'late') {
            bgColor = 'bg-[#FFF3E0]';
            iconBg = 'bg-[#E68A00]'; // orange
            icon = <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        } else if (type === 'leave') {
            bgColor = 'bg-[#EEF5FF]';
            iconBg = 'bg-[#2986FF]'; // blue
            icon = <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        } else if (type === 'absent') {
            bgColor = 'bg-[#FDF0F0]';
            iconBg = 'bg-[#DE3A3A]'; // red
            icon = <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
        }

        return (
            <div className={`px-5 py-4 rounded-[14px] flex items-center gap-3 w-[150px] md:w-auto md:flex-1 shrink-0 ${bgColor}`}>
                <div className={`w-8 h-8 rounded-full flex justify-center items-center text-white ${iconBg}`}>
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-[13px] text-gray-800 font-medium">{title}</span>
                    <span className="text-[15px] font-bold text-gray-900 mt-[2px]">{value}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#FCFAF5] p-5 md:p-8 font-sans w-full text-black">
            <div className="max-w-[1200px] mx-auto">
                {/* Header Area */}
                <div className="flex flex-row items-center md:items-start justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 mb-1 tracking-tight">ประวัติการลงเวลา</h1>
                        <p className="hidden md:block text-[14px] text-gray-500 font-medium">รายงานการลงเวลาปฏิบัติงาน ประจำเดือน</p>
                    </div>

                    {/* Month Selector */}
                    <div className="flex justify-end">
                        <div className="relative">
                            <Flatpickr
                                value={selectedDate}
                                options={{
                                    locale: Thai,
                                    dateFormat: 'M Y', // shows something like "ม.ค. 2026"
                                    plugins: [], // For a pure month picker, a plugin like monthSelectPlugin is often used, but we can stick to standard if needed.
                                    disableMobile: true,
                                }}
                                className="border border-gray-200 rounded-md px-3 py-1.5 bg-white text-sm font-medium w-[130px] shadow-sm text-gray-700 text-center cursor-pointer"
                                onChange={(date) => setSelectedDate(date[0])}
                            />
                            {/* Overlaying arrows to match original design */}
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 font-bold">&lsaquo;</span>
                            </div>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 font-bold">&rsaquo;</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="mb-8">
                    <h2 className="text-[#C51A67] font-bold mb-4 text-[15px]">สรุปการลงเวลา ({
                        ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][selectedDate.getMonth()]
                    })</h2>
                    <div className="flex gap-4 md:gap-5 overflow-x-auto w-full pb-2 snap-x no-scrollbar">
                        <SummaryCard title="เข้างานปกติ" value="14 วัน" type="normal" />
                        <SummaryCard title="สาย" value="1 วัน" type="late" />
                        <SummaryCard title="ลา" value="4 วัน" type="leave" />
                        <SummaryCard title="ขาด" value="1 วัน" type="absent" />
                    </div>
                    <p className="text-[13px] text-gray-400 font-medium mt-3">รายการลงเวลาทั้งหมด 20 วัน</p>
                </div>

                {/* List Section */}
                <div className="mb-4">
                    <h2 className="text-[#C51A67] font-bold mb-4 text-[15px]">รายการประวัติการลงเวลา</h2>
                    <div className="flex flex-col gap-3">
                        {attendanceRecords.map((record, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row border border-[#EAEAEA] rounded-[12px] overflow-hidden bg-white hover:shadow-sm transition-shadow">
                                {/* Desktop Date Box */}
                                <div className="hidden md:flex flex-col items-center justify-center w-[110px] shrink-0 border-r border-[#F0F0F0] bg-white py-4">
                                    <span className="text-[20px] font-bold text-gray-800 leading-none mb-1">{record.dateShort}</span>
                                    <span className="text-[13px] text-gray-500 font-medium">{record.monthShort}</span>
                                </div>

                                {/* Card Body */}
                                <div className="flex flex-col p-4 md:py-4 md:px-5 flex-1 justify-center relative">
                                    {/* Mobile Date Header */}
                                    <div className="md:hidden text-[13px] text-gray-500 mb-1.5 font-medium">
                                        {record.dateFull}
                                    </div>

                                    <div className="text-[15px] font-bold text-gray-900 mb-2.5">
                                        เวลาทำงาน {record.time}
                                    </div>

                                    <div>
                                        {getBadge(record.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Area: Export & Pagination */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4 mt-8 pb-8">
                    <button className="flex items-center gap-2 text-[#C51A67] font-bold text-[14px] w-fit transition hover:opacity-80">
                        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        ส่งออกตาราง
                    </button>

                    <div className="flex border border-[#E5E7EB] rounded-md overflow-hidden bg-white text-[13px] font-medium w-fit self-end md:self-auto shadow-sm">
                        <button className="px-3.5 py-1.5 border-r border-[#E5E7EB] text-gray-400 hover:bg-gray-50 transition-colors">&lsaquo;</button>
                        <button className="px-4 py-1.5 border-r border-[#E5E7EB] bg-gray-200 text-gray-800 transition-colors">1</button>
                        <button className="px-4 py-1.5 border-r border-[#E5E7EB] text-gray-500 hover:bg-gray-50 transition-colors">2</button>
                        <div className="px-3 py-1.5 border-r border-[#E5E7EB] text-gray-400">...</div>
                        <button className="px-4 py-1.5 border-r border-[#E5E7EB] text-gray-500 hover:bg-gray-50 transition-colors">9</button>
                        <button className="px-4 py-1.5 border-r border-[#E5E7EB] text-gray-500 hover:bg-gray-50 transition-colors">10</button>
                        <button className="px-3.5 py-1.5 text-gray-400 hover:bg-gray-50 transition-colors">&rsaquo;</button>
                    </div>
                </div>
            </div>

            {/* Custom style to hide scrollbar but keep functionality */}
            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default AttendanceHistoryPage;
