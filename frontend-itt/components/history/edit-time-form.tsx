'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import IconMapPin from '@/components/icon/icon-map-pin';
import IconFile from '@/components/icon/icon-file';
import IconClock from '@/components/icon/icon-clock';
import IconXCircle from '@/components/icon/icon-x-circle';
import IconX from '@/components/icon/icon-x';
import IconClipboardText from '@/components/icon/icon-clipboard-text';
import IconPaperclip from '@/components/icon/icon-paperclip';
import IconCalendarClock from '@/components/icon/icon-calendar-clock';
import IconCloudDownload from '@/components/icon/icon-cloud-download';
import IconSend from '@/components/icon/icon-send';

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
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [reason, setReason] = useState(selectedHistoryItem?.reqReason || "ลืมกดลงเวลาออก");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError('กรุณากรอกหมายเหตุ');
            return;
        }
        setError(null);
        setShowConfirm(false);
        setShowSuccess(true);

        // Auto close or redirect
        setTimeout(() => {
            setShowSuccess(false);
            setIsEditingTime(false);
        }, 2000);
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
                        {selectedHistoryItem?.statusType === 'danger' ? 'ขาดงาน' : (selectedHistoryItem?.time || 'เวลาทำงาน 08:30 - --:--')}
                    </div>

                    {/* Status Badge below time */}
                    <div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-bold gap-2 border ${
                            selectedHistoryItem?.status === 'เข้างานปกติ' ? 'bg-[#E7FAEF] text-[#10B981] border-[#10B981]' :
                            selectedHistoryItem?.status === 'สาย' || selectedHistoryItem?.statusType === 'warning' ? 'bg-[#FDF4D6] text-[#F59E0B] border-[#F59E0B]' :
                            selectedHistoryItem?.status === 'ขาด' || selectedHistoryItem?.statusType === 'danger' ? 'bg-[#FCEDED] text-[#EF4444] border-[#EF4444]' :
                            selectedHistoryItem?.status === 'ลา' ? 'bg-[#EEF8FF] text-[#3B82F6] border-[#3B82F6]' :
                            'bg-[#F3F4F6] text-[#6B7280] border-[#6B7280]'
                        }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ${
                                selectedHistoryItem?.status === 'เข้างานปกติ' ? 'bg-[#10B981]' :
                                selectedHistoryItem?.status === 'สาย' || selectedHistoryItem?.statusType === 'warning' ? 'bg-[#F59E0B]' :
                                selectedHistoryItem?.status === 'ขาด' || selectedHistoryItem?.statusType === 'danger' ? 'bg-[#EF4444]' :
                                selectedHistoryItem?.status === 'ลา' ? 'bg-[#3B82F6]' :
                                'bg-[#6B7280]'
                            }`}>
                                {selectedHistoryItem?.status === 'เข้างานปกติ' ? (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                ) : selectedHistoryItem?.status === 'สาย' || selectedHistoryItem?.statusType === 'warning' ? (
                                    <IconClock className="w-3 h-3 text-white" />
                                ) : selectedHistoryItem?.status === 'ขาด' || selectedHistoryItem?.statusType === 'danger' ? (
                                    <IconX className="w-2.5 h-2.5 text-white" />
                                ) : selectedHistoryItem?.status === 'ลา' ? (
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 2H18C19.1 2 20 2.9 20 4V15.5L15.5 20H6C4.9 20 4 19.1 4 18V4C4 2.9 4.9 2 6 2Z" fill="white"/>
                                        <rect x="8" y="7" width="8" height="2" rx="1" fill="#3B82F6"/>
                                        <rect x="8" y="11" width="8" height="2" rx="1" fill="#3B82F6"/>
                                        <path d="M15.5 20V17C15.5 16.1716 16.1716 15.5 17 15.5H20L15.5 20Z" fill="#3B82F6"/>
                                    </svg>
                                ) : (
                                    <div className="relative w-3 h-3 flex items-center justify-center">
                                        <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                                            <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                                        </svg>
                                        <div className="absolute w-[12px] h-[1.5px] bg-white rotate-[-45deg]"></div>
                                    </div>
                                )}
                            </div>
                            {selectedHistoryItem?.statusType === 'danger' ? 'ขาด' : (selectedHistoryItem?.status || 'ไม่ลงเวลาออก')}
                        </div>
                    </div>
                </div>

                <div className="w-full h-[1px] bg-[#CECFD2] mt-[12px] mb-[20px] relative z-10"></div>

                {/* Form Box */}
                <div className="w-full max-w-[820px] mx-auto min-h-[337px] bg-[#FEFBF6] dark:bg-[#1C1710] border border-[#CECFD2] rounded-[5px] p-4 sm:p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-[6px] text-[#1C1C1C] dark:text-gray-300 font-bold text-[15px] mb-4">
                        <IconMapPin className="w-5 h-5 text-[#1C1C1C] stroke-[1.5]" />
                        อยู่ในสถานที่
                    </div>

                    {/* เวลาเข้า */}
                    <div className="mb-[14px]">
                        <div className="text-[13px] text-[#828282] font-semibold mb-2">เวลาเข้างาน :</div>
                        <div className="relative w-full max-w-[450px]">
                            <input
                                type="text"
                                defaultValue={selectedHistoryItem?.checkInTime || "08:30"}
                                className="w-full h-[43px] px-[14px] pr-10 border border-[#CECFD2] rounded-[5px] text-[15px] bg-white text-[#1C1C1C] font-bold focus:outline-none focus:border-[#D1D1D1] transition-all"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#6F6F6F]">
                                <IconX className="w-[14px] h-[14px]" />
                            </button>
                        </div>
                    </div>

                    {/* เวลาออก */}
                    <div className="mb-2">
                        <div className="text-[13px] text-[#828282] font-semibold mb-2">เวลาออกงาน :</div>
                        <div className="relative w-full max-w-[450px]">
                            <input
                                type="text"
                                defaultValue={(selectedHistoryItem?.status === "ไม่ลงเวลาออก" || selectedHistoryItem?.checkOutTime === "ไม่ลงเวลา") ? "ไม่ลงเวลา" : (selectedHistoryItem?.checkOutTime || "16:30")}
                                className="w-full h-[43px] px-[14px] pr-10 border border-[#CECFD2] rounded-[5px] text-[15px] bg-white text-[#1C1C1C] font-bold focus:outline-none focus:border-[#D1D1D1] transition-all"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#6F6F6F]">
                                <IconX className="w-[14px] h-[14px]" />
                            </button>
                        </div>
                    </div>

                    {/* หมายเหตุ */}
                    <div className="text-[11px] text-[#A0A0A0] font-medium leading-[1.6]">
                        ชั่วโมงที่เข้าทำงานคำนวณจากเวลาทำงานจริง สูงสุดไม่เกิน 7 ชั่วโมง (ไม่ร่วมเวลาพักเที่ยง 1 ชั่วโมง) <span className="text-[#EF4444]">*</span>
                    </div>

                    {/* สรุปชั่วโมง */}
                    <div className="mt-3 mb-[18px]">
                        <div className="text-[13px] font-bold text-[#828282]">
                            ชั่วโมงที่เข้าทำงาน : {selectedHistoryItem?.status === "ไม่ลงเวลาออก" ? "0 ชั่วโมง" : (selectedHistoryItem?.workingHours || "7 ชั่วโมง")}
                        </div>
                    </div>

                    {/* เหตุผล */}
                    <div className="mb-4">
                        <div className="text-[13px] text-[#828282] font-semibold mb-2 flex items-center gap-2">
                             <IconClipboardText className="w-5 h-5 text-[#1C1C1C]" />
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
                        <div className="text-[13px] text-[#828282] font-semibold mb-2 flex items-center gap-2">
                            <IconPaperclip className="w-5 h-5 text-[#1C1C1C]" />
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
                                    <>คลิกเพื่ออัปโหลด <span className="text-[#A0A0A0] font-normal">ขนาดไฟล์ไม่เกิน 5 MB</span></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-[32px] mb-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (!reason.trim()) {
                                setError('กรุณากรอกหมายเหตุ');
                                return;
                            }
                            setShowConfirm(true);
                        }}
                        className={`w-full max-w-[280px] py-[11px] ${isSubmitDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#A80689] hover:bg-[#8F0574]'} transition-colors text-white rounded-lg font-bold text-[15px]`}
                    >
                        ส่งคำขอ
                    </button>
                </div>
            </div>

            {/* Mobile View (Small to Medium screens) */}
            <div className="lg:hidden w-full flex flex-col gap-4 h-full min-h-[70vh]">
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

                {/* Card 1: Status Summary */}
                <div className="bg-white rounded-[16px] border border-[#CECFD2] p-5 shadow-sm">
                    <div className="text-[15px] font-bold text-gray-900 mb-1">{selectedHistoryItem?.labelMobile || '1 มกราคม 2569'}</div>
                    <div className="text-[17px] font-bold text-gray-900 mb-3 tracking-tight">
                        {selectedHistoryItem?.statusType === 'danger' ? 'ขาดงาน' : (selectedHistoryItem?.time || 'เวลาทำงาน 08:30 - --:--')}
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold gap-2 border ${
                            selectedHistoryItem?.status === 'เข้างานปกติ' ? 'bg-[#E7FAEF] text-[#10B981] border-[#10B981]' :
                            selectedHistoryItem?.status === 'สาย' || selectedHistoryItem?.statusType === 'warning' ? 'bg-[#FDF4D6] text-[#F59E0B] border-[#F59E0B]' :
                            selectedHistoryItem?.status === 'ขาด' || selectedHistoryItem?.statusType === 'danger' ? 'bg-[#FCEDED] text-[#EF4444] border-[#EF4444]' :
                            selectedHistoryItem?.status === 'ลา' ? 'bg-[#EEF8FF] text-[#3B82F6] border-[#3B82F6]' :
                            'bg-[#F3F4F6] text-[#6B7280] border-[#6B7280]'
                        }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ${
                            selectedHistoryItem?.status === 'เข้างานปกติ' ? 'bg-[#10B981]' :
                            selectedHistoryItem?.status === 'สาย' || selectedHistoryItem?.statusType === 'warning' ? 'bg-[#F59E0B]' :
                            selectedHistoryItem?.status === 'ขาด' || selectedHistoryItem?.statusType === 'danger' ? 'bg-[#EF4444]' :
                            selectedHistoryItem?.status === 'ลา' ? 'bg-[#3B82F6]' :
                            'bg-[#6B7280]'
                        }`}>
                            {selectedHistoryItem?.status === 'เข้างานปกติ' ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                </svg>
                            ) : selectedHistoryItem?.status === 'สาย' || selectedHistoryItem?.statusType === 'warning' ? (
                                <IconClock className="w-3 h-3 text-white" />
                            ) : selectedHistoryItem?.status === 'ขาด' || selectedHistoryItem?.statusType === 'danger' ? (
                                <IconX className="w-2.5 h-2.5 text-white" />
                            ) : selectedHistoryItem?.status === 'ลา' ? (
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 2H18C19.1 2 20 2.9 20 4V15.5L15.5 20H6C4.9 20 4 19.1 4 18V4C4 2.9 4.9 2 6 2Z" fill="white"/>
                                    <rect x="8" y="7" width="8" height="2" rx="1" fill="#3B82F6"/>
                                    <rect x="8" y="11" width="8" height="2" rx="1" fill="#3B82F6"/>
                                    <path d="M15.5 20V17C15.5 16.1716 16.1716 15.5 17 15.5H20L15.5 20Z" fill="#3B82F6"/>
                                </svg>
                            ) : (
                                <div className="relative w-3 h-3 flex items-center justify-center">
                                    <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                                        <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                                    </svg>
                                    <div className="absolute w-[12px] h-[1.5px] bg-white rotate-[-45deg]"></div>
                                </div>
                            )}
                        </div>
                        {selectedHistoryItem?.statusType === 'danger' ? 'ขาด' : (selectedHistoryItem?.status || 'ไม่ลงเวลาออก')}
                    </div>
                </div>

                {/* Card 2: Form */}
                <div className="bg-white rounded-[16px] border border-[#CECFD2] p-5 shadow-sm flex flex-col gap-5">
                    {/* Form Title */}
                    <div className="flex items-center gap-3 text-[#A80689] font-bold text-[16px]">
                        <div className="w-8 h-8 rounded-full bg-[#A80689] flex items-center justify-center text-white">
                            <IconCalendarClock className="w-5 h-5" />
                        </div>
                        คำขอแก้ไขเวลา
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3 text-[#1C1C1C] font-bold text-[15px]">
                        <IconMapPin className="w-6 h-6 text-[#1C1C1C]" />
                        อยู่ในสถานที่
                    </div>

                    {/* Time Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[14px] text-[#828282] font-bold mb-2">เวลาเข้างาน</div>
                            <div className="relative">
                                <input
                                    type="text"
                                    defaultValue={selectedHistoryItem?.checkInTime || "08:30"}
                                    className="w-full h-[48px] px-4 border border-[#CECFD2] rounded-[8px] text-[16px] bg-[#F8F9FA] text-[#1C1C1C] font-bold focus:outline-none"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]">
                                    <IconX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="text-[14px] text-[#828282] font-bold mb-2">เวลาออกงาน</div>
                            <div className="relative">
                                <input
                                    type="text"
                                    defaultValue={(selectedHistoryItem?.status === "ไม่ลงเวลาออก" || selectedHistoryItem?.checkOutTime === "ไม่ลงเวลา") ? "ไม่ลงเวลา" : (selectedHistoryItem?.checkOutTime || "16:30")}
                                    className="w-full h-[48px] px-4 border border-[#CECFD2] rounded-[8px] text-[16px] bg-[#F8F9FA] text-[#1C1C1C] font-bold focus:outline-none"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]">
                                    <IconX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instruction Text */}
                    <div className="text-[13px] text-[#EF4444] font-medium leading-[1.6] flex items-start gap-2">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            <circle cx="12" cy="16" r="1" fill="currentColor" />
                        </svg>
                        <span>ชั่วโมงคำนวณจากเวลาทำงานจริง สูงสุดไม่เกิน 7 ชั่วโมง (ไม่ร่วมเวลาพักเที่ยง 1 ชั่วโมง)</span>
                    </div>

                    {/* Result Text */}
                    <div className="text-[15px] font-bold text-gray-800">
                        ชั่วโมงที่เข้าทำงาน : {selectedHistoryItem?.status === "ไม่ลงเวลาออก" ? "0 ชั่วโมง" : (selectedHistoryItem?.workingHours || "7 ชั่วโมง")}
                    </div>

                    {/* Reason Section */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-gray-500 font-bold text-[15px]">
                            <IconClipboardText className="w-6 h-6 text-[#1C1C1C]" />
                            เหตุผลการแก้ไขเวลา
                        </div>
                        <textarea
                            rows={1}
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
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-gray-500 font-bold text-[15px]">
                            <IconPaperclip className="w-6 h-6 text-[#1C1C1C]" />
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
                                    <>คลิกเพื่ออัปโหลด <span className="text-[#A0A0A0] font-normal text-[12px]">ขนาดไฟล์ไม่เกิน 5 MB</span></>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button Mobile */}
                <div className="flex-grow flex items-center justify-center pt-10 pb-16">
                    <button
                        type="button"
                        onClick={() => {
                            if (!reason.trim()) {
                                setError('กรุณากรอกหมายเหตุ');
                                return;
                            }
                            setShowConfirm(true);
                        }}
                        className={`w-full py-4 ${isSubmitDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#A80689] hover:bg-[#8F0574]'} transition-colors text-white rounded-[12px] font-bold text-[17px] flex items-center justify-center gap-3 shadow-lg ${isSubmitDisabled ? '' : 'shadow-purple-200'}`}
                    >
                        <IconSend className="w-5 h-5" />
                        ส่งคำขอแก้ไขเวลา
                    </button>
                </div>
            </div>

            {/* ✅ Modal via Portal */}
            {mounted && showConfirm &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 lg:pl-[260px]">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl p-6 w-[290px] text-center flex flex-col items-center mx-4">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#11A75C] text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold mb-5 text-gray-800 dark:text-white">
                                ยืนยันส่งคำขอแก้ไขเวลา
                            </h3>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                                >
                                    ย้อนกลับ
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-2.5 bg-[#11A75C] hover:bg-[#0E8F4D] text-white rounded-xl text-sm font-bold"
                                >
                                    ยืนยัน
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
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 lg:pl-[260px]">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl p-8 w-[280px] text-center flex flex-col items-center mx-4">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#11A75C] text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                ส่งคำขอแก้ไขเวลาสำเร็จ
                            </h3>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>
    );
};

export default EditTimeForm;