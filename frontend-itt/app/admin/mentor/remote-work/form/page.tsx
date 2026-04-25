"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/api/axios';
import Swal from 'sweetalert2';
import CustomDatePicker from '@/components/forms/date-picker/CustomDatePicker';

interface Student {
    id: string;
    fname?: string;
    lname?: string;
    name?: string;
    displayUsername?: string;
}

const RemoteWorkFormPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskId = searchParams.get('id');
    const isEditMode = !!taskId;

    // Form State
    const [workDate, setWorkDate] = useState('');
    const [locationName, setLocationName] = useState('');
    const [taskDetail, setTaskDetail] = useState('');
    const [note, setNote] = useState('');
    const [studentIds, setStudentIds] = useState<string[]>([]);
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [showEmptySlot, setShowEmptySlot] = useState(true); // Start with one empty slot
    
    // Data State
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownIndex !== null) {
                const ref = dropdownRefs.current[openDropdownIndex];
                if (ref && !ref.contains(event.target as Node)) {
                    setOpenDropdownIndex(null);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openDropdownIndex]);

    // Fetch initial data on mount
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch mentor profile to get departmentId
                const profileResponse = await axiosInstance.get('/user/profile');
                const profileData = profileResponse.data;
                // Check both root and nested profile for departmentId
                const deptId = profileData.departmentId || profileData.profile?.departmentId;

                // 2. Fetch students in the same department
                const studentsResponse = await axiosInstance.get('/user/student', {
                    params: { departmentId: deptId }
                });

                // Handle potential response structure differences
                const studentList = Array.isArray(studentsResponse.data)
                    ? studentsResponse.data
                    : studentsResponse.data?.data || [];

                setAvailableStudents(studentList);

                // 3. If Edit Mode, fetch task details
                if (isEditMode) {
                    const taskResponse = await axiosInstance.get(`/offsite-tasks/${taskId}`);
                    const task = taskResponse.data;

                    // Format Date for HTML5 input (YYYY-MM-DD)
                    if (task.workDate) {
                        setWorkDate(new Date(task.workDate).toISOString().split('T')[0]);
                    }

                    setLocationName(task.locationName);
                    setTaskDetail(task.taskDetail);
                    setNote(task.note || '');

                    const taskStudentIds = task.students.map((s: any) => s.id);
                    setStudentIds(taskStudentIds);

                    // Ensure task students are in availableStudents for name display
                    setAvailableStudents(prev => {
                        const existingIds = new Set(prev.map(s => s.id));
                        const newOnes = task.students
                            .filter((s: any) => !existingIds.has(s.id))
                            .map((s: any) => ({
                                id: s.id,
                                name: s.name,
                                image: s.image
                            }));
                        return [...prev, ...newOnes];
                    });
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
                Swal.fire('Error', 'ไม่สามารถดึงข้อมูลได้', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [isEditMode, taskId]);

    const handleSetStudent = (index: number, studentId: string) => {
        if (!studentId) return;
        const newStudentIds = [...studentIds];
        newStudentIds[index] = studentId;
        setStudentIds(newStudentIds);
        setOpenDropdownIndex(null);
        setShowEmptySlot(false);
        if (errors.studentIds) setErrors(prev => ({ ...prev, studentIds: '' }));
    };

    const handleRemoveSlot = (index: number) => {
        const newStudentIds = [...studentIds];
        newStudentIds.splice(index, 1);
        setStudentIds(newStudentIds);
        if (newStudentIds.length === 0) {
            setShowEmptySlot(true);
        }
    };

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};
        if (!workDate) newErrors.workDate = 'กรุณาระบุระยะเวลาปฏิบัติงาน';
        if (!locationName) newErrors.locationName = 'กรุณาระบุสถานที่ปฏิบัติงาน';
        if (!taskDetail) newErrors.taskDetail = 'กรุณาระบุรายละเอียดการปฏิบัติงาน';
        if (studentIds.length === 0) newErrors.studentIds = 'กรุณาเลือกนักศึกษาอย่างน้อย 1 คน';

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        // 1. Show Confirmation Dialog
        const result = await Swal.fire({
            width: '380px',
            html: `
                <div class="flex flex-col items-center">
                    <div class="w-[64px] h-[64px] bg-[#DCFAE6] rounded-full flex items-center justify-center mb-6">
                        <div class="w-[44px] h-[44px] bg-[#17B26A] rounded-full flex items-center justify-center shadow-sm">
                            <span class="material-symbols-rounded text-white text-[24px]">check</span>
                        </div>
                    </div>
                    <h2 class="text-[16px] font-bold text-[#000] mb-2">${isEditMode ? 'แก้ไขมอบหมาย' : 'ยืนยันการมอบหมาย'}</h2>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#17B26A',
            customClass: {
                popup: 'rounded-[16px] !p-7',
                confirmButton: 'w-[130px] h-[48px] !bg-[#17B26A] rounded-[8px] text-[16px] text-[#FFFFFF]  !mx-2',
                cancelButton: 'w-[130px] h-[48px] !bg-white rounded-[8px] text-[16px] border-2 border-black !text-black !mx-2'
            },
            reverseButtons: true,
            buttonsStyling: false,
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        try {
            const payload = {
                workDate,
                locationName,
                taskDetail,
                note: note || undefined,
                studentIds
            };

            if (isEditMode) {
                await axiosInstance.patch(`/offsite-tasks/${taskId}`, payload);
            } else {
                await axiosInstance.post('/offsite-tasks', payload);
            }

            setIsSubmitting(false);

            // Show Success Dialog
            await Swal.fire({
                width: '380px',
                html: `
                    <div class="flex flex-col items-center">
                        <div class="w-[64px] h-[64px] bg-[#DCFAE6] rounded-full flex items-center justify-center mb-6">
                            <div class="w-[44px] h-[44px] bg-[#17B26A] rounded-full flex items-center justify-center shadow-sm">
                                <span class="material-symbols-rounded text-white text-[24px]">check</span>
                            </div>
                        </div>
                        <h2 class="text-[16px] font-bold text-[#000] mb-2">${isEditMode ? 'แก้ไขมอบหมายสำเร็จ' : 'มอบหมายสำเร็จ'}</h2>
                    </div>
                `,
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#17B26A',
                customClass: {
                    popup: 'rounded-[16px] !p-7',
                    confirmButton: 'w-[130px] h-[48px] !bg-[#17B26A] rounded-[8px] text-[16px] text-[#FFFFFF]  !mx-2',
                },
                buttonsStyling: false,
            });

            router.push('/mentor/remote-work');
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด!',
                text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#A80689',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        const result = await Swal.fire({
            width: '380px',
            html: `
                <div class="flex flex-col items-center">
                    <div class="w-[64px] h-[64px] bg-[#FEE4E2] rounded-full flex items-center justify-center mb-6">
                        <div class="w-[44px] h-[44px] bg-[#D92D20] rounded-full flex items-center justify-center shadow-sm">
                            <span class="material-symbols-rounded text-white text-[24px]">close</span>
                        </div>
                    </div>
                    <h2 class="text-[16px] font-bold text-[#000] mb-2">${isEditMode ? 'ยกเลิกการแก้ไข' : 'ยกเลิกการมอบหมาย'}</h2>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ดำเนินการต่อ',
            confirmButtonColor: '#D92D20',
            customClass: {
                popup: 'rounded-[16px] !p-7',
                confirmButton: 'w-[130px] h-[48px] !bg-[#D92D20] rounded-[8px] text-[16px] text-[#FFFFFF] !mx-2',
                cancelButton: 'w-[130px] h-[48px] !bg-white rounded-[8px] text-[16px] font-bold border-2 border-black !text-black !mx-2'
            },
            reverseButtons: true,
            buttonsStyling: false,
        });

        if (result.isConfirmed) {
            router.back();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black py-4 px-4">
            {/* Main Form Container */}
            <div
                className="mx-auto w-[700px] bg-white dark:bg-[#121212] border border-[#CECFD2] dark:border-gray-700 rounded-[15px] shadow-sm flex flex-col p-10 overflow-visible"

            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-[24px] font-semibold text-black dark:text-white mb-4">
                        {isEditMode ? 'แก้ไขงานนอกสถานที่' : 'ปฏิบัติงานนอกสถานที่'}
                    </h1>
                    <p className="text-[16px] text-[#61646C] dark:text-gray-400">
                        {isEditMode ? 'แก้ไขรายละเอียดกำหนดการปฏิบัติงานนอกสถานที่' : 'กำหนดการวันที่นักศึกษาต้องไปปฏิบัติงานนอกสถานที่'}
                    </p>
                </div>

                {/* Form Sections */}
                <div className="flex-1 flex flex-col gap-4 overflow-visible">

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[50px] h-[50px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[32px] text-[#A80689]">edit_calendar</span>
                            </div>
                            <div>
                                <h2 className="text-[20px] font-bold text-[#A80689]">ระยะเวลาปฏิบัติงาน</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 ">ระบุวันที่และเวลาให้ชัดเจน</p>
                            </div>
                        </div>
                        <div className="w-[348px]">
                            <CustomDatePicker
                                value={workDate}
                                onChange={(date) => {
                                    setWorkDate(date);
                                    if (errors.workDate) setErrors(prev => ({ ...prev, workDate: '' }));
                                }}
                                placeholder="วว/ดด/ปปปป"
                                error={errors.workDate}
                            />
                        </div>
                    </div>

                    {/* 2. Work Location */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[50px] h-[50px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[32px] text-[#A80689]">location_on</span>
                            </div>
                            <div>
                                <h2 className="text-[20px] font-bold text-[#A80689]">สถานที่การปฏิบัติงาน</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 ">ระบุสถานที่การทำงานนอกสถานที่ให้ชัดเจน</p>
                            </div>
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="กรอกชื่อสถานที่ เช่น การท่องเที่ยวแห่งประเทศไทย"
                                value={locationName}
                                onChange={(e) => {
                                    setLocationName(e.target.value);
                                    if (errors.locationName) setErrors(prev => ({ ...prev, locationName: '' }));
                                }}
                                className={`w-[618px] h-[45px] px-4 bg-white dark:bg-gray-900 border ${errors.locationName ? 'border-[#D92D20]' : 'border-[#E4E7EC]'} dark:border-gray-700 rounded-[5px] text-[14px] focus:outline-none focus:border-[#A80689] transition-colors `}
                            />
                            {errors.locationName && <p className="text-[#D92D20] text-[12px] mt-0.5">{errors.locationName}</p>}
                        </div>
                    </div>

                    {/* 3. Work Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[50px] h-[50px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[32px] text-[#A80689]">description</span>
                            </div>
                            <div>
                                <h2 className="text-[20px] font-bold text-[#A80689]">รายละเอียดการปฏิบัติงาน</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 ">ระบุรายละเอียดของงาน</p>
                            </div>
                        </div>
                        <div>
                            <textarea
                                placeholder="รายละเอียดการปฏิบัติงาน เช่น ลักษณะงาน, สถานที่, รายชื่อพี่เลี้ยงที่ร่วมปฏิบัติงาน"
                                value={taskDetail}
                                onChange={(e) => {
                                    setTaskDetail(e.target.value);
                                    if (errors.taskDetail) setErrors(prev => ({ ...prev, taskDetail: '' }));
                                }}
                                className={`w-[618px] h-[100px] p-4 bg-white dark:bg-gray-900 border ${errors.taskDetail ? 'border-[#D92D20]' : 'border-[#E4E7EC]'} dark:border-gray-700 rounded-[5px] text-[14px] focus:outline-none focus:border-[#A80689] transition-colors resize-none`}
                            ></textarea>
                            {errors.taskDetail && <p className="text-[#D92D20] text-[12px] mt-0.5">{errors.taskDetail}</p>}
                        </div>
                    </div>

                    {/* 4. Remarks (Optional) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[50px] h-[50px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[32px] text-[#A80689]">lab_profile</span>
                            </div>
                            <div>
                                <h2 className="text-[20px] font-bold text-[#A80689]">หมายเหตุ (ถ้ามี)</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 ">ระบุรายละเอียดของงานเพิ่มเติม</p>
                            </div>
                        </div>
                        <textarea
                            placeholder="รายละเอียดของงานเพิ่มเติม"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-[618px] h-[100px] p-4 bg-white dark:bg-gray-900 border border-[#E4E7EC] dark:border-gray-700 rounded-[8px] text-[14px] focus:outline-none focus:border-[#A80689] transition-colors resize-none"
                        ></textarea>
                    </div>

                    {/* 5. Assigned Students */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[50px] h-[50px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[32px] text-[#A80689]">person</span>
                            </div>
                            <div>
                                <h2 className="text-[20px] font-bold text-[#A80689]">นักศึกษาที่ได้รับมอบหมาย</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 ">เลือกรายชื่อนักศึกษาที่ทำงานนอกสถานที่</p>
                            </div>
                        </div>

                        {/* Student Selection List */}
                        <div className="space-y-3">
                            {/* Render existing selections */}
                            {studentIds.map((id, index) => {
                                const student = availableStudents.find(s => s.id === id);
                                return (
                                    <div key={`selected-${index}`} className="relative" ref={el => { dropdownRefs.current[index] = el; }}>
                                        {/* Filled Box - White background with purple border */}
                                        <div 
                                            className="w-[618px] h-[45px] px-4 bg-white dark:bg-gray-800 border-2 border-[#A80689] rounded-[8px] flex items-center justify-between cursor-pointer shadow-sm"
                                            onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
                                        >
                                            <span className="text-[14px] text-[#333] font-semibold truncate pr-4">
                                                {student 
                                                    ? (student.fname ? `${student.fname} ${student.lname || ''}` : student.name || student.displayUsername || student.id)
                                                    : '...'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveSlot(index);
                                                    }}
                                                    className="w-7 h-7 flex items-center justify-center text-[#A80689] hover:bg-[#FDF2FE] rounded-full transition-colors"
                                                >
                                                    <span className="material-symbols-rounded text-[20px]">close</span>
                                                </button>
                                                <span className={`material-symbols-rounded text-[#A80689] transition-transform duration-200 ${openDropdownIndex === index ? 'rotate-180' : ''}`}>expand_more</span>
                                            </div>
                                        </div>

                                        {/* Dropdown Menu for existing slot */}
                                        {openDropdownIndex === index && (
                                            <div className="absolute top-[50px] left-0 w-[618px] max-h-[200px] overflow-y-auto bg-[#F8EDF5] border border-[#A80689]/20 rounded-[10px] shadow-lg z-20 py-1 scrollbar-thin scrollbar-thumb-gray-300">
                                                {availableStudents
                                                    .filter(s => s.id === id || !studentIds.includes(s.id))
                                                    .map(s => (
                                                        <div 
                                                            key={s.id} 
                                                            className={`px-4 py-2.5 mx-1 my-0.5 rounded-[8px] text-[14px] transition-all duration-200 cursor-pointer ${s.id === id ? 'bg-[#A80689] text-white' : 'text-[#101828] hover:bg-[#A80689] hover:text-white'}`}
                                                            onClick={() => handleSetStudent(index, s.id)}
                                                        >
                                                            {s.fname ? `${s.fname} ${s.lname || ''}` : s.name || s.displayUsername || s.id}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Render empty slot if active */}
                            {showEmptySlot && (
                                <div className="relative" ref={el => { dropdownRefs.current[studentIds.length] = el; }}>
                                    <div 
                                        className={`w-[618px] h-[45px] px-4 bg-white dark:bg-gray-900 border-2 ${errors.studentIds ? 'border-[#D92D20]' : 'border-[#A80689]'} rounded-[8px] flex items-center justify-between cursor-pointer`}
                                        onClick={() => setOpenDropdownIndex(openDropdownIndex === studentIds.length ? null : studentIds.length)}
                                    >
                                        <span className="text-[14px] text-gray-500">ชื่อนักศึกษา</span>
                                        <span className={`material-symbols-rounded ${errors.studentIds ? 'text-[#D92D20]' : 'text-[#A80689]'} transition-transform duration-200 ${openDropdownIndex === studentIds.length ? 'rotate-180' : ''}`}>expand_more</span>
                                    </div>
                                    {errors.studentIds && <p className="text-[#D92D20] text-[12px] mt-0.5 ml-1">{errors.studentIds}</p>}

                                    {openDropdownIndex === studentIds.length && (
                                        <div className="absolute top-[50px] left-0 w-[618px] max-h-[200px] overflow-y-auto bg-[#F8EDF5] border border-[#A80689]/20 rounded-[10px] shadow-lg z-20 py-1 scrollbar-thin scrollbar-thumb-gray-300">
                                            {availableStudents.filter(s => !studentIds.includes(s.id)).length === 0 ? (
                                                <div className="px-4 py-3 text-[14px] text-gray-500 text-center italic">
                                                    {isLoading ? 'กำลังโหลด...' : 'ไม่มีรายชื่อนักศึกษาเพิ่มเติม'}
                                                </div>
                                            ) : (
                                                availableStudents
                                                    .filter(s => !studentIds.includes(s.id))
                                                    .map(s => (
                                                        <div 
                                                            key={s.id} 
                                                            className="px-4 py-2.5 mx-1 my-0.5 rounded-[8px] text-[14px] text-[#101828] hover:bg-[#A80689] hover:text-white cursor-pointer transition-all duration-200"
                                                            onClick={() => handleSetStudent(studentIds.length, s.id)}
                                                        >
                                                            {s.fname ? `${s.fname} ${s.lname || ''}` : s.name || s.displayUsername || s.id}
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Dashed Add Student Box */}
                            {studentIds.length < availableStudents.length && !showEmptySlot && (
                                <div 
                                    className="w-[618px] h-[45px] border-2 border-dashed border-[#61646C] dark:border-gray-700 rounded-[8px] flex items-center justify-center gap-2 cursor-pointer hover:border-[#A80689] hover:bg-[#FDF2FE] transition-all mt-2"
                                    onClick={() => {
                                        setShowEmptySlot(true);
                                        setOpenDropdownIndex(studentIds.length);
                                    }}
                                >
                                    <span className="material-symbols-rounded text-[#61646C]">add</span>
                                    <span className="text-[#61646C] text-[16px]">เพิ่มนักศึกษา</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-8 flex gap-4">
                    <button 
                        onClick={handleCancel}
                        className="flex-1 h-[54px] border border-[#A80689] text-[#A80689] rounded-[8px] text-[16px]  hover:bg-[#FDF2FE] transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`flex-1 h-[54px] bg-[#A80689] text-white rounded-[8px] text-[16px]  hover:bg-[#8e0574] transition-colors shadow-md flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isEditMode ? 'แก้ไขนักศึกษาปฏิบัติงานนอกสถานที่' : 'เพิ่มนักศึกษาปฏิบัติงานนอกสถานที่'}
                        {isSubmitting ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2"></span>
                                กำลังบันทึก...
                            </>
                        ) : null}
                    </button>
                </div>
            </div>


        </div>
    );
};

export default RemoteWorkFormPage;
