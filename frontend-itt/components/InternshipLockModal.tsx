'use client';

import React from 'react';
import { createPortal } from 'react-dom';

interface InternshipLockModalProps {
    startDate?: string;
}

const InternshipLockModal: React.FC<InternshipLockModalProps> = ({ startDate }) => {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'รอประกาศวันเริ่มฝึกงาน';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'รอประกาศวันเริ่มฝึกงาน';
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return 'รอประกาศวันเริ่มฝึกงาน';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[420px] mx-4 p-10 flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div className="w-[100px] h-[100px] rounded-full bg-pink-50 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 rounded-full bg-[#A80689]/10 animate-pulse"></div>
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg z-1 relative">
                        <span className="material-symbols-outlined text-[#A80689] text-[40px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                            lock_clock
                        </span>
                    </div>
                </div>

                {/* Message */}
                <h2 className="text-[18px] font-medium text-gray-800 leading-relaxed mb-1">
                    ระบบจะเปิดให้ใช้งานในวันเริ่มงานวันแรกของท่านในวันที่
                </h2>
                <p className="text-[22px] font-bold text-[#A80689] mb-4">
                    {formatDate(startDate)}
                </p>
                <p className="text-[16px] text-gray-500 leading-relaxed">
                    กรุณาเข้าใช้งานอีกครั้งในวันที่กำหนด
                </p>
            </div>
        </div>,
        document.body
    );
};

export default InternshipLockModal;
