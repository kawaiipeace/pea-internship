'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    attendanceStatus?: string;
}


// ---- Data ----

// Data fetching and states will be handled inside the component


// ---- Reject Modal ----

const RejectModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    title: string;
    isLoading?: boolean;
}) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(reason);
    };

    const handleClose = () => {
        if (!isLoading) {
            setReason('');
            onClose();
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={handleClose}
        >
            <div
                className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl w-full max-w-[520px] mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                            <span
                                className="material-symbols-outlined text-red-500"
                                style={{ fontSize: '24px', fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                            >
                                cancel
                            </span>
                        </div>
                        <h2 className="text-[18px] font-bold text-gray-800 dark:text-white-light">{title}</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
                    </button>
                </div>

                <hr className="border-gray-100 dark:border-white-dark/10" />

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-500 dark:text-white-dark mb-4">
                        กรุณาระบุเหตุผลเพื่อให้นักศึกษาในการดูแลทราบ
                    </p>
                    <label className="block text-sm font-bold text-gray-800 dark:text-white-light mb-2">
                        เหตุผลที่{title} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="กรุณาระบุเหตุผลที่ชัดเจน..."
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-white-dark/20 rounded-xl text-sm text-gray-700 dark:text-white-light bg-white dark:bg-black/20 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20 resize-none transition-all"
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 pb-5">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="w-[120px] py-2.5 rounded-xl border border-gray-300 dark:border-white-dark/30 text-gray-700 dark:text-white-light text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reason.trim() || isLoading}
                        className={`w-[120px] py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2
                            ${reason.trim() ? 'bg-red-500 hover:bg-red-600 shadow-sm' : 'bg-red-200'}`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'ไม่อนุมัติ'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ---- Approve Confirm Modal ----

const ApproveConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl w-full max-w-[380px] mx-4 px-8 py-8 flex flex-col items-center text-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="w-[76px] h-[76px] rounded-full bg-[#E6F8ED] flex items-center justify-center mb-5">
                    <div className="w-[56px] h-[56px] rounded-full bg-[#0EBA67] flex items-center justify-center shadow-sm">
                        <span
                            className="material-symbols-outlined text-white"
                            style={{ fontSize: '36px', fontVariationSettings: "'wght' 700" }}
                        >
                            check
                        </span>
                    </div>
                </div>

                <h2 className="text-[18px] font-bold text-gray-800 dark:text-white-light mb-6">
                    ยืนยันการอนุมัติคำขอ
                </h2>

                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-white-dark/30 text-gray-700 dark:text-white-light text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'ยืนยัน'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ---- Approve Success Modal ----

const ApproveSuccessModal = ({ isOpen }: { isOpen: boolean }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
            <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl w-full max-w-[380px] mx-4 px-8 py-8 flex flex-col items-center text-center">
                <div className="w-[76px] h-[76px] rounded-full bg-[#E6F8ED] flex items-center justify-center mb-5">
                    <div className="w-[56px] h-[56px] rounded-full bg-[#0EBA67] flex items-center justify-center shadow-sm">
                        <span
                            className="material-symbols-outlined text-white"
                            style={{ fontSize: '36px', fontVariationSettings: "'wght' 700" }}
                        >
                            check
                        </span>
                    </div>
                </div>
                <h2 className="text-[18px] font-bold text-gray-800 dark:text-white-light">
                    อนุมัติคำขอสำเร็จ
                </h2>
            </div>
        </div>,
        document.body
    );
};

// ---- Reject Success Modal ----

const RejectSuccessModal = ({ isOpen }: { isOpen: boolean }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
            <div className="bg-white dark:bg-[#0e1726] rounded-2xl shadow-2xl w-full max-w-[380px] mx-4 px-8 py-8 flex flex-col items-center text-center">
                <div className="w-[76px] h-[76px] rounded-full bg-red-50 flex items-center justify-center mb-5">
                    <div className="w-[56px] h-[56px] rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                        <span
                            className="material-symbols-outlined text-white"
                            style={{ fontSize: '36px', fontVariationSettings: "'wght' 700" }}
                        >
                            check
                        </span>
                    </div>
                </div>
                <h2 className="text-[18px] font-bold text-gray-800 dark:text-white-light">
                    ไม่อนุมัติคำขอสำเร็จ
                </h2>
            </div>
        </div>,
        document.body
    );
};

// ---- Sub-components ----

const ActionButtons = ({ onReject, onApprove }: { onReject: () => void; onApprove: () => void }) => (
    <>
        <hr className="my-4 border-gray-100 dark:border-white-dark/10" />
        <div className="flex justify-end gap-3">
            <button
                onClick={onReject}
                className="flex items-center justify-center gap-2 w-[160px] py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
            >
                <span className="material-symbols-outlined text-white" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>cancel</span>
                ไม่อนุมัติ
            </button>
            <button
                onClick={onApprove}
                className="flex items-center justify-center gap-2 w-[160px] py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
            >
                <span className="material-symbols-outlined text-white" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>check_circle</span>
                อนุมัติ
            </button>
        </div>
    </>
);

const StudentHeader = ({ userId, profileImg, studentName, type, typeBg, typeText, typeIcon, typeCircleBg, typeBorder, submittedDate, attendanceStatusBadge }: any) => {
    const match = typeof studentName === 'string' ? studentName.match(/^(.*?)\s*\(([^)]+)\)\s*$/) : null;
    const displayName = match ? match[1] : studentName;
    const nickname = match ? match[2] : null;

    return (
    <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
            <ImageWithAuth 
                userId={userId} 
                imageKey={profileImg}
                className="w-full h-full object-cover" 
                fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`} 
            />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 dark:text-white-light text-base leading-tight mb-1.5">
                {displayName}{nickname && <span className="font-bold text-[#000000] dark:text-white-light"> ({nickname})</span>}
            </p>
            <div className="flex items-center gap-2 mb-1">
                {type && (
                    <span className={`inline-flex items-center gap-2 text-[12px] pl-1 pr-4 py-1 rounded-full border ${typeBg} ${typeText} ${typeBorder}`}>
                        <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 ${typeCircleBg}`}>
                            <span className="material-symbols-outlined text-white text-[16px] select-none" style={{ fontSize: '18px' }}>{typeIcon}</span>
                        </span>
                        {type}
                    </span>
                )}
                {attendanceStatusBadge && attendanceStatusBadge}
            </div>
            <p className="text-[14px] text-[#85888E]">วันที่ส่งคำขอ : {submittedDate}</p>
        </div>
    </div>
    );
};


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

// ---- Leave Request Card ----

const LeaveCard = ({ request, onReject, onApprove }: { request: LeaveRequest; onReject: () => void; onApprove: () => void }) => (
    <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-white-dark/10 rounded-2xl p-5 shadow-sm">
        <StudentHeader {...request} />

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark mb-3">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                calendar_today
            </span>
            <span className="text-[16px] text-gray-800 dark:text-white-light">วันที่ขอลา : <span className="font-[16px] text-gray-800 dark:text-white-light">{request.leaveDate}</span></span>
        </div>

        <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white-dark/10 rounded-xl px-4 py-3 mb-3">
            <p className="text-[14px] text-gray-400 mb-0.5">เหตุผลการลา</p>
            <p className="text-[16px] text-gray-700 dark:text-white-light font-medium">{request.reason}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
            <span className="text-gray-400 text-[16px]">ไฟล์แนบ (ถ้ามี) :</span>
            {request.hasFile ? (
                <div 
                    onClick={() => request.attachmentUrl && handleViewFile(request.attachmentUrl)}
                    className="flex items-center gap-1.5 bg-gray-100 dark:bg-black/20 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                >
                    {request.fileIcon === 'image' ? (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ) : request.fileIcon === 'picture_as_pdf' ? (
                        <span className="material-symbols-outlined text-[#000000]" style={{ fontSize: '18px' }}>picture_as_pdf</span>
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
                <span className="text-xs text-gray-400">- ไม่ได้แนบไฟล์ -</span>
            )}
        </div>

        <ActionButtons onReject={onReject} onApprove={onApprove} />
    </div>
);

// ---- Time Edit Request Card ----


const TimeEditCard = ({ request, onReject, onApprove }: { request: TimeCorrectionRequest; onReject: () => void; onApprove: () => void }) => {
    const getThaiDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('th-TH', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getAttendanceStatusBadge = (attendanceStatus?: string) => {
        if (!attendanceStatus) return null;
        const map: Record<string, { label: string; icon: string; bg: string; text: string; border: string; iconBg: string }> = {
            LATE:        { label: 'สาย',           icon: 'schedule',           bg: 'bg-[#FDF4D6]', text: 'text-[#FDB022]', border: 'border-[#FDB022]', iconBg: 'bg-[#FDB022]' },
            ABSENT:      { label: 'ขาด',            icon: 'close',              bg: 'bg-[#FCEDED]', text: 'text-[#EF4444]', border: 'border-[#EF4444]', iconBg: 'bg-[#EF4444]' },
            MISSING_OUT: { label: 'ไม่ลงเวลาออก',  icon: 'hourglass_disabled',  bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', border: 'border-[#6B7280]', iconBg: 'bg-[#6B7280]' },
        };
        const cfg = map[attendanceStatus];
        if (!cfg) return null;
        return (
            <span className={`inline-flex items-center gap-1.5 text-[14px] pl-1 pr-3 py-1 rounded-full border font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                    <span className="material-symbols-rounded text-white" style={{ fontSize: '12px' }}>{cfg.icon}</span>
                </span>
                {cfg.label}
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-white-dark/10 rounded-2xl p-5 shadow-sm">
            <StudentHeader 
                userId={undefined} 
                profileImg={request.profileImg}
                studentName={request.studentName}
                submittedDate={getThaiDate(request.createdAt)}
                attendanceStatusBadge={getAttendanceStatusBadge(request.attendanceStatus)}
            />

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    calendar_today
                </span>
                <span className="text-[16px] text-gray-800 dark:text-white-light">วันที่ : <span className="font-semibold text-gray-800 dark:text-white-light">{getThaiDate(request.workDate)}</span></span>
            </div>

            {/* Time Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-2">
                <div className="flex items-center gap-2 text-[16px] text-gray-600 dark:text-white-dark">
                    <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#E4E7EC]">
                        <span className="material-symbols-outlined text-black" style={{ fontSize: '16px' }}>schedule</span>
                    </span>
                    <span>เวลาเดิม : <span className="font-semibold text-gray-800 dark:text-white-light">{request.originalTime}</span></span>
                </div>
                <div className="flex items-center gap-2 text-[16px] text-gray-600 dark:text-white-dark">
                    <span className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#A9EFC5]">
                        <span className="material-symbols-outlined text-[#074D31]" style={{ fontSize: '16px' }}>manage_history</span>
                    </span>
                    <span>เวลาที่ขอแก้ไข : <span className="font-semibold text-gray-800 dark:text-white-light">{request.requestedTime}</span></span>
                </div>
            </div>

            {/* Work Hours */}
            <p className="text-[16px] text-gray-500 mb-3">
                ชั่วโมงทำงานที่แก้ไข : <span className="font-semibold text-gray-800 dark:text-white-light">{request.hoursWorked} ชั่วโมง</span>
            </p>

            {/* Reason Box */}
            <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white-dark/10 rounded-xl px-4 py-3 mb-3">
                <p className="text-[14px] text-gray-400 mb-0.5">เหตุผลการแก้ไขเวลา</p>
                <p className="text-[16px] text-gray-700 dark:text-white-light font-medium">{request.reason}</p>
            </div>

            {/* File Attachment */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
                <span className="text-gray-400 text-[16px]">ไฟล์แนบ (ถ้ามี) :</span>
                {request.attachmentUrl ? (
                    <div 
                        onClick={() => request.attachmentUrl && handleViewFile(request.attachmentUrl)}
                        className="flex items-center gap-1.5 bg-gray-100 dark:bg-black/20 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                        <span className="text-xs font-medium text-gray-600 dark:text-white-light hover:underline hover:text-blue-500">ดูไฟล์</span>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">- ไม่มีไฟล์แนบ -</span>
                )}
            </div>

            <ActionButtons onReject={onReject} onApprove={onApprove} />
        </div>
    );
};

const EmptyState = ({ tabType }: { tabType: 'leave' | 'time-edit' }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-[280px] h-auto mb-6">
            <img 
                src="/mentor_approve.png" 
                alt="No requests" 
                className="w-full h-full object-contain" 
            />
        </div>
        <h3 className="text-[24px] text-[#61646C] dark:text-white-light mb-2 leading-tight">
            ไม่มีรายการคำขออนุมัติ{tabType === 'leave' ? 'ลา' : 'แก้ไขเวลา'}ในขณะนี้
        </h3>
        <p className="text-[16px] text-[#61646C] dark:text-gray-400">
            คุณจัดการคำขอทั้งหมดครบถ้วนแล้ว หรือยังไมมีคำขอใหม่ส่งเข้ามาในตอนนี้
        </p>
    </div>
);

// ---- Main Page ----

const ApprovalRequestPage = () => {
    const [activeTab, setActiveTab] = useState<'leave' | 'time-edit'>('leave');
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [timeCorrectionRequests, setTimeCorrectionRequests] = useState<TimeCorrectionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedId, setSelectedId] = useState<number[] | null>(null);
    const [rejectModal, setRejectModal] = useState<{ open: boolean; title: string }>({ open: false, title: '' });
    const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
    const [approveSuccessOpen, setApproveSuccessOpen] = useState(false);
    const [rejectSuccessOpen, setRejectSuccessOpen] = useState(false);

    const PAGE_SIZE = 5;
    const [leaveMeta, setLeaveMeta] = useState({ totalPages: 1, totalRecords: 0 });
    const [timeMeta, setTimeMeta] = useState({ totalPages: 1, totalRecords: 0 });
    const [page, setPage] = useState(1);

    const records = useMemo(() => {
        if (activeTab === 'leave') return leaveRequests;
        return timeCorrectionRequests;
    }, [page, activeTab, leaveRequests, timeCorrectionRequests]);

    const totalPages = useMemo(() => {
        if (activeTab === 'leave') return leaveMeta.totalPages;
        return timeMeta.totalPages;
    }, [activeTab, leaveMeta.totalPages, timeMeta.totalPages]);


    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/leave/mentor/requests', {
                params: { 
                    page, 
                    limit: PAGE_SIZE,
                    status: 'PENDING',
                    viewType: 'MINE'
                }
            });

            if (response.data && response.data.data) {
                const mappedData = response.data.data
                    .map((item: any) => {
                        const isSick = item.leaveType === 'SICK';
                        
                        let typeText = 'ลากิจ';
                        let typeBg = 'bg-[#EEEFFF]';
                        let typeTextColor = 'text-[#61646C]';
                        let typeBorder = 'border-[#1A3CFF]';
                        let typeIcon = 'business_center';
                        let typeCircleBg = 'bg-[#1A3CFF]';
                        
                        if (isSick) {
                            typeText = 'ลาป่วย';
                            typeBg = 'bg-[#FFEFF3]';
                            typeTextColor = 'text-pink-500';
                            typeBorder = 'border-[#FF1A7D]';
                            typeIcon = 'health_cross';
                            typeCircleBg = 'bg-[#FF1A7D]';
                        }

                        const startObj = new Date(item.startDate);
                        const endObj = new Date(item.endDate);
                        
                        const getThaiDate = (date: Date) => {
                            return date.toLocaleDateString('th-TH', { 
                                year: 'numeric', month: 'long', day: 'numeric' 
                            });
                        };

                        const getDay = (date: Date) => {
                            return new Intl.DateTimeFormat('en-CA', {
                                timeZone: 'Asia/Bangkok',
                                day: '2-digit'
                            }).format(date);
                        };

                        const leaveDateDisplay = item.startDate === item.endDate
                            ? getThaiDate(startObj)
                            : `${getDay(startObj)} - ${getThaiDate(endObj)}`;

                        const hasFile = !!item.attachmentUrl;
                        let fileName = 'ดูไฟล์แนบ';
                        let fileIcon = 'image';
                        if (hasFile) {
                            const extension = item.attachmentUrl.split('.').pop()?.toLowerCase();
                            if (extension === 'pdf') {
                                fileIcon = 'picture_as_pdf';
                                fileName = `ไฟล์เอกสาร.${extension}`;
                            } else {
                                fileName = `รูปภาพหลักฐาน.${extension}`;
                            }
                        }

                        return {
                            ids: item.ids,
                            id: item.ids[0], // fallback
                            studentName: item.studentName || 'นักศึกษา (ไม่ระบุชื่อ)',
                            type: typeText,
                            typeBg,
                            typeText: typeTextColor,
                            typeBorder,
                            typeIcon,
                            typeCircleBg,
                            submittedDate: getThaiDate(new Date(item.createdAt)), 
                            leaveDate: leaveDateDisplay,
                            reason: item.reason || '-',
                            profileImg: item.profileImg || '/assets/images/profile-1.jpeg',
                            userId: item.userId,
                            fileName,
                            fileIcon,
                            hasFile,
                            attachmentUrl: item.attachmentUrl
                        };
                    });
                setLeaveRequests(mappedData);
                if (response.data.meta) {
                    setLeaveMeta(response.data.meta);
                }
            }
        } catch (error) {
            console.error('Error fetching leave requests API:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeCorrectionRequests = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/check-time/mentor/corrections', {
                params: {
                    page,
                    limit: PAGE_SIZE,
                    status: 'PENDING',
                    viewType: 'MINE'
                }
            });

            if (response.data && response.data.data) {
                setTimeCorrectionRequests(response.data.data);
                if (response.data.meta) {
                    setTimeMeta(response.data.meta);
                }
            }
        } catch (error) {
            console.error('Error fetching time correction requests API:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch both counts on initial mount so summary cards show correct numbers
    useEffect(() => {
        fetchLeaveRequests();
        fetchTimeCorrectionRequests();
    }, []);

    useEffect(() => {
        if (activeTab === 'leave') {
            fetchLeaveRequests();
        } else if (activeTab === 'time-edit') {
            fetchTimeCorrectionRequests();
        }
    }, [page, activeTab]);


    const openRejectModal = (tabType: 'leave' | 'time-edit', ids: number[]) => {
        const title = tabType === 'leave' ? 'ไม่อนุมัติการลา' : 'ไม่อนุมัติการแก้ไขเวลา';
        setSelectedId(ids);
        setRejectModal({ open: true, title });
    };

    const closeRejectModal = () => {
        setRejectModal({ open: false, title: '' });
        setSelectedId(null);
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            if (activeTab === 'leave') {
                 await axiosInstance.post(`/leave/bulk-reject`, { ids: selectedId, reason });
            } else if (activeTab === 'time-edit') {
                 // For time corrections, we handle it individually for now as per backend design
                 await axiosInstance.post(`/check-time/mentor/corrections/${selectedId[0]}/reject`, { reason });
            }
            
            setRejectModal({ open: false, title: '' });
            setRejectSuccessOpen(true);
            setTimeout(() => {
                setRejectSuccessOpen(false);
                setSelectedId(null);
                if (activeTab === 'leave') fetchLeaveRequests();
                else fetchTimeCorrectionRequests();
            }, 2000);
        } catch (error) {
            console.error('Failed to reject:', error);
            setRejectModal({ open: false, title: '' });
            setSelectedId(null);
        } finally {
            setSubmitting(false);
        }
    };


    const openApproveConfirm = (ids: number[]) => {
        setSelectedId(ids);
        setApproveConfirmOpen(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            if (activeTab === 'leave') {
                await axiosInstance.post(`/leave/bulk-approve`, { ids: selectedId });
            } else if (activeTab === 'time-edit') {
                await axiosInstance.post(`/check-time/mentor/corrections/${selectedId[0]}/approve`);
            }
            setApproveConfirmOpen(false);
            setApproveSuccessOpen(true);
            setTimeout(() => {
                setApproveSuccessOpen(false);
                setSelectedId(null);
                if (activeTab === 'leave') fetchLeaveRequests();
                else fetchTimeCorrectionRequests();
            }, 2000);
        } catch (error) {
            console.error('Failed to approve request:', error);
        } finally {
            setSubmitting(false);
        }
    };


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
            activeBorder: 'border-[#D9692C]',
            inactiveBg: 'bg-[#FFF6D4]',
            inactiveBorder: 'border-[#FFF6D4]',
        },
    ];


    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="mb-2">
                <h1 className="text-[24px] font-bold text-gray-800 dark:text-white-light">รายการคำขออนุมัติ</h1>
                <p className="text-gray-400 mt-2 text-[16px]">แสดงรายการคำขอจากนักศึกษาที่อยู่ในการดูแล เพื่อพิจารณาอนุมัติหรือปฏิเสธ</p>
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

            {/* List Header */}
            <p className="text-[16px] font-semibold text-gray-500 mb-2">รายการทั้งหมด</p>

            {/* Request List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <p className="text-[14px] text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : records.length === 0 ? (
                    <EmptyState tabType={activeTab} />
                ) : (
                    records.map((r) => (
                        activeTab === 'leave' ? (
                            <LeaveCard key={(r as any).id} request={r as any} onReject={() => openRejectModal('leave', (r as any).ids)} onApprove={() => openApproveConfirm((r as any).ids)} />
                        ) : (
                            <TimeEditCard key={r.id} request={r as any} onReject={() => openRejectModal('time-edit', [(r as any).id])} onApprove={() => openApproveConfirm([(r as any).id])} />
                        )
                    ))
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

            {/* Reject Modal */}
            <RejectModal
                isOpen={rejectModal.open}
                onClose={closeRejectModal}
                onConfirm={handleRejectConfirm}
                title={rejectModal.title}
                isLoading={submitting}
            />

            {/* Approve Confirm Modal */}
            <ApproveConfirmModal
                isOpen={approveConfirmOpen}
                onClose={() => setApproveConfirmOpen(false)}
                onConfirm={handleApproveConfirm}
                isLoading={submitting}
            />

            {/* Approve Success Modal */}
            <ApproveSuccessModal isOpen={approveSuccessOpen} />
            
            {/* Reject Success Modal */}
            <RejectSuccessModal isOpen={rejectSuccessOpen} />
        </div>
    );
};

export default ApprovalRequestPage;
