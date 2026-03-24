'use client';
import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import IconMapPin from '@/components/icon/icon-map-pin';
import Swal from 'sweetalert2';

const CheckInPage = () => {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [locationStatus, setLocationStatus] = useState<'searching' | 'found' | 'outside'>('found');

    // Native OS Camera Tracking State
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [checkInActionType, setCheckInActionType] = useState<'in' | 'out' | null>(null);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);

    // Confirm Clock Out Modal State
    const [showConfirmOutModal, setShowConfirmOutModal] = useState(false);

    const handleCameraTrigger = (actionType: 'in' | 'out') => {
        setCheckInActionType(actionType);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCheckInTime(new Date());
            setShowSuccessModal(true);
        }
        if (e.target) {
            e.target.value = ''; // Reset input to allow retaking
        }
    };

    const handleClockOut = () => {
        setCheckInActionType('out');
        setShowConfirmOutModal(true);
    };
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
                    className="flex flex-row items-center justify-center gap-[16px] cursor-pointer transition-all select-none bg-[#F3F4F6] border border-[#E5E7EB] rounded-full pr-8 pl-3 py-2.5"
                    onClick={() => setLocationStatus('found')}
                    title="คลิกเพื่อจำลองการหาสถานที่เจอแบบในภาพ"
                >
                    <div className="rounded-full flex items-center justify-center w-[44px] h-[44px] bg-[#CECFD2]">
                        <div className="bg-[#85888E] text-white rounded-full flex items-center justify-center w-[32px] h-[32px]">
                            <IconMapPin className="w-[18px] h-[18px]" />
                        </div>
                    </div>
                    <div className="font-bold text-[17px] text-[#333741] whitespace-nowrap">กำลังค้นหาตำแหน่ง...</div>
                </div>
            );
        } else if (locationStatus === 'outside') {
            return (
                <div
                    className="flex flex-row items-center justify-center gap-[16px] cursor-pointer transition-all select-none bg-[#FEE4E2] border border-[#FDA29B] rounded-full pr-8 pl-3 py-2.5"
                    onClick={() => setLocationStatus('searching')}
                    title="คลิกเพื่อจำลองการค้นหาสถานที่"
                >
                    <div className="rounded-full flex items-center justify-center w-[44px] h-[44px] bg-[#F97066]" >
                        <div className="bg-[#F04438] text-[#FEF3F2] rounded-full flex items-center justify-center w-[32px] h-[32px]">
                            <IconMapPin className="w-[18px] h-[18px]" />
                        </div>
                    </div>
                    <div className="font-bold text-[17px] text-[#333741] whitespace-nowrap">อยู่นอกสถานที่</div>
                </div>
            );
        } else {
            return (
                <div
                    className="flex flex-row items-center justify-center gap-[16px] cursor-pointer transition-all select-none bg-[#D1FADF] border border-[#6CE9A6] rounded-full pr-8 pl-3 py-2.5"
                    onClick={() => setLocationStatus('outside')}
                    title="คลิกเพื่อจำลองว่าอยู่นอกสถานที่"
                >
                    <div className="rounded-full flex items-center justify-center w-[44px] h-[44px] bg-[#75E0A7]" >
                        <div className="bg-[#42B86F] text-[#E4F5EA] rounded-full flex items-center justify-center w-[32px] h-[32px]">
                            <IconMapPin className="w-[18px] h-[18px]" />
                        </div>
                    </div>
                    <div className="font-bold text-[17px] text-[#333741] whitespace-nowrap">อยู่ในสถานที่</div>
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

    // Calculate Dynamic Tag UI for the Success Modal
    const getStatusDisplay = () => {
        if (!checkInTime || !checkInActionType) return { label: '-', className: 'bg-[#F3F4F6] text-[#475467]' };

        if (checkInActionType === 'in') {
            const h = checkInTime.getHours();
            const m = checkInTime.getMinutes();
            // Condition for "Late" (มาสาย): 08:45 AM or later
            const isLate = h > 8 || (h === 8 && m >= 45);

            if (isLate) {
                return {
                    label: 'มาสาย',
                    className: 'text-[12px] font-bold bg-[#FFEFBC] text-[#AD5A4C]', // Red styling
                };
            }
            return {
                label: 'เข้างานปกติ',
                className: 'text-[12px] font-bold bg-[#DCFAE6] text-[#067647]', // Green styling 
            };
        } else {
            return {
                label: 'เข้างานปกติ', // Matches user's specific Figma request
                className: 'text-[12px] font-bold bg-[#DCFAE6] text-[#067647]', // Green styling matching Figma check-out
            };
        }
    };

    return (
        <>
            {/* Hidden Input for Native OS Camera Capture (Uses Desktop/Mobile built-in camera/file-picker automatically) */}
            <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                ref={fileInputRef}
                onChange={handlePhotoCapture}
            />

            {/* ----- Desktop Global Fixed Background ----- */}
            <div className="hidden md:block fixed inset-0 z-[1] pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin.jpg')] bg-cover bg-center bg-no-repeat rotate-180 opacity-50"></div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex panel -m-6 min-h-[calc(100vh-80px)] h-fit lg:h-[calc(100vh-80px)] rounded-none border-0 flex-col !bg-transparent p-6 relative z-[2] shadow-none overflow-hidden">
                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-center w-full h-full flex-1 gap-[16px] max-w-[764px] mx-auto my-auto">

                    {/* Top Panel - Progress Bar (Figma Specs: W764, H72, Radius 15, Drop Shadow, Glass, Inside Stroke Gradient) */}
                    <div className="relative rounded-[15px] w-full h-[72px] px-6 py-[13px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] bg-white/60 backdrop-blur-[4px] backdrop-saturate-[150%] flex flex-col justify-between">
                        {/* Stroke Gradient Ring (Border Only) */}
                        <div className="absolute inset-0 rounded-[15px] pointer-events-none p-[1px] bg-gradient-to-tl from-white/20 from-0% to-white to-100% [mask-image:linear-gradient(#fff,#fff),linear-gradient(#fff,#fff)] [mask-clip:content-box,border-box] [mask-composite:exclude] [-webkit-mask-composite:xor]"></div>

                        <div className="text-[14px] font-bold text-[#333741] tracking-wide leading-none z-10">
                            ความคืบหน้าในการฝึกงาน
                        </div>
                        <div className="flex items-center w-full gap-[10px] h-[22px] z-10">
                            {/* Track Container (Shadow Inner) */}
                            <div className="flex-1 h-[18px] rounded-full overflow-hidden bg-gradient-to-b from-[#e4e4e4] to-[#f8f8f8] dark:from-[#1b2e4b] dark:to-[#0f1928] shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.1)] relative flex items-center min-w-0">
                                {/* Thumb */}
                                <div
                                    className="text-white text-[11px] w-[75%] h-[18px] flex justify-end pr-5 items-center font-medium rounded-full bg-[#A80689] shadow-[inset_0px_-4px_6px_rgba(0,0,0,0.4),inset_0px_2px_3px_rgba(255,255,255,0.4)]"
                                >
                                    420 ชั่วโมง
                                </div>
                            </div>
                            {/* Badge at the End */}
                            <div
                                className="shrink-0 text-white text-[11px] px-3 min-w-[70px] h-[22px] rounded-full font-medium flex items-center justify-center bg-[#A80689] shadow-[inset_0px_-5px_7px_rgba(0,0,0,0.4),inset_0px_2px_4px_rgba(255,255,255,0.4)] whitespace-nowrap z-20"
                            >
                                560 ชั่วโมง
                            </div>
                        </div>
                    </div>

                    {/* Main Panel - Content (Figma Specs: W764, H524, Radius 20, Drop Shadow, Glass, Inside Stroke Gradient) */}
                    <div className="relative rounded-[20px] w-full min-h-[524px] h-fit flex-none p-10 shadow-[0_4px_15px_rgba(0,0,0,0.1)] bg-white/60 backdrop-blur-[4px] backdrop-saturate-[150%] flex flex-col items-center justify-center overflow-hidden">
                        {/* Stroke Gradient Ring (Border Only) */}
                        <div className="absolute inset-0 rounded-[20px] pointer-events-none p-[1px] bg-gradient-to-tl from-white/20 from-0% to-white to-100% [mask-image:linear-gradient(#fff,#fff),linear-gradient(#fff,#fff)] [mask-clip:content-box,border-box] [mask-composite:exclude] [-webkit-mask-composite:xor]"></div>

                        {/* Center Time */}
                        <div className="flex flex-col justify-center items-center -mt-6 space-y-4 text-center z-10">
                            <div className="text-[70px] font-bold text-black tracking-wide tabular-nums leading-none">
                                {currentTime ? currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
                            </div>
                            <div className="text-[28px] font-medium text-black tracking-wide">
                                {currentTime ? formatDate(currentTime) : '-'}
                            </div>
                        </div>

                        {/* Location Status Pill */}
                        <div className="mt-14 mb-[70px] z-10">
                            {renderDesktopLocationStatus()}
                        </div>

                        {/* Bottom Buttons */}
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-[16px] sm:gap-[24px] w-full z-10">
                            <button
                                type="button"
                                onClick={() => handleCameraTrigger('in')}
                                className={`w-full max-w-[250px] h-[64px] flex items-center justify-center font-bold rounded-[8px] text-[19px] transition-all hover:-translate-y-[1px] ${locationStatus === 'searching'
                                        ? 'bg-[#EAEAEA] text-[#9A9A9A] shadow-none'
                                        : 'bg-[#A80689] text-white hover:bg-[#8B0374] shadow-[0_4px_15px_rgba(168,6,137,0.3)]'
                                    }`}
                            >
                                ลงเวลาเข้างาน
                            </button>
                            <button
                                type="button"
                                onClick={handleClockOut}
                                className="w-full max-w-[250px] h-[64px] flex items-center justify-center bg-[#F3F4F6] border border-[#E5E7EB] text-[#475467] font-bold rounded-[8px] text-[19px] transition-all hover:-translate-y-[1px] hover:bg-[#E5E7EB] shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                            >
                                ลงเวลาออกงาน
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ----- Mobile Global Fixed Background ----- */}
            <div className="md:hidden fixed inset-0 z-[1] pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin.jpg')] bg-cover bg-center bg-no-repeat opacity-50"></div>
            </div>

            {/* Mobile View (PWA) */}
            <div className="flex md:hidden panel -m-6 min-h-[calc(100vh-114px)] rounded-none border-0 flex-col items-center pt-10 pb-16 relative overflow-hidden font-sans z-[2] !bg-transparent shadow-none">

                {/* Title */}
                <h2 className="text-[#333741] text-[13px] font-medium mb-[85px] tracking-wide relative z-10">ความคืบหน้าในการฝึกงาน</h2>

                {/* Card */}
                <div className="bg-white w-[calc(100vw-48px)] max-w-[360px] min-h-[536px] h-fit rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] relative z-10 flex flex-col items-center pt-[70px] pb-8 px-4 sm:px-6">

                    {/* Donut Chart overlapping top */}
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
                    <div className="flex flex-col items-center w-full max-w-[280px] gap-[24px] mt-[32px]">
                        <button
                            type="button"
                            onClick={() => handleCameraTrigger('in')}
                            className={`w-full h-[48px] flex items-center justify-center rounded-[6px] font-semibold text-[16px] transition-colors ${locationStatus === 'searching'
                                    ? 'bg-[#ECECED] text-[#9A9A9A]'
                                    : 'bg-[#A80689] text-white'
                                }`}
                        >
                            ลงเวลาเข้างาน
                        </button>
                        <button
                            type="button"
                            onClick={handleClockOut}
                            className="w-full h-[48px] flex items-center justify-center rounded-[6px] font-semibold text-[16px] bg-[#ECECED] text-[#000000] transition-colors"
                        >
                            ลงเวลาออกงาน
                        </button>
                    </div>
                </div>
            </div>

            {/* Global Shared Backdrop for all Modals (Keeps perfectly smooth crossfades without flickering) */}
            <Transition
                show={showSuccessModal || showConfirmOutModal}
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="fixed inset-0 bg-[black]/40 backdrop-blur-sm z-[100] pointer-events-none" />
            </Transition>

            {/* Success Modal Overlay (Using Vristo/HeadlessUI Components) */}
            <Transition appear show={showSuccessModal} as={Fragment}>
                <Dialog as="div" open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
                    <div className="fixed inset-0 z-[101] overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center px-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel as="div" className="bg-white rounded-[16px] w-full max-w-[313px] min-h-[490px] h-fit flex flex-col items-center pt-8 pb-6 px-[26px] shadow-2xl relative font-sans align-middle">

                                    {/* Check Icon with Circle */}
                                    <div className="w-[60px] h-[60px] rounded-full border-[2px] border-[#A80689] flex items-center justify-center mb-5 bg-[#FEEBFB]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#A80689" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>

                                    {/* Title & Subtitle */}
                                    <h3 className="font-medium text-[28px] text-black mb-1 tracking-wide">
                                        {checkInActionType === 'in' ? 'ลงเวลาสำเร็จ' : 'ลงเวลาออกสำเร็จ'}
                                    </h3>
                                    <p className="text-[13px] text-[#85888E] font-medium mb-6">
                                        {checkInActionType === 'in' ? 'ขอให้วันนี้เป็นวันที่ดีในการทำงานนะ' : 'ขอบคุณสำหรับการทำงาน'}
                                    </p>

                                    {/* Data Card (Inner Box) */}
                                    <div className="w-full border border-[#E5E7EB] rounded-[8px] p-5 flex flex-col items-center mb-6 bg-white shrink-0">
                                        {/* Time & Date */}
                                        <div className="text-[28px] font-semibold text-[#A80689] leading-none mb-2 tracking-tight tabular-nums">
                                            {checkInTime ? checkInTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }).replace(' น.', '') : '08.30'}
                                        </div>
                                        <div className="text-[13px] text-[#8C8C8C] font-semibold mb-5">
                                            {checkInTime ? checkInTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'อังคาร 17 มิถุนายน 2568'}
                                        </div>

                                        {/* Divider */}
                                        <div className="w-full h-[1px] bg-[#E5E7EB] mb-4"></div>

                                        {/* Location Row */}
                                        <div className="w-full flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-[#333741]">
                                                <IconMapPin className="w-[16px] h-[20px] text-[#61646C]" />
                                                <span className="text-[12px] font-bold">สถานที่</span>
                                            </div>
                                            <span className="text-[12px] font-bold text-[#333741]">อยู่ในสถานที่</span>
                                        </div>

                                        {/* Divider */}
                                        <div className="w-full h-[1px] bg-[#E5E7EB] mb-4"></div>

                                        {/* Status Row */}
                                        <div className="w-full flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[#333741]">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#61646C]"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                                <span className="text-[12px] font-bold">สถานะ</span>
                                            </div>
                                            <div className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${getStatusDisplay().className}`}>
                                                {getStatusDisplay().label}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return Button */}
                                    <button
                                        onClick={() => setShowSuccessModal(false)}
                                        className="shrink-0 w-full h-[40px] flex items-center justify-center bg-[#A80689] hover:bg-[#8B0374] text-white font-bold rounded-[5px] text-[13px] transition-colors"
                                    >
                                        กลับไปหน้าหลัก
                                    </button>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Built-in Confirm Clock Out Modal (Pure Tailwind via HeadlessUI) */}
            <Transition appear show={showConfirmOutModal} as={Fragment}>
                <Dialog as="div" open={showConfirmOutModal} onClose={() => setShowConfirmOutModal(false)}>
                    <div className="fixed inset-0 z-[101] overflow-y-auto flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-[0ms]"
                            leaveFrom="opacity-0 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel as="div" className="bg-white rounded-[16px] w-full max-w-[320px] h-[133px] flex flex-col justify-center px-[22px] shadow-2xl relative font-sans overflow-hidden align-middle">
                                
                                <h3 className="font-medium text-[19px] text-[#1f2937] text-center w-full mt-1 mb-[20px]">
                                    ยืนยันการลงเวลาออก
                                </h3>

                                <div className="flex w-full justify-center items-center gap-[16px]">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmOutModal(false)}
                                        className="shrink-0 w-[130px] h-[40px] flex items-center justify-center bg-white border border-[#D1D5DB] text-[#374151] font-bold text-[15px] rounded-[6px] transition-colors hover:bg-gray-50 focus:outline-none"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowConfirmOutModal(false);
                                            setCheckInTime(new Date());
                                            setShowSuccessModal(true);
                                        }}
                                        className="shrink-0 w-[130px] h-[40px] flex items-center justify-center bg-[#A80689] hover:bg-[#8B0374] text-white font-bold text-[15px] rounded-[6px] transition-colors focus:outline-none"
                                    >
                                        ยืนยัน
                                    </button>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

export default CheckInPage;
