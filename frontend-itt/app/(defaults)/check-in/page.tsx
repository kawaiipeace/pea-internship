'use client';
import React, { useState, useEffect } from 'react';
import IconMapPin from '@/components/icon/icon-map-pin';

const CheckInPage = () => {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [locationStatus, setLocationStatus] = useState<'searching' | 'found' | 'outside'>('found');

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Desktop Location Status
    const renderDesktopLocationStatus = () => {
        if (locationStatus === 'searching') {
            return (
                <div 
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={() => setLocationStatus('found')}
                    title="คลิกเพื่อจำลองการหาสถานที่เจอแบบในภาพ"
                >
                    <div className="rounded-full flex items-center justify-center w-[56px] h-[56px] bg-[#CECFD2]">
                        <div className="bg-[#85888E] text-white rounded-full flex items-center justify-center w-[42px] h-[42px]">
                            <IconMapPin className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">กำลังค้นหาตำแหน่ง...</div>
                </div>
            );
        } else if (locationStatus === 'outside') {
            return (
                <div 
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={() => setLocationStatus('searching')}
                    title="คลิกเพื่อจำลองการค้นหาสถานที่"
                >
                    <div className="rounded-full flex items-center justify-center w-[56px] h-[56px] bg-[#F97066]" >
                        <div className="bg-[#F04438] text-[#FEF3F2] rounded-full flex items-center justify-center w-[42px] h-[42px]">
                            <IconMapPin className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">อยู่นอกสถานที่</div>
                </div>
            );
        } else {
            return (
                <div 
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={() => setLocationStatus('outside')}
                    title="คลิกเพื่อจำลองว่าอยู่นอกสถานที่"
                >
                    <div className="rounded-full flex items-center justify-center w-[56px] h-[56px] bg-[#75E0A7]" >
                        <div className="bg-[#42B86F] text-[#E4F5EA] rounded-full flex items-center justify-center w-[42px] h-[42px]">
                            <IconMapPin className="w-7 h-7" />
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">อยู่ในสถานที่</div>
                </div>
            );
        }
    };

    // Mobile Location Status
    const renderMobileLocationStatus = () => {
        if (locationStatus === 'searching') {
            return (
                <div 
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={() => setLocationStatus('found')}
                    title="คลิกเพื่อจำลองการหาสถานที่เจอแบบในภาพ"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#CECFD2]">
                        <div className="bg-[#85888E] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <IconMapPin className="w-[24px] h-[24px]" />
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">กำลังค้นหาตำแหน่ง...</div>
                </div>
            );
        } else if (locationStatus === 'outside') {
            return (
                <div 
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={() => setLocationStatus('searching')}
                    title="คลิกเพื่อจำลองการค้นหาสถานที่"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#F97066]" >
                        <div className="bg-[#F04438] text-[#FEF3F2] rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <IconMapPin className="w-[24px] h-[24px]" />
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">อยู่นอกสถานที่</div>
                </div>
            );
        } else {
            return (
                <div 
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={() => setLocationStatus('outside')}
                    title="คลิกเพื่อจำลองว่าอยู่นอกสถานที่"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#75E0A7]" >
                        <div className="bg-[#42B86F] text-[#E4F5EA] rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <IconMapPin className="w-[24px] h-[24px]" />
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">อยู่ในสถานที่</div>
                </div>
            );
        }
    };

    const formatDate = (date: Date) => {
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const d = date.getDate();
        const m = months[date.getMonth()];
        const y = date.getFullYear() + 543; // Thai year
        return `${d} ${m} ${y}`;
    };

    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:flex panel -m-6 min-h-[calc(100vh-114px)] rounded-none border-0 flex-col bg-[#FFFCF6] p-6">
                {/* Top Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* Location Status */}
                    <div>
                        {renderDesktopLocationStatus()}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full md:w-5/12 max-w-[450px] space-y-2 pr-6">
                        <div className="text-[15px] font-medium text-[#333741] dark:text-gray-300 mb-2">
                            ความคืบหน้าในการฝึกงาน
                        </div>
                        <div className="flex items-center space-x-[10px]">
                            {/* Track */}
                            <div 
                                className="w-[358px] h-[18px] shrink-0 rounded-full overflow bg-[#ECECED] dark:bg-[#1b2e4b]  shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.1)]"
                            >
                                {/* Thumb */}
                                <div 
                                    className="text-white text-[9px] w-[256px] h-[18px] sm:text-[11px] flex justify-end pr-3 items-center font-medium rounded-full whitespace-nowrap bg-[#A80689] shadow-[inset_0px_-4px_6px_rgba(0,0,0,0.4),inset_0px_2px_3px_rgba(255,255,255,0.4)]" 
                                >
                                    420 ชั่วโมง
                                </div>
                            </div>
                            {/* Right standalone pill */}
                            <div 
                                className="text-white text-[9px] px-4 w-[70px] h-[22px] rounded-full font-medium flex items-center justify-center whitespace-nowrap shrink-0 bg-[#A80689] shadow-[inset_0px_-5px_7px_rgba(0,0,0,0.4),inset_0px_2px_4px_rgba(255,255,255,0.4)]"
                            >
                                560 ชั่วโมง
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Time */}
                <div className="flex-1 flex flex-col justify-center items-center mt-12 mb-10 space-y-6">
                    <div className="text-[80px] font-bold text-black dark:text-white tracking-wider tabular-nums leading-none">
                        {currentTime ? currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
                    </div>
                    <div className="text-[33px] font-medium text-black dark:text-gray-300">
                        {currentTime ? formatDate(currentTime) : '-'}
                    </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex flex-col justify-center items-center gap-[10px] mb-[100px]">
                    <button type="button" className={`w-[235px] h-[48px] flex items-center justify-center font-bold rounded-[6px] text-[16px] transition-colors ${
                        locationStatus === 'searching' 
                            ? 'bg-[#EAEAEA] text-[#9A9A9A]' 
                            : 'bg-[#A80689] text-white'
                    }`}>
                        ลงเวลาเข้างาน
                    </button>
                    <button type="button" className="w-[235px] h-[48px] flex items-center justify-center bg-[#ECECED] text-[#000000] font-bold rounded-[6px] text-[16px] dark:bg-[#1b2e4b] dark:text-[#888ea8]">
                        ลงเวลาออกงาน
                    </button>
                </div>
            </div>

            {/* Mobile View (PWA) */}
            <div className="flex md:hidden panel -m-6 min-h-[calc(100vh-114px)] rounded-none border-0 flex-col items-center pt-10 pb-16 relative overflow-hidden font-sans">
                {/* Background Base */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#fdfbfe]">
                    {/* Top Left: #FDB022 (Yellow/Orange) */}
                    <div className="absolute top-[-5%] left-[-15%] w-[60vw] min-w-[280px] h-[60vw] min-h-[280px] rounded-full bg-[#FDB022] opacity-[0.55] blur-[150px] animate-float1"></div>

                    {/* Top Right: #C212F7 (Purple) */}
                    <div className="absolute top-[-10%] right-[-15%] w-[60vw] min-w-[280px] h-[120vw] min-h-[280px] rounded-full bg-[#C212F7] opacity-[0.5] blur-[90px] animate-float2"></div>

                    {/* Bottom Left: #A80689 (Magenta) */}
                    <div className="absolute bottom-[-5%] left-[-15%] w-[65vw] min-w-[300px] h-[80vw] min-h-[300px] rounded-full bg-[#A80689] opacity-[0.45] blur-[70px] animate-float3"></div>

                    {/* Bottom Right: #58F9FF (Cyan) */}
                    <div className="absolute bottom-[-5%] right-[-15%] w-[65vw] min-w-[300px] h-[65vw] min-h-[300px] rounded-full bg-[#58F9FF] opacity-[0.55] blur-[200px] animate-float4"></div>
                </div>

                {/* Title */}
                <h2 className="text-[#333741] text-[13px] font-medium mb-[85px] tracking-wide relative z-10">ความคืบหน้าในการฝึกงาน</h2>
                
                {/* Card */}
                <div className="bg-white w-[293px] h-[536px] max-w-[360px] rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] relative z-10 flex flex-col items-center pt-[70px] pb-8 px-6">
                    
                    {/* Donut Chart overlapping top */}
                    <div className="absolute -top-[65px] left-1/2 transform -translate-x-1/2 w-[130px] h-[130px] bg-white/40 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                        
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
                            {/* Unfilled track */}
                            <circle cx="55" cy="55" r="47" stroke="url(#grayGradient)" strokeWidth="8" fill="none" />
                            {/* Filled track */}
                            <circle cx="55" cy="55" r="47" stroke="url(#chartGradient)" strokeWidth="8" fill="none" strokeDasharray="295" strokeDashoffset="74" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 3px 4px rgba(168,6,137,0.4))' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 mt-[2px]">
                            <span className="text-[13px] font-medium text-[#111] leading-tight tracking-[0.2px]">420 / 560</span>
                            <span className="text-[13px] font-medium text-[#111] leading-tight mt-[6px]">ชั่วโมง</span>
                        </div>
                    </div>

                    {/* Time and Date */}
                    <div className="text-[54px] font-semibold text-[#000] leading-none tracking-tight tabular-nums mt-2">
                        {currentTime ? currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
                    </div>
                    <div className="text-[28px] font-medium text-[#000] mt-3">
                        {currentTime ? formatDate(currentTime) : '-'}
                    </div>

                    {/* Location Status */}
                    <div className="mt-[64px]">
                        {renderMobileLocationStatus()}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col items-center gap-[24px] mt-[32px]">
                        <button 
                            type="button" 
                            className={`w-[235px] h-[48px] flex items-center justify-center rounded-[6px] font-semibold text-[16px] transition-colors ${
                                locationStatus === 'searching' 
                                    ? 'bg-[#ECECED] text-[#9A9A9A]' 
                                    : 'bg-[#A80689] text-white'
                            }`}
                        >
                            ลงเวลาเข้างาน
                        </button>
                        <button 
                            type="button" 
                            className="w-[235px] h-[48px] flex items-center justify-center rounded-[6px] font-semibold text-[16px] bg-[#ECECED] text-[#000000] transition-colors"
                        >
                            ลงเวลาออกงาน
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CheckInPage;
