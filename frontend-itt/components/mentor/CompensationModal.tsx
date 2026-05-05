'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '@/api/axios';
import ImageWithAuth from '@/components/ImageWithAuth';
import Swal from 'sweetalert2';

interface CompensationModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    studentNickname?: string;
    studentPosition?: string;
    studentGender?: string;
    profileImg?: string;
    periodEndDate?: string;
    accumulatedHours: number;
    totalHoursGoal: number;
    totalExtendedHours?: number;
    onSuccess?: () => void;
}

const CompensationModal = ({
    isOpen,
    onClose,
    studentId,
    studentName,
    studentNickname,
    studentPosition,
    studentGender,
    profileImg,
    periodEndDate,
    accumulatedHours,
    totalHoursGoal,
    onSuccess
}: CompensationModalProps) => {
    const defaultMissing = Math.ceil(Math.max(0, (totalHoursGoal || 0) - (accumulatedHours || 0)));
    const [hours, setHours] = useState<string>(defaultMissing.toString());

    useEffect(() => {
        if (isOpen) {
            setHours(defaultMissing.toString());
        }
    }, [isOpen, defaultMissing]);

    if (!isOpen) return null;

    const parsedHours = parseFloat(hours) || 0;
    const days = Math.ceil(parsedHours / 7);
    const isExceedMax = parsedHours > defaultMissing;

    // Calculate new end date (skipping weekends)
    let endDate = periodEndDate ? new Date(periodEndDate) : new Date();
    let added = 0;
    while (added < days) {
        endDate.setDate(endDate.getDate() + 1);
        if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
            added++;
        }
    }

    const thaiEndDate = endDate.toLocaleDateString('th-TH', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    const formatOrigEnd = periodEndDate ? new Date(periodEndDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

    // Calculate remaining days for original end date (excluding weekends)
    const now = new Date();
    const origEnd = periodEndDate ? new Date(periodEndDate) : new Date();
    
    let remainDays = 0;
    let tempDate = new Date(now);
    tempDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(origEnd);
    targetDate.setHours(0, 0, 0, 0);

    while (tempDate <= targetDate) {
        const day = tempDate.getDay();
        if (day !== 0 && day !== 6) {
            remainDays++;
        }
        tempDate.setDate(tempDate.getDate() + 1);
    }
    remainDays = Math.max(0, remainDays);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-[700px] mx-4 p-7" onClick={e => e.stopPropagation()}>
                {/* Header Profile */}
                <div className="flex items-center gap-4 mb-6">
                    <ImageWithAuth
                        userId={studentId}
                        imageKey={profileImg}
                        className="w-16 h-16 rounded-full object-cover border border-gray-100 shrink-0"
                        fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(studentName || '')}&background=random`}
                    />
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">
                            {(() => {
                                const mainName = studentName || '';
                                const nick = studentNickname;
                                const genderLabel = (studentGender === 'M' || studentGender === 'ชาย') ? '(ชาย)' : (studentGender === 'F' || studentGender === 'หญิง') ? '(หญิง)' : '';

                                return (
                                    <>
                                        {mainName}
                                        {nick && (
                                            <span className="text-[#000000] font-bold ml-2">({nick})</span>
                                        )}
                                        {genderLabel && <span className="ml-2 font-normal text-gray-500">{genderLabel}</span>}
                                    </>
                                );
                            })()}
                        </h2>
                        <p className="text-[#61646C] text-[14px] mt-0.5">{studentPosition || 'นักศึกษาฝึกงาน'}</p>
                    </div>
                </div>

                {/* Two Cards */}
                <div className="flex gap-6 mb-16 justify-center">
                    <div className="bg-[#F2F4F7] rounded-xl p-1.5  border border-[#F2F4F7] w-[253px] h-[93px] shrink-0">
                        <p className="text-[#111827] font-bold text-[16px] mb-1 ml-2">สถานะนักศึกษา</p>
                        <p className="text-[#61646C] text-[16px] mb-1 ml-2">วันสิ้นสุด: <span className="text-[#111827] font-bold">{formatOrigEnd}</span></p>
                        <p className="text-[#61646C] text-[16px] ml-2">เหลือเวลา: <span className="text-[#A80689] font-bold">{remainDays} วัน</span></p>
                    </div>
                    <div className="bg-[#A80689] rounded-xl p-3 text-white flex flex-col justify-between w-[350px] h-[93px] shrink-0">
                        <p className="font-semibold text-[14px]">ความคืบหน้าในการฝึกงาน</p>
                        <div className="flex justify-between items-end">
                            <p className="text-[22px] font-semibold max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                {Math.round(accumulatedHours || 0)} <span className="text-[14px] font-normal text-white/80">/{Math.round(totalHoursGoal || 0)} ชั่วโมง</span>
                            </p>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-[12px] text-white/80 leading-none">ขาดอีก</span>
                                <span className="text-[14px] font-semibold text-white mt-1">{defaultMissing} ชั่วโมง</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="flex items-start gap-1 mb-5">
                    <div className="w-[40px] h-[40px] rounded-full  bg-[#FFF5FD] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#A80689] text-[22px]">calendar_add_on</span>
                    </div>
                    <div>
                        <h3 className="text-[18px] font-bold text-[#A80689]">ชดเชยวันปฏิบัติงาน</h3>
                        <p className="text-[14px] text-[#85888E]  mt-1 leading-snug">จำนวนวันที่ต้องปฏิบัติงานเพิ่มเติมหลังวันสิ้นสุดการฝึกงาน โดยคำนวณจากจำนวนชั่วโมงที่ยังไม่ครบ</p>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-[#F2F4F7] rounded-[10px] p-5 mb-4">
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[14px] font-normal text-[#111827] mb-2">จำนวนชั่วโมงที่ต้องชดเชย</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    value={hours}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (parseFloat(val) < 0) return;
                                        setHours(val);
                                    }}
                                    className={`w-full bg-white border ${isExceedMax ? 'border-[#D92D20]' : 'border-[#F2F4F7]'} rounded-[5px] py-2.5 px-3 pr-14 text-[14px] text-[#111827] focus:ring-2 ${isExceedMax ? 'focus:ring-[#D92D20]/10 focus:border-[#D92D20]' : 'focus:ring-[#A80689]/20 focus:border-[#A80689]'} outline-none`}
                                />
                                <span className="absolute right-3 top-2.5 text-[14px] text-[#61646C] pointer-events-none">ชั่วโมง</span>
                            </div>
                            {isExceedMax && (
                                <p className="mt-1.5 text-[#D92D20] text-[12px] font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">error</span>
                                    จำนวนชั่วโมงชดเชยต้องไม่เกิน {defaultMissing} ชั่วโมง
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[14px] font-normal text-[#111827] mb-2">คิดเป็นจำนวนวัน</label>
                            <div className="w-full bg-[#ECECED] border border-[#EAECF0] rounded-[5px] py-2.5 px-3 text-[14px] font-medium text-[#333741]">
                                {days} วัน / วันสิ้นสุด: {thaiEndDate}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2.5 text-[#98A2B3]">
                                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                <span className="text-[12px]">ระบบคำนวณจาก 7 ชั่วโมง/วัน และปัดขึ้นเสมอ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert */}
                <div className="bg-[#FFF5FD] rounded-xl p-3 flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-[#A80689] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    <span className="text-[#A80689] text-[13px] font-medium">ระบบคำนวณให้อัตโนมัติ สามารถปรับได้ตามความเหมาะสม</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-[#D0D5DD] rounded-xl text-[#344054] text-[14px] font-bold hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={async () => {
                            if (isExceedMax) return;
                            try {
                                Swal.fire({
                                    title: 'กำลังบันทึกข้อมูล...',
                                    allowOutsideClick: false,
                                    didOpen: () => Swal.showLoading()
                                });

                                await axiosInstance.post('/user/internship/extend', {
                                    studentId: studentId,
                                    hours: parsedHours,
                                    reason: 'ชดเชยเวลาฝึกงานที่ยังไม่ครบ'
                                });

                                Swal.fire({
                                    width: '380px',
                                    html: `
                                        <div class="flex flex-col items-center pt-4">
                                            <div class="w-[76px] h-[76px] rounded-full bg-[#DCFAE6] flex items-center justify-center mb-6">
                                                <div class="w-[56px] h-[56px] rounded-full bg-[#0EBA67] flex items-center justify-center shadow-sm">
                                                    <span class="material-symbols-outlined text-white text-[20px] select-none" style="font-size: 36px">check</span>
                                                </div>
                                            </div>
                                            <h2 class="text-[20px] font-bold text-gray-800 mb-2">ยืนยันการชดเชยแล้ว</h2>
                                        </div>
                                    `,
                                    showConfirmButton: false,
                                    timer: 2000,
                                    timerProgressBar: false,
                                    customClass: {
                                        popup: 'rounded-[20px] !p-8',
                                    }
                                });

                                if (onSuccess) onSuccess();
                                onClose();
                            } catch (error) {
                                console.error('Error extending internship:', error);
                                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการชดเชยได้', 'error');
                            }
                        }}
                        disabled={isExceedMax}
                        className={`px-6 py-2.5 rounded-xl text-white text-[14px] font-bold transition-colors shadow-sm ${
                            isExceedMax 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-[#0EBA67] hover:bg-[#0da45a]'
                        }`}
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CompensationModal;
