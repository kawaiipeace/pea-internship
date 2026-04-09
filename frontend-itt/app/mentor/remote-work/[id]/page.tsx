"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/api/axios';
import Swal from 'sweetalert2';
import ImageWithAuth from "@/components/ImageWithAuth";

interface Student {
    id: string;
    name: string;
    image: string | null;
    nickname: string;
    faculty: string;
    major: string;
}

interface OffsiteTask {
    id: number;
    workDate: string;
    createdAt: string;
    locationName: string;
    assignedBy: string;
    assignedByEmployeeId: string | null;
    taskDetail: string;
    note?: string;
    isOwner: boolean;
    students: Student[];
}

const RemoteWorkDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id;
    
    const [task, setTask] = useState<OffsiteTask | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTaskDetail = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`/offsite-tasks/${taskId}`);
            setTask(response.data);
        } catch (error) {
            console.error('Error fetching task details:', error);
            Swal.fire('Error', 'ไม่สามารถดึงข้อมูลรายละเอียดได้', 'error');
            router.push('/mentor/remote-work');
        } finally {
            setIsLoading(false);
        }
    }, [taskId, router]);

    useEffect(() => {
        if (taskId) {
            fetchTaskDetail();
        }
    }, [taskId, fetchTaskDetail]);

    const formatFullThaiDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    const handleDelete = async () => {
        if (!task) return;
        
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณต้องการลบรายการมอบหมายงานนี้ใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#61646C',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await axiosInstance.delete(`/offsite-tasks/${task.id}`);
                await Swal.fire({
                    title: 'ลบสำเร็จ!',
                    text: 'ข้อมูลถูกลบเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonColor: '#A80689',
                });
                router.push('/mentor/remote-work');
            } catch (error) {
                console.error('Error deleting task:', error);
                Swal.fire('Error', 'ไม่สามารถลบข้อมูลได้', 'error');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#A80689]/20 border-t-[#A80689] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!task) return null;

    return (
        <div className="h-full bg-gray-50 dark:bg-black py-4 px-4">
            {/* Redesigned Card Container */}
            <div className="mx-auto w-[892px] max-w-[900px] bg-white dark:bg-[#121212] border border-[#EEEEEE] dark:border-gray-800 rounded-[15px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden relative">
                
                {/* Header Section: Date and Actions */}
                <div className="p-8 pb-0 flex flex-col gap-1">
                    <div className="flex justify-end">
                        <span className="text-[12px] text-[#344054] dark:text-gray-400">
                            วันที่ทำการมอบหมาย : {formatFullThaiDate(task.createdAt)}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        {/* Back Button */}
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-[#94969C] dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
                        >
                            <span className="material-symbols-rounded !text-[24px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            <span className="text-[16px] font-medium">ย้อนกลับ</span>
                        </button>

                        {/* Action Buttons */}
                        {task.isOwner && (
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => router.push(`/mentor/remote-work/form?id=${task.id}`)}
                                    className="p-2 text-[#61646C] hover:text-[#A80689] transition-colors"
                                    title="แก้ไข"
                                >
                                    <span className="material-symbols-rounded !text-[24px]">edit_square</span>
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="p-2 text-[#61646C] hover:text-red-500 transition-colors"
                                    title="ลบ"
                                >
                                    <span className="material-symbols-rounded !text-[24px]">delete</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-10 pt-0">
                    <hr className="mb-4 border-[#CECFD2] h-[1px] dark:border-gray-800" />
                    
                    {/* Date Badge */}
                    <div className="inline-block px-4 py-1.5 bg-[#FFF5E2] dark:bg-[#2a1a10] rounded-lg mb-2">
                        <span className="text-[14px] font-bold text-[#333] dark:text-[#ef6820]">
                            {formatFullThaiDate(task.workDate)}
                        </span>
                    </div>

                    {/* Location Title */}
                    <h1 className="text-[24px] font-bold text-[#1F242F] dark:text-white mb-2 leading-tight ">
                        สถานที่ : {task.locationName}
                    </h1>

                    {/* Task Details */}
                    <div className="space-y-2 mb-6">
                        <div className="flex text-[16px] leading-relaxed">
                            <span className="text-[#85888E] dark:text-gray-400 min-w-[170px]">รายละเอียดการปฏิบัติงาน :</span>
                            <span className="text-[#000000] dark:text-gray-100 font-medium">{task.taskDetail}</span>
                        </div>
                        <div className="flex text-[16px]">
                            <span className="text-[#85888E] dark:text-gray-400 min-w-[170px]">หมายเหตุ :</span>
                            <span className="text-[#000000] dark:text-gray-100 font-medium">{task.note || '-'}</span>
                        </div>
                        <div className="flex text-[16px]">
                            <span className="text-[#85888E] dark:text-gray-400 min-w-[170px]">ผู้มอบหมาย :</span>
                            <span className="text-[#000000] dark:text-gray-100 font-medium">
                                {task.assignedBy} {task.assignedByEmployeeId && `<${task.assignedByEmployeeId}>`}
                            </span>
                        </div>
                    </div>

                    {/* Students Section */}
                    <div className="mt-10">
                        <h2 className="text-[16px] font-bold text-[#1F242F] dark:text-white mb-6 flex items-center gap-2">
                            นักศึกษาที่ได้รับมอบหมาย ({task.students.length} คน)
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {task.students.map((student) => (
                                <div key={student.id} className="p-4 bg-white dark:bg-gray-900 border border-[#CECFD2] dark:border-gray-800 rounded-xl flex items-center gap-4 hover:border-[#A80689] transition-colors group">
                                    <div className="w-12 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800 ring-2 ring-transparent group-hover:ring-[#A80689]/20 transition-all">
                                        <ImageWithAuth 
                                            userId={student.id} 
                                            className="w-full h-full object-cover" 
                                            fallbackSrc="/assets/images/user-profile.jpeg"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold text-[#101828] dark:text-white truncate">
                                            {student.name} {student.nickname && `(${student.nickname})`}
                                        </p>
                                        <p className="text-[12px] text-[#667085] dark:text-gray-400 truncate">
                                            {student.major || student.faculty || "นักศึกษาฝึกงาน"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Optional Footer spacing */}
                <div className="h-10"></div>
            </div>
        </div>
    );
};

export default RemoteWorkDetailPage;