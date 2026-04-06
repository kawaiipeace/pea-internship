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
import IconPaperclip from "@/components/icon/icon-paperclip";
import { useEffect, useCallback } from "react";
import axiosInstance from "@/api/axios";

const AttendanceHistoryPage = () => {
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [summaryCounts, setSummaryCounts] = useState({
    present: 0,
    late: 0,
    leave: 0,
    absent: 0,
    missingOut: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0
  });

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

  const handleViewFile = async (key: string, filename: string) => {
    try {
      const response = await axiosInstance.get(`/check-time/file`, {
        params: { key: key },
        responseType: "arraybuffer", // Use arraybuffer for maximum binary precision
        transformResponse: [data => data], // Force Axios to NOT transform the data
      });

      // Get content type from response headers, fallback to application/pdf for PDF files
      let contentType = response.headers["content-type"];
      if (!contentType || contentType === "text/plain" || contentType === "application/octet-stream") {
        if (filename.toLowerCase().endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (filename.toLowerCase().endsWith(".png")) {
            contentType = "image/png";
        }
      }

      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(url, "_blank");

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Failed to view file:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดไฟล์ได้",
        confirmButtonText: "ตกลง",
      });
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

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      // BE Year to AD Year (BE = AD + 543)
      const adYear = currentYear - 543;
      const monthForApi = currentMonth + 1; // API expects 1-12

      const response = await axiosInstance.get(`/check-time/history`, {
        params: {
          year: adYear,
          month: monthForApi,
          page: pagination.page,
          limit: 10
        }
      });

      if (response.data) {
        const { summary, records, pagination: paginationData } = response.data;
        
        // Map records to UI format
        const mappedRecords = records.map((log: any) => {
          const date = new Date(log.workDate);
          const day = date.getDate().toString();
          const monthIndex = date.getMonth();
          const year = date.getFullYear() + 543;
          
          const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
          const thaiMonthsFull = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

          let statusType = "default";
          let statusLabel = log.displayStatus;

          switch (log.displayStatus) {
            case 'PRESENT':
              statusLabel = "เข้างานปกติ";
              statusType = "success";
              break;
            case 'LATE':
              statusLabel = "สาย";
              statusType = "warning";
              break;
            case 'LEAVE':
              statusLabel = "ลา";
              statusType = "info";
              break;
            case 'ABSENT':
              statusLabel = "ขาดงาน";
              statusType = "danger";
              break;
            case 'MISSING_OUT':
              statusLabel = "ไม่ลงเวลาออก";
              statusType = "default";
              break;
          }

          let approvalStatus = null;
          if (log.correctionStatus) {
            approvalStatus = log.correctionStatus.toLowerCase();
            if (approvalStatus === 'rejected') approvalStatus = 'denied';
          }

          return {
            id: log.id,
            date: day,
            month: thaiMonthsShort[monthIndex],
            labelMobile: `${day} ${thaiMonthsFull[monthIndex]} ${year}`,
            time: `เวลาทำงาน ${log.checkInTime} - ${log.checkOutTime}`,
            status: statusLabel,
            statusType: statusType,
            checkInTime: log.checkInTime,
            checkOutTime: log.checkOutTime,
            location: log.location,
            workingHours: log.workingHours,
            approvalStatus: approvalStatus,
            isLeave: log.displayStatus === 'LEAVE',
            isEdited: log.isEdited,
            correctionId: log.correctionId
          };
        });

        setHistoryItems(mappedRecords);
        setSummaryCounts(summary);
        setPagination({
          page: paginationData.page,
          totalPages: paginationData.totalPages,
          totalRecords: paginationData.totalRecords
        });
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถดึงข้อมูลประวัติการลงเวลาได้',
        confirmButtonText: 'ตกลง'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, currentYear, pagination.page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const fetchCorrectionDetail = async (correctionId: number) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/check-time/edit/${correctionId}`);
      if (response.data && response.data.success) {
        const detail = response.data.data;
        
        // Merge detail into selectedHistoryItem
        setSelectedHistoryItem((prev: any) => ({
          ...prev,
          reqCheckInTime: detail.requested.checkInTime,
          reqCheckOutTime: detail.requested.checkOutTime,
          reqWorkingHours: `${detail.requested.hoursWorked} ชั่วโมง`,
          reqReason: detail.reason,
          evidence: detail.attachment.name,
          evidenceUrl: detail.attachment.url,
          originalCheckInTime: detail.original.checkInTime,
          originalCheckOutTime: detail.original.checkOutTime,
          originalWorkingHours: `${detail.original.hoursWorked} ชั่วโมง`,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch correction detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Dummy Data
  // Dynamic Summary Data from API
  const summaryData = [
    {
      title: "เข้างานปกติ",
      days: summaryCounts.present,
      icon: (
        <svg
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          viewBox="0 0 24 24"
          className="w-7 h-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      ),
      bgColor: "bg-[#e7faef]",
      textColor: "text-[#10b981]",
      iconBg: "bg-[#10b981]",
    },
    {
      title: "สาย",
      days: summaryCounts.late,
      icon: (
        <span className="material-symbols-rounded !text-[28px]">schedule</span>
      ),
      bgColor: "bg-[#fdf4d6]",
      textColor: "text-[#f59e0b]",
      iconBg: "bg-[#f59e0b]",
    },
    {
      title: "ลา",
      days: summaryCounts.leave,
      icon: (
        <span className="material-symbols-rounded !text-[28px] flex items-center justify-center">lab_profile</span>
      ),
      bgColor: "bg-[#eef8ff]",
      textColor: "text-[#3b82f6]",
      iconBg: "bg-[#3b82f6]",
    },
    {
      title: "ขาด",
      days: summaryCounts.absent,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-7 h-7"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      ),
      bgColor: "bg-[#fceded]",
      textColor: "text-[#ef4444]",
      iconBg: "bg-[#ef4444]",
    },
  ];


  const filteredHistoryData = selectedFilter
    ? historyItems.filter((item) => item.status === selectedFilter)
    : historyItems;

  const getStatusBadge = (type: string, status: string) => {
    let icon = null;
    let colorClass = "";

    if (type === "success" || status === "เข้างานปกติ") {
      icon = (
        <div className="w-4 h-4 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm">
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
      );
      colorClass =
        "px-2 py-0.5 bg-[#e7faef] text-[#10b981] border border-[#10b981] rounded-full flex items-center text-[11px] font-bold";
    } else if (type === "warning" || status === "สาย") {
      icon = (
        <div className="w-4 h-4 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm overflow-hidden">
          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center">
            schedule
          </span>
        </div>
      );
      colorClass =
        "px-2 py-0.5 bg-[#fdf4d6] text-[#f59e0b] border border-[#f59e0b] rounded-full flex items-center text-[11px] font-bold";
    } else if (type === "info" || status === "ลา") {
      icon = (
        <div className="w-4 h-4 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm overflow-hidden">
          <span className="material-symbols-rounded !text-[12px] flex items-center justify-center">
            lab_profile
          </span>
        </div>
      );
      colorClass =
        "px-2 py-0.5 bg-[#eef8ff] text-[#3b82f6] border border-[#3b82f6] rounded-full flex items-center text-[11px] font-bold";
    } else if (type === "danger" || status === "ขาด") {
      icon = (
        <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 mr-1.5 shadow-sm focus:outline-none">
          <IconX className="w-2.5 h-2.5" />
        </div>
      );
      colorClass =
        "px-2 py-0.5 bg-[#FCEDED] text-[#EF4444] border border-[#EF4444] rounded-full flex items-center text-[11px] font-bold";
    } else if (type === "default" || status === "ไม่ลงเวลาออก") {
      icon = (
        <div className="w-[18px] h-[18px] rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
          <span className="material-symbols-rounded !text-[12px] leading-none">
            hourglass_disabled
          </span>
        </div>
      );
      colorClass =
        "w-[100px] h-[26px] px-1 bg-[#F3F4F6] text-[#6B7280] border border-[#6B7280] rounded-full flex items-center gap-1.5 text-[11px] font-bold shrink-0";
    }

    return (
      <div className={colorClass}>
        {icon}
        {status}
      </div>
    );
  };

  return (
    <div className="-m-6 p-[22px] sm:p-6 text-black dark:text-white-light bg-[#fffbf7] dark:bg-black min-h-screen relative">
      {isLoading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[2px]">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A80689]"></div>
        </div>
      )}
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
                  className={`panel ${item.bgColor} flex flex-col sm:flex-row justify-between sm:justify-start items-center sm:items-center p-3 sm:px-4 sm:py-5 rounded-[10px] shadow-none dark:bg-opacity-20 shrink-0 w-[100px] h-[120px] sm:w-[200px] sm:h-[90px] text-center sm:text-left transition-all ${isSelected ? `border-2 ${borderColorClass}` : "border-2 border-transparent hover:-translate-y-1"}`}
                >
                  <div
                    className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center sm:mr-4 ${item.iconBg} shadow-sm sm:shadow-none`}
                  >
                    {React.cloneElement(item.icon as any, {
                      className: `${(item.icon as any).props.className || ""} ${item.title === "สาย" || item.title === "ลา" || item.title === "เข้างานปกติ" || item.title === "ขาด" ? "" : "w-6 h-6"} text-white`.trim(),
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
            รายการลงเวลาทั้งหมด {pagination.totalRecords} วัน
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
                      
                      if (item.isEdited && item.correctionId) {
                        fetchCorrectionDetail(item.correctionId);
                      }
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
                          className={`px-2 py-0.5 rounded-full text-[12px] ${
                            item.approvalStatus === "approved"
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
                          className={`px-2 py-0.5 rounded-full text-[12px] ${
                            item.approvalStatus === "approved"
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
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 disabled:opacity-50"
            >
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
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              // Simple logic for showing around current page
              let pageNum = 1;
              if (pagination.totalPages <= 5) pageNum = i + 1;
              else if (pagination.page <= 3) pageNum = i + 1;
              else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
              else pageNum = pagination.page - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-2.5 py-1 sm:px-3.5 sm:py-1 text-xs sm:text-base font-bold border-r border-gray-200 dark:border-gray-700 shrink-0 ${
                    pagination.page === pageNum 
                    ? "text-gray-800 dark:text-gray-200 bg-[#dce0e5] dark:bg-gray-600" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-2 py-1.5 sm:px-3 sm:py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-[#121212] flex items-center justify-center shrink-0 disabled:opacity-50"
            >
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
                      className={`w-full ${isEditingTime ? "sm:max-w-[880px]" : "max-w-lg"} transform text-left align-middle shadow-xl transition-all ${
                        isEditingTime
                          ? "rounded-t-[25px] sm:rounded-2xl bg-white dark:bg-[#1A1A1A] px-6 pb-6 pt-2 h-[calc(100vh-48px)] mt-12 sm:mt-0 sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden sm:block sm:overflow-y-auto"
                          : "rounded-t-[25px] sm:rounded-2xl bg-white dark:bg-[#1A1A1A] p-6 h-[62vh] sm:h-auto max-h-[62vh] sm:max-h-none flex flex-col overflow-hidden sm:block sm:overflow-y-auto sm:overflow-visible"
                      }`}
                      style={{
                        transform:
                          touchTranslateY > 0
                            ? `translateY(${touchTranslateY}px)`
                            : undefined,
                        transition:
                          touchStart === null
                            ? "transform 0.3s ease-out"
                            : "none",
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
                        <div className="flex-1 overflow-y-auto sm:overflow-visible space-y-4 text-black dark:text-white-light sm:pb-0 pb-6 pr-0.5 scrollbar-hide">
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
                              <div
                                className="pb-2 pt-1 touch-none"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                              >
                                <div className="text-[14px] text-gray-800 dark:text-gray-200 mb-2">
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
                              <div className="flex flex-col items-center justify-start flex-1 pt-0 pb-4 px-4">
                                {/* Custom CSS Absent Calendar Illustration */}
                                <div className="relative w-40 h-40 mb-2 flex items-center justify-center">
                                  {/* Soft red background circle */}
                                  <div className="absolute inset-2 bg-[#FFEAEC] dark:bg-red-900/30 rounded-full"></div>
                                  {/* Base shadow oval */}
                                  <div className="absolute w-[100px] h-3 bg-[#FCA5A5]/40 rounded-[100%] bottom-6 blur-[3px]"></div>

                                  {/* Calendar Body */}
                                  <div className="relative w-[100px] h-[110px] bg-white dark:bg-[#202020] rounded-[16px] shadow-sm flex flex-col z-10 overflow-hidden">
                                    {/* Calendar Header */}
                                    <div className="h-[32px] bg-[#EF4444] w-full shrink-0"></div>

                                    {/* Calendar Content */}
                                    <div className="flex flex-1 w-full flex items-center justify-center">
                                      <svg
                                        className="w-12 h-12 text-[#EF4444]"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </div>
                                  </div>

                                  {/* Calendar Rings */}
                                  <div className="absolute top-[37px] left-[52px] w-[12px] h-[20px] border-[3px] border-[#CBD5E1] dark:border-gray-500 rounded-full bg-[#F8FAFC] dark:bg-gray-800 z-20"></div>
                                  <div className="absolute top-[37px] right-[52px] w-[12px] h-[20px] border-[3px] border-[#CBD5E1] dark:border-gray-500 rounded-full bg-[#F8FAFC] dark:bg-gray-800 z-20"></div>
                                </div>
                                <div className="text-[14px] text-[#000000] dark:text-gray-200 mb-1">
                                  ไม่มีการลงเวลาในวันนี้
                                </div>
                                <div className="text-[14px] text-[#000000] dark:text-gray-200 text-center">
                                  หากมาทำงานปกติ โปรดส่งคำขอแก้ไขเวลา
                                </div>
                              </div>

                              {/* Button */}
                              <div className="flex justify-center mt-4 mb-1">
                                <button
                                  type="button"
                                  className="w-[375px] max-w-full h-[45px] bg-[#A80689] text-white rounded-[5px] text-[15px] font-bold shadow-sm hover:bg-[#A80689]/90 transition-colors flex items-center justify-center"
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
                              <div className="sm:hidden flex flex-col gap-4 w-full max-w-[345px] mx-auto">
                                {!selectedHistoryItem.isLeave && (
                                  <div
                                    className="pb-1 touch-none"
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                  >
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-start justify-between">
                                        <div className="text-[14px] text-gray-900 leading-tight">
                                          {selectedHistoryItem.labelMobile}
                                        </div>
                                        {selectedHistoryItem.approvalStatus && (
                                          <div
                                            className={`px-2 py-0.5 rounded-full text-[12px] ${
                                              selectedHistoryItem.approvalStatus ===
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
                                      <div className="text-[17px] font-bold text-gray-900 leading-tight">
                                        {selectedHistoryItem.statusType ===
                                        "danger"
                                          ? "ขาดงาน"
                                          : selectedHistoryItem.isLeave
                                            ? "ลางานเต็มวัน"
                                            : selectedHistoryItem.time.includes(
                                                  "เวลาทำงาน",
                                                )
                                              ? selectedHistoryItem.time
                                              : `เวลาทำงาน ${selectedHistoryItem.time}`}
                                      </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div
                                      className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold gap-1.5 border mt-2 shrink-0 ${
                                        selectedHistoryItem.status ===
                                        "ไม่ลงเวลาออก"
                                          ? "w-[100px] h-[26px] px-1 bg-[#F3F4F6] text-[#6B7280] border-[#6B7280]"
                                          : `w-fit min-w-[75px] px-2 py-1 ${
                                              selectedHistoryItem.status ===
                                                "เข้างานปกติ" ||
                                              selectedHistoryItem.statusType ===
                                                "success"
                                                ? "bg-[#E7FAEF] text-[#10B981] border-[#10B981]"
                                                : selectedHistoryItem.status ===
                                                      "สาย" ||
                                                    selectedHistoryItem.statusType ===
                                                      "warning"
                                                  ? "bg-[#FDF4D6] text-[#F59E0B] border-[#F59E0B]"
                                                  : selectedHistoryItem.status ===
                                                        "ขาด" ||
                                                      selectedHistoryItem.statusType ===
                                                        "danger"
                                                    ? "bg-[#FCEDED] text-[#EF4444] border-[#EF4444]"
                                                    : selectedHistoryItem.leaveType ===
                                                        "ลาป่วย"
                                                      ? "bg-[#FFEBF5] text-[#D42A8C] border-[#D42A8C]"
                                                      : "bg-[#EEF4FF] text-[#4386F9] border-[#4386F9]"
                                            }`
                                      }`}
                                    >
                                      {selectedHistoryItem.status ===
                                        "เข้างานปกติ" ||
                                      selectedHistoryItem.statusType ===
                                        "success" ? (
                                        <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                          <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        </div>
                                      ) : selectedHistoryItem.status ===
                                          "สาย" ||
                                        selectedHistoryItem.statusType ===
                                          "warning" ? (
                                        <div className="w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                          <span className="material-symbols-rounded !text-[14px] flex items-center justify-center">
                                            schedule
                                          </span>
                                        </div>
                                      ) : selectedHistoryItem.status ===
                                          "ขาด" ||
                                        selectedHistoryItem.statusType ===
                                          "danger" ? (
                                        <div className="w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                          <IconX className="w-3 h-3 text-white" />
                                        </div>
                                      ) : selectedHistoryItem.leaveType ===
                                        "ลาป่วย" ? (
                                        <div className="w-5 h-5 bg-[#D42A8C] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                          <span className="material-symbols-rounded !text-[14px] leading-none text-white">
                                            lab_profile
                                          </span>
                                        </div>
                                      ) : selectedHistoryItem.status === "ลา" ||
                                        selectedHistoryItem.isLeave ? (
                                        <div className="w-5 h-5 bg-[#4386F9] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                          <span className="material-symbols-rounded !text-[14px] flex items-center justify-center">
                                            lab_profile
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="w-[18px] h-[18px] rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                          <span className="material-symbols-rounded !text-[12px] leading-none">
                                            hourglass_disabled
                                          </span>
                                        </div>
                                      )}
                                      <span className="text-[11px] font-bold">
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
                                {selectedHistoryItem.isLeave ? (
                                  /* Case: Leave (Business/Sick) */
                                  <div className="flex flex-col">
                                    <div className="flex flex-col mb-4 px-1">
                                      <div className="flex items-start justify-between">
                                        <div className="text-[14px] text-gray-800 dark:text-gray-200">
                                          {selectedHistoryItem.labelMobile}
                                        </div>
                                        {selectedHistoryItem.approvalStatus &&
                                          selectedHistoryItem.approvalStatus !==
                                            "pending" && (
                                            <div
                                              className={`px-3 py-1 rounded-full text-[12px] ${
                                                selectedHistoryItem.approvalStatus ===
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
                                                ? "อนุมัติการลา"
                                                : selectedHistoryItem.approvalStatus ===
                                                    "denied"
                                                  ? "ไม่อนุมัติการลา"
                                                  : "รออนุมัติการลา"}
                                            </div>
                                          )}
                                      </div>
                                      <div className="text-[20px] font-bold text-[#1A1A1A] dark:text-white leading-tight">
                                        ลางานเต็มวัน
                                      </div>
                                    </div>

                                    {/* Leave Type Tag */}
                                    <div className="mb-4">
                                      {selectedHistoryItem.leaveType ===
                                      "ลากิจ" ? (
                                        <div className="inline-flex items-center w-[60px] h-[26px] bg-[#EEF2FF] text-[#4b5e71] border border-[#4F46E5] rounded-[15px] text-[10px] font-bold px-1 gap-1">
                                          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#4F46E5]">
                                            <span className="material-symbols-rounded !text-[12px] leading-none text-white">
                                              lab_profile
                                            </span>
                                          </div>
                                          <span className="leading-none text-gray-500">
                                            ลากิจ
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="inline-flex items-center w-[60px] h-[26px] bg-[#FFF1F2] text-[#4b5e71] border border-[#FF1A7D] rounded-[15px] text-[10px] font-bold px-1 gap-1">
                                          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-[#FF1A7D]">
                                            <span className="material-symbols-rounded !text-[14px] leading-none text-white">
                                              lab_profile
                                            </span>
                                          </div>
                                          <span className="leading-none text-gray-500">
                                            ลาป่วย
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <hr className="w-full h-[1px] bg-[#ECECED] border-none mb-3" />

                                    {/* Reasoning Section (Leave) */}
                                    <div className="w-full space-y-3 mb-3">
                                      <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                                        <span className="material-symbols-rounded text-gray-800 dark:text-gray-300 text-[20px]">
                                          description
                                        </span>
                                        รายละเอียดการลา
                                      </div>
                                      <div className="w-[345px] h-[36px] bg-[#F9FAFB] dark:bg-gray-800 border border-[#D0D5DD] dark:border-gray-700 rounded-[6px] px-4 flex items-center text-[15px] text-gray-700 dark:text-gray-300 shadow-sm">
                                        {selectedHistoryItem.leaveReason ||
                                          "เข้าร่วมประชุมกับทางมหาวิทยาลัย"}
                                      </div>
                                    </div>

                                    {/* Evidence Section (Leave) */}
                                    <div className="w-full">
                                      <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800 dark:text-gray-200">
                                        <span className="whitespace-nowrap">
                                          ไฟล์แนบ :
                                        </span>
                                        {selectedHistoryItem.evidence ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleViewFile(
                                                selectedHistoryItem.evidenceUrl || selectedHistoryItem.evidence,
                                                selectedHistoryItem.evidence,
                                              )
                                            }
                                            className="bg-[#F2F4F7] active:scale-95 transition-transform dark:bg-gray-800 border border-[#CECFD2] dark:border-gray-700 rounded-[6px] px-2 flex items-center gap-1.5 w-[111px] h-[35px] shrink-0 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                          >
                                            <div className="flex items-center justify-center shrink-0">
                                              <svg
                                                width="22"
                                                height="22"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                              >
                                                <path
                                                  d="M7 18H17V20H7V18Z"
                                                  fill="black"
                                                />
                                                <path
                                                  d="M17 14H7V16H17V14Z"
                                                  fill="black"
                                                />
                                                <path
                                                  d="M7 10H14V12H7V10Z"
                                                  fill="black"
                                                />
                                                <path
                                                  fillRule="evenodd"
                                                  clipRule="evenodd"
                                                  d="M6 2C4.34315 2 3 3.34315 3 5V19C3 20.6569 4.34315 22 6 22H18C19.6569 22 21 20.6569 21 19V9L14 2H6ZM13 4L19 10V19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V5C5 4.44772 5.44772 4 6 4H13Z"
                                                  fill="black"
                                                />
                                                <rect
                                                  x="14.5"
                                                  y="10.5"
                                                  width="4"
                                                  height="3"
                                                  rx="1"
                                                  fill="white"
                                                  stroke="black"
                                                />
                                                <text
                                                  x="15"
                                                  y="12.5"
                                                  fontSize="2.5"
                                                  fontWeight="bold"
                                                  fill="black"
                                                >
                                                  PDF
                                                </text>
                                              </svg>
                                            </div>
                                            <div className="text-[12px] font-medium text-[#000000] dark:text-gray-200 truncate">
                                              {selectedHistoryItem.evidence}
                                            </div>
                                          </button>
                                        ) : (
                                          <div className="bg-[#F8F9FA] dark:bg-gray-800 border border-[#D1D5DB] dark:border-gray-700 rounded-[10px] px-3 h-[35px] flex items-center gap-2">
                                            <IconGallery className="w-4 h-4 text-gray-500" />
                                            <span className="text-[12px] font-bold text-gray-500">
                                              ไม่มีไฟล์แนบ
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Case: Normal/Late/Default */
                                  <div className="flex flex-col gap-6">
                                    {/* Conditional Card Layout */}
                                    {/* Conditional Card Layout */}
                                    {selectedHistoryItem.approvalStatus ? (
                                      /* Dual Card: Side-by-Side Comparison (Old vs New) */
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-1 w-full relative">
                                          {/* Card 1: Old Time */}
                                          <div className="flex-1 h-[175px] bg-white border border-[#CECFD2] rounded-[16px] p-3 shadow-sm flex flex-col min-w-0">
                                            <div className="inline-flex items-center gap-1.5 text-gray-500 font-bold text-[14px] mb-2.5">
                                              <div className="w-[30px] h-[30px] rounded-full bg-[#717171] flex items-center justify-center text-white shrink-0">
                                                <span className="material-symbols-rounded text-[20px]">
                                                  calendar_clock
                                                </span>
                                              </div>
                                              <span className="whitespace-nowrap">
                                                เวลาเก่า
                                              </span>
                                            </div>
                                            <div className="space-y-3">
                                              <div className="flex items-center gap-1 text-gray-700 font-bold text-[13px]">
                                                <span className="material-symbols-rounded text-[18px] text-gray-700">
                                                  location_on
                                                </span>
                                                <span className="whitespace-nowrap truncate font-bold">
                                                  อยู่ในสถานที่
                                                </span>
                                              </div>
                                              <div className="space-y-1.5 text-[13px] text-gray-500 font-medium">
                                                <div>
                                                  เวลาเข้า :{" "}
                                                  {
                                                    selectedHistoryItem.checkInTime
                                                  }
                                                </div>
                                                <div>
                                                  เวลาออก :{" "}
                                                  {selectedHistoryItem.checkOutTime ===
                                                  "ไม่ลงเวลาออก"
                                                    ? "ไม่ลงเวลา"
                                                    : selectedHistoryItem.checkOutTime}
                                                </div>
                                                <div className="truncate">
                                                  ชั่วโมงทำงาน:{" "}
                                                  {
                                                    selectedHistoryItem.workingHours
                                                  }
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Magenta Arrow Icon */}
                                          <div className="flex items-center justify-center shrink-0 z-10 px-0.5">
                                            <svg
                                              width="24"
                                              height="24"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                d="M5 12H19M19 12L12 5M19 12L12 19"
                                                stroke="#A80689"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </div>

                                          {/* Card 2: New Time (Requested) */}
                                          <div className="flex-1 h-[175px] bg-[#FFF5FD] border border-[#A80689] rounded-[16px] p-3 shadow-sm flex flex-col min-w-0">
                                            <div className="inline-flex items-center gap-1.5 text-[#A80689] font-bold text-[14px] mb-2.5">
                                              <div className="w-[30px] h-[30px] rounded-full bg-[#A80689] flex items-center justify-center text-white shrink-0">
                                                <span className="material-symbols-rounded text-[20px]">
                                                  calendar_clock
                                                </span>
                                              </div>
                                              <span className="whitespace-nowrap">
                                                เวลาใหม่
                                              </span>
                                            </div>
                                            <div className="space-y-3">
                                              <div className="flex items-center gap-1 text-[#A80689] font-bold text-[13px]">
                                                <span className="material-symbols-rounded text-[18px] text-[#A80689]">
                                                  location_on
                                                </span>
                                                <span className="whitespace-nowrap truncate font-bold">
                                                  อยู่ในสถานที่
                                                </span>
                                              </div>
                                              <div className="space-y-1.5 text-[13px] text-[#A80689] font-medium">
                                                <div>
                                                  เวลาเข้า :{" "}
                                                  {
                                                    selectedHistoryItem.reqCheckInTime
                                                  }
                                                </div>
                                                <div>
                                                  เวลาออก :{" "}
                                                  {
                                                    selectedHistoryItem.reqCheckOutTime
                                                  }
                                                </div>
                                                <div className="truncate">
                                                  ชั่วโมงทำงาน:{" "}
                                                  {
                                                    selectedHistoryItem.reqWorkingHours
                                                  }
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Separate Reason Section (Mobile) */}
                                        <div className="w-full space-y-1">
                                          <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800">
                                            <span className="material-symbols-rounded text-gray-800">
                                              description
                                            </span>
                                            เหตุผลการแก้ไขเวลา
                                          </div>
                                          <div className="w-[345px] h-[36px] bg-[#F9FAFB] border border-[#CECFD2] rounded-[8px] px-4 flex items-center text-[14px] text-gray-700 shadow-sm leading-relaxed">
                                            {selectedHistoryItem.reqReason ||
                                              "ไม่ได้ระบุ"}
                                          </div>
                                        </div>

                                        {/* Evidence Section (Updated Mobile) */}
                                        <div className="w-full">
                                          <div className="flex items-center gap-2 text-[15px] font-bold text-gray-800">
                                            <span className="material-symbols-rounded text-gray-800">
                                              attach_file_add
                                            </span>
                                            <span className="whitespace-nowrap">
                                              ไฟล์แนบ :
                                            </span>
                                            {selectedHistoryItem.evidence ? (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleViewFile(
                                                    selectedHistoryItem.evidenceUrl || selectedHistoryItem.evidence,
                                                    selectedHistoryItem.evidence,
                                                  )
                                                }
                                                className="bg-[#F2F4F7] active:scale-95 transition-transform border border-[#CECFD2] rounded-[8px] px-2 flex items-center gap-1.5 h-[35px] shrink-0 shadow-sm hover:bg-gray-100 min-w-[120px]"
                                              >
                                                <div className="flex items-center justify-center shrink-0">
                                                  <span className="material-symbols-rounded text-[#4B5563] text-[20px]">
                                                    picture_as_pdf
                                                  </span>
                                                </div>
                                                <div className="text-[12px] font-bold text-gray-600 truncate max-w-[80px]">
                                                  {selectedHistoryItem.evidence}
                                                </div>
                                              </button>
                                            ) : (
                                              <span className="text-[13px] text-gray-400 italic">
                                                ไม่มีไฟล์แนบ
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Normal Detail View (Simplified Redesign) */
                                      <div className="space-y-4 pt-1">
                                        {/* Horizontal Divider */}
                                        <hr className="w-full h-[1px] bg-gray-100 border-none" />

                                        <div className="flex flex-col gap-1 px-1">
                                          {/* Location Row (Dynamic Icon) */}
                                          <div className="flex items-center gap-2 text-[#1C1C1C] font-bold text-[16px]">
                                            {selectedHistoryItem.status ===
                                              "เข้างานปกติ" ||
                                            selectedHistoryItem.status ===
                                              "สาย" ||
                                            selectedHistoryItem.status ===
                                              "ไม่ลงเวลาออก" ? (
                                              <span className="material-symbols-rounded text-[24px]">
                                                location_on
                                              </span>
                                            ) : (
                                              <span className="material-symbols-rounded text-[24px]">
                                                apartment
                                              </span>
                                            )}
                                            <span>
                                              {selectedHistoryItem.status ===
                                                "เข้างานปกติ" ||
                                              selectedHistoryItem.status ===
                                                "สาย" ||
                                              selectedHistoryItem.status ===
                                                "ไม่ลงเวลาออก"
                                                ? "อยู่ในสถานที่"
                                                : "อยู่นอกสถานที่"}
                                            </span>
                                          </div>

                                          {/* Time Rows (Right Aligned) */}
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[15px]">
                                              <span className="text-gray-400 font-medium whitespace-nowrap">
                                                เวลาเข้า :
                                              </span>
                                              <span className="font-bold text-[#1C1C1C]">
                                                {
                                                  selectedHistoryItem.checkInTime
                                                }
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[15px]">
                                              <span className="text-gray-400 font-medium whitespace-nowrap">
                                                เวลาออก :
                                              </span>
                                              <span className="font-bold text-[#1C1C1C]">
                                                {selectedHistoryItem.checkOutTime ===
                                                "ไม่ลงเวลาออก"
                                                  ? "ไม่ลงเวลา"
                                                  : selectedHistoryItem.checkOutTime}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[15px]">
                                              <span className="text-gray-400 font-medium whitespace-nowrap">
                                                ชั่วโมงทำงาน :
                                              </span>
                                              <span className="font-bold text-[#1C1C1C]">
                                                {selectedHistoryItem.status ===
                                                "ไม่ลงเวลาออก"
                                                  ? "0 ชม."
                                                  : selectedHistoryItem.workingHours
                                                    ? selectedHistoryItem.workingHours
                                                        .replace(
                                                          " ชั่วโมง",
                                                          " ชม.",
                                                        )
                                                        .replace(
                                                          " นาที",
                                                          " นาที",
                                                        )
                                                    : "0 ชม."}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Evidence Section (Integrated) Removed for this specific view */}
                                        </div>
                                      </div>
                                    )}
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
                                        className="w-[375px] h-[45px] bg-[#A80689] text-white rounded-[5px] text-[17px] font-bold flex items-center justify-center"
                                        onClick={() => {
                                          localStorage.setItem(
                                            "editItem",
                                            JSON.stringify(selectedHistoryItem),
                                          );
                                          router.push(
                                            "/intern/history/edit-time",
                                          );
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
                                    <div className="text-[14px] text-gray-800 dark:text-gray-200">
                                      {selectedHistoryItem.labelMobile}
                                    </div>
                                    {selectedHistoryItem.approvalStatus && (
                                      <div
                                        className={`px-3 py-1 rounded-full text-[12px] ${
                                          selectedHistoryItem.approvalStatus ===
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
                                        <div className="w-5 h-5 rounded-full bg-[#4386F9] flex items-center justify-center text-white shrink-0 overflow-hidden">
                                          <span className="material-symbols-rounded !text-[14px] flex items-center justify-center">
                                            lab_profile
                                          </span>
                                        </div>
                                        ลา
                                      </div>
                                    ) : selectedHistoryItem.status === "ขาด" ||
                                      selectedHistoryItem.statusType ===
                                        "danger" ? (
                                      <div className="inline-flex items-center w-[75px] justify-center px-1 py-1 bg-[#FCEDED] text-[#EF4444] border border-[#EF4444] rounded-full text-[10px] font-semibold gap-1 mt-1">
                                        <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0">
                                          <svg
                                            width="10"
                                            height="10"
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
                                        ขาดงาน
                                      </div>
                                    ) : (
                                      <div
                                        className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold gap-1.5 border mt-1 shrink-0 ${
                                          selectedHistoryItem.status ===
                                          "ไม่ลงเวลาออก"
                                            ? "w-[100px] h-[26px] px-1 bg-[#F3F4F6] text-[#6B7280] border-[#6B7280]"
                                            : `w-fit min-w-[75px] px-2 py-1 ${
                                                selectedHistoryItem.status ===
                                                  "เข้างานปกติ" ||
                                                selectedHistoryItem.statusType ===
                                                  "success"
                                                  ? "bg-[#E7FAEF] text-[#10B981] border-[#10B981]"
                                                  : selectedHistoryItem.status ===
                                                        "สาย" ||
                                                      selectedHistoryItem.statusType ===
                                                        "warning"
                                                    ? "bg-[#FDF4D6] text-[#F59E0B] border-[#F59E0B]"
                                                    : selectedHistoryItem.status ===
                                                          "ขาด" ||
                                                        selectedHistoryItem.statusType ===
                                                          "danger"
                                                      ? "bg-[#FCEDED] text-[#EF4444] border-[#EF4444]"
                                                      : selectedHistoryItem.leaveType ===
                                                          "ลาป่วย"
                                                        ? "bg-[#FFEBF5] text-[#D42A8C] border-[#D42A8C]"
                                                        : "bg-[#EEF4FF] text-[#4386F9] border-[#4386F9]"
                                              }`
                                        }`}
                                      >
                                        {selectedHistoryItem.status ===
                                          "เข้างานปกติ" ||
                                        selectedHistoryItem.statusType ===
                                          "success" ? (
                                          <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                            <svg
                                              className="w-3 h-3"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          </div>
                                        ) : selectedHistoryItem.status ===
                                            "สาย" ||
                                          selectedHistoryItem.statusType ===
                                            "warning" ? (
                                          <div className="w-5 h-5 bg-[#F59E0B] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                            <IconClock className="w-3 h-3 text-white" />
                                          </div>
                                        ) : selectedHistoryItem.status ===
                                            "ขาด" ||
                                          selectedHistoryItem.statusType ===
                                            "danger" ? (
                                          <div className="w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                            <IconX className="w-3 h-3 text-white" />
                                          </div>
                                        ) : selectedHistoryItem.leaveType ===
                                          "ลาป่วย" ? (
                                          <div className="w-5 h-5 bg-[#D42A8C] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                            <svg
                                              width="12"
                                              height="12"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                d="M12 6V18"
                                                stroke="white"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                              />
                                              <path
                                                d="M6 12H18"
                                                stroke="white"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                              />
                                            </svg>
                                          </div>
                                        ) : selectedHistoryItem.status ===
                                            "ลา" ||
                                          selectedHistoryItem.isLeave ? (
                                          <div className="w-5 h-5 bg-[#4386F9] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                            <span className="material-symbols-rounded !text-[14px] flex items-center justify-center">
                                              lab_profile
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="w-[18px] h-[18px] rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                            <span className="material-symbols-rounded !text-[12px] leading-none">
                                              hourglass_disabled
                                            </span>
                                          </div>
                                        )}
                                        <span className="text-[11px] font-bold">
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
                                    )}
                                  </div>
                                </div>

                                <hr className="mt-1 mb-1 h-[1px] bg-[#CECFD2] border-none dark:bg-gray-700" />

                                {/* Vertical Stacked Cards Section */}
                                <div className="space-y-4 pt-4">
                                  {selectedHistoryItem.approvalStatus ? (
                                    <>
                                      {/* Card 1: Original */}
                                      <div className="bg-white dark:bg-[#1C1710] border border-[#CECFD2] dark:border-[#3A2A1A] rounded-2xl p-4 space-y-3 shadow-sm">
                                        <div className="flex items-center w-[92px] h-[21px] gap-1 text-[#000000] font-bold text-[14px] leading-none shrink-0 border-none">
                                          <span className="material-symbols-rounded text-[18px] text-[#000000]">
                                            location_on
                                          </span>
                                          <span className="whitespace-nowrap">
                                            อยู่ในสถานที่
                                          </span>
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
                                      <div className="bg-white dark:bg-[#121212] border border-[#CECFD2] dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
                                        <div className="inline-flex items-center w-[120px] h-[24px] gap-2 text-[#A80689] font-bold text-[16px] leading-none shrink-0">
                                          <div className="w-[22px] h-[22px] rounded-full bg-[#A80689] flex items-center justify-center text-white shrink-0">
                                            <span className="material-symbols-rounded text-[16px]">
                                              calendar_clock
                                            </span>
                                          </div>
                                          <span className="whitespace-nowrap">
                                            คำขอแก้ไขเวลา
                                          </span>
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
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                              <span className="material-symbols-rounded text-[16px]">
                                                description
                                              </span>
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
                                    <div className="bg-white dark:bg-[#1C1710] border border-[#CECFD2] dark:border-[#3A2A1A] rounded-2xl p-4 space-y-3 shadow-sm">
                                      <div className="flex items-start gap-1 border-none">
                                        <div className="flex items-center h-[21px] gap-1 text-[#000000] font-bold text-[14px] leading-none shrink-0">
                                          <span className="material-symbols-rounded text-[20px] text-[#000000]">
                                            location_on
                                          </span>
                                          <span className="whitespace-nowrap">
                                            {selectedHistoryItem.status ===
                                              "เข้างานปกติ" ||
                                            selectedHistoryItem.statusType ===
                                              "success" ||
                                            selectedHistoryItem.status ===
                                              "สาย" ||
                                            selectedHistoryItem.statusType ===
                                              "warning" ||
                                            selectedHistoryItem.status ===
                                              "ไม่ลงเวลาออก"
                                              ? "อยู่ในสถานที่"
                                              : selectedHistoryItem.location}
                                          </span>
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
                                  <div className="bg-white dark:bg-[#1A1A1A] border border-[#CECFD2] dark:border-[#333333] rounded-2xl p-4 space-y-4 shadow-sm">
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
                                              <img
                                                src="/assets/images/profile-34.jpeg"
                                                alt="thumbnail"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.currentTarget.style.display =
                                                    "none";
                                                }}
                                              />
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
                                          <span className="material-symbols-rounded text-[20px]">
                                            description
                                          </span>
                                          รายละเอียดการลา
                                        </div>
                                        <div className="w-[345px] h-[36px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[8px] px-3 flex items-center text-[14px] text-gray-600 dark:text-gray-300 font-medium">
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
                                            router.push(
                                              "/intern/history/edit-time",
                                            );
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

// Custom CSS to hide scrollbar while keeping functionality
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    `;
  document.head.append(style);
}
