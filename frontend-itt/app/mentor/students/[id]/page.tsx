'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/api/axios';
import Swal from 'sweetalert2';

import CompensationModal from '@/components/mentor/CompensationModal';
import StudentProfileCard from '@/components/student_mentor/StudentProfileCard';
import InternshipProgressCard from '@/components/student_mentor/InternshipProgressCard';
import AttendanceSummaryCards from '@/components/student_mentor/AttendanceSummaryCards';
import AttendanceHistoryTable from '@/components/student_mentor/AttendanceHistoryTable';

const StudentDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;

    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [studentData, setStudentData] = useState<any>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [isCompensateModalOpen, setIsCompensateModalOpen] = useState(false);

    const fetchDetail = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`/mentor/students/${studentId}`, {
                params: { page, limit: 10 }
            });
            const data = response.data;
            setStudentData(data);

            let finalRecords = data.attendanceTable.records || [];

            try {
                const leaveRes = await axiosInstance.get('/leave/mentor/requests', {
                    params: { viewType: 'ALL', limit: 100, status: 'APPROVED' }
                });
                if (leaveRes.data && leaveRes.data.data) {
                    const leaveRequests = leaveRes.data.data.filter((req: any) => req.userId === data.profile.id);

                    finalRecords = finalRecords.map((record: any) => {
                        if (record.status === 'LEAVE') {
                            const workDateObj = new Date(record.workDate);
                            workDateObj.setHours(0, 0, 0, 0);

                            const matchingLeave = leaveRequests.find((lr: any) => {
                                const start = new Date(lr.startDate);
                                start.setHours(0, 0, 0, 0);
                                const end = new Date(lr.endDate);
                                end.setHours(0, 0, 0, 0);
                                return workDateObj.getTime() >= start.getTime() && workDateObj.getTime() <= end.getTime();
                            });

                            if (matchingLeave) {
                                return {
                                    ...record,
                                    leaveType: matchingLeave.leaveType,
                                    evidenceUrl: matchingLeave.attachmentUrl || record.evidenceUrl,
                                    note: matchingLeave.reason || matchingLeave.note || record.note
                                };
                            }
                        }
                        return record;
                    });
                }
            } catch (err) {
                console.error("Failed to fetch and merge leaves:", err);
            }

            setAttendanceRecords(finalRecords);
            setPagination(data.attendanceTable.pagination);
        } catch (error) {
            console.error('Error fetching student detail:', error);
            setAttendanceRecords([]);
        } finally {
            setIsLoading(false);
        }
    }, [studentId, page]);

    const handleViewFile = async (evidenceUrl: string) => {
        if (!evidenceUrl) return;

        try {
            Swal.fire({
                title: 'กำลังโหลดไฟล์...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const key = evidenceUrl.startsWith('/') ? evidenceUrl.substring(1) : evidenceUrl;

            const response = await axiosInstance.get(`/files/${encodeURIComponent(key)}`, {
                responseType: 'blob'
            });

            if (!response.data || response.data.size === 0) {
                throw new Error('ไม่พบข้อมูลไฟล์');
            }

            const blobUrl = URL.createObjectURL(response.data);
            window.open(blobUrl, '_blank');
            Swal.close();

            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch (error) {
            console.error('Error fetching file:', error);
            Swal.fire('Error', 'ไม่สามารถเปิดไฟล์ได้', 'error');
        }
    };

    const handlePassInternship = () => {
        Swal.fire({
            width: '400px',
            html: `
                <div class="flex flex-col items-center pt-4">
                    <div class="w-[76px] h-[76px] rounded-full bg-[#DCFAE6] flex items-center justify-center mb-6">
                        <div class="w-[56px] h-[56px] rounded-full bg-[#0EBA67] flex items-center justify-center shadow-sm">
                            <span class="material-symbols-outlined text-white select-none" style="font-size: 36px">check</span>
                        </div>
                    </div>
                    <h2 class="text-[20px] font-bold text-gray-800 mb-6">ยืนยันการอนุมัติ</h2>
                    <div class="flex gap-4 w-full justify-center">
                        <button id="cancel-btn" class="flex-1 max-w-[140px] py-3 border border-gray-300 rounded-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">ยกเลิก</button>
                        <button id="confirm-btn" class="flex-1 max-w-[140px] py-3 bg-[#0EBA67] text-white rounded-[10px] font-bold hover:bg-[#0da45a] transition-colors">ยืนยัน</button>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            customClass: {
                popup: 'rounded-[20px] !p-8',
            },
            didOpen: () => {
                const cancelBtn = document.getElementById('cancel-btn');
                const confirmBtn = document.getElementById('confirm-btn');
                
                cancelBtn?.addEventListener('click', () => Swal.close());
                confirmBtn?.addEventListener('click', async () => {
                    try {
                        Swal.fire({
                            title: 'กำลังบันทึกข้อมูล...',
                            allowOutsideClick: false,
                            didOpen: () => Swal.showLoading()
                        });

                        await axiosInstance.post('/user/internship/complete', { 
                            studentId: studentId,
                            note: 'ผ่านการฝึกงานเรียบร้อยแล้ว'
                        });
                        
                        Swal.fire({
                            width: '400px',
                            html: `
                                <div class="flex flex-col items-center pt-4">
                                    <div class="w-[76px] h-[76px] rounded-full bg-[#DCFAE6] flex items-center justify-center mb-6">
                                        <div class="w-[56px] h-[56px] rounded-full bg-[#0EBA67] flex items-center justify-center shadow-sm">
                                            <span class="material-symbols-outlined text-white select-none" style="font-size: 36px">check</span>
                                        </div>
                                    </div>
                                    <h2 class="text-[20px] font-bold text-gray-800 mb-2">อนุมัติผ่านการฝึกงานแล้ว</h2>
                                </div>
                            `,
                            showConfirmButton: false,
                            timer: 2000,
                            customClass: {
                                popup: 'rounded-[20px] !p-8',
                            }
                        });
                        
                        setTimeout(() => fetchDetail(), 2000);
                    } catch (error) {
                        console.error('Error updating internship status:', error);
                        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถปรับปรุงสถานะได้', 'error');
                    }
                });
            }
        });
    };

    useEffect(() => {
        if (studentId) {
            fetchDetail();
        }
    }, [fetchDetail]);

    const isPassAvailable = useMemo(() => {
        if (!studentData?.profile?.period?.endDate) return false;
        const end = new Date(studentData.profile.period.endDate);
        end.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today >= end;
    }, [studentData]);

    const isCompensateAvailable = useMemo(() => {
        if (!studentData?.profile?.period?.endDate) return false;
        const end = new Date(studentData.profile.period.endDate);
        end.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let count = 0;
        let tempDate = new Date(end);
        if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) count = 1;

        while (count < 7) {
            tempDate.setDate(tempDate.getDate() - 1);
            if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) count++;
        }
        return today >= tempDate;
    }, [studentData]);

    const handleExportExcel = () => {
        const BOM = '\uFEFF';
        let csvContent = BOM + 'วันที่,สถานะ,เวลาเข้า - ออกงาน,ชั่วโมงทำงาน,หมายเหตุ\n';

        attendanceRecords.forEach((row) => {
            const dateStr = new Date(row.workDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            let statusLabel = '-';
            if (row.status === 'LEAVE') {
                if (row.leaveType === 'SICK' || (row.note && (row.note.includes('ป่วย') || row.note.includes('อาหารเป็นพิษ') || row.note.includes('แพทย์') || row.note.includes('โรงพยาบาล')))) {
                    statusLabel = 'ลาป่วย';
                } else {
                    statusLabel = 'ลากิจ';
                }
            } else if (row.status === 'PRESENT') {
                statusLabel = 'เข้างานปกติ';
            } else if (row.status === 'LATE') {
                statusLabel = 'สาย';
            } else if (row.status === 'MISSING_OUT') {
                statusLabel = 'ไม่ลงเวลาออก';
            } else if (row.status === 'ABSENT') {
                statusLabel = 'ขาด';
            }

            const timeStr = row.status === 'ABSENT' || row.status === 'LEAVE' ? '-' : `${row.checkInTime || '-'} - ${row.checkOutTime || '-'}`;
            const noteStr = row.note ? `"${row.note.replace(/"/g, '""')}"` : '-';
            const hoursStr = (row.status === 'ABSENT' || row.status === 'LEAVE') ? 0 : Math.round(parseFloat(row.hours || 0));

            const csvRow = [
                `"${dateStr}"`,
                `"${statusLabel}"`,
                `"${timeStr}"`,
                `"${hoursStr} ชม."`,
                noteStr
            ];
            csvContent += csvRow.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `ประวัติการลงเวลา_${studentData?.profile?.fullName || 'student'}_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading && !studentData) {
        return <div className="p-6 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
    }

    if (!studentData) {
        return <div className="p-6 text-center text-gray-500">ไม่พบข้อมูลนักศึกษา</div>;
    }

    const { profile, progress, summary } = studentData;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-[#111827] hover:opacity-70 transition-all font-medium text-[15px]"
            >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                ย้อนกลับ
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StudentProfileCard 
                    profile={profile} 
                    studentId={studentId} 
                    progress={progress} 
                />

                <InternshipProgressCard 
                    profile={profile}
                    progress={progress}
                    isPassAvailable={isPassAvailable}
                    isCompensateAvailable={isCompensateAvailable}
                    onPassInternship={handlePassInternship}
                    onCompensateClick={() => setIsCompensateModalOpen(true)}
                />
            </div>

            <AttendanceSummaryCards summary={summary} />

            <AttendanceHistoryTable 
                attendanceRecords={attendanceRecords} 
                onViewFile={handleViewFile} 
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2.5 text-[#A80689] font-bold text-[16px] hover:opacity-80 transition-all"
                >
                    <span className="material-symbols-outlined">ios_share</span>
                    ส่งออกตาราง
                </button>

                {pagination && pagination.totalPages > 0 && (
                    <div className="flex items-center border border-[#CECFD2] rounded-full overflow-hidden bg-white shadow-sm">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="w-11 h-10 flex items-center justify-center text-[#000000] border-r border-[#CECFD2] disabled:opacity-30 disabled:bg-gray-50/50"
                        >
                            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                        </button>

                        {Array.from({ length: pagination.totalPages }).map((_, index) => {
                            const p = index + 1;
                            if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-11 h-10 flex items-center justify-center text-[14px] font-medium transition-all border-r border-[#CECFD2] ${page === p ? 'bg-[#E4E7EC] text-[#1F2937]' : 'text-[#6B7280] hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            } else if (p === page - 2 || p === page + 2) {
                                return <div key={p} className="w-11 h-10 flex items-center justify-center text-[#667085] text-[14px] border-r border-[#CECFD2]">...</div>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                            disabled={page === pagination.totalPages}
                            className="w-11 h-10 flex items-center justify-center text-[#000] font-bold hover:bg-gray-50 transition-colors disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            <CompensationModal
                isOpen={isCompensateModalOpen}
                onClose={() => setIsCompensateModalOpen(false)}
                studentId={studentId}
                studentName={profile?.fullName || ''}
                studentNickname={profile?.nickname}
                studentPosition={profile?.position}
                studentGender={profile?.gender}
                profileImg={profile?.profileImg}
                periodEndDate={profile?.period?.endDate}
                accumulatedHours={progress?.accumulatedHours || 0}
                totalHoursGoal={progress?.totalHoursGoal || 0}
                onSuccess={fetchDetail}
            />
        </div>
    );
};

export default StudentDetailPage;
