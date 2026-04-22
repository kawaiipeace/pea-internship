'use client';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/api/axios';
import ImageWithAuth from '@/components/ImageWithAuth';
import Swal from 'sweetalert2';

const CompensationModal = ({ isOpen, onClose, profile, progress, studentId }: any) => {
    const defaultMissing = Math.max(0, (progress?.totalHoursGoal || 0) - (progress?.accumulatedHours || 0));
    const [hours, setHours] = useState<string>(defaultMissing.toString());

    useEffect(() => {
        if (isOpen) {
            setHours(defaultMissing.toString());
        }
    }, [isOpen, defaultMissing]);

    if (!isOpen) return null;

    const parsedHours = parseFloat(hours) || 0;
    const days = Math.ceil(parsedHours / 7);

    // Calculate new end date (skipping weekends)
    let endDate = profile?.period?.endDate ? new Date(profile.period.endDate) : new Date();
    let added = 0;
    while (added < days) {
        endDate.setDate(endDate.getDate() + 1);
        if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
            added++;
        }
    }

    const thaiEndDate = endDate.toLocaleDateString('th-TH', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const formatOrigEnd = profile?.period?.endDate ? new Date(profile.period.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

    // Calculate remaining days for original end date
    const now = new Date();
    const origEnd = profile?.period?.endDate ? new Date(profile.period.endDate) : new Date();
    const timeDiff = Math.ceil((origEnd.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const remainDays = Math.max(0, timeDiff);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-[700px] mx-4 p-7" onClick={e => e.stopPropagation()}>
                {/* Header Profile */}
                <div className="flex items-center gap-4 mb-6">
                    <ImageWithAuth
                        userId={studentId}
                        imageKey={profile?.profileImg}
                        className="w-16 h-16 rounded-full object-cover border border-gray-100 shrink-0"
                        fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || '')}&background=random`}
                    />
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">
                            {(() => {
                                const rawName = profile?.fullName || '';
                                const parts = rawName.split(' (');
                                const mainName = parts[0];
                                const extractedNick = parts[1] ? parts[1].replace(')', '') : '';
                                const nick = profile?.nickname || extractedNick;
                                const genderLabel = (profile?.gender === 'M' || profile?.gender === 'ชาย') ? '(ชาย)' : (profile?.gender === 'F' || profile?.gender === 'หญิง') ? '(หญิง)' : '';

                                return (
                                    <>
                                        {mainName}
                                        {nick && (
                                            <span className="text-[#000000] font-bold ml-2">({nick})</span>
                                        )}
                                        {genderLabel && <span className="ml-2 font-normal text-gray-500">{genderLabel}</span>}
                                    </>
                                );
                            })()}
                        </h2>
                        <p className="text-[#61646C] text-[14px] mt-0.5">{profile?.position || 'นักศึกษาฝึกงาน'}</p>
                    </div>
                </div>

                {/* Two Cards */}
                <div className="flex gap-6 mb-16 justify-center">
                    <div className="bg-[#F2F4F7] rounded-xl p-1.5  border border-[#F2F4F7] w-[253px] h-[93px] shrink-0">
                        <p className="text-[#111827] font-bold text-[16px] mb-1 ml-2">สถานะนักศึกษา</p>
                        <p className="text-[#61646C] text-[16px] mb-1 ml-2">วันสิ้นสุด: <span className="text-[#111827] font-bold">{formatOrigEnd}</span></p>
                        <p className="text-[#61646C] text-[16px] ml-2">เหลือเวลา: <span className="text-[#A80689] font-bold">{remainDays} วัน</span></p>
                    </div>
                    <div className="bg-[#A80689] rounded-xl p-3 text-white flex flex-col justify-between w-[350px] h-[93px] shrink-0">
                        <p className="font-semibold text-[14px]">ความคืบหน้าในการฝึกงาน</p>
                        <div className="flex justify-between items-end">
                            <p className="text-[22px] font-semibold max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                {progress?.accumulatedHours} <span className="text-[14px] font-normal text-white/80">/{progress?.totalHoursGoal} ชั่วโมง</span>
                            </p>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-[12px] text-white/80 leading-none">ขาดอีก</span>
                                <span className="text-[14px] font-semibold text-white mt-1">{defaultMissing} ชั่วโมง</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="flex items-start gap-1 mb-5">
                    <div className="w-[40px] h-[40px] rounded-full  bg-[#FFF5FD] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#A80689] text-[22px]">calendar_add_on</span>
                    </div>
                    <div>
                        <h3 className="text-[18px] font-bold text-[#A80689]">ชดเชยวันปฏิบัติงาน</h3>
                        <p className="text-[14px] text-[#85888E]  mt-1 leading-snug">จำนวนวันที่ต้องปฏิบัติงานเพิ่มเติมหลังวันสิ้นสุดการฝึกงาน โดยคำนวณจากจำนวนชั่วโมงที่ยังไม่ครบ</p>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-[#F2F4F7] rounded-[10px] p-5 mb-4">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[14px] font-normal text-[#111827] mb-2">จำนวนชั่วโมงที่ต้องชดเชย</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    value={hours}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (parseFloat(val) < 0) return;
                                        setHours(val);
                                    }}
                                    className="w-full bg-white border border-[#F2F4F7] rounded-[5px] py-2.5 px-3 pr-14 text-[14px] text-[#111827] focus:ring-2 focus:ring-[#A80689]/20 focus:border-[#A80689] outline-none"
                                />
                                <span className="absolute right-3 top-2.5 text-[14px] text-[#61646C] pointer-events-none">ชั่วโมง</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[14px] font-normal text-[#111827] mb-2">คิดเป็นจำนวนวัน</label>
                            <div className="w-full bg-[#ECECED] border border-[#EAECF0] rounded-[5px] py-2.5 px-3 text-[14px] font-medium text-[#333741]">
                                {days} วัน / วันสิ้นสุด: {thaiEndDate}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2.5 text-[#98A2B3]">
                                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                <span className="text-[12px]">ระบบคำนวณจาก 7 ชั่วโมง/วัน และปัดขึ้นเสมอ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert */}
                <div className="bg-[#FFF5FD] rounded-xl p-3 flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-[#A80689] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    <span className="text-[#A80689] text-[13px] font-medium">ระบบคำนวณให้อัตโนมัติ สามารถปรับได้ตามความเหมาะสม</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-[#D0D5DD] rounded-xl text-[#344054] text-[14px] font-bold hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={() => {
                            Swal.fire({
                                width: '380px',
                                html: `
                                    <div class="flex flex-col items-center pt-4">
                                        <div class="w-[76px] h-[76px] rounded-full bg-[#DCFAE6] flex items-center justify-center mb-6">
                                            <div class="w-[56px] h-[56px] rounded-full bg-[#0EBA67] flex items-center justify-center shadow-sm">
                                                <span class="material-symbols-outlined text-white text-[20px] select-none" style="font-size: 36px">check</span>
                                            </div>
                                        </div>
                                        <h2 class="text-[20px] font-bold text-gray-800 mb-2">ยืนยันการชดเชยแล้ว</h2>
                                    </div>
                                `,
                                showConfirmButton: false,
                                timer: 2000,
                                timerProgressBar: false,
                                customClass: {
                                    popup: 'rounded-[20px] !p-8',
                                }
                            });
                            onClose();
                        }}
                        className="px-6 py-2.5 bg-[#0EBA67] rounded-xl text-white text-[14px] font-bold hover:bg-[#0da45a] transition-colors shadow-sm"
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

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
                        // Optional: You could add the actual API call here if needed
                        // await axiosInstance.patch(`/mentor/students/${studentId}/status`, { status: 'COMPLETE' });
                        
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
                        
                        // Refresh data after a short delay
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

    const renderStatusBadge = (status: string, note: string = '', leaveType?: string) => {
        if (status === 'LEAVE') {
            if (leaveType === 'SICK' || note.includes('ป่วย') || note.includes('อาหารเป็นพิษ') || note.includes('แพทย์') || note.includes('โรงพยาบาล')) {
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FDF2F8] border border-[#FBCFE8] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#EC4899] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>health_cross</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลาป่วย</span>
                    </div>
                );
            }
            return (
                <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#EEEFFF] border border-[#1A3CFF]/50 w-max">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#1A3CFF] text-white rounded-full shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>business_center</span>
                    </div>
                    <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลากิจ</span>
                </div>
            );
        }

        switch (status) {
            case 'PRESENT':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#E4FFEE] border border-[#75E0A7] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#079455] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>check</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">เข้างานปกติ</span>
                    </div>
                );
            case 'LATE':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FFF9E5] border border-[#FFCA5F] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#FDB022] text-white rounded-full shrink-0 shadow-sm transition-transform">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>schedule</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">สาย</span>
                    </div>
                );
            case 'MISSING_OUT':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#F0F1F1] border border-[#94969C] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#85888E] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>hourglass_disabled</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ไม่ลงเวลาออก</span>
                    </div>
                );
            case 'ABSENT':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FFF1EF] border border-[#FF8980] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#D92D20] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>close</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ขาด</span>
                    </div>
                );
            default: return null;
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (isLoading && !studentData) {
        return <div className="p-6 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
    }

    if (!studentData) {
        return <div className="p-6 text-center text-gray-500">ไม่พบข้อมูลนักศึกษา</div>;
    }

    const { profile, progress, summary } = studentData;
    const progressPercent = progress.totalHoursGoal > 0 ? (progress.accumulatedHours / progress.totalHoursGoal) * 100 : 0;

    const handleExportExcel = () => {
        const BOM = '\uFEFF';
        let csvContent = BOM + 'วันที่,สถานะ,เวลาเข้า - ออกงาน,ชั่วโมงทำงาน,หมายเหตุ\n';

        attendanceRecords.forEach((row) => {
            const dateStr = formatDate(row.workDate);
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
            const hoursStr = row.hours || '0';

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
        link.setAttribute('download', `ประวัติการลงเวลา_${profile?.fullName || 'student'}_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                <div className="lg:col-span-2 panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <ImageWithAuth
                            userId={studentId}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                            fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`}
                        />
                        <div className="flex flex-col items-center sm:items-start w-full">
                            <div className={`px-3 py-1 rounded-full border text-[12px] font-bold flex items-center justify-center gap-2 w-max mb-3 sm:mb-5 ${profile.internshipStatus === 'COMPLETE'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-[#FEF7EB] border-[#FDB022] text-[#944900]'
                                }`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${profile.internshipStatus === 'COMPLETE' ? 'bg-green-500' : 'bg-[#FDB022]'}`}></div>
                                {profile.internshipStatus === 'COMPLETE' ? 'สิ้นสุดการฝึกงาน' : 'อยู่ระหว่างฝึกงาน'}
                            </div>
                            <h1 className="text-[20px] sm:text-[24px] font-medium text-[#111827] leading-tight">
                                {(() => {
                                    const rawName = profile.fullName || '';
                                    const parts = rawName.split(' (');
                                    const mainName = parts[0];
                                    const extractedNick = parts[1] ? parts[1].replace(')', '') : '';

                                    // Prioritize nickname from API if available
                                    const nick = profile.nickname || extractedNick;

                                    return (
                                        <>
                                            {mainName}
                                            {nick && (
                                                <span className="text-[#000000] font-bold ml-2">({nick})</span>
                                            )}
                                        </>
                                    );
                                })()}
                            </h1>
                            <p className="text-[#61646C] text-[14px] font-medium mt-1">{profile.position || 'นักศึกษาฝึกงาน'}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 mt-6 sm:mt-8 w-full">
                                <div>
                                    <p className="text-[#98A2B3] text-[14px] mb-0.5">ชื่อสถานบัน</p>
                                    <p className="text-[#111827] text-[16px] font-normal leading-tight break-words max-w-[200px]">{profile.institution || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[14px] mb-0.5">ระยะเวลาการฝึกงาน</p>
                                    <p className="text-[#111827] text-[16px] font-normal leading-tight">
                                        {formatDate(profile.period?.startDate)} - {formatDate(profile.period?.endDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[14px] mb-0.5">อีเมล</p>
                                    <p className="text-[#111827] text-[16px] font-normal leading-tight break-all max-w-[200px]">{profile.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[14px] mb-0.5">เบอร์โทร</p>
                                    <p className="text-[#111827] text-[16px] font-normal leading-tight">{profile.phone || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-8 flex flex-col items-start bg-white h-full relative">
                    <div className="space-y-4 w-full">
                        <h2 className="text-[#111827] font-bold text-[18px]">ความคืบหน้าในการฝึกงาน</h2>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-[32px] font-bold text-[#A80689]">{progress.accumulatedHours}</span>
                                <span className="text-[16px] text-[#61646C] font-medium">/ {progress.totalHoursGoal} ชั่วโมง</span>
                            </div>
                            <div className="w-full bg-[#F2F4F7] rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-[#A80689] h-3 rounded-full shadow-sm transition-all duration-700"
                                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                                ></div>
                            </div>
                            {(() => {
                                if (!profile.period?.endDate) return null;
                                const end = new Date(profile.period.endDate);
                                const now = new Date();
                                const diff = end.getTime() - now.getTime();
                                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

                                const isUrgent = days <= 7;
                                const displayColor = isUrgent ? '#B42318' : '#6b7280';
                                const iconColor = isUrgent ? '#B42318' : '#85888E';

                                return (
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className="material-symbols-outlined select-none"
                                            style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: iconColor }}
                                        >
                                            schedule
                                        </span>
                                        <span className="text-[14px] font-normal" style={{ color: displayColor }}>
                                            {days > 0 ? `เหลืออีก ${days} วันก่อนสิ้นสุดการฝึกงาน` : 'สิ้นสุดการฝึกงานแล้ว'}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="w-full space-y-3 mt-8">
                        <button 
                            type="button"
                            onClick={handlePassInternship}
                            className="w-full py-3 bg-[#74D1A6] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#067647] transition-colors shadow-sm text-[18px]"
                        >
                            <span className="material-symbols-outlined text-white text-[24px]">check_circle</span>
                            ผ่านการฝึกงาน
                        </button>
                        <button
                            onClick={() => setIsCompensateModalOpen(true)}
                            className="w-full py-3 bg-[#FFF5FD] text-[#A80689] border border-[#A80689] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors shadow-sm text-[18px]"
                        >
                            ชดเชยวันทำงาน
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'เข้างานปกติ', icon: 'check', color: '#079455', value: summary.present },
                    { label: 'สาย', icon: 'schedule', color: '#FDB022', value: summary.late },
                    { label: 'ลา', icon: 'business_center', color: '#1A3CFF', value: summary.leave },
                    { label: 'ขาด', icon: 'close', color: '#D92D20', value: summary.absent }
                ].map((stat, i) => (
                    <div key={i} className="panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: stat.color }}>
                            <span className="material-symbols-outlined text-white select-none" style={{ fontSize: '24px' }}>{stat.icon}</span>
                        </div>
                        <div>
                            <p className="text-[#61646C] text-[14px] font-medium">{stat.label}</p>
                            <p className="text-[#111827] text-[16px] font-bold">{stat.value} รายการ</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="panel p-0 border-[#CECFD2] border-[1px] shadow-sm overflow-hidden rounded-xl">
                <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse table-auto min-w-[1100px]">
                        <thead className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                            <tr className="text-[#111827] font-normal text-[14px]">
                                <th className="py-4 px-6 text-center font-normal">วันที่</th>
                                <th className="py-4 px-6 text-center font-normal">สถานะ</th>
                                <th className="py-4 px-6 text-center font-normal">เวลาเข้า - ออกงาน</th>
                                <th className="py-4 px-6 text-center font-normal">ชั่วโมงทำงาน</th>
                                <th className="py-4 px-6 text-center font-normal">หลักฐาน</th>
                                <th className="py-4 px-6 text-center font-normal">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2F4F7]">
                            {attendanceRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-gray-500">ไม่พบประวัติการลงเวลา</td>
                                </tr>
                            ) : attendanceRecords.map((row, i) => (
                                <tr key={row.id || i}>
                                    <td className="py-4 px-6 text-center text-[16px] text-[#475467]">{formatDate(row.workDate)}</td>
                                    <td className="py-4 px-6 flex justify-center">{renderStatusBadge(row.status, row.note, row.leaveType)}</td>
                                    <td className="py-4 px-6 text-center text-[16px] text-[#475467]">
                                        {row.status === 'ABSENT' || row.status === 'LEAVE' ? '-' : `${row.checkInTime} - ${row.checkOutTime}`}
                                    </td>
                                    <td className="py-4 px-6 text-center text-[16px] text-[#475467] font-bold">{row.hours} ชม.</td>
                                    <td className="py-4 px-6">
                                        <div className="flex justify-center">
                                            {row.evidenceUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewFile(row.evidenceUrl)}
                                                    className="inline-flex items-center gap-2 px-1.5 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                                                >
                                                    {row.evidenceUrl.toLowerCase().endsWith('.pdf') ? (
                                                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined text-[#111827] text-[24px]">
                                                                picture_as_pdf
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-[#ffffff] flex items-center justify-center shrink-0">
                                                            <span
                                                                className="material-symbols-outlined text-[#000000] text-[18px]"
                                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                                            >
                                                                image
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span className="text-[15px] font-medium text-[#111827] pr-2">
                                                        หลักฐาน.{row.evidenceUrl.split('.').pop()?.substring(0, 4)}
                                                    </span>
                                                </button>
                                            ) : row.status === 'LEAVE' ? (
                                                <div className="inline-flex items-center justify-center px-4 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl">
                                                    <span className="text-[15px] font-medium text-[#6B7280]">
                                                        - ไม่มีไฟล์แนบ -
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[#98A2B3] text-[16px]">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {(() => {
                                                const allNotes: any[] = [];
                                                
                                                // 1. Add notes from the backend array if present
                                                if (row.notes && Array.isArray(row.notes)) {
                                                    row.notes.forEach((n: any) => {
                                                        if (n.detail) allNotes.push(n);
                                                    });
                                                }
                                                
                                                // 2. Add the merged 'note' field (leaves, etc) if not already included
                                                if (row.note && !allNotes.some(n => n.detail === row.note)) {
                                                    allNotes.push({ type: 'OTHER', detail: row.note });
                                                }

                                                if (allNotes.length === 0) return <span className="text-[16px] font-medium text-[#98A2B3]">-</span>;

                                                return allNotes.map((n, idx) => {
                                                    // Force red color for Correction and Offsite as requested
                                                    const isCorrection = n.type === 'CORRECTION' || n.detail.includes('แก้ไขเวลา');
                                                    const isOffsite = n.type === 'OFFSITE' || n.detail.includes('ปฏิบัติงานนอกสถานที่');
                                                    
                                                    // Hide LATE specific notes like location names if status is LATE
                                                    if (row.status === 'LATE' && (n.detail === 'สาย' || !isCorrection && !isOffsite && n.type !== 'LEAVE')) {
                                                        return null;
                                                    }

                                                    const color = (isCorrection || isOffsite) ? 'text-[#D92D20]' : 'text-[#000000]';
                                                    
                                                    return (
                                                        <span key={idx} className={`text-[16px] font-medium ${color}`}>
                                                            {n.detail}
                                                        </span>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
                profile={profile}
                progress={progress}
                studentId={studentId}
            />
        </div>
    );
};

export default StudentDetailPage;
