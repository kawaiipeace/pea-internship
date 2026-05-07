'use client';
import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import Swal from 'sweetalert2';
import axiosInstance from '@/api/axios';
import useAuthStore from '@/store/authStore';
import { OFFICE_LAT, OFFICE_LNG, MAX_DISTANCE_METERS, getDistanceInMeters, formatDateThai } from '@/components/check-time/utils';
import LocationStatus from '@/components/check-time/LocationStatus';
import ProgressSection from '@/components/check-time/ProgressSection';
import { SuccessModal, ConfirmOutModal } from '@/components/check-time/CheckTimeModals';

const CheckInPage = () => {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const { user } = useAuthStore();
    const isInternshipComplete = (user?.profile as any)?.internshipStatus === 'COMPLETE';
    const [locationStatus, setLocationStatus] = useState<'searching' | 'found' | 'outside'>('searching');
    const [currentPosition, setCurrentPosition] = useState<{ lat: number, lng: number } | null>(null);

    const [checkInActionType, setCheckInActionType] = useState<'in' | 'out' | null>(null);
    const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
    const [hasClockedOutToday, setHasClockedOutToday] = useState<boolean>(false);
    const [isOnLeaveToday, setIsOnLeaveToday] = useState<boolean>(false);

    const [isOffsiteToday, setIsOffsiteToday] = useState<boolean>(false);
    const [offsiteInfo, setOffsiteInfo] = useState<{ locationName: string } | null>(null);

    const [progressData, setProgressData] = useState<{ accumulatedHours: number, totalHoursGoal: number, percentage: number } | null>(null);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
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

    const fetchOffsiteTasks = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/offsite-tasks/student');
            if (response.data && Array.isArray(response.data)) {
                const now = new Date();
                const bkkFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' });
                const todayStr = bkkFormatter.format(now);
                
                const todayTask = response.data.find((task: any) => task.workDate === todayStr);
                if (todayTask) {
                    setIsOffsiteToday(true);
                    setOffsiteInfo(todayTask);
                } else {
                    setIsOffsiteToday(false);
                    setOffsiteInfo(null);
                }
            }
        } catch (error) {
            console.error('Error fetching offsite tasks:', error);
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
                    setIsOnLeaveToday(todayRecord.displayStatus === 'LEAVE');
                    setHasCheckedInToday(!!(todayRecord.checkInTime && todayRecord.checkInTime !== '--:--'));
                    setHasClockedOutToday(!!(todayRecord.checkOutTime && todayRecord.checkOutTime !== '--:--'));
                } else {
                    setHasCheckedInToday(false);
                    setHasClockedOutToday(false);
                }
            }
        } catch (error) {
            console.error('Error fetching today status:', error);
        }
    }, []);

    const handleCheckIn = async (actionType: 'in' | 'out') => {
        if (locationStatus !== 'found' && !isOffsiteToday) {
            Swal.fire({ icon: 'warning', title: 'ไม่อยู่ในสถานที่', text: 'คุณต้องอยู่ในสถานที่ที่กำหนดเพื่อลงเวลาเข้างาน', confirmButtonColor: '#A80689' });
            return;
        }
        try {
            await axiosInstance.post('/check-time/in', {
                latitude: currentPosition?.lat,
                longitude: currentPosition?.lng,
                location_note: isOffsiteToday ? offsiteInfo?.locationName : 'กฟภ. สำนักงานใหญ่'
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

    const canClockOut = () => {
        if (!currentTime) return false;
        const h = currentTime.getHours();
        const m = currentTime.getMinutes();
        return h > 16 || (h === 16 && m >= 30);
    };

    const handleClockOut = () => {
        if (locationStatus !== 'found' && !isOffsiteToday) {
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
                location_note: isOffsiteToday ? offsiteInfo?.locationName : 'กฟภ. สำนักงานใหญ่'
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

    useEffect(() => {
        checkLocation();
        fetchProgress();
        fetchTodayStatus();
        fetchOffsiteTasks();
        
        let lastDate = new Date().toDateString();
        setCurrentTime(new Date());

        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            if (now.toDateString() !== lastDate) {
                lastDate = now.toDateString();
                setHasCheckedInToday(false);
                setHasClockedOutToday(false);
                setIsOnLeaveToday(false);
                fetchTodayStatus();
                fetchProgress();
                fetchOffsiteTasks();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [checkLocation, fetchProgress, fetchTodayStatus, fetchOffsiteTasks]);

    return (
        <>
            <div className="hidden md:block fixed inset-0 z-[1] pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin2.jpg')] bg-cover bg-center bg-no-repeat rotate-180 -scale-x-100 opacity-50"></div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex panel -m-6 min-h-[calc(100vh-80px)] h-fit lg:h-[calc(100vh-80px)] rounded-none border-0 flex-col !bg-transparent p-6 relative z-[2] shadow-none overflow-hidden">
                <div className="relative z-10 flex flex-col justify-center w-full h-full flex-1 gap-[16px] max-w-[764px] mx-auto my-auto">
                    
                    <ProgressSection progressData={progressData} viewType="desktop" />

                    <div className="relative rounded-[20px] w-full min-h-[450px] h-fit flex-none p-10 shadow-[0_4px_15px_rgba(0,0,0,0.1)] bg-white/60 backdrop-blur-[4px] backdrop-saturate-[150%] flex flex-col items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 rounded-[20px] pointer-events-none p-[1px] bg-gradient-to-tl from-white/20 from-0% to-white to-100% [mask-image:linear-gradient(#fff,#fff),linear-gradient(#fff,#fff)] [mask-clip:content-box,border-box] [mask-composite:exclude] [-webkit-mask-composite:xor]"></div>

                        <div className="flex flex-col justify-center items-center -mt-6 space-y-4 text-center z-10">
                            <div className="text-[70px] font-bold text-black tracking-wide tabular-nums leading-none">
                                {currentTime ? currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
                            </div>
                            <div className="text-[28px] font-medium text-black tracking-wide">
                                {currentTime ? formatDateThai(currentTime) : '-'}
                            </div>
                        </div>

                        <LocationStatus status={locationStatus} isOffsiteToday={isOffsiteToday} onRefresh={checkLocation} viewType="desktop" />

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-[16px] sm:gap-[24px] w-full z-10">
                            <button
                                type="button"
                                onClick={() => handleCheckIn('in')}
                                disabled={(locationStatus !== 'found' && !isOffsiteToday) || hasCheckedInToday || isOnLeaveToday || isInternshipComplete}
                                className={`w-full max-w-[160px] h-[60px] flex items-center justify-center font-normal rounded-[6px] text-[18px] transition-all ${((locationStatus !== 'found' && !isOffsiteToday) || hasCheckedInToday || isOnLeaveToday || isInternshipComplete)
                                        ? 'bg-[#ECECED] text-[#61646C]  border border-[#98A2B3]  shadow-none cursor-not-allowed'
                                        : 'hover:-translate-y-[1px] bg-[#A80689] text-white'
                                    }`}
                                title={isInternshipComplete ? "สิ้นสุดการฝึกงานแล้ว" : ""}
                            >
                                ลงเวลาเข้างาน
                            </button>
                            <button
                                type="button"
                                onClick={handleClockOut}
                                disabled={(locationStatus !== 'found' && !isOffsiteToday) || !hasCheckedInToday || hasClockedOutToday || !canClockOut() || isOnLeaveToday || isInternshipComplete}
                                className={`w-full max-w-[160px] h-[60px] flex items-center justify-center font-normal rounded-[6px] text-[18px] transition-all ${((locationStatus !== 'found' && !isOffsiteToday) || !hasCheckedInToday || hasClockedOutToday || !canClockOut() || isOnLeaveToday || isInternshipComplete)
                                        ? 'bg-[#ECECED] text-[#61646C] border border-[#98A2B3] shadow-none cursor-not-allowed'
                                        : 'hover:-translate-y-[1px] bg-[#A80689] text-white '
                                    }`}
                                title={isInternshipComplete ? "สิ้นสุดการฝึกงานแล้ว" : (isOnLeaveToday ? "ไม่สามารถลงเวลาได้เนื่องจากคุณมีการลา" : (!canClockOut() && hasCheckedInToday && !hasClockedOutToday ? "ลงเวลาออกได้ตั้งแต่ 16:30 น." : ""))}
                            >
                                ลงเวลาออกงาน
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:hidden fixed inset-0 z-[1] pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin2.jpg')] bg-cover bg-center bg-no-repeat  opacity-50"></div>
            </div>

            {/* Mobile View (PWA) */}
            <div className="flex md:hidden panel -m-6 min-h-[calc(100vh-114px)] rounded-none border-0 flex-col items-center pt-10 pb-16 relative overflow-hidden font-sans z-[2] !bg-transparent shadow-none">
                <h2 className="text-[#333741] text-[13px] font-medium mb-[85px] tracking-wide relative z-10">ความคืบหน้าในการฝึกงาน</h2>
                <div className="bg-white w-[calc(100vw-48px)] max-w-[360px] min-h-[536px] h-fit rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] relative z-10 flex flex-col items-center pt-[70px] pb-8 px-4 sm:px-6">
                    
                    <ProgressSection progressData={progressData} viewType="mobile" />

                    <div className="text-[54px] font-semibold text-[#000] leading-none tracking-tight tabular-nums mt-2">
                        {currentTime ? currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
                    </div>
                    <div className="text-[28px] font-medium text-[#000] mt-3">
                        {currentTime ? formatDateThai(currentTime) : '-'}
                    </div>

                    <LocationStatus status={locationStatus} isOffsiteToday={isOffsiteToday} onRefresh={checkLocation} viewType="mobile" />

                    <div className="flex flex-col items-center w-full max-w-[280px] gap-[24px] mt-[32px]">
                        <button
                            type="button"
                            onClick={() => handleCheckIn('in')}
                            disabled={(locationStatus !== 'found' && !isOffsiteToday) || hasCheckedInToday || isOnLeaveToday || isInternshipComplete}
                            className={`w-full h-[48px] flex items-center justify-center rounded-[6px] font-semibold text-[16px] transition-colors ${((locationStatus !== 'found' && !isOffsiteToday) || hasCheckedInToday || isOnLeaveToday || isInternshipComplete)
                                    ? 'bg-[#ECECED] text-[#9A9A9A] cursor-not-allowed'
                                    : 'bg-[#A80689] text-white hover:bg-[#8B0374]'
                                }`}
                        >
                            ลงเวลาเข้างาน
                        </button>
                        <button
                            type="button"
                            onClick={handleClockOut}
                            disabled={(locationStatus !== 'found' && !isOffsiteToday) || !hasCheckedInToday || hasClockedOutToday || !canClockOut() || isOnLeaveToday || isInternshipComplete}
                            className={`w-full h-[48px] flex items-center justify-center rounded-[6px] font-semibold text-[16px] transition-colors ${((locationStatus !== 'found' && !isOffsiteToday) || !hasCheckedInToday || hasClockedOutToday || !canClockOut() || isOnLeaveToday || isInternshipComplete)
                                    ? 'bg-[#ECECED] text-[#9A9A9A] cursor-not-allowed'
                                    : 'bg-[#A80689] text-white hover:bg-[#8B0374]'
                                }`}
                        >
                            ลงเวลาออกงาน
                        </button>
                    </div>
                </div>
            </div>

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

            <SuccessModal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                checkInActionType={checkInActionType}
                checkInTime={checkInTime}
                isOffsiteToday={isOffsiteToday}
            />

            <ConfirmOutModal 
                isOpen={showConfirmOutModal}
                onClose={() => setShowConfirmOutModal(false)}
                onConfirm={confirmClockOut}
            />
        </>
    );
};

export default CheckInPage;
