"use client";
import React, { useState, Fragment } from "react";
import IconCircleCheck from "@/components/icon/icon-circle-check";
import IconClock from "@/components/icon/icon-clock";
import IconFile from "@/components/icon/icon-file";
import IconXCircle from "@/components/icon/icon-x-circle";
import IconArrowLeft from "@/components/icon/icon-arrow-left";
import IconShare from "@/components/icon/icon-share";
import { Transition, Dialog } from "@headlessui/react";

import IconCamera from "@/components/icon/icon-camera";
import IconX from "@/components/icon/icon-x";
import IconArchive from "@/components/icon/icon-archive";
import EditTimeForm from "@/components/history/edit-time-form";
import IconCalendarClock from "@/components/icon/icon-calendar-clock";
import IconBriefcase from "@/components/icon/icon-briefcase";
import IconMedicalCross from "@/components/icon/icon-medical-cross";
import IconGallery from "@/components/icon/icon-gallery";
import MonthPicker from "@/components/history/month-picker";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import IconFileText from "@/components/icon/icon-file-text";

const AttendanceHistoryPage = () => {
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
    const thaiMonthsShort = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
    ];
    const thaiMonthsFull = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
    ];
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(
        new Date().getFullYear() + 543,
    );

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

    const handleViewFile = (filename: string) => {
        Swal.fire({
            title: 'ดูไฟล์แนบ',
            html: `<div className="text-gray-500 mb-2">${filename}</div>`,
            imageUrl: '/assets/images/profile-34.jpeg',
            imageWidth: 400,
            imageHeight: 400,
            imageAlt: filename,
            confirmButtonText: 'ปิด',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[20px] p-6 bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
                title: 'text-[18px] font-bold text-black dark:text-white pt-2 text-center',
                confirmButton: 'bg-[#A80689] hover:bg-[#8e0574] text-white font-bold py-2.5 px-12 min-w-[150px] rounded-[12px] text-[15px] mt-4'
            }
        });
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
        {
            title: "เข้างานปกติ",
            days: 14,
            icon: (
                <svg fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
            ),
            bgColor: "bg-[#e7faef]",
            textColor: "text-[#10b981]",
            iconBg: "bg-[#10b981]",
        },
        {
            title: "สาย",
            days: 1,
            icon: <IconClock />,
            bgColor: "bg-[#fdf4d6]",
            textColor: "text-[#f59e0b]",
            iconBg: "bg-[#f59e0b]",
        },
        {
            title: "ลา",
            days: 4,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 2H18C19.1 2 20 2.9 20 4V15.5L15.5 20H6C4.9 20 4 19.1 4 18V4C4 2.9 4.9 2 6 2Z" fill="white" />
                    <rect x="8" y="7" width="8" height="2" rx="1" fill="#3B82F6" />
                    <rect x="8" y="11" width="8" height="2" rx="1" fill="#3B82F6" />
                    <path d="M15.5 20V17C15.5 16.1716 16.1716 15.5 17 15.5H20L15.5 20Z" fill="#3B82F6" />
                </svg>
            ),
            bgColor: "bg-[#eef8ff]",
            textColor: "text-[#3b82f6]",
            iconBg: "bg-[#3b82f6]",
        },
        {
            title: "ขาด",
            days: 1,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            ),
            bgColor: "bg-[#fceded]",
            textColor: "text-[#ef4444]",
            iconBg: "bg-[#ef4444]",
        },
    ];

    const historyData = [
        {
            date: "1",
            month: "ม.ค.",
            labelMobile: "1 มกราคม 2569",
            time: "เวลาทำงาน ",
            status: "ขาด",
            statusType: "danger",
            location: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
            checkInTime: "ไม่ลงเวลา",
            checkOutTime: "ไม่ลงเวลา",
            workingHours: "0 ชั่วโมง",
            approvalStatus: "denied",
            reqCheckInTime: "08:30",
            reqCheckOutTime: "16:30",
            reqWorkingHours: "7 ชั่วโมง",
            reqReason: "ระบบขัดข้องทำให้ลงเวลาไม่ได้",
            evidence: "หลักฐาน.pdf",
            evidenceSize: "(2.4 MB)",
        },
        {
            date: "17",
            month: "ม.ค.",
            labelMobile: "17 มกราคม 2569",
            time: "เวลาทำงาน 08:30 - ไม่ลงเวลา",
            status: "ไม่ลงเวลาออก",
            statusType: "default",
            location: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
            checkInTime: "08:30",
            checkOutTime: "ไม่ลงเวลา",
            workingHours: "0 ชั่วโมง",
            approvalStatus: "pending",
            reqCheckInTime: "08:30",
            reqCheckOutTime: "16:30",
            reqWorkingHours: "7 ชั่วโมง",
            reqReason: "ลืมกดออก",
            evidence: "ลงชื่อเข้างาน.jpg",
            evidenceSize: "(5MB)",
        },
        {
            date: "16",
            month: "ม.ค.",
            labelMobile: "16 มกราคม 2569",
            time: "เวลาทำงาน 08:30 - 16:30",
            status: "เข้างานปกติ",
            statusType: "success",
            location: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
            checkInTime: "08:30",
            checkOutTime: "16:30",
            workingHours: "0 ชั่วโมง",
            approvalStatus: "approved",
            reqCheckInTime: "08:30",
            reqCheckOutTime: "16:30",
            reqWorkingHours: "7 ชั่วโมง",
            reqReason: "ลืมกดออก",
            evidence: "ลงชื่อเข้างาน.jpg",
            evidenceSize: "(5MB)",
        },
        {
            date: "15",
            month: "ม.ค.",
            labelMobile: "15 มกราคม 2569",
            time: "เวลาทำงาน 08:30 - 16:30",
            status: "เข้างานปกติ",
            statusType: "success",
            location: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
            checkInTime: "08:30",
            checkOutTime: "16:30",
            workingHours: "8 ชั่วโมง",
            evidence: "ลงชื่อเข้างาน.jpg",
            evidenceSize: "(5MB)",
        },
        {
            date: "14",
            month: "ม.ค.",
            labelMobile: "14 มกราคม 2569",
            time: "เวลาทำงาน 10:00 - 16:30",
            status: "สาย",
            statusType: "warning",
            location: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
            checkInTime: "10:00",
            checkOutTime: "16:30",
            workingHours: "6 ชั่วโมง 30 นาที",
            evidence: "ลงชื่อเข้างาน.jpg",
            evidenceSize: "(5MB)",
        },
        {
            date: "13",
            month: "ม.ค.",
            labelMobile: "13 มกราคม 2569",
            time: "เวลาทำงาน --:--",
            status: "ลา",
            statusType: "info",
            isLeave: true,
            statusText: "คุณลางานวันนี้",
            leaveDuration: "1 วัน",
            leaveType: "ลากิจ",
            leaveReason: "เข้าร่วมประชุมกับทางมหาวิทยาลัย",
            location: "-",
            checkInTime: "-",
            checkOutTime: "-",
            workingHours: "-",
            evidence: "ลากิจ.jpg",
            evidenceSize: "(5MB)",
        },
        {
            date: "12",
            month: "ม.ค.",
            labelMobile: "12 มกราคม 2569",
            time: "เวลาทำงาน --:--",
            status: "ขาด",
            statusType: "danger",
            location: "-",
            checkInTime: "-",
            checkOutTime: "-",
            workingHours: "-",
            evidence: "-",
            evidenceSize: "-",
        },
        {
            date: "11",
            month: "ม.ค.",
            labelMobile: "11 มกราคม 2569",
            time: "เวลาทำงาน --:--",
            status: "ลา",
            statusType: "info",
            isLeave: true,
            statusText: "คุณลางานวันนี้",
            leaveDuration: "1 วัน",
            leaveType: "ลาป่วย",
            leaveReason: "มีอาการปวดหัวและเป็นไข้",
            location: "-",
            checkInTime: "-",
            checkOutTime: "-",
            workingHours: "-",
            evidence: "ลาป่วย.jpg",
            evidenceSize: "(5MB)",
        },
        {
            date: "18",
            month: "ม.ค.",
            labelMobile: "18 มกราคม 2569",
            time: "เวลาทำงาน 08:30 - ไม่ลงเวลา",
            status: "ไม่ลงเวลาออก",
            statusType: "default",
            location: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
            checkInTime: "08:30",
            checkOutTime: "ไม่ลงเวลา",
            workingHours: "0 ชั่วโมง",
            evidence: null,
        },
    ];

    const filteredHistoryData = selectedFilter
        ? historyData.filter((item) => item.status === selectedFilter)
        : historyData;

    const getStatusBadge = (type: string, status: string) => {
        let icon = null;
        let colorClass = "";

        if (type === "success" || status === "เข้างานปกติ") {
            icon = (
                <div className="w-4 h-4 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
            );
            colorClass = "px-2 py-0.5 bg-[#e7faef] text-[#10b981] border border-[#10b981] rounded-full flex items-center text-[11px] font-bold";
        } else if (type === "warning" || status === "สาย") {
            icon = (
                <div className="w-4 h-4 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm">
                    <IconClock className="w-2.5 h-2.5 text-white" />
                </div>
            );
            colorClass = "px-2 py-0.5 bg-[#fdf4d6] text-[#f59e0b] border border-[#f59e0b] rounded-full flex items-center text-[11px] font-bold";
        } else if (type === "info" || status === "ลา") {
            icon = (
                <div className="w-4 h-4 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 2H18C19.1 2 20 2.9 20 4V15.5L15.5 20H6C4.9 20 4 19.1 4 18V4C4 2.9 4.9 2 6 2Z" fill="white" />
                        <rect x="8" y="7" width="8" height="2" rx="1" fill="#3B82F6" />
                        <rect x="8" y="11" width="8" height="2" rx="1" fill="#3B82F6" />
                        <path d="M15.5 20V17C15.5 16.1716 16.1716 15.5 17 15.5H20L15.5 20Z" fill="#3B82F6" />
                    </svg>
                </div>
            );
            colorClass = "px-2 py-0.5 bg-[#eef8ff] text-[#3b82f6] border border-[#3b82f6] rounded-full flex items-center text-[11px] font-bold";
        } else if (type === "danger" || status === "ขาด") {
            icon = (
                <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm focus:outline-none">
                    <IconX className="w-2.5 h-2.5" />
                </div>
            );
            colorClass = "px-2 py-0.5 bg-[#FCEDED] text-[#EF4444] border border-[#EF4444] rounded-full flex items-center text-[11px] font-bold";
        } else if (type === "default" || status === "ไม่ลงเวลาออก") {
            icon = (
                <div className="w-4 h-4 rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm relative overflow-hidden">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                    </svg>
                    <div className="absolute w-[12px] h-[1px] bg-white rotate-[-45deg]"></div>
                </div>
            );
            colorClass = "px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] border border-[#6B7280] rounded-full flex items-center text-[11px] font-bold";
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
            <div className="w-full max-w-[349px] sm:max-w-[840px] mx-auto min-h-[888px] sm:min-h-[813px] flex flex-col gap-[16px]">
                {/* Header Section */}
                <div className="flex flex-row items-start justify-between gap-2 sm:gap-4 shrink-0">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold mb-1 text-black dark:text-white">
                            ประวัติการลงเวลา
                        </h1>
                        <p className="text-gray-500 text-xs sm:text-sm">
                            รายงานการลงเวลาปฏิบัติงาน ประจำเดือน
                        </p>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5 sm:px-3 sm:py-1.5 shrink-0 shadow-sm">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="text-gray-700 dark:text-gray-300 hover:text-primary p-0.5 sm:p-1"
                        >
                            <svg
                                className="w-3.5 h-3.5 stroke-[2.5]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                ></path>
                            </svg>
                        </button>
                        <MonthPicker
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            onSelect={handleMonthSelect}
                        />
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="text-gray-700 dark:text-gray-300 hover:text-primary p-0.5 sm:p-1"
                        >
                            <svg
                                className="w-3.5 h-3.5 stroke-[2.5]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                ></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="shrink-0 flex flex-col gap-[16px]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[17px] font-bold text-[#B10073]">
                            สรุปการลงเวลา ({thaiMonthsFull[currentMonth]})
                        </h2>
                        {selectedFilter && (
                            <button
                                onClick={() => setSelectedFilter(null)}
                                className="text-sm text-blue-500 hover:underline"
                            >
                                แสดงทั้งหมด
                            </button>
                        )}
                    </div>
                    <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-[13px] pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {summaryData.map((item, index) => {
                            const isSelected = selectedFilter === item.title;
                            const borderColorClass = item.textColor.replace(
                                "text-",
                                "border-",
                            );

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                        setSelectedFilter(isSelected ? null : item.title)
                                    }
                                    className={`panel ${item.bgColor} flex flex-col sm:flex-row justify-between sm:justify-start items-start sm:items-center p-3 sm:px-4 sm:py-5 rounded-[10px] shadow-none dark:bg-opacity-20 shrink-0 w-[100px] h-[120px] sm:w-[200px] sm:h-[90px] text-left transition-all ${isSelected ? `border-2 ${borderColorClass}` : "border-2 border-transparent hover:-translate-y-1"}`}
                                >
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center sm:mr-4 ${item.iconBg} shadow-sm sm:shadow-none`}>
                                        {React.cloneElement(item.icon as any, {
                                            className: "w-5 h-5 text-white",
                                        })}
                                    </div>
                                    <div className="flex flex-col mt-2 sm:mt-0">
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-[11px] sm:text-sm mb-1 sm:mb-0.5">
                                            {item.title}
                                        </div>
                                        <div className="text-base sm:text-[22px] font-bold text-black dark:text-white leading-none">
                                            {item.days} วัน
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                        รายการลงเวลาทั้งหมด {historyData.length} วัน
                    </p>
                </div>

                {/* History List Section */}
                <div className="shrink-0 flex flex-col gap-[16px]">
                    <h2 className="text-[17px] font-bold text-[#B10073]">
                        รายการประวัติการลงเวลา{" "}
                        {selectedFilter && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                (แสดงเฉพาะ: {selectedFilter})
                            </span>
                        )}
                    </h2>
                    <div className="flex flex-col gap-[14px]">
                        {filteredHistoryData.length > 0 ? (
                            filteredHistoryData.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => {
                                        if (
                                            item.isLeave ||
                                            item.statusType === "warning" ||
                                            item.statusType === "danger" ||
                                            item.statusType === "success" ||
                                            item.statusType === "default"
                                        ) {
                                            setSelectedHistoryItem(item);
                                            setIsDetailModalOpen(true);
                                        }
                                    }}
                                    className={`w-full max-sm:min-h-[98px] sm:h-[80px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-[14px] border border-[#CECFD2] dark:border-gray-700 rounded-[14px] p-3.5 sm:px-4 sm:py-2 bg-white dark:bg-[#121212] overflow-hidden animate-[fadeIn_0.3s_ease-in-out] ${item.isLeave || item.statusType === "warning" || item.statusType === "danger" || item.statusType === "success" || item.statusType === "default" ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-[1.01]" : ""}`}
                                >
                                    {/* Desktop Date Badge */}
                                    <div className="hidden sm:flex flex-col items-center justify-center bg-[#fcf2e3] dark:bg-orange-900/20 rounded-xl w-14 h-14 shrink-0 border border-[#f5e3cd] dark:border-none">
                                        <span className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-none mb-1">
                                            {item.date}
                                        </span>
                                        <span className="text-xs text-gray-800 dark:text-gray-300 font-semibold">
                                            {item.month}
                                        </span>
                                    </div>

                                    {/* Mobile Date Header */}
                                    {/* Mobile Content (Isolated) */}
                                    <div className="sm:hidden flex-1 flex flex-col justify-between py-0.5">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[12px] font-medium text-gray-900 dark:text-gray-100">
                                                {item.labelMobile}
                                            </div>
                                            {item.approvalStatus && (
                                                <div
                                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.approvalStatus === "approved"
                                                        ? "bg-[#EBFBF3] text-[#10B981]"
                                                        : item.approvalStatus === "denied"
                                                            ? "bg-[#FFEBEC] text-[#F97066]"
                                                            : "bg-[#F3F4F6] text-[#6B7280]"
                                                        }`}
                                                >
                                                    {item.approvalStatus === "approved"
                                                        ? "อนุมัติการแก้ไขเวลา"
                                                        : item.approvalStatus === "denied"
                                                            ? "ไม่อนุมัติการแก้ไขเวลา"
                                                            : "รออนุมัติการแก้ไขเวลา"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-bold text-[16px] text-gray-900 dark:text-gray-100 leading-none">
                                            {item.time}
                                        </div>
                                        <div className="inline-flex self-start mt-1">
                                            {getStatusBadge(item.statusType, item.status)}
                                        </div>
                                    </div>

                                    {/* Desktop Content (Restored) */}
                                    <div className="hidden sm:flex flex-col w-full gap-2 pl-1">
                                        <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100 leading-tight">
                                            {item.time}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="inline-flex self-start">
                                                {getStatusBadge(item.statusType, item.status)}
                                            </div>
                                            {item.approvalStatus && (
                                                <div
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.approvalStatus === "approved"
                                                        ? "bg-[#EBFBF3] text-[#10B981]"
                                                        : item.approvalStatus === "denied"
                                                            ? "bg-[#FFEBEC] text-[#F97066]"
                                                            : "bg-[#F3F4F6] text-[#6B7280]"
                                                        }`}
                                                >
                                                    {item.approvalStatus === "approved"
                                                        ? "อนุมัติการแก้ไขเวลา"
                                                        : item.approvalStatus === "denied"
                                                            ? "ไม่อนุมัติการแก้ไขเวลา"
                                                            : "รออนุมัติการแก้ไขเวลา"}
                                                </div>
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
                    <button
                        type="button"
                        className="flex items-center gap-2 font-bold text-[15px] hover:opacity-80 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                        <IconShare className="w-5 h-5 sm:w-6 sm:h-6 text-[#b40e56] stroke-[2px]" />
                        <span className="hidden sm:inline">ส่งออกตาราง</span>
                        <span className="sm:hidden text-sm">ส่งออกตาราง</span>
                    </button>

                    <div className="inline-flex items-center border border-gray-200 dark:border-gray-700 rounded-full overflow-x-auto shadow-sm w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <button className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                            <svg
                                className="w-3.5 h-3.5 stroke-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                ></path>
                            </svg>
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
                            <svg
                                className="w-3.5 h-3.5 stroke-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                ></path>
                            </svg>
                        </button>
                    </div>

                    {/* Detail Modal */}
                    <Transition appear show={isDetailModalOpen} as={Fragment}>
                        <Dialog
                            as="div"
                            className="relative z-[999]"
                            open={isDetailModalOpen}
                            onClose={() => {
                                setIsDetailModalOpen(false);
                                setIsEditingTime(false);
                            }}
                        >
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
                                <div
                                    className={`flex min-h-full justify-center p-0 sm:p-4 text-center ${isEditingTime ? "items-stretch sm:items-center" : "items-end sm:items-center"}`}
                                >
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
                                            className={`w-full ${isEditingTime ? 'sm:max-w-[880px]' : 'max-w-lg'} transform text-left align-middle shadow-xl transition-all ${isEditingTime
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
                                            <button
                                                type="button"
                                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 hidden sm:block"
                                                onClick={() => setIsDetailModalOpen(false)}
                                            >
                                                <IconX className="w-5 h-5" />
                                            </button>

                                            {selectedHistoryItem && (
                                                <div className="flex-1 overflow-y-auto sm:overflow-visible space-y-4 text-black dark:text-white-light sm:pb-0 pb-6 pr-0.5 custom-scrollbar">
                                                    {isEditingTime ? (
                                                        <EditTimeForm
                                                            selectedHistoryItem={selectedHistoryItem}
                                                            setIsEditingTime={setIsEditingTime}
                                                            handleTouchStart={handleTouchStart}
                                                            handleTouchMove={handleTouchMove}
                                                            handleTouchEnd={handleTouchEnd}
                                                        />
                                                    ) : selectedHistoryItem.statusType === "danger" &&
                                                        !selectedHistoryItem.approvalStatus ? (
                                                        <div className="flex flex-col pb-2">
                                                            {/* Header (No longer Sticky) */}
                                                            <div className="pb-2 pt-1 touch-none"
                                                                onTouchStart={handleTouchStart}
                                                                onTouchMove={handleTouchMove}
                                                                onTouchEnd={handleTouchEnd}
                                                            >
                                                                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                                                                    {selectedHistoryItem.labelMobile}
                                                                </div>
                                                                <div className="inline-flex items-center px-4 py-1.5 bg-[#FFEAEC] text-[#D92D20] border border-[#FCA5A5] rounded-full text-xs font-bold gap-1.5 w-fit">
                                                                    <div className="w-5 h-5 bg-[#D92D20] rounded-full flex items-center justify-center text-white shrink-0">
                                                                        <IconX className="w-3 h-3" />
                                                                    </div>
                                                                    {selectedHistoryItem.status}
                                                                </div>
                                                            </div>

                                                            <hr className="mt-3 mb-6 h-[1px] bg-[#CECFD2] border-none dark:bg-gray-700" />

                                                            {/* Content */}
                                                            <div className="flex flex-col items-center justify-start flex-1 pt-0 pb-8 px-4">
                                                                {/* Custom CSS Absent Calendar Illustration */}
                                                                <div className="relative w-44 h-44 mb-4 flex items-center justify-center">
                                                                    {/* Soft red background circle */}
                                                                    <div className="absolute inset-2 bg-[#FFEAEC] dark:bg-red-900/30 rounded-full"></div>
                                                                    {/* Base shadow oval */}
                                                                    <div className="absolute w-[100px] h-3 bg-[#FCA5A5]/40 rounded-[100%] bottom-6 blur-[3px]"></div>

                                                                    {/* Calendar Body */}
                                                                    <div className="relative w-[110px] h-[120px] bg-white dark:bg-[#202020] rounded-[18px] shadow-sm flex flex-col z-10 overflow-hidden">
                                                                        {/* Calendar Header */}
                                                                        <div className="h-[36px] bg-[#EF4444] w-full shrink-0"></div>

                                                                        {/* Calendar Content */}
                                                                        <div className="flex-1 w-full flex items-center justify-center">
                                                                            <svg
                                                                                className="w-14 h-14 text-[#EF4444]"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="3.5"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                            >
                                                                                <line
                                                                                    x1="18"
                                                                                    y1="6"
                                                                                    x2="6"
                                                                                    y2="18"
                                                                                ></line>
                                                                                <line
                                                                                    x1="6"
                                                                                    y1="6"
                                                                                    x2="18"
                                                                                    y2="18"
                                                                                ></line>
                                                                            </svg>
                                                                        </div>
                                                                    </div>

                                                                    {/* Calendar Rings (Absolute positioned over header) */}
                                                                    <div className="absolute top-[40px] left-[52px] w-[14px] h-[22px] border-[3.5px] border-[#CBD5E1] dark:border-gray-500 rounded-full bg-[#F8FAFC] dark:bg-gray-800 z-20"></div>
                                                                    <div className="absolute top-[40px] right-[52px] w-[14px] h-[22px] border-[3.5px] border-[#CBD5E1] dark:border-gray-500 rounded-full bg-[#F8FAFC] dark:bg-gray-800 z-20"></div>
                                                                </div>
                                                                <div className="text-[17px] font-bold text-gray-700 dark:text-gray-200 mb-1">
                                                                    ไม่มีการลงเวลาในวันนี้
                                                                </div>
                                                                <div className="text-sm text-gray-500 font-medium text-center">
                                                                    หากมาทำงานปกติ โปรดส่งคำขอแก้ไขเวลา
                                                                </div>
                                                            </div>

                                                            {/* Button */}
                                                            <div className="flex justify-center mt-8 mb-2">
                                                                <button
                                                                    type="button"
                                                                    className="w-[280px] max-w-full px-6 py-3.5 bg-[#A80689] text-white rounded-lg text-[15px] font-bold shadow-sm hover:bg-[#A80689]/90 transition-colors"
                                                                    onClick={() => {
                                                                        localStorage.setItem(
                                                                            "editItem",
                                                                            JSON.stringify(selectedHistoryItem),
                                                                        );
                                                                        router.push("/intern/history/edit-time");
                                                                    }}
                                                                >
                                                                    ส่งคำขอแก้ไขเวลา
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col h-full">
                                                            {/* Mobile Detail View */}
                                                            <div className="sm:hidden flex flex-col gap-5">
                                                                {/* Date & Time Header (No longer Sticky) */}
                                                                {!selectedHistoryItem.isLeave && (
                                                                    <div
                                                                        className="pb-2 touch-none"
                                                                        onTouchStart={handleTouchStart}
                                                                        onTouchMove={handleTouchMove}
                                                                        onTouchEnd={handleTouchEnd}
                                                                    >
                                                                        <div className="flex items-start justify-between mb-1">
                                                                            <div className="text-[15px] font-bold text-gray-900">
                                                                                {selectedHistoryItem.labelMobile}
                                                                            </div>
                                                                            {selectedHistoryItem.approvalStatus && (
                                                                                <div
                                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedHistoryItem.approvalStatus ===
                                                                                        "approved"
                                                                                        ? "bg-[#EBFBF3] text-[#10B981]"
                                                                                        : selectedHistoryItem.approvalStatus ===
                                                                                            "denied"
                                                                                            ? "bg-[#FFEBEC] text-[#F97066]"
                                                                                            : "bg-[#F3F4F6] text-[#6B7280]"
                                                                                        }`}
                                                                                >
                                                                                    {selectedHistoryItem.approvalStatus ===
                                                                                        "approved"
                                                                                        ? "อนุมัติการแก้ไขเวลา"
                                                                                        : selectedHistoryItem.approvalStatus ===
                                                                                            "denied"
                                                                                            ? "ไม่อนุมัติการแก้ไขเวลา"
                                                                                            : "รออนุมัติการแก้ไขเวลา"}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            className={`text-[17px] font-bold text-gray-900 ${selectedHistoryItem.statusType === "danger" ? "mb-2" : "mb-3"}`}
                                                                        >
                                                                            {selectedHistoryItem.statusType === "danger"
                                                                                ? "ขาดงาน"
                                                                                : selectedHistoryItem.isLeave
                                                                                    ? "ลางานเต็มวัน"
                                                                                    : selectedHistoryItem.time}
                                                                        </div>

                                                                        {/* Status Badge */}
                                                                        <div
                                                                            className={`inline-flex items-center w-fit min-w-[75px] justify-center px-2 py-1 rounded-full text-[10px] font-bold gap-1 border ${selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.statusType === "success"
                                                                                    ? "bg-[#E7FAEF] text-[#10B981] border-[#10B981]"
                                                                                    : selectedHistoryItem.status === "สาย" || selectedHistoryItem.statusType === "warning"
                                                                                        ? "bg-[#FDF4D6] text-[#F59E0B] border-[#F59E0B]"
                                                                                        : selectedHistoryItem.status === "ขาด" || selectedHistoryItem.statusType === "danger"
                                                                                            ? "bg-[#FCEDED] text-[#EF4444] border-[#EF4444]"
                                                                                            : selectedHistoryItem.leaveType === "ลาป่วย"
                                                                                                ? "bg-[#FFEBF5] text-[#D42A8C] border-[#D42A8C]"
                                                                                                : selectedHistoryItem.status === "ลา" || selectedHistoryItem.isLeave
                                                                                                    ? "bg-[#EEF4FF] text-[#4386F9] border-[#4386F9]"
                                                                                                    : "bg-[#F3F4F6] text-[#6B7280] border-[#6B7280]"
                                                                                }`}
                                                                        >
                                                                            {selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.statusType === "success" ? (
                                                                                <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                                                    </svg>
                                                                                </div>
                                                                            ) : selectedHistoryItem.status === "สาย" || selectedHistoryItem.statusType === "warning" ? (
                                                                                <div className="w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                                    <IconClock className="w-3 h-3 text-white" />
                                                                                </div>
                                                                            ) : selectedHistoryItem.status === "ขาด" || selectedHistoryItem.statusType === "danger" ? (
                                                                                <div className="w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                                    <IconX className="w-3 h-3 text-white" />
                                                                                </div>
                                                                            ) : selectedHistoryItem.leaveType === "ลาป่วย" ? (
                                                                                <div className="w-5 h-5 bg-[#D42A8C] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path d="M12 6V18" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                                                                        <path d="M6 12H18" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                                                                    </svg>
                                                                                </div>
                                                                            ) : selectedHistoryItem.status === "ลา" || selectedHistoryItem.isLeave ? (
                                                                                <div className="w-5 h-5 bg-[#4386F9] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path d="M6 2H18C19.1 2 20 2.9 20 4V15.5L15.5 20H6C4.9 20 4 19.1 4 18V4C4 2.9 4.9 2 6 2Z" fill="white" />
                                                                                        <rect x="8" y="7" width="8" height="2" rx="0.5" fill="#4386F9" />
                                                                                        <rect x="8" y="11" width="8" height="2" rx="0.5" fill="#4386F9" />
                                                                                        <path d="M15.5 20V17C15.5 16.1716 16.1716 15.5 17 15.5H20L15.5 20Z" fill="#4386F9" />
                                                                                    </svg>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-5 h-5 rounded-full bg-[#6B7280] flex items-center justify-center text-white shadow-sm relative overflow-hidden shrink-0">
                                                                                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                                                                        <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                                                                                    </svg>
                                                                                    <div className="absolute w-[18px] h-[1.5px] bg-white rotate-[-45deg]"></div>
                                                                                </div>
                                                                            )}
                                                                            <span>
                                                                                {selectedHistoryItem.status === "ลา"
                                                                                    ? selectedHistoryItem.leaveType
                                                                                    : selectedHistoryItem.status ===
                                                                                        "เข้างานปกติ" ||
                                                                                        selectedHistoryItem.statusType ===
                                                                                        "success"
                                                                                        ? "เข้างานปกติ"
                                                                                        : selectedHistoryItem.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Conditional Content based on Status */}
                                                                {selectedHistoryItem.statusType === "danger" &&
                                                                    !selectedHistoryItem.approvalStatus ? (
                                                                    /* Case: Absent */
                                                                    <div className="flex flex-col items-center pt-2">
                                                                        <hr className="w-full mb-8 h-[1px] bg-[#CECFD2] border-none" />
                                                                        <div className="relative w-48 h-48 mb-6">
                                                                            <div className="absolute inset-2 bg-[#FCEDED] rounded-full opacity-60"></div>
                                                                            <div className="relative w-[120px] h-[130px] bg-white rounded-[20px] shadow-sm flex flex-col overflow-hidden mx-auto mt-6">
                                                                                <div className="h-[40px] bg-[#EF4444] w-full"></div>
                                                                                <div className="flex-1 flex items-center justify-center">
                                                                                    <svg
                                                                                        className="w-14 h-14 text-[#EF4444]"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="4"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                    >
                                                                                        <line
                                                                                            x1="18"
                                                                                            y1="6"
                                                                                            x2="6"
                                                                                            y2="18"
                                                                                        ></line>
                                                                                        <line
                                                                                            x1="6"
                                                                                            y1="6"
                                                                                            x2="18"
                                                                                            y2="18"
                                                                                        ></line>
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                            <div className="absolute top-[44px] left-[55px] w-[14px] h-[24px] border-[4px] border-[#CBD5E1] rounded-full bg-white"></div>
                                                                            <div className="absolute top-[44px] right-[55px] w-[14px] h-[24px] border-[4px] border-[#CBD5E1] rounded-full bg-white"></div>
                                                                        </div>
                                                                        <div className="text-[17px] font-bold text-[#1C1C1C] mb-1">
                                                                            ไม่มีการลงเวลาในวันนี้
                                                                        </div>
                                                                        <div className="text-[14px] text-gray-500 font-medium text-center">
                                                                            หากมาทำงานปกติ โปรดส่งคำขอแก้ไขเวลา
                                                                        </div>
                                                                    </div>
                                                                ) : selectedHistoryItem.isLeave ? (
                                                                    /* Case: Leave (Business/Sick) */
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <div className="flex flex-col">
                                                                                <div className="text-[14px] font-bold text-gray-800 dark:text-gray-200">
                                                                                    {selectedHistoryItem.labelMobile}
                                                                                </div>
                                                                                <div className="text-[20px] font-bold text-[#1A1A1A] dark:text-white">
                                                                                    ลางานเต็มวัน
                                                                                </div>
                                                                            </div>
                                                                            <div className={`px-3 py-1 rounded-full text-[12px] font-bold ${selectedHistoryItem.approvalStatus === 'approved'
                                                                                    ? 'bg-[#EBFBF3] text-[#10B981]'
                                                                                    : selectedHistoryItem.approvalStatus === 'denied'
                                                                                        ? 'bg-[#FFEBEC] text-[#F97066]'
                                                                                        : 'bg-[#F3F4F6] text-[#6B7280]'
                                                                                }`}>
                                                                                {selectedHistoryItem.approvalStatus === 'approved' ? 'อนุมัติการลา' : selectedHistoryItem.approvalStatus === 'denied' ? 'ไม่อนุมัติการลา' : 'รออนุมัติการลา'}
                                                                            </div>
                                                                        </div>

                                                                        {/* Leave Type Tag */}
                                                                        <div className="mb-4">
                                                                            {selectedHistoryItem.leaveType === 'ลากิจ' ? (
                                                                                <div className="inline-flex items-center w-[60px] h-[26px] bg-[#EEF2FF] text-[#4b5e71] border border-[#4F46E5] rounded-[15px] text-[10px] font-bold px-1 gap-1">
                                                                                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#4F46E5]">
                                                                                        <IconBriefcase className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-[1.5px]" />
                                                                                    </div>
                                                                                    <span className="leading-none text-gray-500">ลากิจ</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFF1F2] text-[#4b5e71] border border-[#FF1A7D] rounded-[15px] text-[10px] font-bold px-1 gap-1">
                                                                                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#FF1A7D]">
                                                                                        <IconMedicalCross className="w-2.5 h-2.5 text-white stroke-[1.5px]" />
                                                                                    </div>
                                                                                    <span className="leading-none text-gray-500">ลาป่วย</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <hr className="w-full h-[1px] bg-[#ECECED] border-none mb-6" />

                                                                        {/* Reasoning Section (Leave) */}
                                                                        <div className="w-full space-y-3 mb-6">
                                                                            <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                                                                                <IconFileText className="w-5 h-5 text-gray-800 dark:text-gray-300" />
                                                                                รายละเอียดการลา
                                                                            </div>
                                                                            <div className="w-full bg-[#F9FAFB] dark:bg-gray-800 border border-[#D0D5DD] dark:border-gray-700 rounded-[6px] px-4 py-3 min-h-[48px] flex items-center text-[15px] text-gray-700 dark:text-gray-300 shadow-sm">
                                                                                {selectedHistoryItem.leaveReason || "เข้าร่วมประชุมกับทางมหาวิทยาลัย"}
                                                                            </div>
                                                                        </div>

                                                                        {/* Evidence Section (Leave) */}
                                                                        <div className="w-full">
                                                                            <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                                                                                <span className="whitespace-nowrap">ไฟล์แนบ :</span>
                                                                                {selectedHistoryItem.evidence ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleViewFile(selectedHistoryItem.evidence)}
                                                                                        className="bg-[#F2F4F7] active:scale-95 transition-transform dark:bg-gray-800 border border-[#CECFD2] dark:border-gray-700 rounded-[6px] px-2 flex items-center gap-1.5 w-[111px] h-[35px] shrink-0 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                                    >
                                                                                        <div className="flex items-center justify-center shrink-0">
                                                                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                                <path d="M7 18H17V20H7V18Z" fill="black" />
                                                                                                <path d="M17 14H7V16H17V14Z" fill="black" />
                                                                                                <path d="M7 10H14V12H7V10Z" fill="black" />
                                                                                                <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9L14 2H6ZM13 4L19 10V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4H13Z" fill="black" />
                                                                                                <rect x="14.5" y="10.5" width="4" height="3" rx="1" fill="white" stroke="black" />
                                                                                                <text x="15" y="12.5" fontSize="2.5" fontWeight="bold" fill="black">PDF</text>
                                                                                            </svg>
                                                                                        </div>
                                                                                        <div className="text-[12px] font-medium text-[#000000] dark:text-gray-200 truncate">
                                                                                            {selectedHistoryItem.evidence}
                                                                                        </div>
                                                                                    </button>
                                                                                ) : (
                                                                                    <div className="bg-[#F8F9FA] dark:bg-gray-800 border border-[#D1D5DB] dark:border-gray-700 rounded-[10px] px-3 h-[35px] flex items-center gap-2">
                                                                                        <IconGallery className="w-4 h-4 text-gray-500" />
                                                                                        <span className="text-[12px] font-bold text-gray-500">ไม่มีไฟล์แนบ</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    /* Case: Normal/Late/Default */
                                                                    <div className="flex flex-col gap-6">
                                                                        {/* Conditional Card Layout */}
                                                                        {selectedHistoryItem.approvalStatus ? (
                                                                            /* Dual Card: Original + Request */
                                                                            <div className="space-y-3">
                                                                                {/* Card 1: Original */}
                                                                                <div className="bg-white border border-[#ECECED] rounded-[16px] p-4 shadow-sm space-y-2">
                                                                                    <div className="flex items-center w-[92px] h-[21px] gap-1 text-[#000000] font-bold text-[14px] leading-none shrink-0 border-none">
                                                                                        <span className="material-symbols-rounded text-[18px] text-[#000000]">location_on</span>
                                                                                        <span className="whitespace-nowrap">อยู่ในสถานที่</span>
                                                                                    </div>
                                                                                    <div className="space-y-2 pl-8">
                                                                                        <div className="text-[14px] font-medium text-gray-600">
                                                                                            เวลาเข้างาน :{" "}
                                                                                            {selectedHistoryItem.checkInTime}
                                                                                        </div>
                                                                                        <div className="text-[14px] font-medium text-gray-600">
                                                                                            เวลาออกงาน :{" "}
                                                                                            {selectedHistoryItem.checkOutTime}
                                                                                        </div>
                                                                                        <div className="text-[14px] font-medium text-gray-600">
                                                                                            ชั่วโมงที่เข้าทำงาน :{" "}
                                                                                            {selectedHistoryItem.workingHours}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                {/* Card 2: Request */}
                                                                                <div className="bg-white border border-[#ECECED] rounded-[16px] p-4 shadow-sm space-y-2">
                                                                                    <div className="inline-flex items-center w-[120px] h-[24px] gap-2 text-[#A80689] font-bold text-[16px] leading-none shrink-0">
                                                                                        <div className="w-[22px] h-[22px] rounded-full bg-[#A80689] flex items-center justify-center text-white shrink-0">
                                                                                            <IconCalendarClock className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                        <span className="whitespace-nowrap">คำขอแก้ไขเวลา</span>
                                                                                    </div>
                                                                                    <div className="space-y-2 pl-10">
                                                                                        <div className="text-[14px] font-bold text-[#1C1C1C]">
                                                                                            เวลาเข้างาน :{" "}
                                                                                            {
                                                                                                selectedHistoryItem.reqCheckInTime
                                                                                            }
                                                                                        </div>
                                                                                        <div className="text-[14px] font-bold text-[#1C1C1C]">
                                                                                            เวลาออกงาน :{" "}
                                                                                            {
                                                                                                selectedHistoryItem.reqCheckOutTime
                                                                                            }
                                                                                        </div>
                                                                                        <div className="text-[14px] font-bold text-[#1C1C1C]">
                                                                                            ชั่วโมงที่เข้าทำงาน :{" "}
                                                                                            {
                                                                                                selectedHistoryItem.reqWorkingHours
                                                                                            }
                                                                                        </div>
                                                                                        <div className="text-[14px] font-medium text-gray-600">
                                                                                            เหตุผลการแก้ไขเวลา :{" "}
                                                                                            {selectedHistoryItem.reqReason}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            /* Unified Detail Card */
                                                                            <div className="bg-white border border-[#ECECED] rounded-[16px] p-5 shadow-sm space-y-4">
                                                                                <div className="flex items-start gap-1 border-none">
                                                                                    <div className="flex items-center h-[21px] gap-1 text-[#000000] font-bold text-[15px] leading-none shrink-0">
                                                                                        <span className="material-symbols-rounded text-[20px] text-[#000000]">location_on</span>
                                                                                        <span className="whitespace-nowrap">{(selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.status === "สาย" || selectedHistoryItem.status === "ไม่ลงเวลาออก") ? "อยู่ในสถานที่" : selectedHistoryItem.location}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-3 pl-9">
                                                                                    <div className="text-[15px] font-bold text-[#1C1C1C]">
                                                                                        <span className="text-gray-400 font-normal">เวลาเข้างาน :</span>{" "}
                                                                                        {selectedHistoryItem.checkInTime}
                                                                                    </div>
                                                                                    <div className="text-[15px] font-bold text-[#1C1C1C]">
                                                                                        <span className="text-gray-400 font-normal">เวลาออกงาน :</span>{" "}
                                                                                        {selectedHistoryItem.checkOutTime}
                                                                                    </div>
                                                                                    <div className="text-[15px] font-bold text-[#1C1C1C]">
                                                                                        <span className="text-gray-400 font-normal">ชั่วโมงที่เข้าทำงาน :</span>{" "}
                                                                                        {selectedHistoryItem.workingHours}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Evidence Section */}
                                                                        <div className="w-full">
                                                                            {selectedHistoryItem.evidence ? (
                                                                                <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                                                                                    <span className="whitespace-nowrap">ไฟล์แนบ :</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleViewFile(selectedHistoryItem.evidence)}
                                                                                        className="bg-[#F2F4F7] active:scale-95 transition-transform dark:bg-gray-800 border border-[#CECFD2] dark:border-gray-700 rounded-[6px] px-2 flex items-center gap-1.5 w-[111px] h-[35px] shrink-0 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                                    >
                                                                                        <div className="flex items-center justify-center shrink-0">
                                                                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                                <path d="M7 18H17V20H7V18Z" fill="black" />
                                                                                                <path d="M17 14H7V16H17V14Z" fill="black" />
                                                                                                <path d="M7 10H14V12H7V10Z" fill="black" />
                                                                                                <path fillRule="evenodd" clipRule="evenodd" d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9L14 2H6ZM13 4L19 10V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4H13Z" fill="black" />
                                                                                                <rect x="14.5" y="10.5" width="4" height="3" rx="1" fill="white" stroke="black" />
                                                                                                <text x="15" y="12.5" fontSize="2.5" fontWeight="bold" fill="black">PDF</text>
                                                                                            </svg>
                                                                                        </div>
                                                                                        <div className="text-[12px] font-medium text-[#000000] dark:text-gray-200 truncate">
                                                                                            {selectedHistoryItem.evidence}
                                                                                        </div>
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-full space-y-3">
                                                                                    <div className="flex items-center gap-3 text-[15px] font-bold text-[#1C1C1C] dark:text-gray-200">
                                                                                        <IconCamera className="w-6 h-6" />
                                                                                        หลักฐานการเข้างาน
                                                                                    </div>
                                                                                    <div className="bg-[#F8F9FA] dark:bg-gray-800 border border-[#D1D5DB] dark:border-gray-700 rounded-[10px] p-2 flex items-center gap-3 w-full h-[52px]">
                                                                                        <div className="w-8 h-8 rounded-[4px] bg-[#6B7280] flex items-center justify-center text-white shrink-0">
                                                                                            <IconGallery className="w-5 h-5" />
                                                                                        </div>
                                                                                        <div className="text-[14px] font-bold text-[#1C1C1C] dark:text-gray-300">
                                                                                            ไม่มีไฟล์แนบ
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Action Button Mobile (Only for relevant states) */}
                                                                {!selectedHistoryItem.approvalStatus &&
                                                                    (selectedHistoryItem.status === "สาย" ||
                                                                        selectedHistoryItem.statusType ===
                                                                        "warning" ||
                                                                        selectedHistoryItem.statusType ===
                                                                        "danger" ||
                                                                        selectedHistoryItem.statusType ===
                                                                        "default") && (
                                                                        <div className="mt-2">
                                                                            <button
                                                                                type="button"
                                                                                className="w-full py-4 bg-[#A80689] text-white rounded-[12px] text-[17px] font-bold"
                                                                                onClick={() => {
                                                                                    localStorage.setItem(
                                                                                        "editItem",
                                                                                        JSON.stringify(selectedHistoryItem),
                                                                                    );
                                                                                    router.push("/intern/history/edit-time");
                                                                                }}
                                                                            >
                                                                                ส่งคำขอแก้ไขเวลา
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            {/* Desktop Detail View (Updated to match mobile data) */}
                                                            {/* Desktop Detail View (Restored original arrangement) */}
                                                            <div className="hidden sm:block space-y-4">
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <div className="text-[14px] font-bold text-gray-800 dark:text-gray-200">
                                                                            {selectedHistoryItem.labelMobile}
                                                                        </div>
                                                                        {selectedHistoryItem.approvalStatus && (
                                                                            <div
                                                                                className={`px-3 py-1 rounded-full text-[12px] font-bold ${selectedHistoryItem.approvalStatus ===
                                                                                    "approved"
                                                                                    ? "bg-[#EBFBF3] text-[#10B981]"
                                                                                    : selectedHistoryItem.approvalStatus ===
                                                                                        "denied"
                                                                                        ? "bg-[#FFEBEC] text-[#F97066]"
                                                                                        : "bg-[#F3F4F6] text-[#6B7280]"
                                                                                    }`}
                                                                            >
                                                                                {selectedHistoryItem.approvalStatus ===
                                                                                    "approved"
                                                                                    ? "อนุมัติการแก้ไขเวลา"
                                                                                    : selectedHistoryItem.approvalStatus ===
                                                                                        "denied"
                                                                                        ? "ไม่อนุมัติการแก้ไขเวลา"
                                                                                        : "รออนุมัติการแก้ไขเวลา"}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                                        {selectedHistoryItem.isLeave
                                                                            ? "ลางานเต็มวัน"
                                                                            : selectedHistoryItem.time}
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        {selectedHistoryItem.isLeave ? (
                                                                            <div className="inline-flex items-center px-2.5 py-1.5 bg-[#EEF4FF] text-[#1C1C1C] border border-[#4386F9] rounded-full text-[12.5px] font-bold gap-1.5 mt-1">
                                                                                <div className="w-5 h-5 rounded-full bg-[#4386F9] flex items-center justify-center text-white shrink-0">
                                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <rect x="5" y="4" width="14" height="16" rx="2" stroke="white" strokeWidth="2.5" />
                                                                                        <path d="M9 9H15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                                                                        <path d="M9 13H15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                                                                        <path d="M9 17H12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                                                                    </svg>
                                                                                </div>
                                                                                ลา
                                                                            </div>
                                                                        ) : selectedHistoryItem.status === 'ขาด' || selectedHistoryItem.statusType === 'danger' ? (
                                                                            <div className="inline-flex items-center w-[75px] justify-center px-1 py-1 bg-[#FCEDED] text-[#EF4444] border border-[#EF4444] rounded-full text-[10px] font-semibold gap-1 mt-1">
                                                                                <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0">
                                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                                    </svg>
                                                                                </div>
                                                                                ขาดงาน
                                                                            </div>
                                                                        ) : selectedHistoryItem.statusType === 'default' || selectedHistoryItem.status === 'ไม่ลงเวลาออก' ? (
                                                                            <div className="inline-flex items-center w-fit min-w-[75px] justify-center px-2 py-1 bg-[#F3F4F6] text-[#6B7280] border border-[#6B7280] rounded-full text-[10px] font-semibold gap-1 mt-1">
                                                                                <div className="w-4 h-4 rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 relative overflow-hidden">
                                                                                    <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                                                                                        <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                                                                                    </svg>
                                                                                    <div className="absolute w-[12px] h-[1px] bg-white rotate-[-45deg]"></div>
                                                                                </div>
                                                                                ไม่ลงเวลาออก
                                                                            </div>
                                                                        ) : (
                                                                            <div className={`inline-flex items-center w-fit min-w-[75px] justify-center px-2 py-1 rounded-full text-[10px] font-semibold gap-1 mt-1 border ${selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.statusType === "success"
                                                                                    ? "bg-[#E7FAEF] text-[#10B981] border-[#10B981]"
                                                                                    : "bg-[#FDF4D6] text-[#F59E0B] border-[#F59E0B]"
                                                                                }`}
                                                                            >
                                                                                {selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.statusType === "success" ? (
                                                                                    <div className="w-4 h-4 bg-[#10B981] rounded-full flex items-center justify-center text-white shrink-0">
                                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                                                        </svg>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-4 h-4 bg-[#F59E0B] rounded-full flex items-center justify-center text-white shrink-0">
                                                                                        <IconClock className="w-2.5 h-2.5 text-white" />
                                                                                    </div>
                                                                                )}
                                                                                {selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.statusType === "success" ? "เข้างานปกติ" : selectedHistoryItem.status}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <hr className="mt-1 mb-1 h-[1px] bg-[#CECFD2] border-none dark:bg-gray-700" />

                                                                {/* Vertical Stacked Cards Section */}
                                                                <div className="space-y-4 pt-4">
                                                                    {selectedHistoryItem.approvalStatus ? (
                                                                        <>
                                                                            {/* Card 1: Original */}
                                                                            <div className="bg-white dark:bg-[#1C1710] border border-[#ECECED] dark:border-[#3A2A1A] rounded-2xl p-4 space-y-3 shadow-sm">
                                                                                <div className="flex items-center w-[92px] h-[21px] gap-1 text-[#000000] font-bold text-[14px] leading-none shrink-0 border-none">
                                                                                    <span className="material-symbols-rounded text-[18px] text-[#000000]">location_on</span>
                                                                                    <span className="whitespace-nowrap">อยู่ในสถานที่</span>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-y-2 pl-8">
                                                                                    <div>
                                                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                            เวลาเข้างาน :
                                                                                        </div>
                                                                                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                                            {selectedHistoryItem.checkInTime}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                            เวลาออกงาน :
                                                                                        </div>
                                                                                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                                            {selectedHistoryItem.checkOutTime}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                            ชั่วโมงที่เข้าทำงาน :
                                                                                        </div>
                                                                                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                                            {selectedHistoryItem.workingHours}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {/* Card 2: Request */}
                                                                            <div className="bg-white dark:bg-[#121212] border border-[#ECECED] dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
                                                                                <div className="inline-flex items-center w-[120px] h-[24px] gap-2 text-[#A80689] font-bold text-[16px] leading-none shrink-0">
                                                                                    <div className="w-[22px] h-[22px] rounded-full bg-[#A80689] flex items-center justify-center text-white shrink-0">
                                                                                        <IconCalendarClock className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                    <span className="whitespace-nowrap">คำขอแก้ไขเวลา</span>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-y-2 pl-10">
                                                                                    <div>
                                                                                        <div className="text-xs text-[#A80689]/60">
                                                                                            เวลาเข้างาน :
                                                                                        </div>
                                                                                        <div className="font-bold text-sm text-[#1C1C1C] dark:text-gray-100">
                                                                                            {
                                                                                                selectedHistoryItem.reqCheckInTime
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-[#A80689]/60">
                                                                                            เวลาออกงาน :
                                                                                        </div>
                                                                                        <div className="font-bold text-sm text-[#1C1C1C] dark:text-gray-100">
                                                                                            {
                                                                                                selectedHistoryItem.reqCheckOutTime
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-xs text-[#A80689]/60">
                                                                                            ชั่วโมงที่เข้าทำงาน :
                                                                                        </div>
                                                                                        <div className="font-bold text-sm text-[#1C1C1C] dark:text-gray-100">
                                                                                            {
                                                                                                selectedHistoryItem.reqWorkingHours
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="col-span-2 mt-1">
                                                                                        <div className="text-xs text-gray-400">
                                                                                            เหตุผลการแก้ไขเวลา :
                                                                                        </div>
                                                                                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                                                            {selectedHistoryItem.reqReason}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        /* Single Detail Card */
                                                                        <div className="bg-white dark:bg-[#1C1710] border border-[#ECECED] dark:border-[#3A2A1A] rounded-2xl p-4 space-y-3 shadow-sm">
                                                                            <div className="flex items-start gap-1 border-none">
                                                                                <div className="flex items-center h-[21px] gap-1 text-[#000000] font-bold text-[14px] leading-none shrink-0">
                                                                                    <span className="material-symbols-rounded text-[20px] text-[#000000]">location_on</span>
                                                                                    <span className="whitespace-nowrap">{selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.statusType === "success" || selectedHistoryItem.status === "สาย" || selectedHistoryItem.statusType === "warning" || selectedHistoryItem.status === "ไม่ลงเวลาออก" ? "อยู่ในสถานที่" : selectedHistoryItem.location}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-y-2 pl-8">
                                                                                <div>
                                                                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                        เวลาเข้างาน :
                                                                                    </div>
                                                                                    <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                                        {selectedHistoryItem.checkInTime}
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                        เวลาออกงาน :
                                                                                    </div>
                                                                                    <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                                        {selectedHistoryItem.status ===
                                                                                            "ไม่ลงเวลาออก"
                                                                                            ? "ไม่ลงเวลา"
                                                                                            : selectedHistoryItem.checkOutTime}
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                        ชั่วโมงที่เข้าทำงาน :
                                                                                    </div>
                                                                                    <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                                        {selectedHistoryItem.status ===
                                                                                            "ไม่ลงเวลาออก"
                                                                                            ? "0 ชั่วโมง"
                                                                                            : selectedHistoryItem.workingHours}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Evidence Section */}
                                                                    <div className="bg-white dark:bg-[#1A1A1A] border border-[#ECECED] dark:border-[#333333] rounded-2xl p-4 space-y-4 shadow-sm">
                                                                        <div>
                                                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                                                <IconCamera className="w-4 h-4 text-gray-400" />
                                                                                {selectedHistoryItem.isLeave
                                                                                    ? "หลักฐานการลางาน"
                                                                                    : "หลักฐานการลงชื่อเข้างาน"}
                                                                            </div>
                                                                            {selectedHistoryItem.evidence ? (
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[8px] p-2 flex-1 min-w-0">
                                                                                        <div className="w-10 h-10 rounded-[4px] overflow-hidden flex items-center justify-center shrink-0 bg-gray-100">
                                                                                            <img src="/assets/images/profile-34.jpeg" alt="thumbnail" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                                                        </div>
                                                                                        <div className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                                                            {selectedHistoryItem.evidence}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-xs text-gray-500 italic flex items-center gap-2">
                                                                                    <div className="w-8 h-8 rounded-[4px] bg-[#6B7280] flex items-center justify-center text-white shrink-0">
                                                                                        <IconGallery className="w-5 h-5 text-white" />
                                                                                    </div>
                                                                                    ไม่มีไฟล์แนบ
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {selectedHistoryItem.isLeave && (
                                                                            <div>
                                                                                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                                                                                        <path d="M9 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                                        <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                                        <path d="M9 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                                    </svg>
                                                                                    รายละเอียดการลา
                                                                                </div>
                                                                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[8px] p-3 min-h-[50px] text-[14px] text-gray-600 dark:text-gray-300 font-medium">
                                                                                    {selectedHistoryItem.leaveReason}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {!selectedHistoryItem.approvalStatus &&
                                                                        (selectedHistoryItem.status === "สาย" ||
                                                                            selectedHistoryItem.statusType ===
                                                                            "warning" ||
                                                                            selectedHistoryItem.statusType ===
                                                                            "danger" ||
                                                                            selectedHistoryItem.statusType ===
                                                                            "default") && (
                                                                            <div className="flex justify-end pt-4">
                                                                                <button
                                                                                    type="button"
                                                                                    className="px-6 py-2 bg-[#A80689] text-white rounded-full text-sm font-bold shadow-md hover:bg-[#A80689]/90 transition-colors"
                                                                                    onClick={() => {
                                                                                        localStorage.setItem(
                                                                                            "editItem",
                                                                                            JSON.stringify(
                                                                                                selectedHistoryItem,
                                                                                            ),
                                                                                        );
                                                                                        router.push("/intern/history/edit-time");
                                                                                    }}
                                                                                >
                                                                                    ส่งคำขอแก้ไขเวลา
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        </div>
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
        </div>
    );
};

export default AttendanceHistoryPage;
