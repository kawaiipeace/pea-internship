"use client";
import React, { useState, Fragment } from 'react';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconClock from '@/components/icon/icon-clock';
import IconFile from '@/components/icon/icon-file';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconShare from '@/components/icon/icon-share';
import { Transition, Dialog } from '@headlessui/react';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCamera from '@/components/icon/icon-camera';
import IconX from '@/components/icon/icon-x';
import IconArchive from '@/components/icon/icon-archive';
import EditTimeForm from '@/components/history/edit-time-form';
import IconCalendar from '@/components/icon/icon-calendar';
import MonthPicker from '@/components/history/month-picker';
import { useRouter } from 'next/navigation';


const AttendanceHistoryPage = () => {
    const router = useRouter();

    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);

    // Thai month names
    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear() + 543);

    const handleMonthSelect = (month: number, year: number) => {
        setCurrentMonth(month);
        setCurrentYear(year);
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Dummy Data
    const summaryData = [
        { title: 'เข้างานปกติ', days: 14, icon: <IconCircleCheck className="w-7 h-7 text-[#10b981]" />, bgColor: 'bg-[#e7faef]', textColor: 'text-[#10b981]' },
        { title: 'สาย', days: 1, icon: <IconClock className="w-7 h-7 text-[#f59e0b]" />, bgColor: 'bg-[#fdf4d6]', textColor: 'text-[#f59e0b]' },
        { title: 'ลา', days: 4, icon: <IconFile className="w-7 h-7 text-[#3b82f6]" />, bgColor: 'bg-[#eef8ff]', textColor: 'text-[#3b82f6]' },
        { title: 'ขาด', days: 1, icon: <IconXCircle className="w-7 h-7 text-[#ef4444]" />, bgColor: 'bg-[#fceded]', textColor: 'text-[#ef4444]' },
    ];

    const historyData = [
        {
            date: '15', month: 'ม.ค.', labelMobile: '15 มกราคม', time: 'เวลาทำงาน 08:30 - --:--', status: 'ไม่ลงเวลาออก', statusType: 'default',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            checkInTime: '08:30',
            checkOutTime: '--:--',
            workingHours: '-',
            evidence: 'ลงชื่อเข้างาน.jpg',
            evidenceSize: '(57KB)'
        },
        {
            date: '14', month: 'ม.ค.', labelMobile: '14 มกราคม', time: 'เวลาทำงาน 10:00 - 16:30', status: 'สาย', statusType: 'warning',
            isLate: true,
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            checkInTime: '10:00',
            checkOutTime: '16:30',
            workingHours: '7 ชั่วโมง (ขอเวลาเพิ่ม)',
            evidence: 'ลงชื่อเข้างาน.jpg',
            evidenceSize: '(57KB)'
        },
        {
            date: '13', month: 'ม.ค.', labelMobile: '13 มกราคม', time: 'เวลาทำงาน --:--', status: 'ลา', statusType: 'info',
            isLeave: true,
            statusText: 'รออนุมัติการลา',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาเต็มวัน',
            leaveType: 'ลากิจ',
            evidence: 'ลากิจ.jpg',
            evidenceSize: '(2MB)',
            leaveReason: 'เข้าร่วมประชุมกับทางมหาวิทยาลัย ขาดไม่ได้'
        },
        {
            date: '12', month: 'ม.ค.', labelMobile: '12 มกราคม', time: 'เวลาทำงาน --:--', status: 'ลา', statusType: 'info',
            isLeave: true,
            statusText: 'รออนุมัติการลา',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาเต็มวัน',
            leaveType: 'ลากิจ',
            evidence: 'ลากิจ.jpg',
            evidenceSize: '(2MB)',
            leaveReason: 'เข้าร่วมประชุมกับทางมหาวิทยาลัย ขาดไม่ได้'
        },
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
        } else if (type === 'default') {
            icon = (
                <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center mr-1 text-white">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                    </svg>
                </div>
            );
            colorClass = 'px-3 py-1 bg-[#F3F4F6] dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-full flex items-center text-xs font-semibold';
        }

        return (
            <div className={colorClass}>
                {icon}
                {status}
            </div>
        );
    };

    return (
        <div className="-m-6 p-[22px] sm:p-6 text-black dark:text-white-light bg-[#fffbf7] dark:bg-black min-h-screen">
            {/* Header Section */}
            <div className="flex flex-row items-start justify-between gap-2 sm:gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold mb-1 text-black dark:text-white">ประวัติการลงเวลา</h1>
                    <p className="text-gray-500 text-xs sm:text-sm">รายงานการลงเวลาปฏิบัติงาน ประจำเดือน</p>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 sm:px-3 sm:py-1.5 shrink-0 shadow-sm">
                    <button type="button" onClick={handlePrevMonth} className="text-gray-700 dark:text-gray-300 hover:text-primary p-0.5 sm:p-1">
                        <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <MonthPicker currentMonth={currentMonth} currentYear={currentYear} onSelect={handleMonthSelect} />
                    <button type="button" onClick={handleNextMonth} className="text-gray-700 dark:text-gray-300 hover:text-primary p-0.5 sm:p-1">
                        <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>

            {/* Summary Section */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[17px] font-bold text-[#b40e56]">สรุปการลงเวลา ({thaiMonthsFull[currentMonth]})</h2>
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
                            <div
                                key={index}
                                onClick={() => {
                                    if (item.isLeave || item.isLate || item.statusType === 'default') {
                                        setSelectedHistoryItem(item);
                                        setIsDetailModalOpen(true);
                                    }
                                }}
                                className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#121212] shadow-sm animate-[fadeIn_0.3s_ease-in-out] ${(item.isLeave || item.isLate || item.statusType === 'default') ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-[1.01]' : ''}`}
                            >
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

                {/* Detail Modal */}
                <Transition appear show={isDetailModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-[999]" open={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setIsEditingTime(false); }}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" />
                        </Transition.Child>
                        <div className="fixed inset-0 overflow-y-auto">
                            <div className={`flex min-h-full justify-center p-0 sm:p-4 text-center ${isEditingTime ? 'items-stretch sm:items-center' : 'items-end sm:items-center'}`}>
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
                                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                    leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
                                >
                                    <Dialog.Panel as="div" className={`w-full max-w-lg transform overflow-hidden text-left align-middle shadow-xl transition-all overflow-y-auto ${
                                        isEditingTime 
                                            ? 'rounded-none sm:rounded-2xl bg-[#FFFCF6] dark:bg-[#1A1A1A] p-6 min-h-screen sm:min-h-0 sm:h-auto sm:max-h-[85vh]' 
                                            : 'rounded-t-[25px] sm:rounded-2xl bg-[#ffffff] dark:bg-[#1A1A1A] p-6 h-[606px] sm:h-auto max-h-[85vh]'
                                    }`}>

                                        {/* Drawer Handle for mobile (hide when editing) */}
                                        {!isEditingTime && (
                                            <div className="flex justify-center mb-4 sm:hidden">
                                                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                            </div>
                                        )}

                                        {/* Close button for desktop */}
                                        <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 hidden sm:block" onClick={() => setIsDetailModalOpen(false)}>
                                            <IconX className="w-5 h-5" />
                                        </button>

                                        {selectedHistoryItem && (
                                            <div className="space-y-4 text-black dark:text-white-light">
                                                {isEditingTime ? (
                                                    <EditTimeForm selectedHistoryItem={selectedHistoryItem} setIsEditingTime={setIsEditingTime} />
                                                ) : (
                                                    <>
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedHistoryItem.labelMobile}</div>
                                                    {selectedHistoryItem.isLeave && (
                                                        <div className="px-3 py-1 bg-[#F5F5F5] dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                                                            {selectedHistoryItem.statusText}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Main Title */}
                                                <div className="text-xl font-bold text-gray-900 dark:text-white pb-1">
                                                    {selectedHistoryItem.time}
                                                </div>

                                                {/* Tag */}
                                                {selectedHistoryItem.isLeave ? (
                                                    <div className="inline-flex items-center px-4 py-1 bg-[#eef8ff] dark:bg-blue-900/20 text-[#3b82f6] border border-[#3b82f6] rounded-full text-xs font-semibold gap-1.5 mt-1">
                                                        <IconFile className="w-3.5 h-3.5" />
                                                        {selectedHistoryItem.status}
                                                    </div>
                                                ) : selectedHistoryItem.statusType === 'default' ? (
                                                    <div className="inline-flex items-center px-4 py-1 bg-[#F3F4F6] text-gray-500 border border-gray-300 rounded-full text-xs font-semibold gap-1.5 mt-1">
                                                        <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-white">
                                                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" /></svg>
                                                        </div>
                                                        {selectedHistoryItem.status}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-4 py-1 bg-[#FFF9E6] text-[#D97706] border border-[#FDE68A] rounded-full text-xs font-semibold gap-1.5 mt-1">
                                                        <IconClock className="w-3.5 h-3.5 text-[#D97706]" />
                                                        {selectedHistoryItem.status}
                                                    </div>
                                                )}

                                                {/* Card 1: Details */}
                                                <div className="bg-[#FFFCF6] dark:bg-[#1C1710] border border-[#FDF2E2] dark:border-[#3A2A1A] rounded-2xl p-4 space-y-3 shadow-sm mt-4">
                                                    <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                        <IconMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                                        <div className="font-semibold text-[14px]">{selectedHistoryItem.location}</div>
                                                    </div>

                                                    {selectedHistoryItem.isLeave ? (
                                                        <>
                                                            <div>
                                                                <div className="text-xs text-gray-400 dark:text-gray-500">ระยะเวลาการลา :</div>
                                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-1">
                                                                    <IconClock className="w-4 h-4 text-gray-400" />
                                                                    <div className="font-semibold text-sm">{selectedHistoryItem.leaveDuration}</div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-400 dark:text-gray-500">ประเภทการลา :</div>
                                                                <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-[#EEF2FF] dark:bg-indigo-900/20 text-[#4F46E5] border border-[#C7D2FE] dark:border-indigo-800 rounded-full text-xs font-semibold mt-1">
                                                                    <IconArchive className="w-3.5 h-3.5" />
                                                                    {selectedHistoryItem.leaveType}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <div className="text-xs text-gray-400 dark:text-gray-500">เวลาเข้างาน :</div>
                                                                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{selectedHistoryItem.checkInTime}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-400 dark:text-gray-500">เวลาออกงาน :</div>
                                                                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{selectedHistoryItem.checkOutTime}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-400 dark:text-gray-500">ชั่วโมงที่เข้าทำงาน :</div>
                                                                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{selectedHistoryItem.workingHours}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card 2: Evidence & Reason */}
                                                <div className="bg-[#FFFCF8] dark:bg-[#1A1A1A] border border-[#FDF4E7] dark:border-[#333333] rounded-2xl p-4 space-y-4 shadow-sm">
                                                    <div>
                                                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                            <IconCamera className="w-4 h-4 text-gray-400" />
                                                            หลักฐานการลงชื่อเข้างาน
                                                        </div>
                                                        <div className="flex items-center justify-between bg-[#F8F9FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                                                        IMG
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                                    {selectedHistoryItem.evidence} <span className="text-gray-400 font-normal">{selectedHistoryItem.evidenceSize}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedHistoryItem.isLeave && (
                                                        <div>
                                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                                <IconFile className="w-4 h-4 text-gray-400" />
                                                                รายละเอียดการลา
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 pl-5">
                                                                {selectedHistoryItem.leaveReason}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Button for Late */}
                                                {!selectedHistoryItem.isLeave && (
                                                    <div className="flex justify-end mt-6">
                                                        <button 
                                                            type="button" 
                                                            // onClick={() => setIsEditingTime(true)}
                                                            className="px-6 py-2 bg-[#A80689] text-white rounded-full text-sm font-bold shadow-md hover:bg-[#A80689]/90 transition-colors"
                        //                                     onClick={() => {
                        //     router.push('/history/edit-time');
                        // }}
                        onClick={() => {
    localStorage.setItem(
        'editItem',
        JSON.stringify(selectedHistoryItem)
    );
    router.push('/history/edit-time');
}}
                                                        >
                                                            ส่งคำขอแก้ไขเวลา
                                                        </button>
                                                    </div>
                                                )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </div>
    );
};

export default AttendanceHistoryPage;
