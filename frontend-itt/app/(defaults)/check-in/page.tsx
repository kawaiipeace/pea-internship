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

    // Helper functions for displaying statuses
    const renderLocationStatus = () => {
        if (locationStatus === 'searching') {
            return (
                <div 
                    className="flex items-center space-x-3 bg-[#e0e6ed] text-[#3b3f5c] px-2 py-2 rounded-full font-bold cursor-pointer transition-all dark:bg-dark-light dark:text-white select-none"
                    onClick={() => setLocationStatus('found')}
                    title="คลิกเพื่อจำลองการหาสถานที่เจอแบบในภาพ"
                >
                    <div className="bg-[#888ea8] text-white rounded-full p-2">
                        <IconMapPin className="w-6 h-6 shrink-0" />
                    </div>
                    <span className="pr-4 text-[16px]">กำลังค้นหาสถานที่</span>
                </div>
            );
        } else if (locationStatus === 'outside') {
            return (
                <div 
                    className="flex items-center space-x-3 bg-danger-light text-danger px-2 py-2 rounded-full font-bold cursor-pointer transition-all select-none"
                    onClick={() => setLocationStatus('searching')}
                    title="คลิกเพื่อจำลองการค้นหาสถานที่"
                >
                    <div className="bg-danger text-white rounded-full p-2 lg:p-2.5">
                        <IconMapPin className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" />
                    </div>
                    <span className="pr-4 text-[16px]">อยู่นอกสถานที่</span>
                </div>
            );
        } else {
            return (
                <div 
                    className="flex items-center space-x-3 bg-success-light text-success px-2 py-2 rounded-full font-bold cursor-pointer transition-all select-none"
                    onClick={() => setLocationStatus('outside')}
                    title="คลิกเพื่อจำลองว่าอยู่นอกสถานที่"
                >
                    <div className="bg-success text-white rounded-full p-2 lg:p-2.5">
                        <IconMapPin className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" />
                    </div>
                    <span className="pr-4 py-1 text-[16px]">อยู่ในสถานที่</span>
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
        <div className="panel -m-6 h-[calc(100vh-114px)] rounded-none border-0 flex flex-col bg-[#FFFCF6] p-6">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                {/* Location Status */}
                <div>
                    {renderLocationStatus()}
                </div>

                {/* Progress Bar */}
                <div className="w-full md:w-5/12 max-w-[450px] space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold text-[#3b3f5c] dark:text-gray-300">
                        <span>ความคืบหน้าในการฝึกงาน</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-[#ebebeb] dark:bg-[#1b2e4b] h-6 rounded-full overflow-hidden flex shadow-sm">
                            <div 
                                className="bg-[#b0128a] text-white text-[12px] flex justify-center items-center h-full font-bold" 
                                style={{ width: '75%' }} 
                            >
                                420 ชั่วโมง
                            </div>
                        </div>
                        <div className="bg-[#b0128a] text-white text-xs px-4 py-1.5 rounded-full font-bold whitespace-nowrap shadow-sm">
                            560 ชั่วโมง
                        </div>
                    </div>
                </div>
            </div>

            {/* Center Time */}
            <div className="flex-1 flex flex-col justify-center items-center mt-12 mb-10 space-y-6">
                <div className="text-[70px] sm:text-[90px] md:text-[120px] lg:text-[140px] font-extrabold text-black dark:text-white tracking-wider tabular-nums leading-none">
                    {currentTime ? currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
                </div>
                <div className="text-2xl sm:text-3xl md:text-5xl font-semibold text-black dark:text-gray-300">
                    {currentTime ? formatDate(currentTime) : '-'}
                </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-auto">
                <button type="button" className="w-full sm:w-auto min-w-[220px] bg-[#b0128a] text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-[#8e0e6f] hover:shadow-lg transition-all duration-300">
                    ลงเวลาเข้างาน
                </button>
                <button type="button" className="w-full sm:w-auto min-w-[220px] bg-[#f1f2f3] text-[#6d7587] font-bold py-4 px-8 rounded-lg text-lg hover:bg-[#e0e6ed] hover:text-[#3b3f5c] hover:shadow-md transition-all duration-300 dark:bg-[#1b2e4b] dark:text-[#888ea8] dark:hover:bg-[#191e3a] dark:hover:text-white">
                    ลงเวลาออกงาน
                </button>
            </div>
        </div>
    );
};

export default CheckInPage;
