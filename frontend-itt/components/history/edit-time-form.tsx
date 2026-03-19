'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import IconMapPin from '@/components/icon/icon-map-pin';
import IconFile from '@/components/icon/icon-file';
import IconClock from '@/components/icon/icon-clock';
import IconX from '@/components/icon/icon-x';

interface EditTimeFormProps {
    selectedHistoryItem: any;
    setIsEditingTime: (val: boolean) => void;
}

const EditTimeForm: React.FC<EditTimeFormProps> = ({ selectedHistoryItem, setIsEditingTime }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = () => {
        setShowConfirm(false);
        setIsEditingTime(false);
    };

    return (
        <>
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

            {/* Top Right Badge */}
            <div className="flex justify-end mb-[6px] pr-1">
                <div className="inline-flex items-center px-4 py-[6px] bg-[#E2F7EB] text-[#11A75C] rounded-full text-[12px] font-bold">
                    อนุมัติการลา
                </div>
            </div>

            {/* Subheader */}
            <div className="text-[14px] font-bold text-[#1C1C1C] dark:text-gray-400 mb-1 tracking-wide">
                {selectedHistoryItem?.labelMobile || '15 มกราคม'}
            </div>
            <div className="flex flex-col gap-2 text-[18px] font-bold text-[#1C1C1C] dark:text-white tracking-tight">
                <div className="text-[20px]">{selectedHistoryItem?.time || 'เวลาทำงาน 08:30 - --:--'}</div>
                
                {/* Status Badge below time */}
                <div>
                    <div className="inline-flex items-center px-3 py-1 bg-[#F5F5F5] text-[#6B7280] border border-[#E5E7EB] rounded-full text-[12px] font-semibold gap-1.5 mt-1">
                        <div className="w-[18px] h-[18px] rounded-full bg-[#9CA3AF] flex items-center justify-center text-white relative overflow-hidden">
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" />
                            </svg>
                            <div className="absolute w-[20px] h-[1.5px] bg-white rotate-[-45deg]"></div>
                        </div>
                        ไม่ลงเวลาออก
                    </div>
                </div>
            </div>

            <div className="w-full h-[2px] bg-[#CECFD2] -mt-[8px] mb-[8px] relative z-10"></div>

            {/* Form Box */}
            <div className="w-full max-w-[820px] mx-auto min-h-[337px] bg-[#FEFBF6] dark:bg-[#1C1710] border border-[#ECECED] rounded-[5px] p-4 sm:p-6 shadow-sm flex flex-col justify-between">
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
                            defaultValue="08:30"
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
                            defaultValue="16:30"
                            className="w-full h-[43px] px-[14px] pr-10 border border-[#CECFD2] rounded-[5px] text-[15px] bg-white text-[#1C1C1C] font-bold focus:outline-none focus:border-[#D1D1D1] transition-all"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#6F6F6F]">
                            <IconX className="w-[14px] h-[14px]" />
                        </button>
                    </div>
                </div>

                {/* หมายเหตุ */}
                <div className="text-[11px] text-[#A0A0A0] font-medium leading-[1.6]">
                    ชั่วโมงที่เข้าทำงานคำนวณจากเวลาทำงานจริง สูงสุดไม่เกิน 7 ชั่วโมง (ไม่รวมเวลาพักเที่ยง 1 ชั่วโมง) <span className="text-[#EF4444]">*</span>
                </div>

                {/* สรุปชั่วโมง */}
                <div className="mt-3 mb-[18px]">
                    <div className="text-[13px] font-bold text-[#828282]">
                        ชั่วโมงที่เข้าทำงาน : 7 ชั่วโมง
                    </div>
                </div>

                {/* เหตุผล */}
                <div>
                    <div className="text-[13px] text-[#828282] font-semibold mb-2">เหตุผลการแก้ไขเวลา :</div>
                    <textarea
                        rows={1}
                        defaultValue="ลืมกดลงเวลาออก"
                        className="w-full max-w-[450px] min-h-[43px] px-[14px] py-[10px] border border-[#CECFD2] rounded-[5px] text-[15px] bg-white text-[#1C1C1C] font-bold focus:outline-none focus:border-[#D1D1D1] transition-all resize-none overflow-hidden"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-[32px] mb-2">
                <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="w-full max-w-[280px] py-[11px] bg-[#A80689] hover:bg-[#8F0574] transition-colors text-white rounded-lg font-bold text-[15px]"
                >
                    ส่งคำขอ
                </button>
            </div>

            {/* ✅ Modal via Portal */}
            {mounted && showConfirm &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 lg:pl-[260px]">
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 w-[280px] text-center">
                            <h3 className="text-base font-bold mb-6">
                                ส่งคำขอถึงพี่เลี้ยง
                            </h3>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2 border rounded-lg"
                                >
                                    ยกเลิก
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-2 bg-[#A80689] text-white rounded-lg"
                                >
                                    ยืนยัน
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>
    );
};

export default EditTimeForm;