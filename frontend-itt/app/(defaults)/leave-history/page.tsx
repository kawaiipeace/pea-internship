"use client";
import React, { useState, Fragment } from 'react';
import Swal from 'sweetalert2';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconClock from '@/components/icon/icon-clock';
import IconFile from '@/components/icon/icon-file';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconShare from '@/components/icon/icon-share';
import { Transition, Dialog } from '@headlessui/react';
import IconMapPin from '@/components/icon/icon-map-pin';
import IconCamera from '@/components/icon/icon-camera';
import IconX from '@/components/icon/icon-x';
import IconArchive from '@/components/icon/icon-archive';
import IconPlusCircle from '@/components/icon/icon-plus-circle';
import IconTrash from '@/components/icon/icon-trash';
import EditTimeForm from '@/components/history/edit-time-form';
import MonthPicker from '@/components/history/month-picker';
import { useRouter } from 'next/navigation';

const LeaveHistoryPage = () => {
    const router = useRouter();

    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);

    // Thai month names
    const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const [currentMonth, setCurrentMonth] = useState(0); // Jan
    const [currentYear, setCurrentYear] = useState(2569);

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

    // Summary Data for Leave History
    const summaryData = [
        { title: 'ลาทั้งหมด', days: 4, icon: <IconFile />, bgColor: 'bg-[#E3F2FD] dark:bg-blue-900/20', textColor: 'text-[#03A9F4]', activeBorderClass: 'border-[#03A9F4]', hoverBorderClass: 'hover:border-[#03A9F4]' },
        { title: 'ลากิจ', days: 2, icon: <IconArchive />, bgColor: 'bg-[#E8EAF6] dark:bg-indigo-900/20', textColor: 'text-[#3F51B5]', activeBorderClass: 'border-[#3F51B5]', hoverBorderClass: 'hover:border-[#3F51B5]' },
        { title: 'ลาป่วย', days: 2, icon: <IconPlusCircle />, bgColor: 'bg-[#FCE4EC] dark:bg-rose-900/20', textColor: 'text-[#E91E63]', activeBorderClass: 'border-[#E91E63]', hoverBorderClass: 'hover:border-[#E91E63]' },
    ];

    const [historyData, setHistoryData] = useState([
        {
            id: 0,
            date: '1', month: 'ม.ค.', labelMobile: '1 มกราคม', time: 'ลางานเต็มวัน', status: 'ไม่อนุมัติการลา', statusType: 'danger',
            isLeave: true,
            statusText: 'ไม่อนุมัติการลา',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาเต็มวัน',
            leaveType: 'ลาป่วย',
            evidence: 'ลาป่วย.jpg',
            evidenceSize: '(1MB)',
            leaveReason: 'ไม่ผ่านการพิจารณา'
        },
        {
            id: 1,
            date: '13', month: 'ม.ค.', labelMobile: '13 มกราคม', time: 'ลางานเต็มวัน', status: 'อนุมัติการลา', statusType: 'success',
            isLeave: true,
            statusText: 'อนุมัติการลา',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาเต็มวัน',
            leaveType: 'ลากิจ',
            evidence: 'ลากิจ.jpg',
            evidenceSize: '(2MB)',
            leaveReason: 'ลาเพื่อทำกิจกรรมมหาวิทยาลัยแต่ระบบล่ม ทำให้ส่งคำขอไม่ได้'
        },
        {
            id: 2,
            date: '12', month: 'ม.ค.', labelMobile: '12 มกราคม', time: 'ลางานเต็มวัน', status: 'อนุมัติการลา', statusType: 'success',
            isLeave: true,
            statusText: 'อนุมัติการลา',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาเต็มวัน',
            leaveType: 'ลากิจ',
            evidence: 'ลากิจ.jpg',
            evidenceSize: '(2MB)',
            leaveReason: 'ทำธุระส่วนตัว'
        },
        {
            id: 3,
            date: '9', month: 'ม.ค.', labelMobile: '9 มกราคม', time: 'เวลาทำงาน 13:00 - 16:30', status: 'อนุมัติการลา', statusType: 'success',
            isLeave: true,
            statusText: 'อนุมัติการลา',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาป่วย 3.5 ชม.',
            leaveType: 'ลาป่วย',
            evidence: 'ใบรับรองแพทย์.jpg',
            evidenceSize: '(1.5MB)',
            leaveReason: 'ไปพบแพทย์'
        },
        {
            id: 4,
            date: '8', month: 'ม.ค.', labelMobile: '8 มกราคม', time: 'ลางานเต็มวัน', status: 'อนุมัติการลา', statusType: 'success',
            isLeave: true,
            statusText: 'อนุมัติการลา',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาเต็มวัน',
            leaveType: 'ลาป่วย',
            evidence: 'ลาป่วย.jpg',
            evidenceSize: '(105KB)',
            leaveReason: 'เกิดอุบัติเหตุ'
        },
        {
            id: 5,
            date: '14', month: 'ม.ค.', labelMobile: '14 มกราคม', time: 'ลางานเต็มวัน', status: 'รอการอนุมัติ', statusType: 'warning',
            isLeave: true,
            statusText: 'รอการอนุมัติ',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาเต็มวัน',
            leaveType: 'ลากิจ',
            evidence: 'ลากิจ.jpg',
            evidenceSize: '(2MB)',
            leaveReason: 'ทำธุระสำคัญ'
        },
        {
            id: 6,
            date: '15', month: 'ม.ค.', labelMobile: '15 มกราคม', time: 'ลางานเต็มวัน', status: 'รอการอนุมัติ', statusType: 'warning',
            isLeave: true,
            statusText: 'รอการอนุมัติ',
            location: 'การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)',
            leaveDuration: 'ลาเต็มวัน',
            leaveType: 'ลาป่วย',
            evidence: 'ลาป่วย.jpg',
            evidenceSize: '(1MB)',
            leaveReason: 'ไม่สบาย'
        }
    ]);

    const filteredHistoryData = selectedFilter
        ? historyData.filter(item => item.leaveType === selectedFilter || (selectedFilter === 'ลาทั้งหมด'))
        : historyData;

    const getStatusBadge = (type: string, status: string) => {
        let colorClass = '';
        if (type === 'success') {
            colorClass = 'w-[70px] h-[20px] bg-[#DCFAE6] text-[#085D3A] rounded-[15px] flex items-center justify-center text-[10px] font-bold whitespace-nowrap';
        } else if (type === 'warning') {
            colorClass = 'w-[70px] h-[20px] bg-[#F0F1F1] text-[#61646C] rounded-[15px] flex items-center justify-center text-[10px] font-bold whitespace-nowrap';
        } else if (type === 'info') {
            colorClass = 'w-[70px] h-[20px] bg-[#e5f5ff] text-[#3b82f6] rounded-[15px] flex items-center justify-center text-[10px] font-bold whitespace-nowrap';
        } else if (type === 'danger') {
            colorClass = 'w-[70px] h-[20px] bg-[#ffeaeb] text-[#ef4444] rounded-[15px] flex items-center justify-center text-[10px] font-bold whitespace-nowrap';
        } else {
            colorClass = 'w-[70px] h-[20px] bg-[#F3F4F6] text-gray-400 rounded-[15px] flex items-center justify-center text-[10px] font-bold whitespace-nowrap';
        }

        return (
            <div className={colorClass}>
                {status}
            </div>
        );
    };

    return (
        <div className="-m-6 p-[22px] sm:p-6 text-black dark:text-white-light bg-[#fffbf7] dark:bg-black min-h-screen">
            <div className="w-full sm:max-w-[840px] mx-auto min-h-[888px] sm:min-h-[813px] flex flex-col gap-[16px]">
                {/* Header Section */}
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 shrink-0 px-1 sm:px-0">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold mb-1 text-black dark:text-white whitespace-nowrap">ประวัติการลา</h1>
                        <p className="text-gray-500 text-xs sm:text-sm">รายงานการลาปฏิบัติงาน ประจำเดือน</p>
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
                <div className="shrink-0 flex flex-col gap-[16px]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[17px] font-bold text-[#B10073]">สรุปการลงเวลา ({thaiMonthsFull[currentMonth]})</h2>
                        {selectedFilter && (
                            <button
                                onClick={() => setSelectedFilter(null)}
                                className="text-sm text-blue-500 hover:underline"
                            >
                                แสดงทั้งหมด
                            </button>
                        )}
                    </div>
                    <div className="flex flex-row overflow-x-auto sm:overflow-visible gap-[13px] pt-1 w-full mx-auto sm:mx-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {summaryData.map((item, index) => {
                            const isSelected = selectedFilter === item.title || (selectedFilter === null && item.title === 'ลาทั้งหมด');

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setSelectedFilter(isSelected ? null : item.title)}
                                    className={`w-[107px] sm:w-auto flex-none sm:flex-1 ${item.bgColor} flex flex-col sm:flex-row justify-between sm:justify-start items-start sm:items-center p-3 sm:px-4 sm:py-5 rounded-[14px] shadow-none h-[120px] sm:h-[90px] text-left transition-all border-2 ${isSelected ? item.activeBorderClass : `border-transparent hover:-translate-y-1 ${item.hoverBorderClass}`}`}
                                >
                                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-full ${
                                        item.title === 'ลาทั้งหมด' ? 'bg-[#03A9F4]' : 
                                        item.title === 'ลากิจ' ? 'bg-[#3F51B5]' : 'bg-[#E91E63]'
                                    } sm:mr-4`}>
                                        {React.cloneElement(item.icon, { className: 'w-4 h-4 sm:w-6 sm:h-6 text-white stroke-[2px]' })}
                                    </div>
                                    <div className="flex flex-col mt-3 sm:mt-0">
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-[13px] sm:text-sm mb-1 sm:mb-0.5">{item.title}</div>
                                        <div className="text-[16px] sm:text-[22px] font-bold text-black dark:text-white leading-none">{item.days} วัน</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">รายการการลาทั้งหมด {historyData.length} วัน</p>
                </div>

                {/* History List Section */}
                <div className="shrink-0 flex flex-col gap-[16px]">
                    <div className="flex items-center justify-between mt-2 px-1 sm:px-0">
                        <h2 className="text-[17px] font-bold text-[#B10073]">
                            รายการประวัติการลา
                        </h2>
                        <button 
                            className="w-[130px] h-[35px] bg-[#A80689] text-white rounded-[10px] text-[13px] font-bold shadow-sm hover:bg-[#900b45] transition-colors flex items-center justify-center gap-1 shrink-0"
                            onClick={() => router.push('/leave-request')}
                        >
                            <span className="text-xl font-normal mb-0.5">+</span> ส่งคำขอการลา
                        </button>
                    </div>
                    <div className="flex flex-col gap-[14px]">
                        {filteredHistoryData.length > 0 ? (
                            filteredHistoryData.map((item, index) => (
                                <div
                                    key={index}
                                    className={`w-full max-w-[349px] sm:max-w-none h-[98px] sm:h-[80px] flex flex-col sm:flex-row sm:items-center gap-[6px] sm:gap-[14px] border border-[#CECFD2] dark:border-gray-700 rounded-[14px] px-3.5 py-2.5 sm:px-4 sm:py-2 bg-white dark:bg-[#121212] overflow-hidden animate-[fadeIn_0.3s_ease-in-out] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-[1.01] mx-auto sm:mx-0`}
                                    onClick={() => {
                                        setSelectedHistoryItem(item);
                                        setIsDetailModalOpen(true);
                                    }}
                                >
                                    {/* Mobile Responsive Layout */}
                                    <div className="sm:hidden flex flex-col w-full max-w-[317px] h-[74px] gap-[4px] relative">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[14px] font-bold text-gray-800">
                                                {item.date} {item.month.length > 3 ? item.month.substring(0, 3) + '.' : item.month} 2569
                                            </div>
                                            <div className="flex items-center gap-1.5 translate-y-[-2px]">
                                                {getStatusBadge(item.statusType, item.status)}
                                                {item.statusType === 'warning' && (
                                                    <button
                                                        type="button"
                                                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            Swal.fire({
                                                                title: 'ต้องการยกเลิกส่งคำขอลาหรือไม่',
                                                                icon: 'error',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'ตกลง',
                                                                cancelButtonText: 'ย้อนกลับ',
                                                                buttonsStyling: false,
                                                                reverseButtons: true,
                                                                customClass: {
                                                                    popup: 'rounded-[20px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
                                                                    title: 'text-[16px] font-bold text-black dark:text-white pt-3 pb-2 text-center whitespace-nowrap',
                                                                    actions: 'flex gap-3 w-full justify-center mt-3',
                                                                    confirmButton: 'bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold py-2.5 px-6 rounded-[12px] text-[15px] flex-1 text-center min-w-[100px]',
                                                                    cancelButton: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2.5 px-6 rounded-[12px] text-[15px] flex-1 text-center min-w-[100px]'
                                                                }
                                                            }).then((result) => {
                                                                if (result.isConfirmed) {
                                                                    setHistoryData(prev => prev.filter(h => h.id !== item.id));
                                                                    Swal.fire({
                                                                        title: 'ยกเลิกสำเร็จ!',
                                                                        icon: 'success',
                                                                        buttonsStyling: false,
                                                                        customClass: {
                                                                            popup: 'rounded-[20px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
                                                                            title: 'text-[16px] font-bold text-black dark:text-white pt-2 text-center whitespace-nowrap',
                                                                            htmlContainer: 'text-[14px] text-gray-500 text-center mb-4 mt-1',
                                                                            confirmButton: 'bg-[#11A75C] hover:bg-[#0E8F4D] text-white font-bold py-2.5 px-12 min-w-[150px] rounded-[12px] text-[15px] text-center'
                                                                        },
                                                                        confirmButtonText: 'ตกลง'
                                                                    });
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="font-bold text-[16px] text-[#1A1A1A] dark:text-gray-200">
                                            {item.leaveDuration === 'ลาเต็มวัน' ? 'ลางานเต็มวัน' : item.time}
                                        </div>

                                        <div className="inline-flex mt-0.5">
                                            {item.leaveType === 'ลากิจ' ? (
                                                <div className="inline-flex items-center px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] rounded-full text-[11px] font-bold gap-1">
                                                    <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0 bg-[#4F46E5]">
                                                        <IconArchive className="w-2h-2 text-white stroke-[2.5px]" />
                                                    </div>
                                                    {item.leaveType}
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center px-2 py-0.5 bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] rounded-full text-[11px] font-bold gap-1">
                                                    <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0 bg-[#E11D48]">
                                                        <IconPlusCircle className="w-2 h-2 text-white stroke-[2.5px]" />
                                                    </div>
                                                    {item.leaveType}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="hidden sm:flex items-center gap-[14px] w-full">
                                        {/* Desktop Date Badge */}
                                        <div className="flex flex-col items-center justify-center bg-[#fcf2e3] dark:bg-orange-900/20 rounded-xl w-14 h-14 shrink-0 border border-[#f5e3cd] dark:border-none">
                                            <span className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-none mb-1">{item.date}</span>
                                            <span className="text-xs text-gray-800 dark:text-gray-300 font-semibold">{item.month}</span>
                                        </div>

                                        {/* Details Container */}
                                        <div className="flex flex-col w-full gap-2 sm:gap-2 pl-0 sm:pl-1 flex-1">
                                            <div className="font-bold text-[14px] sm:text-[15px] text-gray-800 dark:text-gray-200">{item.time}</div>
                                            <div className="inline-flex self-start">
                                                {item.leaveType === 'ลากิจ' ? (
                                                    <div className="inline-flex items-center px-3 py-1 bg-[#eef2ff] text-[#4F46E5] border border-[#c7d2fe] rounded-full text-xs font-bold gap-1.5">
                                                        <IconArchive className="w-3.5 h-3.5" />
                                                        {item.leaveType}
                                                    </div>
                                                ) : item.leaveType === 'ลาป่วย' ? (
                                                    <div className="inline-flex items-center px-3 py-1 bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] rounded-full text-xs font-bold gap-1.5">
                                                        <IconPlusCircle className="w-3.5 h-3.5" />
                                                        {item.leaveType}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-3 py-1 bg-[#f0f9ff] text-[#0ea5e9] border border-[#bae6fd] rounded-full text-xs font-bold gap-1.5">
                                                        <IconFile className="w-3.5 h-3.5" />
                                                        {item.leaveType}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 ml-auto">
                                            {getStatusBadge(item.statusType, item.status)}
                                                {item.statusType === 'warning' && (
                                                    <button
                                                        type="button"
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            Swal.fire({
                                                                title: 'ต้องการยกเลิกส่งคำขอลาหรือไม่',
                                                                icon: 'error',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'ตกลง',
                                                                cancelButtonText: 'ย้อนกลับ',
                                                                buttonsStyling: false,
                                                                reverseButtons: true,
                                                                customClass: {
                                                                    popup: 'rounded-[20px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
                                                                    title: 'text-[16px] font-bold text-black dark:text-white pt-3 pb-2 text-center whitespace-nowrap',
                                                                    actions: 'flex gap-3 w-full justify-center mt-3',
                                                                    confirmButton: 'bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold py-2.5 px-6 rounded-[12px] text-[15px] flex-1 text-center min-w-[100px]',
                                                                    cancelButton: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2.5 px-6 rounded-[12px] text-[15px] flex-1 text-center min-w-[100px]'
                                                                }
                                                            }).then((result) => {
                                                                if (result.isConfirmed) {
                                                                    setHistoryData(prev => prev.filter(h => h.id !== item.id));
                                                                    Swal.fire({
                                                                        title: 'ยกเลิกสำเร็จ!',
                                                                        icon: 'success',
                                                                        buttonsStyling: false,
                                                                        customClass: {
                                                                            popup: 'rounded-[20px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
                                                                            title: 'text-[16px] font-bold text-black dark:text-white pt-2 text-center whitespace-nowrap',
                                                                            htmlContainer: 'text-[14px] text-gray-500 text-center mb-4 mt-1',
                                                                            confirmButton: 'bg-[#11A75C] hover:bg-[#0E8F4D] text-white font-bold py-2.5 px-12 min-w-[150px] rounded-[12px] text-[15px] text-center'
                                                                        },
                                                                        confirmButtonText: 'ตกลง'
                                                                    });
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        <IconTrash className="w-5 h-5" />
                                                    </button>
                                                )}
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
                <div className="flex flex-row items-center justify-between gap-4 shrink-0 pb-8 mt-auto pt-4">
                    <button type="button" className="flex items-center gap-2 font-bold text-[15px] hover:opacity-80 text-[#b40e56] whitespace-nowrap">
                        <IconShare className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2px]" />
                        <span className="hidden sm:inline">ส่งออกตาราง</span>
                        <span className="sm:hidden text-sm">ส่งออกตาราง</span>
                    </button>

                    <div className="inline-flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto shadow-sm w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                                <div className={`flex min-h-full justify-center p-0 sm:p-4 text-center items-end sm:items-center`}>
                                      <Transition.Child
                                        as={Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
                                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                        leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
                                      >
                                        <Dialog.Panel as="div" className={`w-full sm:max-w-[700px] transform overflow-hidden text-left align-middle shadow-xl transition-all overflow-y-auto rounded-t-[20px] sm:rounded-[20px] bg-[#ffffff] dark:bg-[#1A1A1A] p-5 sm:p-6 h-[606px] sm:h-[623px] max-h-[90vh] sm:max-h-none`}>

                                            {/* Drawer Handle for mobile */}
                                            <div className="flex justify-center mb-4 sm:hidden">
                                                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                            </div>

                                            {/* Close button for desktop */}
                                            <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 hidden sm:block" onClick={() => setIsDetailModalOpen(false)}>
                                                <IconX className="w-5 h-5" />
                                            </button>

                                            {selectedHistoryItem && (
                                                <div className="text-black dark:text-white-light h-full w-full flex flex-col items-center">
                                                    {/* Header */}
                                                    <div className="w-full sm:w-[636px] h-auto sm:h-[153px] flex flex-col pt-2">
                                                        <div className="flex items-center justify-between mt-2 mb-3">
                                                            <div className="text-[14px] font-bold text-gray-800 dark:text-gray-200">
                                                                {selectedHistoryItem.date} {selectedHistoryItem.month}
                                                            </div>
                                                            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                                selectedHistoryItem.statusType === 'success' ? 'bg-[#E6F4EA] text-[#0D652D]' :
                                                                selectedHistoryItem.statusType === 'danger' ? 'bg-[#FFE4E6] text-[#E11D48]' :
                                                                selectedHistoryItem.statusType === 'warning' ? 'bg-[#F0F1F1] text-[#61646C]' :
                                                                'bg-[#F3F4F6] text-gray-600'
                                                            }`}>
                                                                {selectedHistoryItem.status}
                                                            </div>
                                                        </div>

                                                        <div className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] dark:text-white mb-2">
                                                            {selectedHistoryItem.leaveDuration === 'ลาเต็มวัน' ? 'ลางานเต็มวัน' : selectedHistoryItem.time}
                                                        </div>

                                                        {/* Tag */}
                                                        <div>
                                                            <div className="inline-flex items-center px-2 py-1 bg-[#E0F2FE] text-[#0284C7] rounded-full text-[12px] font-bold gap-1 mt-0.5">
                                                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0284C7]">
                                                                    <IconFile className="w-3 h-3 text-white stroke-[2px]" />
                                                                </div>
                                                                {selectedHistoryItem.leaveType === 'ลากิจ' ? 'ลา' : selectedHistoryItem.leaveType}
                                                            </div>
                                                        </div>

                                                        {/* Divider */}
                                                        <hr className="w-full sm:w-[353px] h-[1px] bg-[#CECFD2] border-none mt-3 sm:mt-3 mb-1 self-start" />
                                                    </div>

                                                    {/* Card 1: Details */}
                                                    <div className="w-full sm:w-[636px] sm:h-[168px] bg-[#FEFBF6] dark:bg-[#1C1710] border-none rounded-[5px] px-5 py-5 mt-4 flex flex-col mx-auto space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <IconMapPin className="w-[18px] h-[18px] text-gray-800 dark:text-gray-300 stroke-[1.5px]" />
                                                            <div className="font-bold text-[14px] text-gray-800 dark:text-gray-100">อยู่นอกสถานที่</div>
                                                        </div>
                                                        
                                                        <div className="space-y-0.5">
                                                            <div className="text-[12px] font-bold text-gray-400">ระยะเวลาการลา :</div>
                                                            <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                                                                <IconClock className="w-[18px] h-[18px] stroke-[1.5px]" />
                                                                <div className="font-bold text-[14px]">{selectedHistoryItem.leaveDuration}</div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-0.5">
                                                            <div className="text-[12px] font-bold text-gray-400">ประเภทการลา :</div>
                                                            <div className="pt-0.5">
                                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${
                                                                    selectedHistoryItem.leaveType === 'ลากิจ' ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]' : 
                                                                    selectedHistoryItem.leaveType === 'ลาป่วย' ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]' :
                                                                    'bg-[#F0F9FF] text-[#0EA5E9] border border-[#BAE6FD]'
                                                                }`}>
                                                                    {selectedHistoryItem.leaveType === 'ลากิจ' ? (
                                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#4F46E5]">
                                                                            <IconArchive className="w-3 h-3 text-white" />
                                                                        </div>
                                                                    ) : selectedHistoryItem.leaveType === 'ลาป่วย' ? (
                                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#e11d48]">
                                                                            <IconPlusCircle className="w-3 h-3 text-white" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[#0ea5e9]">
                                                                            <IconFile className="w-3 h-3 text-white" />
                                                                        </div>
                                                                    )}
                                                                    <span className="pr-1">{selectedHistoryItem.leaveType}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card 2: Evidence & Reason */}
                                                    <div className="w-full sm:w-[636px] sm:h-[168px] bg-[#FEFBF6] dark:bg-[#1A1A1A] border-none rounded-[5px] px-5 py-5 mt-4 flex flex-col mx-auto space-y-2">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-2 text-[14px] font-bold text-gray-800 dark:text-gray-200">
                                                                <IconCamera className="w-[18px] h-[18px]" />
                                                                หลักฐานการลงชื่อเข้างาน
                                                            </div>
                                                            <div className="flex items-center bg-[#F1F5F9] dark:bg-gray-800 border border-gray-100 rounded-md px-2 py-1.5 gap-2 h-[44px]">
                                                                <div className="w-8 h-8 rounded-sm overflow-hidden flex items-center justify-center shrink-0 bg-gray-200">
                                                                    <img src="/assets/images/profile-34.jpeg" alt="thumbnail" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                                </div>
                                                                <div className="text-[13px] font-bold text-gray-600 dark:text-gray-400">
                                                                    ลากิจ.jpg <span className="font-normal text-gray-400">(2MB)</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5 mt-2">
                                                            <div className="flex items-center gap-2 text-[14px] font-bold text-gray-800 dark:text-gray-200">
                                                                <IconFile className="w-[18px] h-[18px]" />
                                                                รายละเอียดการลา
                                                            </div>
                                                            <div className="text-[13px] text-gray-600 font-medium pt-0.5">
                                                                    เข้าร่วมประชุมกับทางมหาวิทยาลัย ขาดไม่ได้
                                                            </div>
                                                        </div>
                                                    </div>
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
        </div>
    );
};

export default LeaveHistoryPage;
