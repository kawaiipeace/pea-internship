import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkInActionType: 'in' | 'out' | null;
    checkInTime: Date | null;
    isOffsiteToday: boolean;
}

interface ConfirmOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    checkInActionType,
    checkInTime,
    isOffsiteToday
}) => {
    const getStatusDisplay = () => {
        if (!checkInTime || !checkInActionType) return { label: '-', className: 'bg-[#F3F4F6] text-[#475467]' };

        if (checkInActionType === 'in') {
            const h = checkInTime.getHours();
            const m = checkInTime.getMinutes();
            const isLate = h > 8 || (h === 8 && m >= 45);
            if (isLate) return { label: 'มาสาย', className: 'bg-[#FFEFBC] text-[#AD5A4C]' };
            return { label: 'เข้างานปกติ', className: 'bg-[#DCFAE6] text-[#067647]' };
        }
        return { label: 'เข้างานปกติ', className: 'bg-[#DCFAE6] text-[#067647]' };
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" open={isOpen} onClose={onClose}>
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
                                <div className="w-[72px] h-[72px] shrink-0 rounded-full flex items-center justify-center mb-6 bg-[#25C277]">
                                    <span className="material-symbols-outlined text-white text-[56px] select-none" style={{ fontSize: '56px' }}>check</span>
                                </div>
                                <h3 className="font-bold text-[28px] text-black mb-1">
                                    {checkInActionType === 'in' ? 'ลงเวลาสำเร็จ' : 'ลงเวลาออกสำเร็จ'}
                                </h3>
                                <p className="text-[15px] text-[#888888] font-medium mb-6">
                                    {checkInActionType === 'in' ? 'ขอให้วันนี้เป็นวันที่ดีในการทำงาน' : 'ขอบคุณสำหรับการทำงาน'}
                                </p>
                                <div className="w-full border border-[#E5E7EB] rounded-[8px] pt-8 pb-6 px-6 flex flex-col items-center mb-6 bg-[#FCF9FD] shrink-0">
                                    <div className="text-[44px] font-medium text-[#A80689] leading-none mb-3 tracking-tight tabular-nums">
                                        {checkInTime ? checkInTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }).replace(' น.', '') : '08:30'}
                                    </div>
                                    <div className="text-[15px] text-[#888888] mb-8">
                                        {checkInTime ? checkInTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^(วัน[^\s]+)\s/, '$1ที่ ') : 'วันจันทร์ที่ 1 มกราคม 2569'}
                                    </div>
                                    <div className="w-full flex items-center justify-between mb-4 mt-2">
                                        <div className="flex items-center gap-3 text-[#333741]">
                                            <span className="material-symbols-rounded text-[20px] text-[#555555] select-none">location_on</span>
                                            <span className="text-[14px] font-medium text-[#444]">สถานที่</span>
                                        </div>
                                        <span className="text-[14px] font-medium text-[#333741]">
                                            {isOffsiteToday ? 'ปฏิบัติงานนอกสถานที่' : 'อยู่ในสถานที่'}
                                        </span>
                                    </div>
                                    <div className="w-full h-[1px] bg-[#E5E7EB] mb-4"></div>
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
                                <button
                                    onClick={onClose}
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
    );
};

export const ConfirmOutModal: React.FC<ConfirmOutModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" open={isOpen} onClose={onClose}>
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
                                    onClick={onClose}
                                    className="shrink-0 w-[130px] h-[40px] flex items-center justify-center bg-white border border-[#D1D5DB] text-[#374151] font-bold text-[15px] rounded-[6px] transition-colors hover:bg-gray-50 focus:outline-none"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
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
    );
};
