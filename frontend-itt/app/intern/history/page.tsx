"use client";
import React, { useState } from "react";
import MonthPicker from "@/components/history/month-picker";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useEffect, useCallback } from "react";
import axiosInstance from "@/api/axios";
import useAuthStore from "@/store/authStore";
import SummarySection from "@/components/history/summary-section";
import HistoryList from "@/components/history/history-list";
import PaginationControl from "@/components/history/pagination-control";
import HistoryDetailModal from "@/components/history/history-detail-modal";

const AttendanceHistoryPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();

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

  const [currentMonth, setCurrentMonth] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleMonthSelect = (month: number | null, year: number | null) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePrevMonth = () => {
    if (currentMonth !== null && currentYear !== null) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  const handleViewLeaveFile = async (item: any) => {
    try {
      if (!item.evidenceUrl) return;

      Swal.fire({
        title: 'กำลังโหลดไฟล์...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

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
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-[15px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
            title: 'text-[18px] font-bold text-black dark:text-white pt-2 text-center whitespace-nowrap',
            htmlContainer: 'text-[14px] text-gray-500 text-center mb-4 mt-1',
            confirmButton: 'bg-[#A80689] text-white font-bold py-2 px-8 min-w-[120px] rounded-[10px] text-[15px] text-center'
          }
        });
      }

      Swal.close();
      // Clean up
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('Error fetching file:', error);
      Swal.fire('Error', 'ไม่สามารถเปิดไฟล์ได้', 'error');
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
        buttonsStyling: false,
        customClass: {
          popup: 'rounded-[15px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
          title: 'text-[18px] font-bold text-black dark:text-white pt-2 text-center whitespace-nowrap',
          htmlContainer: 'text-[14px] text-gray-500 text-center mb-4 mt-1',
          confirmButton: 'bg-[#EF4444] text-white font-bold py-2 px-8 min-w-[120px] rounded-[10px] text-[15px] text-center'
        }
      });
    }
  };

  const handleNextMonth = () => {
    if (currentMonth !== null && currentYear !== null) {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      // Map UI filter label to Backend StatusFilter
      let filterStatusArg = "";
      if (selectedFilter === "เข้างานปกติ") filterStatusArg = "PRESENT";
      else if (selectedFilter === "สาย") filterStatusArg = "LATE";
      else if (selectedFilter === "ลา") filterStatusArg = "LEAVE";
      else if (selectedFilter === "ขาด") filterStatusArg = "ABSENT";
      else if (selectedFilter === "ไม่ลงเวลาออก") filterStatusArg = "MISSING_OUT";

      const params: any = {
        page: pagination.page,
        limit: 10,
        filterStatus: filterStatusArg || undefined
      };

      if (currentMonth !== null && currentYear !== null) {
        params.year = currentYear - 543;
        params.month = currentMonth + 1;
      }

      const response = await axiosInstance.get(`/check-time/history`, { params });

      if (response.data) {
        const { summary, records, pagination: paginationData } = response.data;

        const mappedRecords = records.map((log: any) => {
          const formatTimeDisplay = (time: string) => (time === "--:--" ? "ไม่ลงเวลา" : time);
          const inTimeDisplay = formatTimeDisplay(log.checkInTime);
          const outTimeDisplay = formatTimeDisplay(log.checkOutTime);

          const startDate = new Date(log.startDate);
          const endDate = new Date(log.endDate);
          const day = startDate.getDate().toString();
          const monthIndex = startDate.getMonth();
          const year = startDate.getFullYear() + 543;

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
              statusLabel = "ขาด";
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

          const isRange = log.startDate !== log.endDate;
          const displayDateLabel = isRange
            ? `${startDate.getDate()} - ${endDate.getDate()} ${thaiMonthsFull[endDate.getMonth()]} ${endDate.getFullYear() + 543}`
            : `${day} ${thaiMonthsFull[monthIndex]} ${year}`;

          return {
            id: log.id,
            workDate: log.workDate,
            date: day,
            month: thaiMonthsFull[monthIndex],
            monthFull: thaiMonthsFull[monthIndex],
            year: year,
            labelMobile: displayDateLabel,
            time: log.displayStatus === 'ABSENT' ? 'ขาดงาน' : log.displayStatus === 'LEAVE' ? 'ลางาน' : `${inTimeDisplay} - ${outTimeDisplay}`,
            status: statusLabel,
            statusType: statusType,
            checkInTime: inTimeDisplay,
            checkOutTime: outTimeDisplay,
            location: log.location,
            workingHours: log.workingHours,
            approvalStatus: approvalStatus,
            isLeave: log.displayStatus === 'LEAVE',
            startDate: log.startDate,
            endDate: log.endDate,
            ids: log.ids,
            isEdited: log.isEdited,
            correctionId: log.correctionId,
            leaveType: log.leaveType,
            leaveReason: log.leaveReason,
            evidence: log.attachmentUrl ? "หลักฐาน" : null,
            evidenceUrl: log.attachmentUrl,
          };
        });

        // Filter out today's record if it's incomplete (no check-out and before 23:50)
        const now = new Date();
        const bkkNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
        const bkkTodayStr = bkkNow.getFullYear() + "-" + (bkkNow.getMonth() + 1).toString().padStart(2, '0') + "-" + bkkNow.getDate().toString().padStart(2, '0');
        const bkkCurrentTime = bkkNow.getHours() * 100 + bkkNow.getMinutes();

        const filteredRecords = mappedRecords.filter((item: any) => {
          // เช็คว่าเป็นข้อมูลวันนี้หรือไม่
          const isToday = item.workDate === bkkTodayStr;

          // ถ้าเป็นสถานะ 'ขาดงาน' (ABSENT) หรือ 'ลา' (LEAVE) ให้แสดงทันทีไม่ต้องรอ 23:50
          if (item.status === "ขาด" || item.isLeave) {
            return true;
          }

          // สำหรับสถานะอื่นๆ (เช่น มาทำงานปกติ) ถ้ายังไม่ลงเวลาออก และยังไม่ถึง 23:50 ให้ซ่อนไว้ก่อน
          if (isToday && item.checkOutTime === "ไม่ลงเวลา" && bkkCurrentTime < 2350) {
            return false;
          }

          return true;
        });

        // Adjust summary counts based on filtered records
        const activeSummary = { ...summary };
        const missingRecord = mappedRecords.find((item: any) =>
          item.workDate === bkkTodayStr &&
          item.checkOutTime === "ไม่ลงเวลา" &&
          bkkCurrentTime < 2350 &&
          !item.isLeave
        );
        if (missingRecord) {
          activeSummary.missingOut = Math.max(0, activeSummary.missingOut - 1);
        }

        setHistoryItems(filteredRecords);
        setSummaryCounts(activeSummary);
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
        confirmButtonText: 'ตกลง',
        buttonsStyling: false,
        customClass: {
          popup: 'rounded-[15px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
          title: 'text-[18px] font-bold text-black dark:text-white pt-2 text-center whitespace-nowrap',
          htmlContainer: 'text-[14px] text-gray-500 text-center mb-4 mt-1',
          confirmButton: 'bg-[#EF4444] text-white font-bold py-2 px-8 min-w-[120px] rounded-[10px] text-[15px] text-center'
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, selectedFilter, currentMonth, currentYear]);

  const handleExport = () => {
    if (!historyItems || historyItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "ไม่มีข้อมูลสำหรับการส่งออก",
        confirmButtonText: "ตกลง",
        buttonsStyling: false,
        customClass: {
          popup: 'rounded-[15px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
          title: 'text-[18px] font-bold text-black dark:text-white pt-2 text-center whitespace-nowrap',
          confirmButton: 'bg-[#A80689] text-white font-bold py-2 px-8 min-w-[120px] rounded-[10px] text-[15px] text-center'
        }
      });
      return;
    }

    const BOM = "\uFEFF";
    const header = "วันที่,ชื่อ-นามสกุล,สถานะ,เวลาเข้า,เวลาออก,สถานที่,ชั่วโมงทำงาน,ประเภทการลา,เหตุผลการลา\n";
    
    const studentName = user ? `${user.fname} ${user.lname}` : "Student";
    
    const rows = historyItems.map(item => {
      return `"${item.labelMobile}","${studentName}","${item.status}","${item.checkInTime}","${item.checkOutTime}","${item.location || "-"}","${item.workingHours || "-"}","${item.leaveType || "-"}","${item.leaveReason || "-"}"`;
    }).join("\n");

    const summarySection = `\nสรุปข้อมูล\nเข้างานปกติ,${summaryCounts.present}\nสาย,${summaryCounts.late}\nลา,${summaryCounts.leave}\nขาด,${summaryCounts.absent}\nไม่ลงเวลาออก,${summaryCounts.missingOut}\n`;

    const csvContent = BOM + header + rows + summarySection;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const monthLabel = currentMonth !== null ? thaiMonthsFull[currentMonth] : "ทั้งหมด";
    const yearLabel = currentYear !== null ? currentYear : "";
    
    const fileName = `${studentName}_ประวัติการลงเวลา_${monthLabel}_${yearLabel}.csv`.replace(/\s+/g, "_");
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterChange = (filter: string | null) => {
    setSelectedFilter(filter);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filter changes
  };

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
          evidence: "หลักฐาน",
          evidenceUrl: detail.attachment.url,
          originalCheckInTime: detail.original.checkInTime,
          originalCheckOutTime: detail.original.checkOutTime,
          originalWorkingHours: `${detail.original.hoursWorked} ชั่วโมง`,
          mentorReason: detail.approverNote || "",
        }));
      }
    } catch (error) {
      console.error("Failed to fetch correction detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoResubmit = async (item: any) => {
    const result = await Swal.fire({
      html: `
        <div class="flex flex-col items-center">
          <div class="mb-6 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#DCFAE6]">
            <div class="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#17B26A] text-white">
              <span class="material-symbols-rounded !text-[24px]">check</span>
            </div>
          </div>
          <h2 class="text-[20px] font-bold text-[#1C1C1C] dark:text-white mb-4">ยืนยันส่งคำขอ</h2>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ย้อนกลับ',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-[16px] p-8 w-auto min-w-[320px] max-w-[400px] bg-white dark:bg-[#1A1A1A] shadow-xl',
        actions: 'flex gap-3 w-full px-4',
        confirmButton: 'flex-1 py-2.5 bg-[#11A75C] hover:bg-[#0E8F4D] text-white rounded-xl text-[15px] font-bold order-2',
        cancelButton: 'flex-1 py-2.5 bg-white border border-[#1C1C1C] text-[#1C1C1C] rounded-xl text-[15px] font-bold order-1'
      }
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('attendanceLogId', String(item.id));
        formData.append('checkInTime', item.reqCheckInTime);
        formData.append('checkOutTime', item.reqCheckOutTime);
        formData.append('reason', item.reqReason);

        const response = await axiosInstance.put('/check-time/edit', formData);

        if (response.data && response.data.success) {
          await Swal.fire({
            html: `
              <div class="flex flex-col items-center py-4">
                <div class="mb-6 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#DCFAE6]">
                  <div class="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#17B26A] text-white">
                    <span class="material-symbols-rounded !text-[32px]">check</span>
                  </div>
                </div>
                <h2 class="text-[22px] font-bold text-[#1C1C1C] dark:text-white mt-2">ส่งคำขอเรียบร้อยแล้ว</h2>
              </div>
            `,
            showConfirmButton: false,
            timer: 2000,
            customClass: {
              popup: 'rounded-[20px] p-10 w-auto min-w-[300px] bg-white dark:bg-[#1A1A1A] shadow-xl',
            }
          });
          setIsDetailModalOpen(false);
          fetchHistory();
        }
      } catch (error: any) {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: error.response?.data?.message || 'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง',
          icon: 'error',
          confirmButtonText: 'ตกลง',
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-[15px] p-6 w-auto min-w-[360px] max-w-[420px] bg-white dark:bg-[#1A1A1A] flex flex-col items-center justify-center',
            title: 'text-[18px] font-bold text-black dark:text-white pt-2 text-center whitespace-nowrap',
            htmlContainer: 'text-[14px] text-gray-500 text-center mb-4 mt-1',
            confirmButton: 'bg-[#EF4444] text-white font-bold py-2 px-8 min-w-[120px] rounded-[10px] text-[15px] text-center'
          }
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Dummy Data
  // Dynamic Summary Data from API
  const summaryData = [
    {
      title: "เข้างานปกติ",
      days: summaryCounts.present,
      icon: "check",
      bgColor: "bg-[#e7faef]",
      textColor: "text-[#079455]",
      borderColor: "border-[#079455]",
      iconBg: "bg-[#079455]",
    },
    {
      title: "สาย",
      days: summaryCounts.late,
      icon: "schedule",
      bgColor: "bg-[#fdf4d6]",
      textColor: "text-[#FDB022]",
      borderColor: "border-[#FDB022]",
      iconBg: "bg-[#FDB022]",
    },
    {
      title: "ลา",
      days: summaryCounts.leave,
      icon: "lab_profile",
      bgColor: "bg-[#eef8ff]",
      textColor: "text-[#1AB3FF]",
      borderColor: "border-[#1AB3FF]",
      iconBg: "bg-[#1AB3FF]",
    },
    {
      title: "ขาด",
      days: summaryCounts.absent,
      icon: "close",
      bgColor: "bg-[#fceded]",
      textColor: "text-[#ef4444]",
      borderColor: "border-[#ef4444]",
      iconBg: "bg-[#ef4444]",
    },
  ];


  const filteredHistoryData = historyItems;


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
            <h1 className="text-[20px] sm:text-2xl font-bold mb-1 text-black dark:text-white">
              ประวัติการลงเวลา
            </h1>
            
          </div>
          <MonthPicker
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSelect={handleMonthSelect}
            placeholder="เลือกช่วงเวลาที่ต้องการดู..."
          />
        </div>

        {/* Summary Section */}
        <SummarySection
          summaryData={summaryData}
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
          thaiMonthsFull={thaiMonthsFull}
          currentMonth={currentMonth}
        />

        {/* History List Section */}
        <HistoryList
          items={historyItems}
          selectedFilter={selectedFilter}
          onItemClick={(item) => {
            setSelectedHistoryItem(item);
            setIsDetailModalOpen(true);
            if (item.isEdited && item.correctionId) {
              fetchCorrectionDetail(item.correctionId);
            }
          }}
          thaiMonthsShort={thaiMonthsShort}
        />

        {/* Footer / Pagination & Export */}
        <PaginationControl
          pagination={pagination}
          onPageChange={handlePageChange}
          onExport={handleExport}
        />

        {/* Detail Modal */}
        <HistoryDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          selectedHistoryItem={selectedHistoryItem}
          isEditingTime={isEditingTime}
          setIsEditingTime={setIsEditingTime}
          onViewLeaveFile={handleViewLeaveFile}
          onViewFile={handleViewFile}
          onAutoResubmit={handleAutoResubmit}
          onEditClick={(item) => {
            localStorage.setItem("editItem", JSON.stringify(item));
            router.push("/intern/history/edit-time");
          }}
          thaiMonthsFull={thaiMonthsFull}
        />
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
