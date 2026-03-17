import React, { useState, Fragment } from 'react';
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

    const handleSubmit = () => {
        setShowConfirm(false);
        setIsEditingTime(false);
    };

    return (
        <>
            {/* Custom Header with Back button */}
            <div className="relative flex items-center justify-center pb-2">
                <button type="button" onClick={() => setIsEditingTime(false)} className="absolute left-0 text-gray-800 dark:text-gray-400">
                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div className="text-lg font-bold text-gray-900 dark:text-white">คำขอแก้ไขเวลา</div>
            </div>

            {/* Normal Subheader info repeats */}
            <div className="flex items-center justify-between mb-1">
                <div className="text-[#687588] dark:text-gray-400 font-semibold text-xs">{selectedHistoryItem.labelMobile}</div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white pb-1">{selectedHistoryItem.time}</div>
            
            {selectedHistoryItem.isLeave ? (
                 <div className="inline-flex items-center px-4 py-1 bg-[#eef8ff] text-[#3b82f6] border border-[#3b82f6] rounded-full text-xs font-semibold gap-1.5 mt-1">
                    <IconFile className="w-3.5 h-3.5" />
                    {selectedHistoryItem.status}
                 </div>
            ) : selectedHistoryItem.statusType === 'default' ? (
                <div className="inline-flex items-center px-3 py-0.5 bg-[#F4F4F4] text-[#6F6F6F] border border-[#E1E1E1] rounded-full text-xs font-semibold gap-1.5 mt-1">
                    <div className="w-4 h-4 rounded-full bg-[#A8A8A8] flex items-center justify-center text-white">
                        <svg className="w-2 h-2 fill-current" viewBox="0 0 24 24"><path d="M6 2h12a1 1 0 011 1v4a1 1 0 01-.3.7l-4.7 4.7 4.7 4.7a1 1 0 01.3.7v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4a1 1 0 01.3-.7l4.7-4.7-4.7-4.7A1 1 0 015 7V3a1 1 0 011-1zm1 2v2.6l4.3 4.4L7 15.4V18h10v-2.6l-4.3-4.4 4.3-4.4V4H7z" /></svg>
                    </div>
                    {selectedHistoryItem.status}
                </div>
            ) : (
                <div className="inline-flex items-center px-4 py-1 bg-[#FFF9E6] text-[#D97706] border border-[#FDE68A] rounded-full text-xs font-semibold gap-1.5 mt-1">
                    <IconClock className="w-3.5 h-3.5 text-[#D97706]" />
                    {selectedHistoryItem.status}
                </div>
            )}

            <div className="w-full h-[1px] bg-[#ECECED] my-6"></div>

            {/* Form Cards */}
            <div className="bg-[#FFFCF6] dark:bg-[#1C1710] border border-[#FDF2E2] rounded-2xl p-4 space-y-4 shadow-sm mt-4">
                <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <IconMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="font-semibold text-[14px]">{selectedHistoryItem.location}</div>
                </div>

                <div>
                    <div className="text-xs text-gray-400 mb-1">เวลาเข้างาน :</div>
                    <div className="relative">
                        <input type="text" defaultValue="08:30" className="w-full p-2 pr-10 border border-[#DCE4EC] rounded-lg text-sm bg-white text-gray-800 font-semibold focus:outline-none" />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><IconX className="w-3.5 h-3.5" /></button>
                    </div>
                </div>

                <div>
                    <div className="text-xs text-gray-400 mb-1">เวลาออกงาน :</div>
                    <div className="relative">
                        <input type="text" defaultValue="16:30" className="w-full p-2 pr-10 border border-[#DCE4EC] rounded-lg text-sm bg-white text-gray-800 font-semibold focus:outline-none" />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><IconX className="w-3.5 h-3.5" /></button>
                    </div>
                </div>

                <div className="text-[10px] text-gray-400 leading-normal">
                    ชั่วโมงที่เข้าทำงานคำนวณจากเวลาทำงานจริง สูงสุดไม่เกิน 7 ชั่วโมง (ไม่ร่วมเวลาพักเที่ยง 1 ชั่วโมง) <span className="text-red-500">*</span>
                </div>

                <div className="space-y-0.5">
                    <div className="text-xs text-gray-400">ชั่วโมงที่เข้าทำงาน :</div>
                    <div className="font-bold text-sm text-gray-800">7 ชั่วโมง</div>
                </div>

                <div>
                    <div className="text-xs text-gray-400 mb-1">เหตุผลการแก้ไขเวลา :</div>
                    <textarea rows={2} defaultValue="ลืมกดลงเวลาออก" className="w-full p-2 border border-[#DCE4EC] rounded-lg text-sm bg-white text-gray-800 focus:outline-none"></textarea>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-10">
                <button type="button" onClick={() => setShowConfirm(true)} className="w-full max-w-[280px] py-2.5 bg-[#A80689] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#A80689]/90 transition-colors">
                    ส่งคำขอ
                </button>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 w-[280px] text-center">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">ส่งคำขอถึงพี่เลี้ยง</h3>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="flex-1 py-2 bg-[#A80689] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#A80689]/90 transition-colors"
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditTimeForm;
