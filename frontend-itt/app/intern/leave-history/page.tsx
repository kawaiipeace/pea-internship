"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '@/api/axios';
import useAuthStore from '@/store/authStore';
import EditTimeForm from '@/components/history/edit-time-form';
import MonthPicker from '@/components/history/month-picker';
import { useRouter } from 'next/navigation';
import SummarySection from '@/components/leave-history/summary-section';
import LeaveHistoryList from '@/components/leave-history/leave-history-list';
import PaginationControl from '@/components/leave-history/pagination-control';
import LeaveDetailModal from '@/components/leave-history/leave-detail-modal';

const LeaveHistoryPage = () => {
    const router = useRouter();
    const { user } = useAuthStore();

    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);


    // Thai month names
    const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    // Default to current date
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState<number | null>(null);
    const [currentYear, setCurrentYear] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState({ total: 0, absence: 0, sick: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRecords: 0 });
    const [historyData, setHistoryData] = useState<any[]>([]);

    const fetchLeaveHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            let typeParam = undefined;
            if (selectedFilter === 'ลากิจ') typeParam = 'ABSENCE';
            if (selectedFilter === 'ลาป่วย') typeParam = 'SICK';

            const params: any = {
                page: currentPage,
                limit: 10,
                type: typeParam
            };

            if (currentMonth !== null && currentYear !== null) {
                params.month = currentMonth + 1;
                params.year = currentYear - 543;
            }

            const response = await axiosInstance.get('/leave/history', { params });

            const data = response.data;
            setHistoryData(data.records.map((r: any) => {
                const startObj = new Date(r.startDate);
                const endObj = new Date(r.endDate);
                
                const getParts = (date: Date) => {
                    const formatted = new Intl.DateTimeFormat('en-CA', {
                        timeZone: 'Asia/Bangkok',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }).format(date);
                    const [y, m, d] = formatted.split('-').map(Number);
                    return { year: y, month: m, day: d };
                };

                const start = getParts(startObj);
                const end = getParts(endObj);

                const isRange = r.startDate !== r.endDate;
                const dateDisplay = isRange 
                    ? `${start.day} - ${end.day}`
                    : start.day.toString();

                return {
                    ids: r.ids,
                    id: r.ids[0], // fallback for parts expecting single id
                    date: dateDisplay,
                    month: thaiMonthsFull[start.month - 1],
                    monthShort: thaiMonthsShort[start.month - 1],
                    year: (start.year + 543).toString(),
                    labelMobile: isRange 
                        ? `${start.day}-${end.day} ${thaiMonthsFull[start.month - 1]} ${(start.year + 543).toString()}`
                        : `${start.day} ${thaiMonthsFull[start.month - 1]} ${(start.year + 543).toString()}`,
                    time: 'ลางานเต็มวัน',
                    status: mapStatusToText(r.status),
                    statusType: mapStatusToType(r.status),
                    isLeave: true,
                    location: 'PEA',
                    leaveDuration: 'ลาเต็มวัน',
                    leaveType: r.leaveType === 'ABSENCE' || r.leaveType === 'ลากิจ' ? 'ลากิจ' : 'ลาป่วย',
                    evidence: r.attachmentUrl ? r.attachmentUrl.split('/').pop() : '',
                    evidenceUrl: r.attachmentUrl,
                    leaveReason: r.reason || 'ไม่ระบุเหตุผล',
                    isRange,
                    startDateStr: r.startDate,
                    endDateStr: r.endDate,
                    mentorReason: r.approverNote || ""
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

    const handleExport = () => {
        if (!historyData || historyData.length === 0) {
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
        const header = "วันที่ลา,ชื่อ-นามสกุล,ประเภทการลา,สถานะ,เหตุผลการลา\n";
        
        const studentName = user ? `${user.fname} ${user.lname}` : "Student";

        const rows = historyData.map(item => {
            return `"${item.labelMobile}","${studentName}","${item.leaveType}","${item.status}","${item.leaveReason || "-"}"`;
        }).join("\n");

        const summarySection = `\nสรุปการลา\nลากิจทั้งหมด,${summary.absence} วัน\nลาป่วยทั้งหมด,${summary.sick} วัน\nลาทั้งหมดรวม,${summary.total} วัน\n`;

        const csvContent = BOM + header + rows + summarySection;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        const monthLabel = currentMonth !== null ? thaiMonthsFull[currentMonth] : "ทั้งหมด";
        const yearLabel = currentYear !== null ? currentYear : "";
        
        const fileName = `${studentName}_ประวัติการลา_${monthLabel}_${yearLabel}.csv`.replace(/\s+/g, "_");
        
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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

    const handleDeleteLeaveRequest = async (ids: number[]) => {
        try {
            Swal.fire({
                title: 'กำลังยกเลิกคำขอ...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await axiosInstance.post(`/leave/bulk-delete`, { ids });

            const firstId = ids[0];
            setHistoryData(prev => prev.filter(h => !ids.includes(h.id)));
            setIsDetailModalOpen(false);

            Swal.fire({
                html: `
                  <div class="flex flex-col items-center py-4">
                    <div class="mb-6 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#DCFAE6]">
                      <div class="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#17B26A] text-white">
                        <span class="material-symbols-rounded !text-[32px]">check</span>
                      </div>
                    </div>
                    <h2 class="text-[22px] font-bold text-[#1C1C1C] dark:text-white mt-2">ยกเลิกสำเร็จ!</h2>
                  </div>
                `,
                showConfirmButton: false,
                timer: 2000,
                customClass: {
                  popup: 'rounded-[20px] p-10 w-auto min-w-[300px] bg-white dark:bg-[#1A1A1A] shadow-xl',
                }
            });
            
            fetchLeaveHistory();
        } catch (error: any) {
            console.error('Error deleting leave request:', error);
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: 'ไม่สามารถยกเลิกคำขอได้',
              confirmButtonText: 'ตกลง',
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

    const handleAutoResubmitLeave = async (item: any) => {
        const result = await Swal.fire({
          html: `
            <div class="flex flex-col items-center">
              <div class="mb-6 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#DCFAE6]">
                <div class="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#17B26A] text-white">
                  <span class="material-symbols-rounded !text-[24px]">check</span>
                </div>
              </div>
              <h2 class="text-[20px] font-bold text-[#1C1C1C] dark:text-white mb-2">ยืนยันการส่งคำขออีกครั้ง</h2>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'ยืนยัน',
          cancelButtonText: 'ยกเลิก',
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-[16px] p-8 w-auto min-w-[320px] max-w-[400px] bg-white dark:bg-[#1A1A1A] shadow-xl',
            actions: 'flex gap-3 w-full px-4 mt-6',
            confirmButton: 'flex-1 py-2.5 bg-[#11A75C] hover:bg-[#0E8F4D] text-white rounded-xl text-[15px] font-bold order-2 shadow-md',
            cancelButton: 'flex-1 py-2.5 bg-white border border-[#1C1C1C] text-[#1C1C1C] rounded-xl text-[15px] font-bold order-1'
          }
        });
    
        if (result.isConfirmed) {
          try {
            setIsLoading(true);
            
            // Only need to send IDs for status-only resubmission
            const response = await axiosInstance.post('/leave/resubmit', {
                ids: item.ids
            });
            
            if (response.data && response.data.success) {
              await Swal.fire({
                html: `
                  <div class="flex flex-col items-center py-4">
                    <div class="mb-6 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#DCFAE6]">
                      <div class="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#17B26A] text-white">
                        <span class="material-symbols-rounded !text-[32px]">check</span>
                      </div>
                    </div>
                    <h2 class="text-[22px] font-bold text-[#1C1C1C] dark:text-white mt-2">ส่งคำขออีกครั้งสำเร็จ</h2>
                  </div>
                `,
                showConfirmButton: false,
                timer: 2000,
                customClass: {
                  popup: 'rounded-[20px] p-10 w-auto min-w-[300px] bg-white dark:bg-[#1A1A1A] shadow-xl',
                }
              });
              setIsDetailModalOpen(false);
              fetchLeaveHistory();
            }
          } catch (error: any) {
            Swal.fire({
              title: 'เกิดข้อผิดพลาด',
              text: error.response?.data?.message || 'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง',
              icon: 'error',
              confirmButtonText: 'ตกลง',
              buttonsStyling: false,
              customClass: {
                popup: 'rounded-[16px] p-8 w-auto min-w-[320px] max-w-[400px] bg-white dark:bg-[#1A1A1A] shadow-xl',
                title: 'text-[18px] font-bold text-[#1C1C1C] dark:text-white mb-4',
                htmlContainer: 'text-[14px] text-gray-500 mb-6',
                confirmButton: 'w-full py-2.5 bg-[#E22E2E] hover:bg-[#C12727] text-white rounded-xl text-[15px] font-bold shadow-md transition-colors'
              }
            });
          } finally {
            setIsLoading(false);
          }
        }
    };

    const handleMonthSelect = (month: number | null, year: number | null) => {
        setCurrentMonth(month);
        setCurrentYear(year);
        setCurrentPage(1);
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

    const summaryCards = [
        { title: 'ลาทั้งหมด', days: summary.total, icon: 'lab_profile', bgColor: 'bg-[#E3F2FD] dark:bg-blue-900/20', textColor: 'text-[#03A9F4]', activeBorderClass: 'border-[#03A9F4]', hoverBorderClass: 'hover:border-[#03A9F4]' },
        { title: 'ลากิจ', days: summary.absence, icon: 'business_center', bgColor: 'bg-[#E2E4FF] dark:bg-indigo-900/20', textColor: 'text-[#3F51B5]', activeBorderClass: 'border-[#1A3CFF]', hoverBorderClass: 'hover:border-[#1A3CFF]' },
        { title: 'ลาป่วย', days: summary.sick, icon: 'health_cross', bgColor: 'bg-[#FFD7EF] dark:bg-rose-900/20', textColor: 'text-[#FF1A7D]', activeBorderClass: 'border-[#FF1A7D]', hoverBorderClass: 'hover:border-[#FF1A7D]' },
    ];

    return (
        <div className="-m-6 p-[22px] sm:p-6 text-black dark:text-white-light bg-[#fffbf7] dark:bg-black min-h-screen">
            <div className="w-full sm:max-w-[840px] mx-auto min-h-[888px] sm:min-h-[813px] flex flex-col gap-[16px]">
                {/* Header Section */}
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 shrink-0 px-1 sm:px-0">
                    <div>
                        <h1 className="text-[20px] sm:text-2xl font-bold mb-1 text-black dark:text-white whitespace-nowrap">ประวัติการลา</h1>
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
                    summaryCards={summaryCards}
                    selectedFilter={selectedFilter}
                    onFilterChange={(filter) => {
                        setSelectedFilter(filter);
                        setCurrentPage(1);
                    }}
                    currentMonth={currentMonth}
                    thaiMonthsFull={thaiMonthsFull}
                />

                {/* History List Section */}
                <LeaveHistoryList
                    items={historyData}
                    isLoading={isLoading}
                    selectedFilter={selectedFilter}
                    onItemClick={(item) => {
                        setSelectedHistoryItem(item);
                        setIsDetailModalOpen(true);
                    }}
                    onDeleteRequest={handleDeleteLeaveRequest}
                    onAddRequest={() => router.push('/intern/leave-history/leave-form')}
                />

                {/* Footer / Pagination & Export */}
                <PaginationControl
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                    onExport={handleExport}
                />

                {/* Detail Modal */}
                <LeaveDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setIsEditingTime(false);
                    }}
                    selectedHistoryItem={selectedHistoryItem}
                    onViewFile={handleViewFile}
                    onDeleteRequest={handleDeleteLeaveRequest}
                    onResubmitLeave={handleAutoResubmitLeave}
                    onSuccess={fetchLeaveHistory}
                />
            </div>
        </div>
    );
};

export default LeaveHistoryPage;
