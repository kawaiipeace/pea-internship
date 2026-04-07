'use client';
import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import axiosInstance from '@/api/axios';
import IconMapPin from '@/components/icon/icon-map-pin';

const OFFICE_LAT = 13.893511352870942;
const OFFICE_LNG = 100.47590942850128;
const MAX_DISTANCE_METERS = 300;

const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

const CheckInPage = () => {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [locationStatus, setLocationStatus] = useState<'searching' | 'found' | 'outside'>('searching');
    const [currentPosition, setCurrentPosition] = useState<{ lat: number, lng: number } | null>(null);

    const [checkInActionType, setCheckInActionType] = useState<'in' | 'out' | null>(null);
    const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
    const [hasClockedOutToday, setHasClockedOutToday] = useState<boolean>(false);

    // Progress State
    const [progressData, setProgressData] = useState<{ accumulatedHours: number, totalHoursGoal: number, percentage: number } | null>(null);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);

    // Confirm Clock Out Modal State
    const [showConfirmOutModal, setShowConfirmOutModal] = useState(false);

    const checkLocation = useCallback(() => {
        if (!navigator.geolocation) {
            Swal.fire({ icon: 'error', title: 'ไม่รองรับ Location', text: 'เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง', confirmButtonColor: '#A80689' });
            setLocationStatus('outside');
            return;
        }

        setLocationStatus('searching');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCurrentPosition({ lat, lng });

                const distance = getDistanceInMeters(lat, lng, OFFICE_LAT, OFFICE_LNG);
                if (distance <= MAX_DISTANCE_METERS) {
                    setLocationStatus('found');
                } else {
                    setLocationStatus('outside');
                }
            },
            (error) => {
                console.error("Error getting location: ", error);
                let text = 'ไม่สามารถระบุตำแหน่งได้ กรุณาเปิดการเข้าถึงตำแหน่งที่ตั้ง (Location)';
                if (error.code === error.PERMISSION_DENIED) { text = 'กรุณาอนุญาตการเข้าถึงตำแหน่ง (Location Permission)'; }
                Swal.fire({ icon: 'warning', title: 'ข้อผิดพลาดเกี่ยวกับตำแหน่ง', text: text, confirmButtonColor: '#A80689' });
                setLocationStatus('outside');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    const handleCheckIn = async (actionType: 'in' | 'out') => {
        if (locationStatus !== 'found') {
            Swal.fire({ icon: 'warning', title: 'ไม่อยู่ในสถานที่', text: 'คุณต้องอยู่ในสถานที่ที่กำหนดเพื่อลงเวลาเข้างาน', confirmButtonColor: '#A80689' });
            return;
        }
        try {
            await axiosInstance.post('/check-time/in', {
                latitude: currentPosition?.lat,
                longitude: currentPosition?.lng,
                location_note: 'กฟภ. สำนักงานใหญ่'
            });
            setCheckInActionType(actionType);
            setCheckInTime(new Date());
            setHasCheckedInToday(true);
            setShowSuccessModal(true);
            fetchProgress();
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการลงเวลาเช็คอิน', confirmButtonColor: '#A80689' });
        }
    };

    const handleClockOut = () => {
        if (locationStatus !== 'found') {
            Swal.fire({ icon: 'warning', title: 'ไม่อยู่ในสถานที่', text: 'คุณต้องอยู่ในสถานที่ที่กำหนดเพื่อลงเวลาออกงาน', confirmButtonColor: '#A80689' });
            return;
        }

        if (!canClockOut()) {
            Swal.fire({ icon: 'warning', title: 'ยังไม่ถึงเวลาลงเวลาออก', text: 'คุณสามารถลงเวลาออกได้ตั้งแต่เวลา 16:30 น. เป็นต้นไป', confirmButtonColor: '#A80689' });
            return;
        }

        setCheckInActionType('out');
        setShowConfirmOutModal(true);
    };

    const confirmClockOut = async () => {
        try {
            await axiosInstance.post('/check-time/out', {
                latitude: currentPosition?.lat,
                longitude: currentPosition?.lng,
                location_note: 'กฟภ. สำนักงานใหญ่'
            });
            setShowConfirmOutModal(false);
            setCheckInTime(new Date());
            setHasClockedOutToday(true);
            setShowSuccessModal(true);
            fetchProgress();
        } catch (error: any) {
            setShowConfirmOutModal(false);
            Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการลงเวลาเช็คเอาท์', confirmButtonColor: '#A80689' });
        }
    };

    const fetchProgress = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/user/student/total-hours');
            if (response.data) {
                setProgressData(response.data);
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
        }
    }, []);

    const fetchTodayStatus = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/check-time/history');
            if (response.data && response.data.records) {
                const now = new Date();
                const bkkFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' });
                const todayStr = bkkFormatter.format(now);
                
                const todayRecord = response.data.records.find((r: any) => r.workDate === todayStr);
                if (todayRecord) {
                    if (todayRecord.checkInTime && todayRecord.checkInTime !== '--:--') {
                        setHasCheckedInToday(true);
                    } else {
                        setHasCheckedInToday(false);
                    }
                    if (todayRecord.checkOutTime && todayRecord.checkOutTime !== '--:--') {
                        setHasClockedOutToday(true);
                    } else {
                        setHasClockedOutToday(false);
                    }
                } else {
                    setHasCheckedInToday(false);
                    setHasClockedOutToday(false);
                }
            }
        } catch (error) {
            console.error('Error fetching today status:', error);
        }
    }, []);

    const canClockOut = () => {
        if (!currentTime) return false;
        const h = currentTime.getHours();
        const m = currentTime.getMinutes();
        // Allowed from 16:30 (4:30 PM) onwards
        return h > 16 || (h === 16 && m >= 30);
    };

    useEffect(() => {
        checkLocation();
        fetchProgress();
        fetchTodayStatus();
        
        let lastDate = new Date().toDateString();
        setCurrentTime(new Date());

        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // Midnight Reset Logic: If the date has changed, reset the status and re-fetch
            if (now.toDateString() !== lastDate) {
                lastDate = now.toDateString();
                setHasCheckedInToday(false);
                setHasClockedOutToday(false);
                fetchTodayStatus();
                fetchProgress();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [checkLocation, fetchProgress, fetchTodayStatus]);

    // Desktop Location Status
    const renderDesktopLocationStatus = () => {
        if (locationStatus === 'searching') {
            return (
                <div
                    className="flex flex-row items-center w-[180px] h-[40px] gap-[10px] cursor-pointer transition-all select-none bg-[#F3F4F6] rounded-[25px] pr-4 overflow-hidden"
                    onClick={checkLocation}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] shrink-0 bg-[#CECFD2]">
                        <div className="bg-[#85888E] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[20px]">location_on</span>
                        </div>
                    </div>
                    <div className="flex-1 text-center font-medium text-[13px] text-[#333741] whitespace-nowrap">กำลังค้นหาตำแหน่ง...</div>
                </div>
            );
        } else if (locationStatus === 'outside') {
            return (
                <div
                    className="flex flex-row items-center w-[180px] h-[40px] gap-[10px] cursor-pointer transition-all select-none bg-[#FAF0DB] rounded-[25px] pr-4 overflow-hidden"
                    onClick={checkLocation}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] shrink-0 bg-[#EDC878]">
                        <div className="bg-[#E2A727] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[20px]">location_on</span>
                        </div>
                    </div>
                    <div className="flex-1 text-center font-medium text-[13px] text-[#333741] whitespace-nowrap">อยู่นอกสถานที่</div>
                </div>
            );
        } else {
            return (
                <div
                    className="flex flex-row items-center w-[180px] h-[40px] gap-[10px] cursor-pointer transition-all select-none bg-[#D1FADF] rounded-[25px] pr-4 overflow-hidden"
                    onClick={checkLocation}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] shrink-0 bg-[#75E0A7]">
                        <div className="bg-[#42B86F] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[20px]">location_on</span>
                        </div>
                    </div>
                    <div className="flex-1 text-center font-medium text-[13px] text-[#333741] whitespace-nowrap">อยู่ในสถานที่</div>
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
                    onClick={checkLocation}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#CECFD2]">
                        <div className="bg-[#85888E] text-white rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[24px]">location_on</span>
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">กำลังค้นหาตำแหน่ง...</div>
                </div>
            );
        } else if (locationStatus === 'outside') {
            return (
                <div
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={checkLocation}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#F97066]" >
                        <div className="bg-[#F04438] text-[#FEF3F2] rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[24px]">location_on</span>
                        </div>
                    </div>
                    <div className="font-medium text-[15px] text-[#333741] dark:text-white-light whitespace-nowrap">อยู่นอกสถานที่</div>
                </div>
            );
        } else {
            return (
                <div
                    className="flex flex-col items-center justify-center gap-[8px] cursor-pointer transition-all select-none"
                    onClick={checkLocation}
                    title="คลิกเพื่อรีเฟรชตำแหน่ง"
                >
                    <div className="rounded-full flex items-center justify-center w-[40px] h-[40px] bg-[#75E0A7]" >
                        <div className="bg-[#42B86F] text-[#E4F5EA] rounded-full flex items-center justify-center w-[30px] h-[30px]">
                            <span className="material-symbols-rounded text-[24px]">location_on</span>
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
                    className: 'bg-[#FFEFBC] text-[#AD5A4C]', // Red styling
                };
            }
            return {
                label: 'เข้างานปกติ',
                className: 'bg-[#DCFAE6] text-[#067647]', // Green styling 
            };
        } else {
            return {
                label: 'เข้างานปกติ', // Matches user's specific Figma request
                className: 'bg-[#DCFAE6] text-[#067647]', // Green styling matching Figma check-out
            };
        }
    };

    return (
        <>

            {/* ----- Desktop Global Fixed Background ----- */}
            <div className="hidden md:block fixed inset-0 z-[1] pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin2.jpg')] bg-cover bg-center bg-no-repeat rotate-180 -scale-x-100 opacity-50"></div>
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
                                    className="text-white text-[11px] h-[18px] flex justify-end pr-4 items-center font-medium rounded-full bg-[#A80689] shadow-[inset_0px_-4px_6px_rgba(0,0,0,0.4),inset_0px_2px_3px_rgba(255,255,255,0.4)] whitespace-nowrap"
                                    style={{ width: `${progressData?.percentage || 0}%`, minWidth: '75px' }}
                                >
                                    {progressData?.accumulatedHours || 0} ชั่วโมง
                                </div>
                            </div>
                            {/* Badge at the End */}
                            <div
                                className="shrink-0 text-white text-[11px] px-3 min-w-[70px] h-[22px] rounded-full font-medium flex items-center justify-center bg-[#A80689] shadow-[inset_0px_-5px_7px_rgba(0,0,0,0.4),inset_0px_2px_4px_rgba(255,255,255,0.4)] whitespace-nowrap z-20"
                            >
                                {progressData?.totalHoursGoal || 560} ชั่วโมง
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
                                onClick={() => handleCheckIn('in')}
                                disabled={locationStatus !== 'found' || hasCheckedInToday}
                                className={`w-full max-w-[160px] h-[60px] flex items-center justify-center font-normal rounded-[6px] text-[20px] transition-all ${(locationStatus !== 'found' || hasCheckedInToday)
                                        ? 'bg-[#ECECED] text-[#61646C]  border border-[#98A2B3]  shadow-none cursor-not-allowed'
                                        : 'hover:-translate-y-[1px] bg-[#A80689] text-white'
                                    }`}
                            >
                                ลงเวลาเข้างาน
                            </button>
                            <button
                                type="button"
                                onClick={handleClockOut}
                                disabled={locationStatus !== 'found' || !hasCheckedInToday || hasClockedOutToday || !canClockOut()}
                                className={`w-full max-w-[160px] h-[60px] flex items-center justify-center font-normal rounded-[6px] text-[20px] transition-all ${(locationStatus !== 'found' || !hasCheckedInToday || hasClockedOutToday || !canClockOut())
                                        ? 'bg-[#ECECED] text-[#61646C] border border-[#98A2B3] shadow-none cursor-not-allowed'
                                        : 'hover:-translate-y-[1px] bg-[#A80689] text-white '
                                    }`}
                                title={!canClockOut() && hasCheckedInToday && !hasClockedOutToday ? "ลงเวลาออกได้ตั้งแต่ 16:30 น." : ""}
                            >
                                ลงเวลาออกงาน
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ----- Mobile Global Fixed Background ----- */}
            <div className="md:hidden fixed inset-0 z-[1] pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin2.jpg')] bg-cover bg-center bg-no-repeat  opacity-50"></div>
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
                            <circle cx="55" cy="55" r="47" stroke="url(#chartGradient)" strokeWidth="8" fill="none" strokeDasharray="295" strokeDashoffset={295 - (295 * (progressData?.percentage || 0) / 100)} strokeLinecap="round" style={{ filter: 'drop-shadow(0px 3px 4px rgba(168,6,137,0.4))' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 mt-[2px]">
                            <span className="text-[13px] font-medium text-[#111] leading-tight tracking-[0.2px]">{progressData?.accumulatedHours || 0} / {progressData?.totalHoursGoal || 560}</span>
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
                            onClick={() => handleCheckIn('in')}
                            disabled={locationStatus !== 'found' || hasCheckedInToday}
                            className={`w-full h-[48px] flex items-center justify-center rounded-[6px] font-semibold text-[16px] transition-colors ${(locationStatus !== 'found' || hasCheckedInToday)
                                    ? 'bg-[#ECECED] text-[#9A9A9A] cursor-not-allowed'
                                    : 'bg-[#A80689] text-white hover:bg-[#8B0374]'
                                }`}
                        >
                            ลงเวลาเข้างาน
                        </button>
                        <button
                            type="button"
                            onClick={handleClockOut}
                            disabled={locationStatus !== 'found' || !hasCheckedInToday || hasClockedOutToday || !canClockOut()}
                            className={`w-full h-[48px] flex items-center justify-center rounded-[6px] font-semibold text-[16px] transition-colors ${(locationStatus !== 'found' || !hasCheckedInToday || hasClockedOutToday || !canClockOut())
                                    ? 'bg-[#ECECED] text-[#9A9A9A] cursor-not-allowed'
                                    : 'bg-[#A80689] text-white hover:bg-[#8B0374]'
                                }`}
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
                                <Dialog.Panel as="div" className="bg-white rounded-[16px] w-full max-w-[340px] flex flex-col items-center pt-10 pb-6 px-6 shadow-2xl relative font-sans align-middle">

                                    {/* Check Icon with Circle */}
                                    <div className="w-[72px] h-[72px] shrink-0 rounded-full flex items-center justify-center mb-6 bg-[#25C277]">
                                        <span className="material-symbols-outlined text-white text-[56px] select-none" style={{ fontSize: '56px' }}>check</span>
                                    </div>

                                    {/* Title & Subtitle */}
                                    <h3 className="font-bold text-[28px] text-black mb-1">
                                        {checkInActionType === 'in' ? 'ลงเวลาสำเร็จ' : 'ลงเวลาออกสำเร็จ'}
                                    </h3>
                                    <p className="text-[15px] text-[#888888] font-medium mb-6">
                                        {checkInActionType === 'in' ? 'ขอให้วันนี้เป็นวันที่ดีในการทำงาน' : 'ขอบคุณสำหรับการทำงาน'}
                                    </p>

                                    {/* Data Card (Inner Box) */}
                                    <div className="w-full border border-[#E5E7EB] rounded-[8px] pt-8 pb-6 px-6 flex flex-col items-center mb-6 bg-[#FCF9FD] shrink-0">
                                        {/* Time & Date */}
                                        <div className="text-[44px] font-medium text-[#A80689] leading-none mb-3 tracking-tight tabular-nums">
                                            {checkInTime ? checkInTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }).replace(' น.', '') : '08:30'}
                                        </div>
                                        <div className="text-[15px] text-[#888888] mb-8">
                                            {checkInTime ? checkInTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^(วัน[^\s]+)\s/, '$1ที่ ') : 'วันจันทร์ที่ 1 มกราคม 2569'}
                                        </div>

                                        {/* Location Row */}
                                        <div className="w-full flex items-center justify-between mb-4 mt-2">
                                            <div className="flex items-center gap-3 text-[#333741]">
                                                <span className="material-symbols-rounded text-[20px] text-[#555555] select-none">location_on</span>
                                                <span className="text-[14px] font-medium text-[#444]">สถานที่</span>
                                            </div>
                                            <span className="text-[14px] font-medium text-[#333741]">อยู่ในสถานที่</span>
                                        </div>

                                        {/* Divider */}
                                        <div className="w-full h-[1px] bg-[#E5E7EB] mb-4"></div>

                                        {/* Status Row */}
                                        <div className="w-full flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-[#333741]">
                                                <span className="material-symbols-rounded text-[20px] text-[#555555] select-none">planner_review</span>
                                                <span className="text-[14px] font-medium text-[#444]">สถานะ</span>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-[13px] font-medium ${getStatusDisplay().className}`}>
                                                {getStatusDisplay().label}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return Button */}
                                    <button
                                        onClick={() => setShowSuccessModal(false)}
                                        className="shrink-0 w-full h-[52px] flex items-center justify-center bg-[#A80689] hover:bg-[#8B0374] text-white text-[16px] font-medium rounded-[8px] transition-colors"
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
                                        onClick={confirmClockOut}
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
