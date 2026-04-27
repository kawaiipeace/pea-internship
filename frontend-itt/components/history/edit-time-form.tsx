'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';


import IconFile from '@/components/icon/icon-file';
import IconClock from '@/components/icon/icon-clock';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconX from '@/components/icon/icon-x';

import IconPaperclip from '@/components/icon/icon-paperclip';
import IconCalendarClock from '@/components/icon/icon-calendar-clock';
import IconCloudDownload from '@/components/icon/icon-cloud-download';
import IconSend from '@/components/icon/icon-send';
import IconPaperclipPlus from '@/components/icon/icon-paperclip-plus';
import axiosInstance from '@/api/axios';
import Swal from 'sweetalert2';
import TimeWheelPicker from './TimeWheelPicker';

interface EditTimeFormProps {
    selectedHistoryItem: any;
    setIsEditingTime: (val: boolean) => void;
    handleTouchStart?: (e: React.TouchEvent) => void;
    handleTouchMove?: (e: React.TouchEvent) => void;
    handleTouchEnd?: () => void;
}

const EditTimeForm: React.FC<EditTimeFormProps> = ({ 
    selectedHistoryItem, 
    setIsEditingTime,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
}) => {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [reason, setReason] = useState(selectedHistoryItem?.reqReason || "ลืมกดลงเวลาออก");
    const [checkInTime, setCheckInTime] = useState("");
    const [checkOutTime, setCheckOutTime] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pickingType, setPickingType] = useState<'in' | 'out' | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        // Initialize times from selected item, handling various "empty" indicators
        const isInvalidTime = (time: string | undefined) => 
            !time || time === "-" || time === "--:--" || time === "ไม่ลงเวลา" || time === "Invalid Date";

        const initialIn = isInvalidTime(selectedHistoryItem?.checkInTime) ? "08:30" : selectedHistoryItem.checkInTime;
        const initialOut = isInvalidTime(selectedHistoryItem?.checkOutTime) ? "16:30" : selectedHistoryItem.checkOutTime;
        
        setCheckInTime(initialIn);
        setCheckOutTime(initialOut);
    }, [selectedHistoryItem]);

    const handleSubmit = async () => {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        
        if (!timeRegex.test(checkInTime) || !timeRegex.test(checkOutTime)) {
            setError('รูปแบบเวลาไม่ถูกต้อง (ตัวอย่าง 08:30)');
            return;
        }

        if (!reason.trim()) {
            setError('กรุณากรอกหมายเหตุ');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const formData = new FormData();
            // Elysia t.Numeric can handle string from FormData
            formData.append('attendanceLogId', String(selectedHistoryItem.id));
            formData.append('checkInTime', checkInTime);
            formData.append('checkOutTime', checkOutTime);
            formData.append('reason', reason);
            
            if (selectedFile) {
                // Ensure field name matches 'attachment' and it's a File object
                formData.append('attachment', selectedFile);
            }

            // Log exact payload to console for verification
            console.log("Submit Payload:", {
                id: selectedHistoryItem.id,
                in: checkInTime,
                out: checkOutTime,
                reason: reason,
                file: selectedFile?.name
            });

            await axiosInstance.put('/check-time/edit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setShowConfirm(false);
            setShowSuccess(true);

            // Optimized redirect: Remove refresh and duplicate push calls for speed
            setTimeout(() => {
                localStorage.removeItem('editItem');
                setIsEditingTime(false);
                router.push('/intern/history');
            }, 500);
        } catch (err: any) {
            console.error("Failed to submit correction:", err);
            
            // Extract detailed error from server for 422
            let msg = 'เกิดข้อผิดพลาดในการส่งข้อมูล';
            if (err.response?.data?.message) {
                msg = err.response.message;
            } else if (err.response?.data?.error) {
                msg = err.response.data.error;
            } else if (err.response?.status === 422) {
                // For 422, server usually returns specific field errors
                const details = err.response?.data;
                msg = `ข้อมูลไม่ถูกต้อง: ${typeof details === 'object' ? JSON.stringify(details) : details}`;
            }

            setError(msg);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: msg,
                confirmButtonText: 'ตกลง',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const isSubmitDisabled = !reason.trim();

    return (
        <>
            {/* Desktop View (lg and up) */}
            <div className="hidden lg:block w-full">
                {/* Header */}
                <div className="relative flex items-center justify-center pb-4">
                    <button
                        type="button"
                        onClick={() => setIsEditingTime(false)}
                        className="absolute left-0 text-[#1C1C1C] dark:text-gray-400"
                    >
                        <svg className="w-[22px] h-[22px] stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <div className="text-[22px] font-bold text-[#1C1C1C] dark:text-white tracking-tight">
                        คำขอแก้ไขเวลา
                    </div>
                </div>


                {/* Subheader */}
                <div className="text-[14px] font-bold text-[#1C1C1C] dark:text-gray-400 mb-1 tracking-wide">
                    {selectedHistoryItem?.labelMobile || '15 มกราคม'}
                </div>
                <div className="flex flex-col gap-2 text-[18px] font-bold text-[#1C1C1C] dark:text-white tracking-tight">
                    <div className="text-[20px]">
                        {selectedHistoryItem?.statusType === 'danger' ? 'ขาดงาน' : (selectedHistoryItem?.time || '08:30 - --:--')}
                    </div>

                    {/* Status Badge below time */}
                    <div className="mt-1">
                        {selectedHistoryItem?.status === 'เข้างานปกติ' ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold gap-1.5 border bg-[#E7FAEF] text-[#079455] border-[#079455]">
                                <div className="w-4 h-4 rounded-full bg-[#079455] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                    <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0.5px]">check</span>
                                </div>
                                เข้างานปกติ
                            </div>
                        ) : selectedHistoryItem?.status === 'สาย' || selectedHistoryItem?.statusType === 'warning' ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold gap-1.5 border bg-[#FDF4D6] text-[#FDB022] border-[#FDB022]">
                                <div className="w-4 h-4 rounded-full bg-[#FDB022] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                    <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0.5px]">schedule</span>
                                </div>
                                สาย
                            </div>
                        ) : selectedHistoryItem?.status === 'ขาด' || selectedHistoryItem?.statusType === 'danger' ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold gap-1.5 border bg-[#FCEDED] text-[#EF4444] border-[#EF4444]">
                                <div className="w-4 h-4 rounded-full bg-[#EF4444] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                    <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0.5px]">close</span>
                                </div>
                                ขาด
                            </div>
                        ) : (
                            <div className="w-[100px] h-[26px] px-1 bg-[#F3F4F6] text-[#6B7280] border border-[#6B7280] rounded-full flex items-center gap-1.5 text-[11px] font-bold shrink-0">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                    <span className="material-symbols-rounded !text-[12px] leading-none">
                                        hourglass_disabled
                                    </span>
                                </div>
                                ไม่ลงเวลาออก
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full h-[1px] bg-[#CECFD2] mt-[12px] mb-[20px] relative z-10"></div>

                {/* Form Box */}
                <div className="w-full max-w-[820px] mx-auto min-h-[337px] bg-[#FEFBF6] dark:bg-[#1C1710] border border-[#CECFD2] rounded-[5px] p-4 sm:p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-[2px] text-[#1C1C1C] dark:text-gray-300 text-[15px] mb-4">
                        <span className={`material-symbols-rounded text-[24px] ${(selectedHistoryItem?.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem?.location) 
                             ? "text-[#079455]" : "text-[#FDB022]"}`}>
                            {(selectedHistoryItem?.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem?.location) 
                             ? "apartment" : "globe_location_pin"}
                        </span>
                        {(selectedHistoryItem?.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem?.location) 
                         ? "อยู่ในสถานที่" : "อยู่นอกสถานที่"}
                    </div>

                    {/* เวลาเข้า */}
                    <div className="mb-[14px]">
                        <div className="text-[13px] text-[#828282] font-semibold mb-2">เวลาเข้างาน :</div>
                        <button 
                            type="button"
                            onClick={() => setPickingType('in')}
                            className="w-full max-w-[450px] h-[43px] px-[14px] border border-[#CECFD2] rounded-[5px] text-[15px] bg-white text-[#1C1C1C] font-bold flex items-center justify-between hover:border-[#D1D1D1] transition-all"
                        >
                            <span>{checkInTime || "--:--"}</span>
                            <span className="material-symbols-rounded !text-[20px] text-gray-400">keyboard_arrow_down</span>
                        </button>
                    </div>

                    {/* เวลาออก */}
                    <div className="mb-2">
                        <div className="text-[13px] text-[#828282] font-semibold mb-2">เวลาออกงาน :</div>
                        <button 
                            type="button"
                            onClick={() => setPickingType('out')}
                            className="w-full max-w-[450px] h-[43px] px-[14px] border border-[#CECFD2] rounded-[5px] text-[15px] bg-white text-[#1C1C1C] font-bold flex items-center justify-between hover:border-[#D1D1D1] transition-all"
                        >
                            <span>{checkOutTime || "--:--"}</span>
                            <span className="material-symbols-rounded !text-[20px] text-gray-400">keyboard_arrow_down</span>
                        </button>
                    </div>

                    {/* หมายเหตุ */}
                    <div className="text-[13px] text-[#EF4444] font-medium leading-[1.6]">
                        *ชั่วโมงคำนวณจากเวลาทำงานจริง สูงสุดไม่เกิน 7 ชั่วโมง (ไม่ร่วมเวลาพักเที่ยง 1 ชั่วโมง)
                    </div>
                    {/* สรุปชั่วโมง */}
                    <div className="mt-3 mb-[18px]">
                        <div className="text-[13px] font-bold text-[#828282]">
                            ชั่วโมงที่เข้าทำงาน : {(selectedHistoryItem?.workingHours && selectedHistoryItem?.workingHours !== "-" && selectedHistoryItem?.workingHours !== "0 ชั่วโมง") ? selectedHistoryItem.workingHours : "7 ชั่วโมง"}
                        </div>
                    </div>

                    {/* เหตุผล */}
                    <div className="mb-4">
                        <div className="text-[15px] text-[#1C1C1C] mb-2 flex items-center gap-1">
                            เหตุผลการแก้ไขเวลา :
                        </div>
                        <textarea
                            rows={1}
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (e.target.value.trim()) setError(null);
                            }}
                            className={`w-full max-w-[450px] min-h-[43px] px-[14px] py-[10px] border ${error ? 'border-red-500 bg-red-50/10' : 'border-[#CECFD2]'} rounded-[5px] text-[15px] bg-white text-[#1C1C1C] font-bold focus:outline-none focus:border-[#D1D1D1] transition-all resize-none overflow-hidden`}
                        />
                        {error && <div className="text-red-500 text-[12px] mt-1 font-bold">{error}</div>}
                    </div>

                    {/* ไฟล์แนบ Desktop */}
                    <div>
                        <div className="text-[15px] text-[#1C1C1C]  mb-2 flex items-center gap-2">
                            ไฟล์แนบ (ถ้ามี)
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*, .pdf, .doc, .docx"
                        />
                        <div
                            onClick={triggerFileSelect}
                            className="w-full max-w-[450px] h-[120px] border-2 border-dashed border-[#CECFD2] rounded-[8px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <IconCloudDownload className="w-6 h-6 text-[#A0A0A0]" />
                            </div>
                            <div className="text-[12px] text-[#A80689] font-bold">
                                {selectedFile ? (
                                    <span className="text-green-600">เลือกไฟล์แล้ว: {selectedFile.name}</span>
                                ) : (
                                    <>
                                        คลิกเพื่ออัปโหลด <span className="text-[#A0A0A0] font-normal">ขนาดไฟล์ไม่เกิน 5 MB</span>
                                        <div className="text-[#A0A0A0] font-normal mt-0.5 text-[11px]">(ประเภทไฟล์ที่รองรับ: .pdf, .jpg, .jpeg, .png)</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons Desktop */}
                <div className="flex justify-center items-center gap-4 mt-[32px] mb-[40px]">
                    <button
                        type="button"
                        onClick={() => setIsEditingTime(false)}
                        className="w-full max-w-[180px] py-[11px] bg-white border border-[#A80689] text-[#A80689] hover:bg-gray-50 transition-colors rounded-lg font-bold text-[15px] shadow-sm"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                            if (!reason.trim()) {
                                setError('กรุณากรอกหมายเหตุ');
                                return;
                            }
                            setShowConfirm(true);
                        }}
                        className={`w-full max-w-[180px] py-[11px] ${isSubmitDisabled || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#A80689] hover:bg-[#8F0574]'} transition-colors text-white rounded-lg font-bold text-[15px] shadow-sm flex items-center justify-center`}
                    >
                        {isLoading ? (
                             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'ส่งคำขอ'}
                    </button>
                </div>
            </div>

            {/* Mobile View (Small to Medium screens) */}
            <div className="lg:hidden w-full flex flex-col gap-4 h-auto">
                {/* Header (No longer Sticky) */}
                <div 
                    className="relative flex items-center justify-center py-2 mb-2 touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <button
                        type="button"
                        onClick={() => setIsEditingTime(false)}
                        className="absolute left-0 text-[#1C1C1C]"
                    >
                        <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <div className="text-[20px] font-bold text-[#1C1C1C]">
                        คำขอแก้ไขเวลา
                    </div>
                </div>

                {/* Card 1: Status Summary (Vertical Layout) */}
                <div className="bg-white rounded-[16px] border border-[#CECFD2] p-5 shadow-sm space-y-2">
                    <div className="text-[15px] text-gray-800 dark:text-gray-200">{selectedHistoryItem?.labelMobile || '1 มกราคม 2569'}</div>
                    <div className="text-[17px] font-bold text-gray-900 dark:text-gray-100">
                        {selectedHistoryItem?.statusType === 'danger' ? 'ขาดงาน' : (selectedHistoryItem?.time || '08:30 - --:--')}
                    </div>

                    {/* Status Badge below time */}
                    <div className="mt-1">
                        {selectedHistoryItem?.status === 'เข้างานปกติ' ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold gap-1.5 border bg-[#E7FAEF] text-[#079455] border-[#079455]">
                                <div className="w-4 h-4 rounded-full bg-[#079455] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                    <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none text-white translate-x-[0.5px]">check</span>
                                </div>
                                เข้างานปกติ
                            </div>
                        ) : selectedHistoryItem?.status === 'สาย' || selectedHistoryItem?.statusType === 'warning' ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold gap-1.5 border bg-[#FDF4D6] text-[#FDB022] border-[#FDB022]">
                                <div className="w-4 h-4 rounded-full bg-[#FDB022] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                    <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0.5px]">schedule</span>
                                </div>
                                สาย
                            </div>
                        ) : selectedHistoryItem?.status === 'ขาด' || selectedHistoryItem?.statusType === 'danger' ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold gap-1.5 border bg-[#FCEDED] text-[#EF4444] border-[#EF4444]">
                                <div className="w-4 h-4 rounded-full bg-[#EF4444] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                    <span className="material-symbols-rounded !text-[12px] flex items-center justify-center leading-none translate-x-[0.5px]">close</span>
                                </div>
                                ขาด
                            </div>
                        ) : (
                            <div className="w-[100px] h-[26px] px-1 bg-[#F3F4F6] text-[#6B7280] border border-[#6B7280] rounded-full flex items-center gap-1.5 text-[11px] font-bold shrink-0">
                                <div className="w-[18px] h-[18px] rounded-full bg-[#6B7280] flex items-center justify-center text-white shrink-0 shadow-sm overflow-hidden">
                                    <span className="material-symbols-rounded !text-[12px] leading-none">
                                        hourglass_disabled
                                    </span>
                                </div>
                                ไม่ลงเวลาออก
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 2: Form */}
                <div className="bg-white rounded-[16px] border border-[#CECFD2] p-5 shadow-sm flex flex-col gap-5">
                    {/* Form Title (Updated Magenta Theme) */}
                    <div className="flex items-center gap-3 text-[#A80689] font-bold text-[16px]">
                          <div className="w-7 h-7 bg-[#A80689] rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                            <span className="material-symbols-rounded !text-[20px] text-white">
                              calendar_clock
                            </span>
                          </div>
                        คำขอแก้ไขเวลา
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-[#1C1C1C] text-[15px]">
                        <span className={`material-symbols-rounded text-[24px] ${(selectedHistoryItem?.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem?.location) 
                             ? "text-[#079455]" : "text-[#FDB022]"}`}>
                            {(selectedHistoryItem?.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem?.location) 
                             ? "apartment" : "globe_location_pin"}
                        </span>
                        {(selectedHistoryItem?.location === "กฟภ. สำนักงานใหญ่" || !selectedHistoryItem?.location) 
                         ? "อยู่ในสถานที่" : "อยู่นอกสถานที่"}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[14px] text-[#828282] font-bold mb-2">เวลาเข้างาน</div>
                            <button 
                                type="button"
                                onClick={() => setPickingType('in')}
                                className="w-full h-[48px] px-4 border border-[#CECFD2] rounded-[8px] text-[16px] bg-[#F8F9FA] text-[#1C1C1C] font-bold flex items-center justify-between"
                            >
                                <span>{checkInTime || "--:--"}</span>
                                <span className="material-symbols-rounded !text-[20px] text-gray-400">keyboard_arrow_down</span>
                            </button>
                        </div>
                        <div>
                            <div className="text-[14px] text-[#828282] font-bold mb-2">เวลาออกงาน</div>
                            <button 
                                type="button"
                                onClick={() => setPickingType('out')}
                                className="w-full h-[48px] px-4 border border-[#CECFD2] rounded-[8px] text-[16px] bg-[#F8F9FA] text-[#1C1C1C] font-bold flex items-center justify-between"
                            >
                                <span>{checkOutTime || "--:--"}</span>
                                <span className="material-symbols-rounded !text-[20px] text-gray-400">keyboard_arrow_down</span>
                            </button>
                        </div>
                    </div>

                    {/* Instruction Text (No Icon) */}
                    <div className="text-[13px] text-[#EF4444] font-medium leading-[1.6]">
                        *ชั่วโมงคำนวณจากเวลาทำงานจริง สูงสุดไม่เกิน 7 ชั่วโมง (ไม่ร่วมเวลาพักเที่ยง 1 ชั่วโมง)
                    </div>

                    {/* Result Text */}
                    <div className="text-[15px] font-bold text-gray-800">
                        ชั่วโมงที่เข้าทำงาน : {(selectedHistoryItem?.workingHours && selectedHistoryItem?.workingHours !== "-" && selectedHistoryItem?.workingHours !== "0 ชั่วโมง") ? selectedHistoryItem.workingHours : "7 ชั่วโมง"}
                    </div>

                    {/* Reason Section */}
                    <div className="flex flex-col gap-2">
                        <div className="text-[15px] text-gray-800">
                            เหตุผลการแก้ไขเวลา
                        </div>
                        <textarea
                            rows={1}
                            placeholder="ระบุเหตุผล"
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (e.target.value.trim()) setError(null);
                            }}
                            className={`w-full min-h-[48px] px-4 py-3 border ${error ? 'border-red-500 bg-red-50/10' : 'border-[#CECFD2]'} rounded-[8px] text-[16px] bg-[#F8F9FA] text-[#1C1C1C] font-bold focus:outline-none resize-none`}
                        />
                        {error && <div className="text-red-500 text-[13px] mt-1 font-bold">{error}</div>}
                    </div>

                    {/* ไฟล์แนบ Mobile */}
                    <div className="flex flex-col gap-2">
                        <div className="text-[15px] text-gray-800">
                            ไฟล์แนบ (ถ้ามี)
                        </div>
                        <div
                            onClick={triggerFileSelect}
                            className="w-full h-[140px] border-2 border-dashed border-[#CECFD2] rounded-[12px] flex flex-col items-center justify-center gap-2 cursor-pointer bg-white"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <IconCloudDownload className="w-7 h-7 text-[#A0A0A0]" />
                            </div>
                            <div className="text-[14px] text-[#A80689] font-bold text-center px-4">
                                {selectedFile ? (
                                    <span className="text-green-600">เลือกไฟล์แล้ว: {selectedFile.name}</span>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <span>คลิกเพื่ออัปโหลด <span className="text-[#A0A0A0] font-normal text-[12px]">ขนาดไฟล์ไม่เกิน 5 MB</span></span>
                                        <span className="text-[#A0A0A0] font-normal text-[11px] mt-1">(ประเภทไฟล์ที่รองรับ: .pdf, .jpg, .jpeg, .png)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons Mobile */}
                <div className="flex flex-col gap-3 pb-8 px-4">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                            if (!reason.trim()) {
                                setError('กรุณากรอกหมายเหตุ');
                                return;
                            }
                            setShowConfirm(true);
                        }}
                        className={`w-full py-3.5 ${isSubmitDisabled || isLoading ? 'bg-gray-400' : 'bg-[#A80689]'} text-white rounded-[12px] font-bold text-[16px] shadow-sm`}
                    >
                         {isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งคำขอแก้ไขเวลา'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsEditingTime(false)}
                        className="w-full py-3.5 bg-white border border-[#A80689] text-[#A80689] rounded-[12px] font-bold text-[16px] shadow-sm"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>

            {/* ✅ Modal via Portal */}
            {mounted && showConfirm &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] lg:pl-[260px]">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-2xl p-8 w-[320px] text-center flex flex-col items-center mx-4 border border-white/20">
                            <div className="mb-6 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#DCFAE6] shadow-sm">
                                <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#17B26A] text-white">
                                    <span className="material-symbols-rounded !text-[24px]">check</span>
                                </div>
                            </div>
                            <h3 className="text-[20px] font-bold mb-8 text-[#1C1C1C] dark:text-white">
                                ยืนยันส่งคำขอ
                            </h3>

                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-3 bg-white border border-[#1C1C1C] rounded-[14px] text-[15px] font-bold text-[#1C1C1C] hover:bg-gray-50 transition-colors"
                                >
                                    ย้อนกลับ
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className={`flex-1 py-3 ${isLoading ? 'bg-gray-400' : 'bg-[#11A75C] hover:bg-[#0E8F4D]'} text-white rounded-[14px] text-[15px] font-bold flex items-center justify-center transition-colors shadow-md`}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : 'ยืนยัน'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* ✅ Success Modal via Portal */}
            {mounted && showSuccess &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] lg:pl-[260px]">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-2xl p-10 w-[300px] text-center flex flex-col items-center mx-4 border border-white/20">
                            <div className="mb-6 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#DCFAE6] shadow-sm">
                                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#17B26A] text-white">
                                    <span className="material-symbols-rounded !text-[32px]">check</span>
                                </div>
                            </div>
                            <h3 className="text-[22px] font-bold text-[#1C1C1C] dark:text-white">
                                ส่งคำขอเรียบร้อยแล้ว
                            </h3>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* ✅ Time Picker Modal */}
            <TimeWheelPicker 
                isOpen={!!pickingType}
                initialTime={pickingType === 'in' ? checkInTime : checkOutTime}
                onConfirm={(time) => {
                    if (pickingType === 'in') setCheckInTime(time);
                    if (pickingType === 'out') setCheckOutTime(time);
                    setPickingType(null);
                }}
                onClose={() => setPickingType(null)}
            />
        </>
    );
};

export default EditTimeForm;