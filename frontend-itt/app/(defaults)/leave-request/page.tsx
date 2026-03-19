'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { renderToString } from 'react-dom/server';
import Swal from 'sweetalert2';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import IconCalendar from '@/components/icon/icon-calendar';
import IconCloudDownload from '@/components/icon/icon-cloud-download';
import IconSend from '@/components/icon/icon-send';
import IconInfoCircle from '@/components/icon/icon-info-circle';
import IconFile from '@/components/icon/icon-file';
import IconX from '@/components/icon/icon-x';

const LeaveRequestPage = () => {
    const [leaveDate, setLeaveDate] = useState<any>('');
    const [leaveType, setLeaveType] = useState<'sick' | 'personal' | ''>('');
    const [timePeriod, setTimePeriod] = useState('fullday');
    const [details, setDetails] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

    const timePeriodOptions = [
        { value: 'fullday', label: 'ลาเต็มวัน' },
    ];

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
        // TODO: Implement actual API submission
        Swal.fire({
            html: `
                <div class="flex flex-col items-center py-2">
                    <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-400 bg-gray-100">
                        ${renderToString(<IconInfoCircle className="h-10 w-10 text-gray-500" />)}
                    </div>
                    <h2 class="mb-2 text-2xl font-bold text-gray-800">ยืนยันการยื่นคำขอลา</h2>
                    <p class="text-sm text-gray-500">คุณตรวจสอบข้อมูลครบถ้วน และต้องการยื่นคำขอลาใช่หรือไม่?</p>
                </div>
            `,
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ยกเลิก',
            showCloseButton: false,
            customClass: {
                confirmButton: '!rounded-lg !px-8 !py-3 !text-base !font-bold',
                cancelButton: '!rounded-lg !px-8 !py-3 !text-base !font-bold !bg-white !text-gray-700 !border !border-gray-300 hover:!bg-gray-50',
                popup: '!rounded-2xl',
                actions: '!gap-4',
            },
            didOpen: () => {
                const btn = document.querySelector('.swal2-confirm') as HTMLElement;
                if (btn) {
                    btn.style.cssText = 'background-color: #A80689 !important; border-color: #A80689 !important; color: white !important; border-radius: 8px; padding: 12px 32px; font-size: 16px; font-weight: 700;';
                }
            },
        });
    };

    const selectedTimePeriodLabel = timePeriodOptions.find((opt) => opt.value === timePeriod)?.label || '';

    return (
        <div className="mx-auto max-w-3xl">
            <form onSubmit={handleSubmit}>
                {/* ===== Header ===== */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-black dark:text-white-light">การลาปฏิบัติงาน</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">กรุณากรอกข้อมูลการลาให้ครบถ้วน ข้อมูลนี้จะถูกส่งให้พี่เลี้ยงฝึกงานตรวจสอบ</p>
                </div>

                {/* ===== Section 1: ข้อมูลวันลา ===== */}
                <div className="panel mb-5">
                    <div className="mb-4 flex items-center gap-3">
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
                            className="form-input w-full max-w-xs cursor-pointer focus:border-[#A80689] focus:ring-[#A80689] focus:ring-0"
                            placeholder="เลือกวันที่เริ่ม - วันที่สิ้นสุด"
                        />
                    </div>
                </div>

                {/* ===== Section 2: รายละเอียดการลา ===== */}
                <div className="panel mb-5">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3e8ff] dark:bg-[#3b1f6e]">
                            <IconFile className="h-5 w-5 text-[#A80689]" />
                        </div>
                        <div>
                            <h5 className="text-base font-bold text-[#A80689]">รายละเอียดการลา</h5>
                            <p className="text-xs text-gray-400">ระบุช่วงเวลาและเหตุผลการลาให้ชัดเจน</p>
                        </div>
                    </div>

                    {/* Leave Type Radio Buttons */}
                    <div className="mb-5 flex flex-wrap gap-4">
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

                    {/* Time Period Dropdown */}
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">ช่วงเวลาการลงเวลา</label>
                        <div className="relative max-w-xs">
                            <div
                                className="form-input flex w-full items-center justify-between text-left bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-[#1b2e4b] dark:text-gray-400 border-gray-200 dark:border-[#1b2e4b]"
                            >
                                <span>{selectedTimePeriodLabel || 'ลาเต็มวัน'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Leave Details Textarea */}
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-semibold text-dark dark:text-white-dark">
                            รายละเอียดการลา<span className="text-danger">*</span>
                        </label>
                        <textarea
                            id="leave-details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={4}
                            className="form-textarea w-full focus:border-[#A80689] focus:ring-[#A80689] focus:ring-0"
                            placeholder="ระบุเหตุผลที่ต้องการลงเวลา..."
                            required
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="mb-2 flex items-center gap-1 text-sm font-semibold text-dark dark:text-white-dark">
                            แนบหลักฐาน ถ้ามี
                            <IconInfoCircle className="h-4 w-4 text-gray-400" />
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
                                <p className="text-sm font-semibold text-[#A80689]">คลิกเพื่ออัปโหลด</p>
                                <p className="mt-1 text-xs text-gray-400">หรือลากไฟล์มาวางที่นี่</p>
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
                <div className="mb-5">
                    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                        ตรวจสอบข้อมูลให้ถูกต้องก่อนกดส่ง ระบบจะบันทึกค่าขอเบิกในประวัติการลงเวลา
                    </p>
                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A80689] px-6 py-3 text-base font-bold text-white shadow-md transition-all duration-300 hover:bg-[#8e0e6f] hover:shadow-lg sm:w-auto sm:min-w-[280px] sm:mx-auto"
                    >
                        <IconSend className="h-5 w-5" />
                        ส่งคำขออนุมัติ
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LeaveRequestPage;
