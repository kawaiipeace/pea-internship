'use client';

import React, { useState } from 'react';
import IconCalendar from '@/components/icon/icon-calendar';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconXCircle from '@/components/icon/icon-x-circle';

// ---- Data ----

const leaveRequests = [
    {
        id: 1,
        studentName: 'สมหมาย สายเสมอ (นาย)',
        type: 'ลากิจ',
        typeBg: 'bg-blue-50',
        typeText: 'text-blue-600',
        typeIcon: 'business_center',
        typeCircleBg: 'bg-blue-500',
        submittedDate: '11 มกราคม 2569',
        leaveDate: '12 มกราคม 2569',
        reason: 'เข้าร่วมกิจกรรมมหาวิทยาลัย ขาดไม่ได้',
        profileImg: '/assets/images/profile-1.jpeg',
        fileName: 'หลักฐาน.png',
        fileIcon: 'image',
    },
    {
        id: 2,
        studentName: 'สมหมาย สายเสมอ (นาย)',
        type: 'ลาป่วย',
        typeBg: 'bg-pink-50',
        typeText: 'text-pink-500',
        typeIcon: 'health_cross',
        typeCircleBg: 'bg-pink-500',
        submittedDate: '9 มกราคม 2569',
        leaveDate: '10 มกราคม 2569',
        reason: 'ท้องเสียเนื่องจากอาหารเป็นพิษ',
        profileImg: '/assets/images/profile-2.jpeg',
        fileName: 'หลักฐาน.pdf',
        fileIcon: 'pdf',
    },
];

const timeEditRequests = [
    {
        id: 1,
        studentName: 'สมหมาย สายเสมอ (นาย)',
        type: 'ไม่ผ่านการครองเวลา',
        typeBg: 'bg-gray-100',
        typeText: 'text-gray-600',
        typeIcon: 'hourglass_disabled',
        typeCircleBg: 'bg-gray-500',
        submittedDate: '16 มกราคม 2569',
        date: '15 มกราคม 2569',
        originalTime: '08:30 - ไม่ลงเวลา',
        requestedTime: '08:30 - 16:30',
        workHours: 7,
        reason: 'ดีลดเวลาออก',
        profileImg: '/assets/images/profile-1.jpeg',
        hasFile: false,
    },
    {
        id: 2,
        studentName: 'สมหมาย สายเสมอ (นาย)',
        type: 'ลาย',
        typeBg: 'bg-orange-50',
        typeText: 'text-orange-500',
        typeIcon: 'edit_square',
        typeCircleBg: 'bg-orange-500',
        submittedDate: '15 มกราคม 2569',
        date: '14 มกราคม 2569',
        originalTime: '10:00 - 16:30',
        requestedTime: '08:30 - 16:30',
        workHours: 2,
        reason: 'ระบบขัดข้องทำให้ลงเวลาไม่ได้',
        profileImg: '/assets/images/profile-2.jpeg',
        hasFile: false,
    },
];

// ---- Sub-components ----

const ActionButtons = () => (
    <>
        <hr className="my-4 border-gray-100 dark:border-white-dark/10" />
        <div className="flex justify-end gap-3">
            <button className="flex items-center justify-center gap-2 w-[160px] py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                <IconXCircle className="w-4 h-4" />
                ไม่อนุมัติ
            </button>
            <button className="flex items-center justify-center gap-2 w-[160px] py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors">
                <IconCircleCheck className="w-4 h-4" />
                อนุมัติ
            </button>
        </div>
    </>
);

const StudentHeader = ({ profileImg, studentName, type, typeBg, typeText, typeIcon, typeCircleBg, submittedDate }: any) => (
    <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
            <img src={profileImg} alt="Student" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 dark:text-white-light text-base leading-tight mb-1.5">{studentName}</p>
            <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-2 text-sm font-semibold pl-1 pr-3 py-1 rounded-full border ${typeBg} ${typeText}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${typeCircleBg}`}>
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>{typeIcon}</span>
                    </span>
                    {type}
                </span>
            </div>
            <p className="text-xs text-gray-400">วันที่ส่งคำขอ : {submittedDate}</p>
        </div>
    </div>
);


// ---- Leave Request Card ----

const LeaveCard = ({ request }: { request: typeof leaveRequests[0] }) => (
    <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-white-dark/10 rounded-2xl p-5 shadow-sm">
        <StudentHeader {...request} />

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
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-black/20 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                {request.fileIcon === 'image' ? (
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                )}
                <span className="text-xs font-medium text-gray-600 dark:text-white-light">{request.fileName}</span>
            </div>
        </div>

        <ActionButtons />
    </div>
);

// ---- Time Edit Request Card ----

const TimeEditCard = ({ request }: { request: typeof timeEditRequests[0] }) => (
    <div className="bg-white dark:bg-[#0e1726] border border-gray-200 dark:border-white-dark/10 rounded-2xl p-5 shadow-sm">
        <StudentHeader {...request} />

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark mb-3">
            <IconCalendar className="w-4 h-4 text-gray-400" />
            <span>วันที่ : <span className="font-semibold text-gray-800 dark:text-white-light">{request.date}</span></span>
        </div>

        {/* Time Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '18px' }}>schedule</span>
                <span>เวลาเดิม : <span className="font-semibold text-gray-800 dark:text-white-light">{request.originalTime}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
                <span className="material-symbols-outlined text-green-500" style={{ fontSize: '18px' }}>schedule</span>
                <span>เวลาที่ขอแก้ไข : <span className="font-semibold text-gray-800 dark:text-white-light">{request.requestedTime}</span></span>
            </div>
        </div>

        {/* Work Hours */}
        <p className="text-sm text-gray-500 mb-3">
            ชั่วโมงทำงานที่แก้ไข : <span className="font-semibold text-gray-800 dark:text-white-light">{request.workHours} ชั่วโมง</span>
        </p>

        {/* Reason Box */}
        <div className="bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white-dark/10 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-gray-400 mb-0.5">เหตุผลการแก้ไขเวลา</p>
            <p className="text-sm text-gray-700 dark:text-white-light font-medium">{request.reason}</p>
        </div>

        {/* File Attachment */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white-dark">
            <span className="text-gray-400">ไฟล์แนบ :</span>
            {request.hasFile ? (
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-black/20 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <span className="text-xs font-medium text-gray-600 dark:text-white-light">ดูไฟล์</span>
                </div>
            ) : (
                <span className="text-xs text-gray-400">- ไม่มีไฟล์แนบ -</span>
            )}
        </div>

        <ActionButtons />
    </div>
);

// ---- Main Page ----

const ApprovalRequestPage = () => {
    const [activeTab, setActiveTab] = useState<'leave' | 'time-edit'>('leave');

    const summaryCards = [
        {
            key: 'leave' as const,
            title: 'คำขอลา',
            count: `${leaveRequests.length} รายการ`,
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
            count: `${timeEditRequests.length} รายการ`,
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
                {activeTab === 'leave'
                    ? leaveRequests.map((r) => <LeaveCard key={r.id} request={r} />)
                    : timeEditRequests.map((r) => <TimeEditCard key={r.id} request={r} />)
                }
            </div>
        </div>
    );
};

export default ApprovalRequestPage;
