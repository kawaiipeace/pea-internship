import React from 'react';

interface AttendanceBadgeProps {
    status: string;
}

const AttendanceBadge: React.FC<AttendanceBadgeProps> = ({ status }) => {
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
        case 'SICK':
            return (
                <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FDF2F8] border border-[#FBCFE8] w-max">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#EC4899] text-white rounded-full shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>health_cross</span>
                    </div>
                    <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลาป่วย</span>
                </div>
            );
        case 'ABSENCE':
        case 'LEAVE':
            return (
                <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#EEEFFF] border border-[#1A3CFF]/50 w-max">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#1A3CFF] text-white rounded-full shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>business_center</span>
                    </div>
                    <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลากิจ</span>
                </div>
            );
        default: return null;
    }
};

export default AttendanceBadge;
