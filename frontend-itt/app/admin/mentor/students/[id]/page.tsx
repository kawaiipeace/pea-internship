'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/api/axios';
import ImageWithAuth from '@/components/ImageWithAuth';

const StudentDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;
    
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [studentData, setStudentData] = useState<any>(null);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);

    const fetchDetail = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`/mentor/students/${studentId}`, {
                params: { page, limit: 10 }
            });
            const data = response.data;
            setStudentData(data);
            setAttendanceRecords(data.attendanceTable.records || []);
            setPagination(data.attendanceTable.pagination);
        } catch (error) {
            console.error('Error fetching student detail:', error);
        } finally {
            setIsLoading(false);
        }
    }, [studentId, page]);

    useEffect(() => {
        if (studentId) {
            fetchDetail();
        }
    }, [fetchDetail]);

    const renderStatusBadge = (status: string) => {
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
            case 'LEAVE':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#EEEFFF] border border-[#1A3CFF]/50 w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#1A3CFF] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>business_center</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลา</span>
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
                <div className="lg:col-span-2 panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-8">
                    <div className="flex items-start gap-6">
                        <ImageWithAuth 
                            userId={studentId} 
                            className="w-32 h-32 rounded-full object-cover border border-[#E5E7EB] shrink-0" 
                            fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random`}
                        />
                        <div className="flex flex-col">
                            <div className={`px-3 py-1 rounded-full border text-[12px] font-bold flex items-center gap-2 w-max mb-5 ${
                                profile.internshipStatus === 'COMPLETE' 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-[#FEF7EB] border-[#FDB022] text-[#944900]'
                            }`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${profile.internshipStatus === 'COMPLETE' ? 'bg-green-500' : 'bg-[#FDB022]'}`}></div>
                                {profile.internshipStatus === 'COMPLETE' ? 'สิ้นสุดการฝึกงาน' : 'อยู่ระหว่างฝึกงาน'}
                            </div>
                            <h1 className="text-[24px] font-medium text-[#111827] leading-tight">{profile.fullName}</h1>
                            <p className="text-[#61646C] text-[14px] font-medium">{profile.position || 'นักศึกษาฝึกงาน'}</p>
                            
                            <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-8">
                                <div>
                                    <p className="text-[#98A2B3] text-[15px] mb-0.5">ชื่อสถานบัน</p>
                                    <p className="text-[#111827] text-[18px] font-normal leading-tight">{profile.institution || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[15px] mb-0.5">ระยะเวลาการฝึกงาน</p>
                                    <p className="text-[#111827] text-[18px] font-normal leading-tight">
                                        {formatDate(profile.period?.startDate)} - {formatDate(profile.period?.endDate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[15px] mb-0.5">อีเมล</p>
                                    <p className="text-[#111827] text-[18px] font-normal leading-tight">{profile.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[15px] mb-0.5">เบอร์โทร</p>
                                    <p className="text-[#111827] text-[18px] font-normal leading-tight">{profile.phone || '-'}</p>
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
                        <button className="w-full py-3 bg-[#74D1A6] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#067647] transition-colors shadow-sm text-[18px]">
                            <span className="material-symbols-outlined text-white text-[24px]">check_circle</span>
                            ผ่านการฝึกงาน
                        </button>
                        <button className="w-full py-3 bg-[#FFF5FD] text-[#333741]/60 border border-[#A80689] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-[18px]">
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
                            <p className="text-[#61646C] text-[12px] font-medium">{stat.label}</p>
                            <p className="text-[#111827] text-[16px] font-bold">{stat.value} รายการ</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="panel p-0 border-[#CECFD2] border-[1px] shadow-sm overflow-hidden rounded-xl">
                <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse table-auto min-w-[1000px]">
                        <thead className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                            <tr className="text-[#111827] font-normal text-[14px]">
                                <th className="py-4 px-6 text-center font-normal">วันที่</th>
                                <th className="py-4 px-6 text-center font-normal">สถานะ</th>
                                <th className="py-4 px-6 text-center font-normal">เวลาเข้า - ออกงาน</th>
                                <th className="py-4 px-6 text-center font-normal">ชั่วโมงทำงาน</th>
                                <th className="py-4 px-6 text-center font-normal">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2F4F7]">
                            {attendanceRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-gray-500">ไม่พบประวัติการลงเวลา</td>
                                </tr>
                            ) : attendanceRecords.map((row, i) => (
                                <tr key={row.id || i}>
                                    <td className="py-4 px-6 text-center text-[16px] text-[#475467]">{formatDate(row.workDate)}</td>
                                    <td className="py-4 px-6 flex justify-center">{renderStatusBadge(row.status)}</td>
                                    <td className="py-4 px-6 text-center text-[16px] text-[#475467]">
                                        {row.status === 'ABSENT' || row.status === 'LEAVE' ? '-' : `${row.checkInTime} - ${row.checkOutTime}`}
                                    </td>
                                    <td className="py-4 px-6 text-center text-[16px] text-[#475467] font-bold">{row.hours} ชม.</td>
                                    <td className="py-4 px-6 text-center">
                                        <span className="text-[16px] font-medium text-[#000000]">
                                            {row.note || '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                <button className="flex items-center gap-2.5 text-[#A80689] font-bold text-[16px] hover:opacity-80 transition-all">
                    <span className="material-symbols-outlined">ios_share</span>
                    ส่งออกตาราง
                </button>

                {pagination && pagination.totalPages > 1 && (
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
        </div>
    );
};

export default StudentDetailPage;
