"use client";
import React, { useState, Fragment } from "react";
import IconCircleCheck from "@/components/icon/icon-circle-check";
import IconClock from "@/components/icon/icon-clock";
import IconFile from "@/components/icon/icon-file";
import IconXCircle from "@/components/icon/icon-x-circle";
import IconArrowLeft from "@/components/icon/icon-arrow-left";
import IconShare from "@/components/icon/icon-share";
import { Transition, Dialog } from "@headlessui/react";
import IconMapPin from "@/components/icon/icon-map-pin";
import IconCamera from "@/components/icon/icon-camera";
import IconX from "@/components/icon/icon-x";
import IconArchive from "@/components/icon/icon-archive";
import EditTimeForm from "@/components/history/edit-time-form";
import IconGallery from "@/components/icon/icon-gallery";
import MonthPicker from "@/components/history/month-picker";
import { useRouter } from "next/navigation";

const AttendanceHistoryPage = () => {
    const router = useRouter();

    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);

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
            icon: <IconCircleCheck className="w-7 h-7 text-[#10b981]" />,
            bgColor: "bg-[#e7faef]",
            textColor: "text-[#10b981]",
        },
        {
            title: "สาย",
            days: 1,
            icon: <IconClock className="w-7 h-7 text-[#f59e0b]" />,
            bgColor: "bg-[#fdf4d6]",
            textColor: "text-[#f59e0b]",
        },
        {
            title: "ลา",
            days: 4,
            icon: <IconFile className="w-7 h-7 text-[#3b82f6]" />,
            bgColor: "bg-[#eef8ff]",
            textColor: "text-[#3b82f6]",
        },
        {
            title: "ขาด",
            days: 1,
            icon: <IconXCircle className="w-7 h-7 text-[#ef4444]" />,
            bgColor: "bg-[#fceded]",
            textColor: "text-[#ef4444]",
        },
    ];

    const historyData = [
        {
            date: "1",
            month: "ม.ค.",
            labelMobile: "1 มกราคม 2569",
            time: "เวลาทำงาน --:--",
            status: "ขาด",
            statusType: "danger",
            location: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
            checkInTime: "--:--",
            checkOutTime: "--:--",
            workingHours: "0 ชั่วโมง",
            approvalStatus: "denied",
            reqCheckInTime: "08:30",
            reqCheckOutTime: "16:30",
            reqWorkingHours: "7 ชั่วโมง",
            reqReason: "ระบบขัดข้องทำให้ลงเวลาไม่ได้",
            evidence: null,
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
        if (type === "success") {
            icon = <IconCircleCheck className="w-3 h-3 mr-1 text-[#10b981]" />;
            colorClass =
                "px-2 py-0.5 bg-[#ebfbf3] text-[#10b981] border border-[#10b981] rounded-full flex items-center text-[11px] font-bold";
        } else if (type === "warning") {
            icon = <IconClock className="w-3 h-3 mr-1 text-[#f59e0b]" />;
            colorClass =
                "px-2 py-0.5 bg-[#fef4d4] text-[#f59e0b] border border-[#f59e0b] rounded-full flex items-center text-[11px] font-bold";
        } else if (type === "info") {
            icon = <IconFile className="w-3 h-3 mr-1 text-[#3b82f6]" />;
            colorClass =
                "px-2 py-0.5 bg-[#e5f5ff] text-[#3b82f6] border border-[#3b82f6] rounded-full flex items-center text-[11px] font-bold";
        } else if (type === "danger") {
            icon = (
                <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 mr-1 focus:outline-none">
                    <IconX className="w-2.5 h-2.5" />
                </div>
            );
            colorClass =
                "px-2 py-0.5 bg-[#FFEBEC] text-[#F97066] border border-[#F97066] rounded-full flex items-center text-[11px] font-bold";
        } else if (type === "default") {
            icon = (
                <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center mr-1 text-white relative overflow-hidden shrink-0">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                    </svg>
                    <div className="absolute w-[18px] h-[1px] bg-white rotate-[-45deg]"></div>
                </div>
            );
            colorClass =
                "px-2 py-0.5 bg-[#F5F5F5] dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-[#CECFD2] dark:border-gray-700 rounded-full flex items-center text-[11px] font-bold";
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
                                    <div className="flex-shrink-0 bg-white dark:bg-black sm:bg-transparent sm:dark:bg-transparent w-8 h-8 sm:w-auto sm:h-auto rounded-full sm:rounded-none flex items-center justify-center shadow-sm sm:shadow-none sm:mr-4">
                                        {React.cloneElement(item.icon, {
                                            className: "w-5 h-5 sm:w-8 sm:h-8 " + item.textColor,
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
                                            className={`w-full max-w-lg transform text-left align-middle shadow-xl transition-all ${isEditingTime
                                                    ? "rounded-none sm:rounded-2xl bg-white dark:bg-[#1A1A1A] p-6 min-h-screen sm:min-h-0 sm:h-auto sm:max-h-[85vh] overflow-y-auto"
                                                    : "rounded-t-[25px] sm:rounded-2xl bg-white dark:bg-[#1A1A1A] p-6 h-[62vh] sm:h-auto max-h-[62vh] sm:max-h-none overflow-y-auto sm:overflow-visible"
                                                }`}
                                        >
                                            {/* Drawer Handle for mobile (hide when editing) */}
                                            {!isEditingTime && (
                                                <div className="flex justify-center mb-4 sm:hidden">
                                                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                                </div>
                                            )}

                                            {/* Close button for desktop */}
                                            <button
                                                type="button"
                                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 hidden sm:block"
                                                onClick={() => setIsDetailModalOpen(false)}
                                            >
                                                <IconX className="w-5 h-5" />
                                            </button>

                                            {selectedHistoryItem && (
                                                <div className="space-y-4 text-black dark:text-white-light sm:pb-0 pb-6">
                                                    {isEditingTime ? (
                                                        <EditTimeForm
                                                            selectedHistoryItem={selectedHistoryItem}
                                                            setIsEditingTime={setIsEditingTime}
                                                        />
                                                    ) : selectedHistoryItem.statusType === "danger" &&
                                                        !selectedHistoryItem.approvalStatus ? (
                                                        <div className="flex flex-col pb-2">
                                                            {/* Header */}
                                                            <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                                                                {selectedHistoryItem.labelMobile}
                                                            </div>
                                                            <div className="inline-flex items-center px-4 py-1.5 bg-[#FFEAEC] text-[#D92D20] border border-[#FCA5A5] rounded-full text-xs font-bold gap-1.5 w-fit">
                                                                <div className="w-5 h-5 bg-[#D92D20] rounded-full flex items-center justify-center text-white shrink-0">
                                                                    <IconX className="w-3 h-3" />
                                                                </div>
                                                                {selectedHistoryItem.status}
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
                                                                        router.push("/history/edit-time");
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
                                                                {/* Date & Time Header */}
                                                                <div>
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
                                                                        className={`inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold gap-2 border ${selectedHistoryItem.status ===
                                                                                "เข้างานปกติ" ||
                                                                                selectedHistoryItem.statusType ===
                                                                                "success"
                                                                                ? "bg-[#E7FAEF] text-[#059669] border-[#10B981]"
                                                                                : selectedHistoryItem.status ===
                                                                                    "สาย" ||
                                                                                    selectedHistoryItem.statusType ===
                                                                                    "warning"
                                                                                    ? "bg-[#FFF9E6] text-[#D97706] border-[#FDE68A]"
                                                                                    : selectedHistoryItem.status ===
                                                                                        "ไม่ลงเวลาออก" ||
                                                                                        selectedHistoryItem.status ===
                                                                                        "ขาด" ||
                                                                                        selectedHistoryItem.statusType ===
                                                                                        "danger"
                                                                                        ? "bg-[#F3F4F6] text-[#6B7280] border-[#D1D5DB]"
                                                                                        : selectedHistoryItem.status ===
                                                                                            "ลา" &&
                                                                                            selectedHistoryItem.leaveType ===
                                                                                            "ลาป่วย"
                                                                                            ? "bg-[#FFF1F2] text-[#E11D48] border-[#FDA4AF]"
                                                                                            : selectedHistoryItem.isLeave
                                                                                                ? "bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]"
                                                                                                : "bg-[#F5F5F5] text-[#6B7280] border-[#E5E7EB]"
                                                                            }`}
                                                                    >
                                                                        {selectedHistoryItem.status ===
                                                                            "เข้างานปกติ" ||
                                                                            selectedHistoryItem.statusType ===
                                                                            "success" ? (
                                                                            <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center text-white shrink-0">
                                                                                <svg
                                                                                    className="w-3.5 h-3.5"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="4"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                >
                                                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                                                </svg>
                                                                            </div>
                                                                        ) : selectedHistoryItem.status === "สาย" ||
                                                                            selectedHistoryItem.statusType ===
                                                                            "warning" ? (
                                                                            <IconClock className="w-4 h-4" />
                                                                        ) : selectedHistoryItem.status === "ขาด" ||
                                                                            selectedHistoryItem.statusType ===
                                                                            "danger" ? (
                                                                            <div className="w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0">
                                                                                <IconX className="w-3.5 h-3.5" />
                                                                            </div>
                                                                        ) : selectedHistoryItem.status === "ลา" &&
                                                                            selectedHistoryItem.leaveType ===
                                                                            "ลาป่วย" ? (
                                                                            <div className="w-5 h-5 bg-[#E11D48] rounded-md flex items-center justify-center text-white">
                                                                                <svg
                                                                                    className="w-3.5 h-3.5 fill-current"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                                                                </svg>
                                                                            </div>
                                                                        ) : selectedHistoryItem.isLeave ? (
                                                                            <IconArchive className="w-4 h-4" />
                                                                        ) : (
                                                                            <div className="w-[18px] h-[18px] rounded-full bg-[#9CA3AF] flex items-center justify-center text-white relative overflow-hidden shrink-0">
                                                                                <svg
                                                                                    className="w-2.5 h-2.5 fill-current"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                                                                                </svg>
                                                                                <div className="absolute w-[20px] h-[1px] bg-white rotate-[-45deg]"></div>
                                                                            </div>
                                                                        )}
                                                                        {selectedHistoryItem.status === "ลา"
                                                                            ? selectedHistoryItem.leaveType
                                                                            : selectedHistoryItem.status ===
                                                                                "เข้างานปกติ" ||
                                                                                selectedHistoryItem.statusType ===
                                                                                "success"
                                                                                ? "เข้างานปกติ"
                                                                                : selectedHistoryItem.status}
                                                                    </div>
                                                                </div>

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
                                                                    <div className="flex flex-col gap-6">
                                                                        <hr className="w-full h-[1px] bg-[#CECFD2] border-none" />

                                                                        {/* Evidence Section (Leave) */}
                                                                        <div>
                                                                            <div className="flex items-center gap-3 text-[15px] font-bold text-[#1C1C1C] mb-3">
                                                                                <IconCamera className="w-6 h-6" />
                                                                                หลักฐานการลา
                                                                            </div>
                                                                            <div className="bg-white border border-[#ECECED] rounded-[10px] p-2 flex items-center gap-3">
                                                                                <div className="w-12 h-12 rounded-[6px] overflow-hidden bg-gray-200">
                                                                                    <img
                                                                                        src="/assets/images/sample-leave.jpg"
                                                                                        alt="Leave"
                                                                                        className="w-full h-full object-cover"
                                                                                        onError={(e) =>
                                                                                        (e.currentTarget.style.display =
                                                                                            "none")
                                                                                        }
                                                                                    />
                                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-[10px] font-bold">
                                                                                        IMG
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-[14px] font-bold text-[#1C1C1C]">
                                                                                    {selectedHistoryItem.evidence}{" "}
                                                                                    <span className="text-gray-500 font-normal">
                                                                                        {selectedHistoryItem.evidenceSize}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Reason Section (Leave) */}
                                                                        <div>
                                                                            <div className="flex items-center gap-3 text-[15px] font-bold text-[#1C1C1C] mb-3">
                                                                                <svg
                                                                                    className="w-6 h-6 fill-none stroke-[#1C1C1C]"
                                                                                    strokeWidth="2"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                    />
                                                                                </svg>
                                                                                รายละเอียดการลา
                                                                            </div>
                                                                            <div className="bg-[#F8F9FA] border border-[#ECECED] rounded-[10px] p-4 text-[15px] font-bold text-[#1C1C1C]">
                                                                                {selectedHistoryItem.leaveReason ||
                                                                                    "เข้าร่วมประชุมกับทางมหาวิทยาลัย"}
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
                                                                                    <div className="flex items-start gap-3">
                                                                                        <IconMapPin className="w-5 h-5 text-[#1C1C1C] shrink-0 mt-0.5" />
                                                                                        <div className="font-bold text-[14px] text-[#1C1C1C]">
                                                                                            อยู่ในสถานที่
                                                                                        </div>
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
                                                                                    <div className="flex items-center gap-3 text-[#A80689] font-bold text-[14px]">
                                                                                        <div className="w-7 h-7 rounded-full bg-[#A80689] flex items-center justify-center text-white">
                                                                                            <IconClock className="w-4 h-4 text-[#D97706]" />
                                                                                        </div>
                                                                                        คำขอแก้ไขเวลา
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
                                                                                <div className="flex items-start gap-3">
                                                                                    <IconMapPin className="w-6 h-6 text-[#1C1C1C] shrink-0 mt-0.5" />
                                                                                    <div className="font-bold text-[15px] text-[#1C1C1C]">
                                                                                        {(selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.status === "สาย" || selectedHistoryItem.status === "ไม่ลงเวลาออก") ? "อยู่ในสถานที่" : selectedHistoryItem.location}
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
                                                                        <div>
                                                                            {(selectedHistoryItem.status === "เข้างานปกติ" || selectedHistoryItem.status === "สาย" || selectedHistoryItem.status === "ไม่ลงเวลาออก") ? (
                                                                                <div className="flex items-center gap-2 text-[15px] font-bold text-[#1C1C1C]">
                                                                                    <span className="whitespace-nowrap">ไฟล์แนบ :</span>
                                                                                    {selectedHistoryItem.evidence ? (
                                                                                        <div className="bg-[#F3F4F6] border border-[#ECECED] rounded-[8px] px-3 py-1.5 flex items-center gap-2 max-w-[200px]">
                                                                                            <div className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center shrink-0">
                                                                                                <div className="text-[7px] font-bold text-gray-800 leading-none">PDF</div>
                                                                                            </div>
                                                                                            <div className="text-[14px] font-medium text-[#1C1C1C] truncate">
                                                                                                {selectedHistoryItem.evidence}
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-gray-500 font-normal">ไม่มีไฟล์แนบ</span>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="flex items-center gap-3 text-[15px] font-bold text-[#1C1C1C] mb-3">
                                                                                        <IconCamera className="w-6 h-6" />
                                                                                        หลักฐานการเข้างาน
                                                                                    </div>
                                                                                    {selectedHistoryItem.evidence ? (
                                                                                        <div className="bg-[#F8F9FA] border border-[#ECECED] rounded-[10px] p-2 flex items-center gap-3">
                                                                                            <div className="w-12 h-12 rounded-[6px] overflow-hidden bg-gray-200">
                                                                                                <img
                                                                                                    src="/assets/images/sample-evidence.jpg"
                                                                                                    alt="Evidence"
                                                                                                    className="w-full h-full object-cover"
                                                                                                    onError={(e) =>
                                                                                                    (e.currentTarget.style.display =
                                                                                                        "none")
                                                                                                    }
                                                                                                />
                                                                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-[10px] font-bold">
                                                                                                    IMG
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="text-[14px] font-bold text-[#1C1C1C]">
                                                                                                {selectedHistoryItem.evidence}{" "}
                                                                                                <span className="text-gray-500 font-normal">
                                                                                                    {selectedHistoryItem.evidenceSize}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="bg-[#F8F9FA] border border-[#D1D5DB] rounded-[10px] p-2 flex items-center gap-3">
                                                                                            <div className="w-8 h-8 rounded-[4px] bg-[#6B7280] flex items-center justify-center text-white shrink-0">
                                                                                                <IconGallery className="w-5 h-5" />
                                                                                            </div>
                                                                                            <div className="text-[14px] font-bold text-[#1C1C1C]">
                                                                                                ไม่มีไฟล์แนบ
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </>
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
                                                                                    router.push("/history/edit-time");
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
                                                                            <div className="inline-flex items-center px-4 py-1 bg-[#eef8ff] dark:bg-blue-900/20 text-[#3b82f6] border border-[#3b82f6] rounded-full text-xs font-semibold gap-1.5 mt-1">
                                                                                <IconArchive className="w-3.5 h-3.5" />
                                                                                {selectedHistoryItem.leaveType}
                                                                            </div>
                                                                        ) : selectedHistoryItem.statusType ===
                                                                            "default" ? (
                                                                            <div className="inline-flex items-center px-4 py-1 bg-[#F3F4F6] text-gray-500 border border-gray-300 rounded-full text-xs font-semibold gap-1.5 mt-1">
                                                                                <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-white">
                                                                                    <svg
                                                                                        className="w-2.5 h-2.5 fill-current"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                                                                                    </svg>
                                                                                </div>
                                                                                {selectedHistoryItem.status}
                                                                            </div>
                                                                        ) : (
                                                                            <div
                                                                                className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold gap-1.5 mt-1 border ${selectedHistoryItem.status ===
                                                                                        "เข้างานปกติ" ||
                                                                                        selectedHistoryItem.statusType ===
                                                                                        "success"
                                                                                        ? "bg-[#E7FAEF] text-[#059669] border-[#10B981]"
                                                                                        : "bg-[#FFF9E6] text-[#D97706] border-[#FDE68A]"
                                                                                    }`}
                                                                            >
                                                                                {selectedHistoryItem.status ===
                                                                                    "เข้างานปกติ" ||
                                                                                    selectedHistoryItem.statusType ===
                                                                                    "success" ? (
                                                                                    <div className="w-4 h-4 bg-[#10B981] rounded-full flex items-center justify-center text-white shrink-0">
                                                                                        <svg
                                                                                            className="w-2.5 h-2.5"
                                                                                            viewBox="0 0 24 24"
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            strokeWidth="4"
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                        >
                                                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                                                        </svg>
                                                                                    </div>
                                                                                ) : (
                                                                                    <IconClock className="w-3.5 h-3.5 text-[#D97706]" />
                                                                                )}
                                                                                {selectedHistoryItem.status}
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
                                                                                <div className="flex items-start gap-3">
                                                                                    <IconMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                                                                    <div className="font-semibold text-[14px]">
                                                                                        อยู่ในสถานที่ (ข้อมูลเดิม)
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
                                                                                <div className="flex items-center gap-3 text-[#A80689] font-bold text-[14px]">
                                                                                    <div className="w-7 h-7 rounded-full bg-[#A80689] flex items-center justify-center text-white">
                                                                                        <IconClock className="w-4 h-4 text-[#D97706]" />
                                                                                    </div>
                                                                                    คำขอแก้ไขเวลา
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
                                                                            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                                                                <IconMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                                                                <div className="font-semibold text-[14px]">
                                                                                    {selectedHistoryItem.status === "เข้างานปกติ" ? "อยู่ในสถานที่" : selectedHistoryItem.location}
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-2">
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
                                                                                    ? "หลักฐานการลา"
                                                                                    : "หลักฐานการลงชื่อเข้างาน"}
                                                                            </div>
                                                                            {selectedHistoryItem.evidence ? (
                                                                                <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 gap-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                                                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                                                                                IMG
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                                                                            {selectedHistoryItem.evidence}{" "}
                                                                                            <span className="text-gray-400 font-normal">
                                                                                                {
                                                                                                    selectedHistoryItem.evidenceSize
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-xs text-gray-500 italic">
                                                                                    ไม่มีไฟล์แนบ
                                                                                </div>
                                                                            )}
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
                                                                                        router.push("/history/edit-time");
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
