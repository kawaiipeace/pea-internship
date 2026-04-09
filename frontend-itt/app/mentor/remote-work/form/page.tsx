"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/api/axios';
import Swal from 'sweetalert2';

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
    
    // Data State
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleAddStudent = (studentId: string) => {
        if (!studentId) return;
        if (!studentIds.includes(studentId)) {
            setStudentIds([...studentIds, studentId]);
        }
    };

    const handleRemoveStudent = (studentId: string) => {
        setStudentIds(studentIds.filter(id => id !== studentId));
    };

    const handleSubmit = async () => {
        if (!workDate || !locationName || !taskDetail || studentIds.length === 0) {
            Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วนและเลือกนักศึกษาอย่างน้อย 1 คน', 'warning');
            return;
        }

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
                await Swal.fire({
                    title: 'แก้ไขสำเร็จ!',
                    text: 'แก้ไขรายการมอบหมายงานนอกสถานที่เรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonColor: '#A80689',
                });
            } else {
                await axiosInstance.post('/offsite-tasks', payload);
                await Swal.fire({
                    title: 'มอบหมายสำเร็จ!',
                    text: 'มอบหมายงานนอกสถานที่ให้เพื่อนนักศึกษาเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonColor: '#A80689',
                });
            }
            router.push('/mentor/remote-work');
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire('Error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black py-10 px-4">
            {/* Main Form Container */}
            <div 
                className="mx-auto w-[700px] h-full bg-white dark:bg-[#121212] border border-[#CECFD2] dark:border-gray-700 rounded-[15px] shadow-sm flex flex-col p-10 overflow-hidden"
                
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-[24px] font-bold text-black dark:text-white mb-1">
                        {isEditMode ? 'แก้ไขงานนอกสถานที่' : 'มอบหมายงานนอกสถานที่'}
                    </h1>
                    <p className="text-[16px] text-[#61646C] dark:text-gray-400">
                        {isEditMode ? 'แก้ไขรายละเอียดกำหนดการปฏิบัติงานนอกสถานที่' : 'กำหนดการวันที่นักศึกษาต้องไปปฏิบัติงานนอกสถานที่'}
                    </p>
                </div>

                {/* Form Sections */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    
                    {/* 1. Work Period */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[44px] h-[44px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-[10px] flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[24px] text-[#A80689]">edit_calendar</span>
                            </div>
                            <div>
                                <h2 className="text-[18px] font-bold text-[#A80689]">ระยะเวลาปฏิบัติงาน</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 font-medium">ระบุวันที่และเวลาให้ชัดเจน</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={workDate}
                                onChange={(e) => setWorkDate(e.target.value)}
                                className="w-full h-[54px] px-4 bg-white dark:bg-gray-900 border border-[#E4E7EC] dark:border-gray-700 rounded-[8px] text-[16px] focus:outline-none focus:border-[#A80689] transition-colors"
                            />
                        </div>
                    </div>

                    {/* 2. Work Location */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[44px] h-[44px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-[10px] flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[24px] text-[#A80689]">location_on</span>
                            </div>
                            <div>
                                <h2 className="text-[18px] font-bold text-[#A80689]">สถานที่การปฏิบัติงาน</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 font-medium">ระบุสถานที่การทำงานนอกสถานที่ให้ชัดเจน</p>
                            </div>
                        </div>
                        <input 
                            type="text" 
                            placeholder="กรอกชื่อสถานที่ เช่น การท่องเที่ยวแห่งประเทศไทย" 
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            className="w-full h-[54px] px-4 bg-white dark:bg-gray-900 border border-[#E4E7EC] dark:border-gray-700 rounded-[8px] text-[16px] focus:outline-none focus:border-[#A80689] transition-colors"
                        />
                    </div>

                    {/* 3. Work Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[44px] h-[44px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-[10px] flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[24px] text-[#A80689]">assignment</span>
                            </div>
                            <div>
                                <h2 className="text-[18px] font-bold text-[#A80689]">รายละเอียดการปฏิบัติงาน</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 font-medium">ระบุรายละเอียดของงาน</p>
                            </div>
                        </div>
                        <textarea 
                            placeholder="รายละเอียดการปฏิบัติงาน เช่น ลักษณะงาน, สถานที่, รายชื่อพี่เลี้ยงที่ร่วมปฏิบัติงาน" 
                            value={taskDetail}
                            onChange={(e) => setTaskDetail(e.target.value)}
                            className="w-full h-[120px] p-4 bg-white dark:bg-gray-900 border border-[#E4E7EC] dark:border-gray-700 rounded-[8px] text-[16px] focus:outline-none focus:border-[#A80689] transition-colors resize-none"
                        ></textarea>
                    </div>

                    {/* 4. Remarks (Optional) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[44px] h-[44px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-[10px] flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[24px] text-[#A80689]">article</span>
                            </div>
                            <div>
                                <h2 className="text-[18px] font-bold text-[#A80689]">หมายเหตุ (ถ้ามี)</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 font-medium">ระบุรายละเอียดของงานเพิ่มเติม</p>
                            </div>
                        </div>
                        <textarea 
                            placeholder="รายละเอียดของงานเพิ่มเติม" 
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full h-[120px] p-4 bg-white dark:bg-gray-900 border border-[#E4E7EC] dark:border-gray-700 rounded-[8px] text-[16px] focus:outline-none focus:border-[#A80689] transition-colors resize-none"
                        ></textarea>
                    </div>

                    {/* 5. Assigned Students */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-[44px] h-[44px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-[10px] flex items-center justify-center shrink-0">
                                <span className="material-symbols-rounded !text-[24px] text-[#A80689]">person_add</span>
                            </div>
                            <div>
                                <h2 className="text-[18px] font-bold text-[#A80689]">นักศึกษาที่ได้รับมอบหมาย</h2>
                                <p className="text-[14px] text-[#61646C] dark:text-gray-400 font-medium">เลือกรายชื่อนักศึกษาที่ทำงานนอกสถานที่</p>
                            </div>
                        </div>
                        <div className="relative">
                            <select 
                                className="w-full h-[54px] px-4 bg-white dark:bg-gray-900 border border-[#CECFD2] dark:border-gray-700 rounded-[8px] text-[16px] text-gray-500 appearance-none focus:outline-none focus:border-[#A80689] transition-colors"
                                defaultValue=""
                                onChange={(e) => handleAddStudent(e.target.value)}
                            >
                                <option value="" disabled>{isLoading ? 'กำลังโหลด...' : 'เลือกรายชื่อนักศึกษา'}</option>
                                {availableStudents
                                    .filter(s => !studentIds.includes(s.id))
                                    .map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.fname ? `${student.fname} ${student.lname || ''}` : student.name || student.displayUsername || student.id}
                                        </option>
                                    ))
                                }
                            </select>
                            <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
                        </div>
                        
                        {/* Selected Students List */}
                        {studentIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {studentIds.map(id => {
                                    const student = availableStudents.find(s => s.id === id);
                                    return (
                                        <div key={id} className="bg-[#FDF2FE] border border-[#F9E1F9] rounded-full px-4 py-1.5 flex items-center gap-2">
                                            <span className="text-[14px] text-[#A80689] font-medium">
                                                {student 
                                                    ? (student.fname ? `${student.fname} ${student.lname || ''}` : student.name || student.displayUsername || student.id)
                                                    : 'กำลังโหลด...'}
                                            </span>
                                            <button 
                                                onClick={() => handleRemoveStudent(id)}
                                                className="text-[#A80689] hover:text-red-500"
                                            >
                                                <span className="material-symbols-rounded text-[18px]">close</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        </div>
                    </div>

                {/* Footer Buttons */}
                <div className="mt-8 flex gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex-1 h-[54px] border border-[#A80689] text-[#A80689] rounded-[8px] text-[16px] font-bold hover:bg-[#FDF2FE] transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`flex-1 h-[54px] bg-[#A80689] text-white rounded-[8px] text-[16px] font-bold hover:bg-[#8e0574] transition-colors shadow-md flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มนักศึกษาปฏิบัติงานนอกสถานที่'}
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
