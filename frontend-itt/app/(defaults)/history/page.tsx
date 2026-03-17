"use client";
import React, { useState } from 'react';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconClock from '@/components/icon/icon-clock';
import IconFile from '@/components/icon/icon-file';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconShare from '@/components/icon/icon-share';

const AttendanceHistoryPage = () => {
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

    // Dummy Data
    const summaryData = [
        { title: 'เข้างานปกติ', days: 14, icon: <IconCircleCheck className="w-7 h-7 text-[#10b981]" />, bgColor: 'bg-[#e7faef]', textColor: 'text-[#10b981]' },
        { title: 'สาย', days: 1, icon: <IconClock className="w-7 h-7 text-[#f59e0b]" />, bgColor: 'bg-[#fdf4d6]', textColor: 'text-[#f59e0b]' },
        { title: 'ลา', days: 4, icon: <IconFile className="w-7 h-7 text-[#3b82f6]" />, bgColor: 'bg-[#eef8ff]', textColor: 'text-[#3b82f6]' },
        { title: 'ขาด', days: 1, icon: <IconXCircle className="w-7 h-7 text-[#ef4444]" />, bgColor: 'bg-[#fceded]', textColor: 'text-[#ef4444]' },
    ];

    const historyData = [
        { date: '15', month: 'ม.ค.', labelMobile: '15 มกราคม', time: 'เวลาทำงาน 08:30 - 16:30', status: 'เข้างานปกติ', statusType: 'success' },
        { date: '14', month: 'ม.ค.', labelMobile: '14 มกราคม', time: 'เวลาทำงาน 08:30 - 16:30', status: 'สาย', statusType: 'warning' },
        { date: '13', month: 'ม.ค.', labelMobile: '13 มกราคม', time: 'เวลาทำงาน 08:30 - 16:30', status: 'ลา', statusType: 'info' },
        { date: '12', month: 'ม.ค.', labelMobile: '12 มกราคม', time: 'เวลาทำงาน 08:30 - 16:30', status: 'ลา', statusType: 'info' },
        { date: '11', month: 'ม.ค.', labelMobile: '11 มกราคม', time: 'เวลาทำงาน 08:30 - 16:30', status: 'ขาด', statusType: 'danger' },
    ];

    const filteredHistoryData = selectedFilter 
        ? historyData.filter(item => item.status === selectedFilter)
        : historyData;

    const getStatusBadge = (type: string, status: string) => {
        let icon = null;
        let colorClass = '';
        if (type === 'success') {
            icon = <IconCircleCheck className="w-3.5 h-3.5 mr-1 text-[#10b981]" />;
            colorClass = 'px-3 py-1 bg-[#ebfbf3] text-[#10b981] border border-[#10b981] rounded-full flex items-center text-xs font-semibold';
        } else if (type === 'warning') {
            icon = <IconClock className="w-3.5 h-3.5 mr-1 text-[#f59e0b]" />;
            colorClass = 'px-3 py-1 bg-[#fef4d4] text-[#f59e0b] border border-[#f59e0b] rounded-full flex items-center text-xs font-semibold';
        } else if (type === 'info') {
            icon = <IconFile className="w-3.5 h-3.5 mr-1 text-[#3b82f6]" />;
            colorClass = 'px-3 py-1 bg-[#e5f5ff] text-[#3b82f6] border border-[#3b82f6] rounded-full flex items-center text-xs font-semibold';
        } else if (type === 'danger') {
            icon = <IconXCircle className="w-3.5 h-3.5 mr-1 text-[#ef4444]" />;
            colorClass = 'px-3 py-1 bg-[#ffeaeb] text-[#ef4444] border border-[#ef4444] rounded-full flex items-center text-xs font-semibold';
        }

        return (
            <div className={colorClass}>
                {icon}
                {status}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 text-black dark:text-white-light bg-[#fffbf7] dark:bg-black min-h-screen">
            {/* Header Section */}
            <div className="flex flex-row items-start justify-between gap-2 sm:gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold mb-1 text-black dark:text-white">ประวัติการลงเวลา</h1>
                    <p className="text-gray-500 text-xs sm:text-sm">รายงานการลงเวลาปฏิบัติงาน ประจำเดือน</p>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 sm:px-3 sm:py-1.5 shrink-0 shadow-sm">
                    <button type="button" className="text-gray-700 dark:text-gray-300 hover:text-primary p-0.5 sm:p-1">
                        <IconArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="font-semibold mx-2 sm:mx-4 text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">ม.ค. 2569</span>
                    <button type="button" className="text-gray-700 dark:text-gray-300 hover:text-primary rotate-180 p-0.5 sm:p-1">
                        <IconArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>

            {/* Summary Section */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[17px] font-bold text-[#b40e56]">สรุปการลงเวลา (มกราคม)</h2>
                    {selectedFilter && (
                        <button 
                            onClick={() => setSelectedFilter(null)} 
                            className="text-sm text-blue-500 hover:underline"
                        >
                            แสดงทั้งหมด
                        </button>
                    )}
                </div>
                <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {summaryData.map((item, index) => {
                        const isSelected = selectedFilter === item.title;
                        const borderColorClass = item.textColor.replace('text-', 'border-'); 
                        
                        return (
                            <button 
                                key={index} 
                                type="button"
                                onClick={() => setSelectedFilter(isSelected ? null : item.title)}
                                className={`panel ${item.bgColor} flex flex-col sm:flex-row justify-between sm:justify-start items-start sm:items-center p-3 sm:p-5 rounded-xl shadow-none dark:bg-opacity-20 shrink-0 w-[100px] h-[120px] sm:w-[200px] sm:h-[90px] lg:w-auto text-left transition-all ${isSelected ? `border-2 ${borderColorClass}` : 'border-2 border-transparent hover:-translate-y-1'}`}
                            >
                                <div className="flex-shrink-0 bg-white dark:bg-black sm:bg-transparent sm:dark:bg-transparent w-8 h-8 sm:w-auto sm:h-auto rounded-full sm:rounded-none flex items-center justify-center shadow-sm sm:shadow-none sm:mr-4">
                                    {React.cloneElement(item.icon, { className: 'w-5 h-5 sm:w-8 sm:h-8 ' + item.textColor })}
                                </div>
                                <div className="flex flex-col mt-2 sm:mt-0">
                                    <div className="font-bold text-gray-800 dark:text-gray-200 text-[11px] sm:text-sm mb-1 sm:mb-0.5">{item.title}</div>
                                    <div className="text-base sm:text-[22px] font-bold text-black dark:text-white leading-none">{item.days} วัน</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-6 mb-4">รายการลงเวลาทั้งหมด {historyData.length} วัน</p>
            </div>

            {/* History List Section */}
            <div>
                <h2 className="text-[17px] font-bold text-[#b40e56] mb-4">
                    รายการประวัติการลงเวลา {selectedFilter && <span className="text-sm font-normal text-gray-500 ml-2">(แสดงเฉพาะ: {selectedFilter})</span>}
                </h2>
                <div className="space-y-3 sm:space-y-4">
                    {filteredHistoryData.length > 0 ? (
                        filteredHistoryData.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#121212] shadow-sm animate-[fadeIn_0.3s_ease-in-out]">
                                {/* Desktop Date Badge */}
                                <div className="hidden sm:flex flex-col items-center justify-center bg-[#fcf2e3] dark:bg-orange-900/20 rounded-xl w-14 h-14 shrink-0 border border-[#f5e3cd] dark:border-none">
                                    <span className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-none mb-1">{item.date}</span>
                                    <span className="text-xs text-gray-800 dark:text-gray-300 font-semibold">{item.month}</span>
                                </div>

                                {/* Mobile Date Header */}
                                <div className="sm:hidden text-[13px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                    {item.labelMobile}
                                </div>

                                {/* Details Container */}
                                <div className="flex flex-col w-full gap-2 sm:gap-2 pl-0 sm:pl-1">
                                    <div className="font-bold text-[14px] sm:text-[15px] text-gray-800 dark:text-gray-200">{item.time}</div>
                                    <div className="inline-flex self-start">
                                        {getStatusBadge(item.statusType, item.status)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl mt-4">
                            ไม่พบข้อมูลสำหรับสถานะ "{selectedFilter}"
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Pagination & Export */}
            <div className="mt-6 sm:mt-8 flex flex-row items-center justify-between gap-4 pb-8">
                <button type="button" className="flex items-center gap-2 font-bold text-[15px] hover:opacity-80 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <IconShare className="w-5 h-5 sm:w-6 sm:h-6 text-[#b40e56] stroke-[2px]" />
                    <span className="hidden sm:inline">ส่งออกตาราง</span>
                    <span className="sm:hidden text-sm">ส่งออกตาราง</span>
                </button>

                <div className="inline-flex items-center border border-gray-200 dark:border-gray-700 rounded-full overflow-x-auto shadow-sm w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <button className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <button className="px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base text-gray-800 dark:text-gray-200 font-bold bg-[#dce0e5] dark:bg-gray-600 border-r border-gray-200 dark:border-gray-700 shrink-0">
                        1
                    </button>
                    <button className="px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 shrink-0">
                        2
                    </button>
                    <span className="px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base text-gray-600 dark:text-gray-400 font-bold bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 shrink-0">
                        ...
                    </span>
                    <button className="px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 shrink-0">
                        9
                    </button>
                    <button className="px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 shrink-0">
                        10
                    </button>
                    <button className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistoryPage;
