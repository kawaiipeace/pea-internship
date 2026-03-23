'use client';
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import '@/styles/flatpickr.css';

import IconCalendar from '@/components/icon/icon-calendar';
import IconCloudDownload from '@/components/icon/icon-cloud-download';
import IconSend from '@/components/icon/icon-send';
import IconFile from '@/components/icon/icon-file';
import IconX from '@/components/icon/icon-x';

const LeaveRequestPage = () => {
    const [leaveDate, setLeaveDate] = useState<any>('');
    const [leaveType, setLeaveType] = useState<'sick' | 'personal' | ''>('');

    // Ensure the Flatpickr input always replaces 'to' with '-' even after React re-renders.
    const [details, setDetails] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    useEffect(() => {
        const inputElement = document.querySelector('.flatpickr-input') as HTMLInputElement | null;
        if (inputElement && inputElement.value.includes(' to ')) {
            inputElement.value = inputElement.value.replace(' to ', ' - ');
        }
    }, [leaveDate, leaveType, details, attachment]); // Watch ALL form state that causes re-renders
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB


    const validateAndSetFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            alert('ไฟล์มีขนาดเกิน 50 MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า');
            return;
        }
        setAttachment(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfirmOpen(true);
    };

    const handleConfirm = () => {
        setIsConfirmOpen(false);
        setIsSuccessOpen(true);

        // TODO: Implement actual API submission
        console.log('Form submitted:', { leaveDate, leaveType, details, attachment });

        // Auto close success modal after 2 seconds and reset form
        setTimeout(() => {
            setIsSuccessOpen(false);
            
            // Optionally reset form here or redirect
            setLeaveDate('');
            setLeaveType('');
            setDetails('');
            setAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }, 2000);
    };

    const handleCancel = () => {
        setLeaveDate('');
        setLeaveType('');
        setDetails('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }


    return (
        <div className="mx-auto max-w-4xl p-6">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-[#1b2e4b] dark:bg-[#0e1726]">
                 <h2 className="mb-1 text-2xl font-bold text-gray-800 dark:text-gray-100">การลาปฏิบัติงาน</h2>
                    <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                        กรุณากรอกข้อมูลการลาปฏิบัติงานให้ครบถ้วน ข้อมูลนี้จะถูกจัดส่งให้พี่เลี้ยงตรวจสอบ
                    </p>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* ===== Section 1: ข้อมูลวันลา ===== */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3e8ff] dark:bg-[#3b1f6e]">
                                <IconCalendar className="h-5 w-5 text-[#A80689]" />
                            </div>
                            <div>
                                <h5 className="text-base font-bold text-[#A80689]">ข้อมูลวันลา</h5>
                                <p className="text-xs text-gray-400">เลือกวันที่ต้องการลา</p>
                            </div>
                        </div>

                        <div>
                            <Flatpickr
                                value={leaveDate}
                                options={{
                                    mode: 'range',
                                    dateFormat: 'd/m/Y',
                                    disableMobile: true,
                                    closeOnSelect: false,
                                    onReady: (_selectedDates, _dateStr, instance) => {
                                        (instance as any)._okClicked = false;

                                        const calendarContainer = instance.calendarContainer;
                                        const btnContainer = document.createElement('div');
                                        btnContainer.style.cssText = 'display:flex;justify-content:center;gap:12px;padding:8px 12px 12px;border-top:1px solid #e5e7eb;';

                                        const clearBtn = document.createElement('button');
                                        clearBtn.textContent = 'Clear';
                                        clearBtn.type = 'button';
                                        clearBtn.style.cssText = 'padding:8px 28px;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:#374151;font-weight:600;font-size:14px;cursor:pointer;';
                                        clearBtn.addEventListener('click', () => {
                                            instance.clear();
                                            setLeaveDate('');
                                        });

                                        const okBtn = document.createElement('button');
                                        okBtn.textContent = 'Ok';
                                        okBtn.type = 'button';
                                        okBtn.style.cssText = 'padding:8px 28px;border-radius:8px;border:none;background:#A80689;color:#fff;font-weight:600;font-size:14px;cursor:pointer;';
                                        okBtn.addEventListener('click', () => {
                                            (instance as any)._okClicked = true;
                                            const dates = instance.selectedDates;
                                            if (dates.length === 1) {
                                                setLeaveDate([dates[0], dates[0]]);
                                            } else if (dates.length >= 2) {
                                                setLeaveDate([...dates]);
                                            }
                                            instance.close();
                                        });

                                        btnContainer.appendChild(clearBtn);
                                        btnContainer.appendChild(okBtn);
                                        calendarContainer.appendChild(btnContainer);
                                    },
                                    onClose: (_selectedDates, _dateStr, instance) => {
                                        if (!(instance as any)._okClicked) {
                                            setTimeout(() => instance.open(), 0);
                                        }
                                        (instance as any)._okClicked = false;
                                    },
                                }}
                                onChange={([start, end], dateStr, instance) => {
                                    if (start && end && start !== end) {
                                        setTimeout(() => {
                                            if (instance.input) {
                                                instance.input.value = instance.input.value.replace(' to ', ' - ');
                                            }
                                        }, 0);
                                    }
                                }}
                                className="form-input w-full max-w-xs cursor-pointer focus:border-[#A80689] focus:ring-[#A80689] focus:ring-0"
                                placeholder="วว/ดด/ปปปป"
                            />
                        </div>
                    </div>

                    {/* ===== Section 2: รายละเอียดการลา ===== */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3e8ff] dark:bg-[#3b1f6e]">
                                <IconFile className="h-5 w-5 text-[#A80689]" />
                            </div>
                            <div>
                                <h5 className="text-base font-bold text-[#A80689]">รายละเอียดการลา</h5>
                                <p className="text-xs text-gray-400">ระบุประเภท ช่วงเวลาและเหตุผลการลาให้ชัดเจน</p>
                            </div>
                        </div>

                        {/* Leave Type Radio Buttons */}
                        <div className="flex flex-wrap gap-4">
                            <label
                                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                    leaveType === 'sick'
                                        ? 'border-[#A80689] bg-[#fdf2f8] text-[#A80689] shadow-sm dark:bg-[#3b1f6e]/30'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-dark'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="leaveType"
                                    value="sick"
                                    checked={leaveType === 'sick'}
                                    onChange={() => setLeaveType('sick')}
                                    className="form-radio text-[#A80689] border-gray-300 accent-[#A80689]"
                                />
                                <span>ลาป่วย</span>
                            </label>
                            <label
                                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                    leaveType === 'personal'
                                        ? 'border-[#A80689] bg-[#fdf2f8] text-[#A80689] shadow-sm dark:bg-[#3b1f6e]/30'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:text-white-dark'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="leaveType"
                                    value="personal"
                                    checked={leaveType === 'personal'}
                                    onChange={() => setLeaveType('personal')}
                                    className="form-radio text-[#A80689] border-gray-300 accent-[#A80689]"
                                />
                                <span>ลากิจ</span>
                            </label>
                        </div>

                        {/* Leave Details */}
                        <div>
                            <label htmlFor="details" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                รายละเอียดการลา<span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="details"
                                name="details"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="form-textarea mt-2 min-h-[120px] w-full resize-none rounded-lg border-gray-200 focus:border-[#A80689] focus:ring-[#A80689] dark:border-[#1b2e4b] dark:bg-[#1b2e4b] dark:focus:border-[#A80689]"
                                placeholder="ระบุเหตุผลที่ต้องการลงเวลา..."
                                required
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">
                                แนบหลักฐาน ถ้ามี
                            </label>
                            <p className="mb-2 text-xs text-gray-400">รองรับไฟล์ขนาดไม่เกิน 50 MB</p>

                            {!attachment ? (
                                <div
                                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#e0c36a] bg-[#fffdf5] px-6 py-8 transition-colors hover:border-[#A80689] hover:bg-[#fdf2f8] dark:border-[#3b3f5c] dark:bg-[#1b2e4b] dark:hover:border-[#A80689]"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                >
                                    <IconCloudDownload className="mb-2 h-10 w-10 text-gray-400" />
                                    <p className="text-sm"><span className="font-semibold text-[#A80689]">คลิกเพื่ออัปโหลด</span> ขนาดไฟล์ไม่เกิน 50 MB</p>
                                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-[#1b2e4b] dark:bg-[#1b2e4b]">
                                    <div className="flex items-center gap-2">
                                        <IconFile className="h-4 w-4 text-[#A80689]" />
                                        <span className="text-sm text-dark dark:text-white-light">{attachment.name}</span>
                                        <span className="text-xs text-gray-400">({(attachment.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                    </div>
                                    <button type="button" onClick={handleRemoveFile} className="text-gray-400 transition-colors hover:text-danger">
                                        <IconX className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                {/* ===== Bottom Notice + Submit ===== */}
                <div className="pt-2">
                    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                        ตรวจสอบข้อมูลให้ถูกต้องก่อนกดส่งระบบจะบันทึกคำขอในประวัติการลงเวลา
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setLeaveDate('');
                                setLeaveType('');
                                setDetails('');
                                handleRemoveFile();
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#A80689] bg-white px-6 py-3 text-base font-bold text-[#A80689] transition-all duration-300 hover:bg-[#fdf2f8] sm:w-auto sm:min-w-[200px]"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A80689] px-6 py-3 text-base font-bold text-white shadow-md transition-all duration-300 hover:bg-[#8e0e6f] hover:shadow-lg sm:w-auto sm:min-w-[200px]"
                        >
                            <IconSend className="h-5 w-5" />
                            ส่งคำขอลา
                        </button>
                    </div>
                </div>
            </form>
            </div>
            {/* ===== Confirm Modal ===== */}
            <Transition appear show={isConfirmOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[999]" onClose={() => setIsConfirmOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1a1a] p-6 shadow-xl">
                                <div className="flex flex-col items-center py-2">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-green-200 bg-green-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <Dialog.Title className="text-lg font-bold text-gray-800 dark:text-white">
                                        ยืนยันส่งคำขอลา
                                    </Dialog.Title>
                                </div>
                                <div className="mt-5 flex justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsConfirmOpen(false)}
                                        className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-300"
                                    >
                                        ย้อนกลับ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        className="flex-1 rounded-xl bg-[#A80689] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#8e0e6f]"
                                    >
                                        ยืนยัน
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>

            {/* ===== Success Modal ===== */}
            <Transition appear show={isSuccessOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[999]" onClose={() => setIsSuccessOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-xs rounded-2xl bg-white dark:bg-[#1a1a1a] p-8 shadow-xl">
                                <div className="flex flex-col items-center py-2">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-green-200 bg-green-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <Dialog.Title className="text-lg font-bold text-gray-800 dark:text-white">
                                        ส่งคำขอลาสำเร็จ
                                    </Dialog.Title>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default LeaveRequestPage;
