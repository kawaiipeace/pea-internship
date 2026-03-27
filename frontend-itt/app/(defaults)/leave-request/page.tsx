'use client';
import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import '@/styles/flatpickr.css';

import IconCalendar from '@/components/icon/icon-calendar';
import IconCloudDownload from '@/components/icon/icon-cloud-download';
import IconFile from '@/components/icon/icon-file';
import IconX from '@/components/icon/icon-x';
import IconInfoTriangle from '@/components/icon/icon-info-triangle';

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
    const [error, setError] = useState<string | null>(null);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    const validateAndSetFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            alert('ไฟล์มีขนาดเกิน 5 MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า');
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
        setError(null);

        // ตรวจสอบความครบถ้วนของข้อมูล
        if (!leaveDate || (Array.isArray(leaveDate) && leaveDate.length === 0)) {
            setError('กรุณาเลือกวันที่ต้องการลา');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (!leaveType) {
            setError('กรุณาเลือกประเภทการลา');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (!details.trim()) {
            setError('กรุณาระบุรายละเอียดการลา');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
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
            
            setLeaveDate('');
            setLeaveType('');
            setDetails('');
            setAttachment(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }, 2000);
    };

    return (
        <div className="-m-6 min-h-screen bg-[#fffbf7] dark:bg-black p-4 sm:p-10">
            <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1b2e4b] sm:p-10">
                    <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white-light sm:mb-2 sm:text-2xl">การลาปฏิบัติงาน</h2>
                    {/* ซ่อนคำอธิบายบนมือถือ แสดงเฉพาะบนจอใหญ่ */}
                    <p className="mb-8 hidden text-sm text-gray-500 dark:text-white-dark sm:block">
                        กรุณากรอกข้อมูลการลาให้ครบถ้วน ข้อมูลนี้จะถูกจัดส่งให้พี่เลี้ยงฝึกงานตรวจสอบ
                    </p>

                    {/* ===== Alert Message ===== */}
                    {error && (
                        <div className="flex items-center rounded bg-danger-light p-3.5 text-danger dark:bg-danger-dark-light mb-8">
                            <span className="ltr:pr-2 rtl:pl-2 flex items-center gap-2">
                                <IconInfoTriangle className="h-5 w-5 shrink-0" />
                                <strong className="ltr:mr-1 rtl:ml-1 text-sm font-bold">แจ้งเตือน!</strong> 
                                <span className="text-sm">{error}</span>
                            </span>
                            <button type="button" className="hover:opacity-80 ltr:ml-auto rtl:mr-auto" onClick={() => setError(null)}>
                                <IconX className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                        {/* ===== Section 1: ข้อมูลการลา ===== */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf2f8] dark:bg-white/10">
                                    <IconCalendar className="h-5 w-5 text-[#A80689] dark:text-[#fb7185]" />
                                </div>
                                <div>
                                    <h5 className="text-[15px] font-bold text-[#A80689] dark:text-[#fb7185]">ข้อมูลการลา</h5>
                                    <p className="text-[13px] text-gray-500 dark:text-white-dark">เลือกวันที่ต้องการลา</p>
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
                                    className="form-input w-full cursor-pointer rounded-lg border-gray-200 text-sm focus:border-[#A80689] focus:ring-0 focus:ring-[#A80689] dark:border-[#17263c] dark:bg-[#121e32] dark:text-white-light sm:max-w-md"
                                    placeholder="วว/ดด/ปปปป"
                                />
                            </div>
                        </div>

                        {/* ===== Section 2: รายละเอียดการลา ===== */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf2f8] dark:bg-white/10">
                                    <IconFile className="h-5 w-5 text-[#A80689] dark:text-[#fb7185]" />
                                </div>
                                <div>
                                    <h5 className="text-[15px] font-bold text-[#A80689] dark:text-[#fb7185]">รายละเอียดการลา</h5>
                                    <p className="text-[13px] text-gray-500 dark:text-white-dark">ระบุประเภท เหตุผล และหลักฐานการลาให้ครบถ้วน</p>
                                </div>
                            </div>

                            {/* Leave Type Radio Buttons - Grid 2 คอลัมน์สำหรับมือถือ */}
                            <div className="grid w-full grid-cols-2 gap-3 sm:max-w-md">
                                <label
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 ${
                                        leaveType === 'sick'
                                            ? 'border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-[#121e32]'
                                            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-[#17263c] dark:bg-[#121e32] dark:hover:border-white/20'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="leaveType"
                                        value="sick"
                                        checked={leaveType === 'sick'}
                                        onChange={() => setLeaveType('sick')}
                                        className="h-4 w-4 border-gray-300 text-[#A80689] focus:ring-0 dark:border-[#17263c] dark:bg-[#121e32]"
                                    />
                                    <span className="text-gray-700 dark:text-white-light">ลาป่วย</span>
                                </label>
                                <label
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 ${
                                        leaveType === 'personal'
                                            ? 'border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-[#121e32]'
                                            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-[#17263c] dark:bg-[#121e32] dark:hover:border-white/20'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="leaveType"
                                        value="personal"
                                        checked={leaveType === 'personal'}
                                        onChange={() => setLeaveType('personal')}
                                        className="h-4 w-4 border-gray-300 text-[#A80689] focus:ring-0 dark:border-[#17263c] dark:bg-[#121e32]"
                                    />
                                    <span className="text-gray-700 dark:text-white-light">ลากิจ</span>
                                </label>
                            </div>

                            {/* Leave Details */}
                            <div className="pt-2">
                                <label htmlFor="details" className="text-[13px] font-bold text-gray-700 dark:text-white-light">
                                    รายละเอียดการลา<span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="details"
                                    name="details"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    className="form-textarea mt-1 min-h-[100px] w-full resize-none rounded-lg border-gray-200 text-sm focus:border-[#A80689] focus:ring-[#A80689] dark:border-[#17263c] dark:bg-[#121e32] dark:text-white-light dark:focus:border-[#A80689]"
                                    placeholder="ระบุเหตุผลการลา..."
                                />
                            </div>

                            {/* File Upload */}
                            <div className="pt-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <label className="block text-[13px] font-bold text-gray-700 dark:text-white-light">
                                        แนบหลักฐาน (ถ้ามี)
                                    </label>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>
                                </div>

                                {!attachment ? (
                                    <div
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center transition-colors hover:border-[#A80689] dark:border-white/10 dark:bg-[#121e32] dark:hover:border-[#A80689]"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
                                            <IconCloudDownload className="h-5 w-5 text-gray-500 dark:text-white-dark" />
                                        </div>
                                        <p className="text-[13px] text-gray-500 dark:text-white-dark">
                                            <span className="font-semibold text-[#A80689] dark:text-[#fb7185]">คลิกเพื่ออัปโหลด</span> ขนาดไฟล์ไม่เกิน 5 MB
                                        </p>
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#121e32]">
                                        <span className="truncate text-[13px] text-gray-800 dark:text-white-light">{attachment.name}</span>
                                        <button type="button" onClick={handleRemoveFile} className="ml-2 text-gray-600 hover:text-red-500 dark:text-white-dark dark:hover:text-red-400">
                                            <IconX className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    {/* ===== Bottom Notice + Submit ===== */}
                    <div className="pt-4">
                        <p className="mb-6 text-[13px] text-gray-400 dark:text-white-dark">
                            ตรวจสอบข้อมูลให้ถูกต้องก่อนกดส่งและจะบันทึกในประวัติการลา
                        </p>
                        {/* ใช้ flex-col-reverse เพื่อให้ปุ่มส่งอยู่บน และปุ่มยกเลิกอยู่ล่างบนมือถือ */}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row w-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setLeaveDate('');
                                    setLeaveType('');
                                    setDetails('');
                                    handleRemoveFile();
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#A80689] bg-white px-6 py-3 text-[15px] font-bold text-[#A80689] transition-all duration-300 hover:bg-[#fdf2f8] dark:bg-transparent dark:text-white-light dark:hover:bg-white/10 sm:flex-1"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A80689] px-6 py-3 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-[#8e0e6f] dark:bg-[#A80689] dark:hover:bg-[#8e0e6f] sm:flex-1"
                            >
                                ส่งคำขอลา
                            </button>
                        </div>
                    </div>
                </form>
                </div>
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
                            <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1a1a] p-5 sm:p-6 shadow-xl">
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
                                <div className="mt-5 flex flex-col-reverse sm:flex-row justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsConfirmOpen(false)}
                                        className="w-full sm:flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 sm:py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-[#2a2a2a] dark:text-gray-300"
                                    >
                                        ย้อนกลับ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        className="w-full sm:flex-1 rounded-xl btn-success px-6 py-3 sm:py-2.5 text-sm font-bold text-white hover:bg-[#157347]"
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
                            <Dialog.Panel className="w-full max-w-xs rounded-2xl bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 shadow-xl">
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