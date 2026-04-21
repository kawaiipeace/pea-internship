'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/api/axios';
import ImageWithAuth from '@/components/ImageWithAuth';

// ---- Types ----
interface LeaveRequest {
    ids: number[];
    id: number;
    studentName: string;
    type: string;
    typeBg: string;
    typeText: string;
    typeBorder: string;
    typeIcon: string;
    typeCircleBg: string;
    submittedDate: string;
    leaveDate: string;
    reason: string;
    profileImg: string;
    userId: string;
    fileName: string;
    fileIcon: string;
    hasFile: boolean;
    attachmentUrl?: string;
    status: string;
}

interface TimeCorrectionRequest {
    id: number;
    studentName: string;
    profileImg: string | null;
    createdAt: string;
    workDate: string;
    originalTime: string;
    requestedTime: string;
    hoursWorked: number | string;
    reason: string;
    attachmentUrl: string | null;
    status: string;
    type: string;
    typeBg: string;
    typeText: string;
    typeBorder: string;
    typeIcon: string;
    typeCircleBg: string;
}

// ---- Helper Methods ----
export const handleViewFile = async (attachmentUrl: string) => {
    try {
        const key = attachmentUrl.startsWith('/') ? attachmentUrl.substring(1) : attachmentUrl;
        if (!key) return;
        
        const response = await axiosInstance.get('/check-time/file', {
            params: { key },
            responseType: 'blob'
        });
        
        const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
        
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
        console.error('Error fetching file:', error);
        alert('ไม่สามารถเปิดไฟล์ได้ในขณะนี้');
    }
};

const getThaiDate = (dateStr: string | Date) => {
    try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        return date.toLocaleDateString('th-TH', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        });
    } catch (e) {
        return String(dateStr);
    }
};

const getDay = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        day: '2-digit'
    }).format(date);
};

// ---- Sub-components ----

const StatusBadge = ({ status, activeTab }: { status: string, activeTab: 'leave' | 'time-edit' }) => {
    const isApproved = status === 'APPROVED';
    const textPrefix = isApproved ? 'อนุมัติ' : 'ไม่อนุมัติ';
    const textSuffix = activeTab === 'leave' ? 'การลา' : 'การแก้ไขเวลา';
    
    if (isApproved) {
        return (
            <span className="px-3 py-1 bg-[#E6F8ED] text-[#074D31] rounded-full text-xs font-semibold whitespace-nowrap">
                {textPrefix}{textSuffix}
            </span>
        );
    }
    
    return (
        <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-semibold whitespace-nowrap">
            {textPrefix}{textSuffix}
        </span>
    );
};

const StudentHeader = ({ userId, profileImg, studentName, type, typeBg, typeText, typeIcon, typeCircleBg, typeBorder, submittedDate, status, activeTab }: any) => (
    <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1 min-w-0 pr-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
                <ImageWithAuth 
                    userId={userId} 
                    imageKey={profileImg}
                    className="w-full h-full object-cover" 
                    fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`} 
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 dark:text-white-light text-base leading-tight mb-1.5">{studentName}</p>
                <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-2 text-[12px] pl-1 pr-4 py-1 rounded-full border ${typeBg} ${typeText} ${typeBorder}`}>
                        <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 ${typeCircleBg}`}>
                            <span className="material-symbols-outlined text-white text-[16px] select-none" style={{ fontSize: '18px' }}>{typeIcon}</span>
                        </span>
                        {type}
                    </span>
                </div>
                <p className="text-xs text-gray-400">วันที่ส่งคำขอ : {submittedDate}</p>
            </div>
        </div>
        <StatusBadge status={status} activeTab={activeTab} />
    </div>
);

// ---- Cards ----

const LeaveHistoryCard = ({ request }: { request: LeaveRequest }) => (
    <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-white-dark/10 rounded-2xl p-5 shadow-sm">
        <StudentHeader {...request} activeTab="leave" />

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark mb-3">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                calendar_today
            </span>
            <span>วันที่ขอลา : <span className="font-[16px] text-gray-800 dark:text-white-light">{request.leaveDate}</span></span>
        </div>

        <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white-dark/10 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-gray-400 mb-0.5">เหตุผลการลา</p>
            <p className="text-sm text-gray-700 dark:text-white-light font-medium">{request.reason}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
            <span className="text-gray-400">ไฟล์แนบ :</span>
            {request.hasFile ? (
                <div 
                    onClick={() => request.attachmentUrl && handleViewFile(request.attachmentUrl)}
                    className="flex items-center gap-1.5 bg-gray-100 dark:bg-black/20 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                >
                    {request.fileIcon === 'image' ? (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    )}
                    <span className="text-xs font-medium text-gray-600 dark:text-white-light hover:underline hover:text-blue-500">
                        {request.fileName}
                    </span>
                </div>
            ) : (
                <div className="flex items-center bg-gray-50 border border-gray-200 dark:bg-black/10 dark:border-white-dark/10 px-3 py-1.5 rounded-lg">
                    <span className="text-xs text-gray-500">- ไม่มีไฟล์แนบ -</span>
                </div>
            )}
        </div>
    </div>
);

const TimeEditHistoryCard = ({ request }: { request: TimeCorrectionRequest }) => (
    <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-white-dark/10 rounded-2xl p-5 shadow-sm">
        <StudentHeader 
            userId={undefined} 
            profileImg={request.profileImg}
            studentName={request.studentName}
            type={request.type}
            typeBg={request.typeBg}
            typeText={request.typeText}
            typeBorder={request.typeBorder}
            typeIcon={request.typeIcon}
            typeCircleBg={request.typeCircleBg}
            submittedDate={getThaiDate(request.createdAt)}
            status={request.status}
            activeTab="time-edit"
        />

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark mb-3">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                calendar_today
            </span>
            <span>วันที่ : <span className="font-semibold text-gray-800 dark:text-white-light">{getThaiDate(request.workDate)}</span></span>
        </div>

        {/* Time Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
                <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#E4E7EC]">
                    <span className="material-symbols-outlined text-black" style={{ fontSize: '16px' }}>schedule</span>
                </span>
                <span>เวลาเดิม : <span className="font-semibold text-gray-800 dark:text-white-light">{request.originalTime}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
                <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#A9EFC5]">
                    <span className="material-symbols-outlined text-[#074D31]" style={{ fontSize: '16px' }}>manage_history</span>
                </span>
                <span>เวลาที่ขอแก้ไข : <span className="font-semibold text-gray-800 dark:text-white-light">{request.requestedTime}</span></span>
            </div>
        </div>

        {/* Work Hours */}
        <p className="text-sm text-gray-500 mb-3">
            ชั่วโมงทำงานที่แก้ไข : <span className="font-semibold text-gray-800 dark:text-white-light">{request.hoursWorked} ชั่วโมง</span>
        </p>

        {/* Reason Box */}
        <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white-dark/10 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-gray-400 mb-0.5">เหตุผลการแก้ไขเวลา</p>
            <p className="text-sm text-gray-700 dark:text-white-light font-medium">{request.reason}</p>
        </div>

        {/* File Attachment */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
            <span className="text-gray-400">ไฟล์แนบ :</span>
            {request.attachmentUrl ? (
                <div 
                    onClick={() => request.attachmentUrl && handleViewFile(request.attachmentUrl)}
                    className="flex items-center gap-1.5 bg-gray-100 dark:bg-black/20 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                >
                    <span className="text-xs font-medium text-gray-600 dark:text-white-light hover:underline hover:text-blue-500">ดูไฟล์</span>
                </div>
            ) : (
                <div className="flex items-center bg-gray-50 border border-gray-200 dark:bg-black/10 dark:border-white-dark/10 px-3 py-1.5 rounded-lg">
                    <span className="text-xs text-gray-500">- ไม่มีไฟล์แนบ -</span>
                </div>
            )}
        </div>
    </div>
);

// ---- Main Page ----

const ApprovalHistoryPage = () => {
    const [activeTab, setActiveTab] = useState<'leave' | 'time-edit'>('leave');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [timeCorrectionRequests, setTimeCorrectionRequests] = useState<TimeCorrectionRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const PAGE_SIZE = 5;
    const [leaveMeta, setLeaveMeta] = useState({ totalPages: 1, totalRecords: 2 });
    const [timeMeta, setTimeMeta] = useState({ totalPages: 1, totalRecords: 3 });
    const [page, setPage] = useState(1);

    const records = useMemo(() => {
        if (activeTab === 'leave') return leaveRequests;
        return timeCorrectionRequests;
    }, [activeTab, leaveRequests, timeCorrectionRequests]);

    const totalPages = useMemo(() => {
        if (activeTab === 'leave') return leaveMeta.totalPages;
        return timeMeta.totalPages;
    }, [activeTab, leaveMeta.totalPages, timeMeta.totalPages]);

    useEffect(() => {
        setPage(1);
    }, [activeTab, statusFilter]);

    const fetchLeaveRequests = async () => {
        setLoading(true);
        setTimeout(() => {
            const mockLeaveData: LeaveRequest[] = [
                {
                    ids: [1],
                    id: 1,
                    studentName: 'สมศรี สตรีไทย (เฟิร์น)',
                    type: 'ลากิจ',
                    typeBg: 'bg-[#EEEFFF]',
                    typeText: 'text-[#61646C]',
                    typeBorder: 'border-[#1A3CFF]',
                    typeIcon: 'business_center',
                    typeCircleBg: 'bg-[#1A3CFF]',
                    submittedDate: '11 มกราคม 2569',
                    leaveDate: '12 มกราคม 2569',
                    reason: 'เข้าร่วมกิจกรรมมหาวิทยาลัย ขาดไม่ได้',
                    profileImg: '/assets/images/profile-1.jpeg',
                    userId: '1',
                    fileName: 'หลักฐาน.png',
                    fileIcon: 'image',
                    hasFile: true,
                    attachmentUrl: 'mock.png',
                    status: 'REJECTED'
                },
                {
                    ids: [2],
                    id: 2,
                    studentName: 'สมหมาย สายเสมอ (นาย)',
                    type: 'ลาป่วย',
                    typeBg: 'bg-[#FFEFF3]',
                    typeText: 'text-pink-500',
                    typeBorder: 'border-[#FF1A7D]',
                    typeIcon: 'health_cross',
                    typeCircleBg: 'bg-[#FF1A7D]',
                    submittedDate: '9 มกราคม 2569',
                    leaveDate: '10 มกราคม 2569',
                    reason: 'ท้องเสียเนื่องจากอาหารเป็นพิษ',
                    profileImg: '/assets/images/profile-2.jpeg',
                    userId: '2',
                    fileName: 'หลักฐาน.pdf',
                    fileIcon: 'pdf',
                    hasFile: true,
                    attachmentUrl: 'mock.pdf',
                    status: 'APPROVED'
                }
            ];
            
            // Filter by status if not ALL
            const filteredData = statusFilter === 'ALL' 
                ? mockLeaveData 
                : mockLeaveData.filter(item => item.status === statusFilter);

            setLeaveRequests(filteredData);
            setLeaveMeta({ totalPages: 1, totalRecords: filteredData.length });
            setLoading(false);
        }, 300);
    };

    const fetchTimeCorrectionRequests = async () => {
        setLoading(true);
        setTimeout(() => {
            const mockTimeData: TimeCorrectionRequest[] = [
                {
                    id: 3,
                    studentName: 'สมใจ ใฝ่ฝัน (ใจฝัน)',
                    profileImg: '/assets/images/profile-3.jpeg',
                    createdAt: '16 มกราคม 2569',
                    workDate: '15 มกราคม 2569',
                    originalTime: '08:30 - ไม่ลงเวลา',
                    requestedTime: '08:30 - 16:30',
                    hoursWorked: 7,
                    reason: 'ลืมลงเวลาออก',
                    attachmentUrl: null,
                    status: 'APPROVED',
                    type: 'ไม่ลงเวลาออก',
                    typeBg: 'bg-[#F1F5F9]',
                    typeText: 'text-[#475569]',
                    typeBorder: 'border-[#94969C]',
                    typeIcon: 'hourglass_disabled',
                    typeCircleBg: 'bg-[#85888E]'
                },
                {
                    id: 4,
                    studentName: 'สมนึก คึกคะนอง (นิก)',
                    profileImg: '/assets/images/profile-4.jpeg',
                    createdAt: '15 มกราคม 2569',
                    workDate: '14 มกราคม 2569',
                    originalTime: '10:00 - 16:30',
                    requestedTime: '08:30 - 16:30',
                    hoursWorked: 7,
                    reason: 'ระบบขัดข้องทำให้ลงเวลาไม่ได้',
                    attachmentUrl: null,
                    status: 'REJECTED',
                    type: 'สาย',
                    typeBg: 'bg-[#FEF3C7]',
                    typeText: 'text-[#D97706]',
                    typeBorder: 'border-[#FCD34D]',
                    typeIcon: 'schedule',
                    typeCircleBg: 'bg-[#F59E0B]'
                },
                {
                    id: 5,
                    studentName: 'สมชาย ล่าฝัน (ชาย)',
                    profileImg: '/assets/images/profile-5.jpeg',
                    createdAt: '11 มกราคม 2569',
                    workDate: '10 มกราคม 2569',
                    originalTime: 'ไม่ลงเวลา - ไม่ลงเวลา',
                    requestedTime: '08:30 - 16:30',
                    hoursWorked: 7,
                    reason: 'เกิดอุบัติเหตุ',
                    attachmentUrl: null,
                    status: 'APPROVED',
                    type: 'ขาด',
                    typeBg: 'bg-[#FEE2E2]',
                    typeText: 'text-[#EF4444]',
                    typeBorder: 'border-[#FECACA]',
                    typeIcon: 'close',
                    typeCircleBg: 'bg-[#EF4444]'
                }
            ];

            // Filter by status if not ALL
            const filteredData = statusFilter === 'ALL' 
                ? mockTimeData 
                : mockTimeData.filter(item => item.status === statusFilter);

            setTimeCorrectionRequests(filteredData);
            setTimeMeta({ totalPages: 1, totalRecords: filteredData.length });
            setLoading(false);
        }, 300);
    };

    useEffect(() => {
        if (activeTab === 'leave') {
            fetchLeaveRequests();
        } else if (activeTab === 'time-edit') {
            fetchTimeCorrectionRequests();
        }
    }, [page, activeTab, statusFilter]);

    const summaryCards = [
        {
            key: 'leave' as const,
            title: 'คำขอลา',
            count: `${leaveMeta.totalRecords} รายการ`,
            icon: (
                <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#1AB3FF]">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>lab_profile</span>
                </div>
            ),
            activeBg: 'bg-[#E5F4FF]',
            activeBorder: 'border-[#1AB3FF]',
            inactiveBg: 'bg-[#E5F4FF]',
            inactiveBorder: 'border-[#E5F4FF]',
        },
        {
            key: 'time-edit' as const,
            title: 'คำขอแก้ไขเวลา',
            count: `${timeMeta.totalRecords} รายการ`,
            icon: (
                <div className="w-[28px] h-[28px] rounded-full bg-[#D9692C] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>edit_square</span>
                </div>
            ),
            activeBg: 'bg-[#FFF6D4]',
            activeBorder: 'border-[#FFCA5F]',
            inactiveBg: 'bg-[#FFF6D4]',
            inactiveBorder: 'border-[#FFF6D4]',
        },
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-[24px] font-bold text-gray-800 dark:text-white-light">ประวัติการพิจารณาคำขอ</h1>
                <p className="text-gray-400 mt-2 text-[16px]">แสดงผลการพิจารณาและรายละเอียดของคำขอในแต่ละรายการ</p>
            </div>

            {/* Summary Cards (Tabs) */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {summaryCards.map((card) => {
                    const isActive = activeTab === card.key;
                    return (
                        <button
                            key={card.key}
                            onClick={() => setActiveTab(card.key)}
                            style={{ height: '78px' }}
                            className={`flex items-center gap-4 px-5 rounded-2xl border-2 transition-all text-left w-full
                                ${isActive ? `${card.activeBg} ${card.activeBorder} shadow-sm` : `${card.inactiveBg} ${card.inactiveBorder}`}`}
                        >
                            {card.icon}
                            <div>
                                <p className="text-[16px] text-black dark:text-white-light">{card.title}</p>
                                <p className={`text-[16px] font-bold ${isActive ? 'text-black dark:text-white-light' : 'text-black dark:text-white-light'}`}>{card.count}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filter and List Header */}
            <div className="flex flex-col gap-3 mb-2">
                <p className="text-[16px] font-semibold text-gray-500">รายการพิจารณาคำขอทั้งหมด</p>
                <div className="flex items-center">
                    <div className="relative min-w-[220px]">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between border border-gray-200 dark:border-white-dark/10 bg-white dark:bg-[#0e1726] rounded-xl px-4 py-2.5 cursor-pointer shadow-sm focus:outline-none"
                        >
                            <span className="text-[15px] text-gray-800 dark:text-white-light font-medium">
                                สถานะคำขอ : {statusFilter === 'ALL' ? 'ทั้งหมด' : statusFilter === 'APPROVED' ? 'อนุมัติ' : 'ไม่อนุมัติ'}
                            </span>
                            <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '20px' }}>expand_more</span>
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-[5]" 
                                    onClick={() => setIsDropdownOpen(false)} 
                                />
                                <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-white-dark/10 rounded-xl shadow-lg z-10 py-1.5 overflow-hidden">
                                    {[
                                        { value: 'ALL', label: 'ทั้งหมด' },
                                        { value: 'APPROVED', label: 'อนุมัติ' },
                                        { value: 'REJECTED', label: 'ไม่อนุมัติ' },
                                    ].map((opt) => {
                                        const isSelected = statusFilter === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    setStatusFilter(opt.value as any);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-[15px] transition-colors focus:outline-none 
                                                    ${isSelected 
                                                        ? 'bg-[#F9EDF6] text-[#863073] font-medium' 
                                                        : 'text-gray-700 dark:text-white-light hover:bg-gray-50 dark:hover:bg-black/20'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Request List */}
            <div className="space-y-4">
                {activeTab === 'leave' ? (
                    loading ? (
                        <p className="text-center text-sm text-gray-500 py-8">กำลังโหลดข้อมูล...</p>
                    ) : records.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-8">ไม่มีประวัติคำขอลา</p>
                    ) : (
                        records.map((r) => (
                            <LeaveHistoryCard key={(r as any).id} request={r as any} />
                        ))
                    )
                ) : (
                    loading ? (
                        <p className="text-center text-sm text-gray-500 py-8">กำลังโหลดข้อมูล...</p>
                    ) : records.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-8">ไม่มีประวัติคำขอแก้ไขเวลา</p>
                    ) : (
                        records.map((r) => (
                            <TimeEditHistoryCard key={r.id} request={r as any} />
                        ))
                    )
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end mt-8 pb-10 gap-6 px-2">
                    <div className="flex items-center border border-[#CECFD2] rounded-full overflow-hidden bg-white shadow-sm">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="w-11 h-10 flex items-center justify-center text-[#000000] border-r border-[#CECFD2] disabled:opacity-30 disabled:bg-gray-50/50"
                        >
                            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                        </button>
                        
                        {Array.from({ length: totalPages }).map((_, index) => {
                            const pageNum = index + 1;
                            return (
                                <button 
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)} 
                                    className={`w-11 h-10 flex items-center justify-center text-[14px] font-medium transition-all border-r border-[#CECFD2] ${page === pageNum ? 'bg-[#E4E7EC] text-[#1F2937]' : 'text-[#6B7280] hover:bg-gray-50'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page >= totalPages}
                            className="w-11 h-10 flex items-center justify-center text-[#000] font-bold hover:bg-gray-50 transition-colors disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalHistoryPage;