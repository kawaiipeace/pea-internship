import React from 'react';

interface ConsiderationBadgeProps {
    considerationStatus: string;
    compensationDays?: number;
}

const ConsiderationBadge: React.FC<ConsiderationBadgeProps> = ({ considerationStatus, compensationDays = 0 }) => {
    let text = '-';
    let bgColor = '';
    let textColor = '';

    if (considerationStatus === 'COMPLETE') {
        text = 'ผ่านการฝึกงาน';
        bgColor = 'bg-[#DCFAE6]';
        textColor = 'text-[#079455]';
    } else if (considerationStatus === 'EXTENDED') {
        text = `ชดเชยวันทำงาน ${compensationDays} วัน`;
        bgColor = 'bg-[#F2F4F7]';
        textColor = 'text-[#FF6B6B]';
    } else if (considerationStatus === 'AWAITING') {
        text = 'รออนุมัติการฝึกงาน';
        bgColor = 'bg-[#F2F4F7]';
        textColor = 'text-[#61646C]';
    } else {
        text = 'อยู่ในระหว่างฝึกงาน';
        bgColor = 'bg-[#FEF6E0]';
        textColor = 'text-[#D58C47]';
    }

    return (
        <div className={`px-4 py-2 rounded-[4px] ${bgColor} ${textColor} text-[16px] font-normal whitespace-nowrap flex items-center justify-center min-w-[140px]`}>
            {text}
        </div>
    );
};

export default ConsiderationBadge;
