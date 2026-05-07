import React from 'react';

interface ProgressSectionProps {
    progressData: {
        accumulatedHours: number;
        totalHoursGoal: number;
        percentage: number;
    } | null;
    viewType: 'desktop' | 'mobile';
}

const ProgressSection: React.FC<ProgressSectionProps> = ({ progressData, viewType }) => {
    if (viewType === 'desktop') {
        return (
            <div className="relative mt-6 rounded-[15px] w-full min-h-[110px] h-fit px-12 pt-[22px] pb-10 shadow-[0_4px_15px_rgba(0,0,0,0.1)] bg-white/60 backdrop-blur-[4px] backdrop-saturate-[150%] flex flex-col justify-start gap-4 overflow-visible">
                <div className="absolute inset-0 rounded-[15px] pointer-events-none p-[1px] bg-gradient-to-tl from-white/20 from-0% to-white to-100% [mask-image:linear-gradient(#fff,#fff),linear-gradient(#fff,#fff)] [mask-clip:content-box,border-box] [mask-composite:exclude] [-webkit-mask-composite:xor]"></div>

                <div className="text-[14px] font-bold text-[#333741] tracking-wide leading-none z-10">
                    ความคืบหน้าในการฝึกงาน
                </div>
                <div className="flex items-center w-full gap-[12px] h-fit z-10 relative">
                    <div className="flex-1 flex flex-col relative min-w-0">
                        <div className="h-[18px] rounded-full overflow-hidden bg-gradient-to-b from-[#e4e4e4] to-[#f8f8f8] dark:from-[#1b2e4b] dark:to-[#0f1928] shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.1)] relative flex items-center min-w-0">
                            <div
                                className="h-[18px] rounded-full bg-[#A80689] shadow-[inset_0px_-4px_6px_rgba(0,0,0,0.4),inset_0px_2px_3px_rgba(255,255,255,0.4)] transition-all duration-300"
                                style={{ width: `${progressData?.percentage || 0}%` }}
                            ></div>
                        </div>
                        <div 
                            className="absolute top-[30px] text-black text-[12px] font-bold whitespace-nowrap transition-all duration-300 z-20"
                            style={{ 
                                left: `${progressData?.percentage || 0}%`,
                                transform: `translateX(-${progressData?.percentage || 0}%)`
                            }}
                        >
                            {Math.round(progressData?.accumulatedHours || 0)} ชั่วโมง
                        </div>
                    </div>
                    <div
                        className="shrink-0 text-white text-[11px] px-3 min-w-[70px] h-[22px] rounded-full font-medium flex items-center justify-center bg-[#A80689] shadow-[inset_0px_-5px_7px_rgba(0,0,0,0.4),inset_0px_2px_4px_rgba(255,255,255,0.4)] whitespace-nowrap z-20 self-start"
                    >
                        {Math.round(progressData?.totalHoursGoal || 560)} ชั่วโมง
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute -top-[57px] left-1/2 transform -translate-x-1/2 w-[114px] h-[114px] bg-white/40 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.1)]">
            <svg className="w-[110px] h-[110px] transform -rotate-90 relative z-10 overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="100%" y1="110%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#CF07AA" />
                        <stop offset="100%" stopColor="#690456" />
                    </linearGradient>
                    <linearGradient id="grayGradient" x1="0%" y1="110%" x2="110%" y2="100%">
                        <stop offset="0%" stopColor="#838383" />
                        <stop offset="100%" stopColor="#E8E8E8" />
                    </linearGradient>
                </defs>
                <circle cx="55" cy="55" r="47" stroke="url(#grayGradient)" strokeWidth="8" fill="none" />
                <circle cx="55" cy="55" r="47" stroke="url(#chartGradient)" strokeWidth="8" fill="none" strokeDasharray="295" strokeDashoffset={295 - (295 * (progressData?.percentage || 0) / 100)} strokeLinecap="round" style={{ filter: 'drop-shadow(0px 3px 4px rgba(168,6,137,0.4))' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 mt-[2px]">
                <span className="text-[13px] font-medium text-[#111] leading-tight tracking-[0.2px]">{Math.round(progressData?.accumulatedHours || 0)} / {Math.round(progressData?.totalHoursGoal || 560)}</span>
                <span className="text-[13px] font-medium text-[#111] leading-tight mt-[6px]">ชั่วโมง</span>
            </div>
        </div>
    );
};

export default ProgressSection;
