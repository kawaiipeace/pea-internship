import React from 'react';

interface InternshipProgressCardProps {
    profile: any;
    progress: any;
    isPassAvailable: boolean;
    isCompensateAvailable: boolean;
    onPassInternship: () => void;
    onCompensateClick: () => void;
}

const InternshipProgressCard: React.FC<InternshipProgressCardProps> = ({
    profile,
    progress,
    isPassAvailable,
    isCompensateAvailable,
    onPassInternship,
    onCompensateClick
}) => {
    const progressPercent = progress.totalHoursGoal > 0 ? (progress.accumulatedHours / progress.totalHoursGoal) * 100 : 0;

    return (
        <div className="panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-8 flex flex-col items-start bg-white h-full relative">
            <div className="space-y-4 w-full">
                <h2 className="text-[#111827] font-bold text-[18px]">ความคืบหน้าในการฝึกงาน</h2>
                <div className="flex flex-col gap-5">
                    <div className="flex items-baseline justify-end gap-1">
                        <span className="text-[32px] font-bold text-[#A80689]">{Math.round(progress.accumulatedHours || 0)}</span>
                        <span className="text-[16px] text-[#61646C] font-medium">/ {Math.round(progress.totalHoursGoal || 0)} ชั่วโมง</span>
                    </div>
                    <div className="w-full bg-[#F2F4F7] rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-[#A80689] h-3 rounded-full shadow-sm transition-all duration-700"
                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                        ></div>
                    </div>
                    {(() => {
                        const end = progress?.extendedEndDate ? new Date(progress.extendedEndDate) : (profile.period?.endDate ? new Date(profile.period.endDate) : null);
                        if (!end) return null;
                        const now = new Date();
                        
                        let days = 0;
                        let tempDate = new Date(now);
                        tempDate.setHours(0, 0, 0, 0);
                        const targetDate = new Date(end);
                        targetDate.setHours(0, 0, 0, 0);

                        while (tempDate <= targetDate) {
                            const day = tempDate.getDay();
                            if (day !== 0 && day !== 6) {
                                days++;
                            }
                            tempDate.setDate(tempDate.getDate() + 1);
                        }

                        const isUrgent = days <= 7;
                        const displayColor = isUrgent ? '#B42318' : '#6b7280';
                        const iconColor = isUrgent ? '#B42318' : '#85888E';

                        let statusText = '';
                        if (days > 1) {
                            statusText = `เหลืออีก ${days} วันทำการก่อนสิ้นสุดการฝึกงาน`;
                        } else if (days === 1) {
                            statusText = 'ฝึกงานวันสุดท้าย';
                        } else {
                            const isToday = (progress?.extendedEndDate || profile.period?.endDate) && 
                                          new Date(progress?.extendedEndDate || profile.period?.endDate).toDateString() === new Date().toDateString();
                            statusText = isToday ? 'สิ้นสุดการฝึกงานวันนี้' : 'สิ้นสุดการฝึกงานแล้ว';
                        }

                        return (
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="material-symbols-outlined select-none"
                                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: iconColor }}
                                >
                                    schedule
                                </span>
                                <span className="text-[14px] font-normal" style={{ color: displayColor }}>
                                    {statusText}
                                </span>
                            </div>
                        );
                    })()}
                </div>
            </div>

            <div className="w-full space-y-3 mt-8">
                {profile?.internshipStatus === 'COMPLETE' ? (
                    <div className="w-full py-3 bg-[#DCFAE6] text-[#079455] rounded-xl font-bold flex items-center justify-center text-[18px]">
                        ผ่านการฝึกงาน
                    </div>
                ) : profile?.internshipStatus === 'EXTENDED' ? (
                    <div className="w-full py-3 bg-[#F2F4F7] text-[#FF6B6B] rounded-xl font-bold flex flex-col items-center justify-center text-[18px]">
                        <div>
                            {(() => {
                                const rawHours = progress?.totalExtendedHours;
                                const hoursFromExtensions = typeof rawHours === 'string' ? parseFloat(rawHours) : (rawHours || 0);
                                
                                if (hoursFromExtensions > 0) {
                                    return `ชดเชยวันทำงาน ${Math.ceil(hoursFromExtensions / 7)} วัน`;
                                }
                                
                                const statusNote = profile?.statusNote || '';
                                const match = statusNote.match(/COMPENSATION:(\d+)/);
                                if (match) {
                                    return `ชดเชยวันทำงาน ${match[1]} วัน`;
                                }
                                
                                const missingHours = Math.max(0, (progress?.totalHoursGoal || 0) - (progress?.accumulatedHours || 0));
                                if (missingHours > 0) {
                                    return `ชดเชยวันทำงาน ${Math.ceil(missingHours / 7)} วัน`;
                                }
                                
                                return 'ชดเชยวันทำงาน 0 วัน';
                            })()}
                        </div>
                    </div>
                ) : (
                    <>
                        <button 
                            type="button"
                            onClick={onPassInternship}
                            disabled={!isPassAvailable}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm text-[18px] text-white ${
                                isPassAvailable 
                                    ? 'bg-[#17B26A] hover:bg-[#067647]' 
                                    : 'bg-[#98A2B3] cursor-not-allowed'
                            }`}
                        >
                            <span className="material-symbols-outlined text-white text-[24px]">check_circle</span>
                            ผ่านการฝึกงาน
                        </button>
                        <button
                            onClick={onCompensateClick}
                            disabled={!isCompensateAvailable}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm text-[18px] ${
                                isCompensateAvailable 
                                    ? 'bg-[#FFF5FD] text-[#A80689] border border-[#A80689] hover:bg-pink-50' 
                                    : 'bg-[#FFF5FD] text-[#98A2B3] border border-[#A80689]/40 cursor-not-allowed'
                            }`}
                        >
                            ชดเชยวันทำงาน
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default InternshipProgressCard;
