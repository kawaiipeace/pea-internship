import React from 'react';

interface AttendanceSummaryCardsProps {
    summary: {
        present: number;
        late: number;
        leave: number;
        absent: number;
    };
}

const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({ summary }) => {
    const stats = [
        { label: 'เข้างานปกติ', icon: 'check', color: '#079455', value: summary.present },
        { label: 'สาย', icon: 'schedule', color: '#FDB022', value: summary.late },
        { label: 'ลา', icon: 'business_center', color: '#1A3CFF', value: summary.leave },
        { label: 'ขาด', icon: 'close', color: '#D92D20', value: summary.absent }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
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
    );
};

export default AttendanceSummaryCards;
