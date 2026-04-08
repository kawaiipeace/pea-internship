"use client";

import React, { useState, Fragment, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '@/api/axios';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconClock from '@/components/icon/icon-clock';
import IconFile from '@/components/icon/icon-file';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconShare from '@/components/icon/icon-share';
import { Transition, Dialog } from '@headlessui/react';

import IconCamera from '@/components/icon/icon-camera';
import IconX from '@/components/icon/icon-x';
import IconArchive from '@/components/icon/icon-archive';
import IconPlusCircle from '@/components/icon/icon-plus-circle';
import IconTrash from '@/components/icon/icon-trash';
import IconFileText from '@/components/icon/icon-file-text';
import IconBriefcase from '@/components/icon/icon-briefcase';
import IconMedicalCross from '@/components/icon/icon-medical-cross';
import EditTimeForm from '@/components/history/edit-time-form';
import MonthPicker from '@/components/history/month-picker';
import { useRouter } from 'next/navigation';

const LeaveHistoryPage = () => {
    const router = useRouter();

    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);

    // Swipe to close state
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchTranslateY, setTouchTranslateY] = useState(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStart !== null) {
            const currentY = e.targetTouches[0].clientY;
            const diff = currentY - touchStart;
            if (diff > 0) {
                setTouchTranslateY(diff);
            }
        }
    };

    const handleTouchEnd = () => {
        if (touchTranslateY > 100) {
            setIsDetailModalOpen(false);
            setIsEditingTime(false);
        }
        setTouchStart(null);
        setTouchTranslateY(0);
    };

    // Thai month names
    const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    // Default to current date
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());
    const [currentYear, setCurrentYear] = useState(now.getFullYear() + 543);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState({ total: 0, absence: 0, sick: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRecords: 0 });
    const [historyData, setHistoryData] = useState<any[]>([]);

    const fetchLeaveHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const yearAD = currentYear - 543;
            const month = currentMonth + 1;
            
            let typeParam = undefined;
            if (selectedFilter === 'ลากิจ') typeParam = 'ABSENCE';
            if (selectedFilter === 'ลาป่วย') typeParam = 'SICK';

            const response = await axiosInstance.get('/leave/history', {
                params: {
                    month,
                    year: yearAD,
                    page: currentPage,
                    limit: 10,
                    type: typeParam
                }
            });

            const data = response.data;
            setHistoryData(data.records.map((r: any) => {
                const dateObj = new Date(r.leaveDate);
                return {
                    id: r.id,
                    date: dateObj.getDate().toString(),
                    month: thaiMonthsFull[dateObj.getMonth()],
                    monthShort: thaiMonthsShort[dateObj.getMonth()],
                    year: (dateObj.getFullYear() + 543).toString(),
                    labelMobile: `${dateObj.getDate()} ${thaiMonthsShort[dateObj.getMonth()]}`,
                    time: 'ลางานเต็มวัน',
                    status: mapStatusToText(r.status),
                    statusType: mapStatusToType(r.status),
                    isLeave: true,
                    location: 'PEA',
                    leaveDuration: 'ลาเต็มวัน',
                    leaveType: r.leaveType === 'ABSENCE' || r.leaveType === 'ลากิจ' ? 'ลากิจ' : 'ลาป่วย',
                    evidence: r.attachmentUrl ? r.attachmentUrl.split('/').pop() : '',
                    evidenceUrl: r.attachmentUrl,
                    leaveReason: r.reason || 'ไม่ระบุเหตุผล'
                };
            }));
            setSummary(data.summary);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching leave history:', error);
            // Swal.fire('Error', 'ไม่สามารถดึงข้อมูลประวัติการลาได้', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth, currentYear, selectedFilter, currentPage]);

    useEffect(() => {
        fetchLeaveHistory();
    }, [fetchLeaveHistory]);

    const mapStatusToText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'รออนุมัติการลา';
            case 'APPROVED': return 'อนุมัติการลา';
            case 'REJECTED': return 'ไม่อนุมัติการลา';
            default: return status;
        }
    };

    const mapStatusToType = (status: string) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            default: return 'warning';
        }
    };

    const handleViewFile = async (item: any) => {
        if (!item.evidenceUrl) return;

        try {
            Swal.fire({
                title: 'กำลังโหลดไฟล์...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Re-using the logic from current user request: file endpoint is /files/:key
            // The evidenceUrl is likely "/leave-documents/..."
            // We need to extract the key. If it starts with "/", remove it.
            const key = item.evidenceUrl.startsWith('/') ? item.evidenceUrl.substring(1) : item.evidenceUrl;
            
            const response = await axiosInstance.get(`/files/${encodeURIComponent(key)}`, {
                responseType: 'blob'
            });

            if (!response.data || response.data.size === 0) {
                throw new Error('ไม่พบข้อมูลไฟล์');
            }

            const blobUrl = URL.createObjectURL(response.data);
            
            // Open in new tab
            const newTab = window.open(blobUrl, '_blank');
            if (!newTab) {
                Swal.fire({
                    title: 'เปิดไฟล์ไม่สำเร็จ',
                    text: 'กรุณาอนุญาตให้เบราว์เซอร์เปิดหน้าต่างป็อปอัพ',
                    icon: 'warning',
                    confirmButtonText: 'ตกลง',
                    customClass: {
                        confirmButton: 'bg-[#A80689] text-white px-6 py-2 rounded-lg'
                    }
                });
            }
            
            Swal.close();
        } catch (error) {
            console.error('Error fetching file:', error);
            Swal.fire('Error', 'ไม่สามารถเปิดไฟล์ได้', 'error');
        }
    };

    const handleDeleteLeaveRequest = async (id: string) => {
        try {
            Swal.fire({
                title: 'กำลังยกเลิกคำขอ...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await axiosInstance.delete(`/leave/${id}`);

            setHistoryData(prev => prev.filter(h => h.id !== id));
            setIsDetailModalOpen(false);

            Swal.fire({
                title: 'ยกเลิกสำเร็จ!',
                icon: 'success',
                confirmButtonText: 'ตกลง',
                buttonsStyling: false,
                customClass: {
                    popup: 'rounded-[20px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
                    title: 'text-[16px] font-bold text-black dark:text-white pt-2 text-center whitespace-nowrap',
                    htmlContainer: 'text-[14px] text-gray-500 text-center mb-4 mt-1',
                    confirmButton: 'bg-[#11A75C] hover:bg-[#0E8F4D] text-white font-bold py-2.5 px-12 min-w-[150px] rounded-[12px] text-[15px] text-center'
                }
            });
            
            // Refresh summary and data
            fetchLeaveHistory();
        } catch (error: any) {
            console.error('Error deleting leave request:', error);
            const errorMessage = error.response?.data?.message || 'ไม่สามารถยกเลิกคำขอได้';
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'ตกลง',
                customClass: {
                    confirmButton: 'bg-[#A80689] text-white px-6 py-2 rounded-lg'
                }
            });
        }
    };

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

    // Summary Data for Leave History (Dynamic)
    const summaryCards = [
        { title: 'ลาทั้งหมด', days: summary.total, icon: 'lab_profile', bgColor: 'bg-[#E3F2FD] dark:bg-blue-900/20', textColor: 'text-[#03A9F4]', activeBorderClass: 'border-[#03A9F4]', hoverBorderClass: 'hover:border-[#03A9F4]' },
        { title: 'ลากิจ', days: summary.absence, icon: 'business_center', bgColor: 'bg-[#E2E4FF] dark:bg-indigo-900/20', textColor: 'text-[#3F51B5]', activeBorderClass: 'border-[#1A3CFF]', hoverBorderClass: 'hover:border-[#1A3CFF]' },
        { title: 'ลาป่วย', days: summary.sick, icon: 'health_cross', bgColor: 'bg-[#FFD7EF] dark:bg-rose-900/20', textColor: 'text-[#FF1A7D]', activeBorderClass: 'border-[#FF1A7D]', hoverBorderClass: 'hover:border-[#FF1A7D]' },
    ];


    const getStatusBadge = (type: string, status: string) => {
        let colorClass = "";

        if (type === "success" || status === "อนุมัติการลา") {
            colorClass = "px-3 py-1 bg-[#DCFAE6] text-[#067647] rounded-full text-[12px] whitespace-nowrap font-medium";
        } else if (type === "danger" || status === "ไม่อนุมัติการลา") {
            colorClass = "px-3 py-1 bg-[#FEE4E2] text-[#B42318] rounded-full text-[12px] whitespace-nowrap font-medium";
        } else {
            colorClass = "px-3 py-1 bg-[#F0F1F1] text-[#61646C] rounded-full text-[12px] whitespace-nowrap font-medium";
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
                        {summaryCards.map((item, index) => {
                            const isSelected = selectedFilter === item.title || (selectedFilter === null && item.title === 'ลาทั้งหมด');

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                        setSelectedFilter(isSelected ? null : item.title);
                                        setCurrentPage(1); // Reset to page 1 on filter change
                                    }}
                                    className={`w-[100px] sm:w-auto flex-none sm:flex-1 ${item.bgColor} flex flex-col sm:flex-row justify-between sm:justify-start items-center sm:items-center p-3 sm:px-4 sm:py-5 rounded-[12px] shadow-none h-[115px] sm:h-[90px] text-center sm:text-left transition-all border-2 ${isSelected ? item.activeBorderClass : `border-transparent hover:-translate-y-1 ${item.hoverBorderClass}`}`}
                                >
                                    <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full ${
                                        item.title === 'ลาทั้งหมด' ? 'bg-[#03A9F4]' : 
                                        item.title === 'ลากิจ' ? 'bg-[#1A3CFF]' : 'bg-[#FF1A7D]'
                                    } sm:mr-4`}>
                                        <span className={`material-symbols-rounded !text-[24px] sm:!text-[28px] text-white flex items-center justify-center leading-none translate-x-[0.5px] ${item.icon === 'close' ? 'translate-y-[0.5px]' : '-translate-y-[0.5px]'}`}>
                                            {item.icon}
                                        </span>
                                    </div>
                                    <div className="flex flex-col mt-2 sm:mt-0">
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-[13px] sm:text-[15px] mb-0.5 sm:mb-0.5 leading-tight">{item.title}</div>
                                        <div className="text-[15px] sm:text-[22px] font-bold text-black dark:text-white leading-none">{item.days} วัน</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">รายการการลาทั้งหมด {pagination.totalRecords} วัน</p>
                </div>

                {/* History List Section */}
                <div className="shrink-0 flex flex-col gap-[16px]">
                    <div className="flex items-center justify-between mt-2 px-1 sm:px-0">
                        <h2 className="text-[17px] font-bold text-[#B10073]">
                            รายการประวัติการลา
                        </h2>
                        <button 
                            className="w-[130px] h-[35px] bg-[#A80689] text-white rounded-[10px] text-[13px] font-bold shadow-sm hover:bg-[#900b45] transition-colors flex items-center justify-center gap-1 shrink-0"
                            onClick={() => router.push('/intern/leave-history/leave-form')}
                        >
                            <span className="text-xl font-normal mb-0.5">+</span> ส่งคำขอการลา
                        </button>
                    </div>
                    <div className="flex flex-col gap-[14px]">
                        {isLoading ? (
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-full h-[88px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-[14px]"></div>
                                ))}
                            </div>
                        ) : historyData.length > 0 ? (
                            historyData.map((item, index) => (
                                <div
                                    key={index}
                                    className={`relative w-full max-sm:min-h-0 sm:h-[88px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 border border-[#CECFD2] dark:border-gray-700 rounded-[14px] p-3 sm:px-4 sm:py-2 bg-white dark:bg-[#121212] overflow-hidden animate-[fadeIn_0.3s_ease-in-out] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-[1.01] mx-auto sm:mx-0`}
                                    onClick={() => {
                                        setSelectedHistoryItem(item);
                                        setIsDetailModalOpen(true);
                                    }}
                                >
                                    {/* Mobile Responsive Layout */}
                                    <div className="sm:hidden flex-1 flex flex-col justify-between sm:justify-center py-0.5 sm:gap-1 relative">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-[14px] text-[#000000] whitespace-nowrap">
                                                {item.date} {item.month} {item.year}
                                            </div>
                                            <div className="flex items-center gap-1.5">
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
                                                                    handleDeleteLeaveRequest(item.id);
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        <IconTrash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="font-bold text-[16px] text-gray-900 dark:text-gray-100 leading-none mt-1">
                                            ลางาน
                                        </div>

                                        <div className="inline-flex mt-1.5">
                                            {item.leaveType === 'ลากิจ' ? (
                                                <div className="inline-flex items-center w-[60px] h-[26px] bg-[#E2E4FF] text-[#4b5e71] border border-[#1A3CFF] rounded-full text-[10px] font-bold px-1 gap-1">
                                                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#1A3CFF] shadow-sm overflow-hidden">
                                                        <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0.5px]">business_center</span>
                                                    </div>
                                                    <span className="leading-none text-gray-500">ลากิจ</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFD7EF] text-[#4b5e71] border border-[#FF1A7D] rounded-full text-[10px] font-bold px-1 gap-1">
                                                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#FF1A7D] shadow-sm overflow-hidden">
                                                        <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0px]">health_cross</span>
                                                    </div>
                                                    <span className="leading-none text-gray-500">ลาป่วย</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="hidden sm:flex items-center gap-[14px] w-full">
                                        {/* Desktop Date Badge */}
                                        <div className="hidden sm:flex flex-col items-center justify-center bg-[#E4E7EC] dark:bg-gray-800 rounded-xl w-[70px] h-[70px] shrink-0 border border-[#CECFD2] dark:border-gray-700 px-1 text-center">
                                            <span className="text-[14px] font-bold text-gray-800 dark:text-gray-200 leading-tight mb-1">
                                                {item.date} {item.month}
                                            </span>
                                            <span className="text-[14px] text-gray-800 dark:text-gray-300 font-bold leading-tight">
                                                {item.year || '2569'}
                                            </span>
                                        </div>

                                        {/* Details Container */}
                                        <div className="flex flex-col w-full gap-2 sm:gap-1 pl-0 sm:pl-1 flex-1">
                                            <div className="font-bold text-[16px] sm:text-[19px] text-gray-900 dark:text-gray-100 leading-none">ลางาน</div>
                                            <div className="inline-flex self-start">
                                                {item.leaveType === 'ลากิจ' ? (
                                                    <div className="inline-flex items-center w-[60px] h-[26px] bg-[#E2E4FF] text-[#4b5e71] border border-[#4F46E5] rounded-[15px] text-[10px] font-bold px-1 gap-1">
                                                        <div className="w-[18px] h-[18px] rounded-full bg-[#1A3CFF] flex items-center justify-center shrink-0 shadow-sm overflow-hidden text-white">
                                                            <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0px] -translate-y-[0.5px]">business_center</span>
                                                        </div>
                                                        <span className="leading-none text-gray-500">ลากิจ</span>
                                                    </div>
                                                ) : item.leaveType === 'ลาป่วย' ? (
                                                    <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFD7EF] text-[#4b5e71] border border-[#FF1A7D] rounded-[15px] text-[10px] font-bold px-1 gap-1">
                                                        <div className="w-[18px] h-[18px] rounded-full bg-[#FF1A7D] flex items-center justify-center shrink-0 shadow-sm overflow-hidden text-white">
                                                            <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0px] -translate-y-[0px]">health_cross</span>
                                                        </div>
                                                        <span className="leading-none text-gray-500">ลาป่วย</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-3 py-1 bg-[#f0f9ff] text-[#0ea5e9] border border-[#bae6fd] rounded-full text-xs font-bold gap-1.5">
                                                        <span className="material-symbols-rounded !text-[14px]">lab_profile</span>
                                                        {item.leaveType}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 ml-auto sm:absolute sm:top-3 sm:right-4">
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
                                                                    handleDeleteLeaveRequest(item.id);
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
                                ไม่พบข้อมูลสำหรับ "{selectedFilter || 'ทั้งหมด'}"
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
                        <button 
                            className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 disabled:opacity-50"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                            <svg className="w-3.5 h-3.5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base font-bold border-r border-gray-200 dark:border-gray-700 shrink-0 ${
                                    currentPage === page 
                                    ? 'bg-[#dce0e5] dark:bg-gray-600 text-gray-800 dark:text-gray-200' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212]'
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button 
                            className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] flex items-center justify-center shrink-0 disabled:opacity-50"
                            disabled={currentPage === pagination.totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        >
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
                                        <Dialog.Panel
                                            as="div"
                                            className={`w-full ${isEditingTime ? 'sm:max-w-[880px]' : 'sm:max-w-[550px]'} transform text-left align-middle shadow-xl transition-all ${isEditingTime
                                                    ? "rounded-t-[25px] sm:rounded-2xl bg-white dark:bg-[#1A1A1A] px-6 pb-6 pt-2 h-[calc(100vh-48px)] mt-12 sm:mt-0 sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden sm:block sm:overflow-y-auto"
                                                    : "rounded-t-[25px] sm:rounded-2xl bg-white dark:bg-[#1A1A1A] p-6 h-[62vh] sm:h-auto max-h-[62vh] sm:max-h-none flex flex-col overflow-hidden sm:block sm:overflow-y-auto sm:overflow-visible"
                                                }`}
                                            style={{
                                                transform: touchTranslateY > 0 ? `translateY(${touchTranslateY}px)` : undefined,
                                                transition: touchStart === null ? 'transform 0.3s ease-out' : 'none'
                                            }}
                                        >

                                            {/* Drawer Handle for mobile */}
                                            <div 
                                                className="flex justify-center py-3 sm:hidden cursor-grab active:cursor-grabbing touch-none"
                                                onTouchStart={handleTouchStart}
                                                onTouchMove={handleTouchMove}
                                                onTouchEnd={handleTouchEnd}
                                            >
                                                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                            </div>

                                            {/* Close button for desktop */}
                                            <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 hidden sm:block" onClick={() => setIsDetailModalOpen(false)}>
                                                <IconX className="w-5 h-5" />
                                            </button>

                                            {selectedHistoryItem && (
                                                    <div className="flex-1 overflow-y-auto sm:overflow-visible space-y-4 text-black dark:text-white-light sm:pb-0 pb-6 pr-0.5 custom-scrollbar">
                                                        {/* Unified Detail Layout */}
                                                        <div className="flex flex-col items-center">
                                                            {/* Header Region */}
                                                            <div className="w-full h-auto flex flex-col pt-1 touch-none">
                                                                <div className="flex items-center justify-between mt-1 mb-2">
                                                                    <div className="text-[16px] font-bold text-gray-800 dark:text-gray-200">
                                                                        {selectedHistoryItem.date} {selectedHistoryItem.month} {selectedHistoryItem.year}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {getStatusBadge(selectedHistoryItem.statusType, selectedHistoryItem.status)}
                                                                        {selectedHistoryItem.status === 'รอการอนุมัติ' || selectedHistoryItem.status === 'รออนุมัติการลา' ? (
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
                                                                                            handleDeleteLeaveRequest(selectedHistoryItem.id);
                                                                                        }
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <IconTrash className="w-[18px] h-[18px]" />
                                                                            </button>
                                                                        ) : null}
                                                                    </div>
                                                                </div>

                                                                <div className="text-[19px] sm:text-[22px] font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                                                    ลางาน
                                                                </div>

                                                                {/* Leave Type Tag */}
                                                                <div className="mb-3">
                                                                    {selectedHistoryItem.leaveType === 'ลากิจ' ? (
                                                                        <div className="inline-flex items-center w-[60px] h-[26px] bg-[#E2E4FF] text-[#4b5e71] border border-[#1A3CFF] rounded-full text-[10px] font-bold px-1 gap-1">
                                                                            <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#1A3CFF] shadow-sm overflow-hidden">
                                                                                <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0.5px]">business_center</span>
                                                                            </div>
                                                                            <span className="leading-none text-gray-500">ลากิจ</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFD7EF] text-[#4b5e71] border border-[#FF1A7D] rounded-full text-[10px] font-bold px-1 gap-1">
                                                                            <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#FF1A7D] shadow-sm overflow-hidden">
                                                                                <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0px] -translate-y-[0px]">health_cross</span>
                                                                            </div>
                                                                            <span className="leading-none text-gray-500">ลาป่วย</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Divider */}
                                                                <hr className="w-full h-[1px] bg-[#ECECED] dark:bg-gray-700 border-none mb-3" />
                                                            </div>

                                                            {/* Reasoning Section */}
                                                            <div className="w-full space-y-3 mb-6">
                                                                <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                                                                    <span className="material-symbols-rounded text-gray-800 dark:text-gray-300 text-[20px]">description</span>
                                                                    รายละเอียดการลา
                                                                </div>
                                                                <div className="w-full bg-[#F9FAFB] dark:bg-gray-800 border border-[#D0D5DD] dark:border-gray-700 rounded-[6px] px-4 py-3 min-h-[48px] flex items-center text-[15px] text-gray-700 dark:text-gray-300 shadow-sm">
                                                                    {selectedHistoryItem.leaveReason}
                                                                </div>
                                                            </div>

                                                            {/* Evidence Section */}
                                                            <div className="w-full space-y-3">
                                                                <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                                                                    <span className="whitespace-nowrap font-bold">ไฟล์แนบ :</span>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => handleViewFile(selectedHistoryItem)}
                                                                        className="bg-[#F2F4F7] active:scale-95 transition-transform dark:bg-gray-800 border border-[#CECFD2] dark:border-gray-700 rounded-[6px] px-2 flex items-center gap-1.5 w-auto min-w-[111px] h-[35px] shrink-0 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                    >
                                                                        <div className="flex items-center justify-center shrink-0 text-[#A80689]">
                                                                            <span className="material-symbols-rounded !text-[20px]">description</span>
                                                                        </div>
                                                                        <div className="text-[12px] font-medium text-[#000000] dark:text-white truncate max-w-[250px]">
                                                                            {selectedHistoryItem.evidence ? 'หลักฐาน' : 'ไม่มีไฟล์แนบ'}
                                                                        </div>
                                                                    </button>
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
