"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosInstance from '@/api/axios';
import Swal from 'sweetalert2';

interface Student {
    id: string;
    name: string;
    image: string | null;
}

interface OffsiteTask {
    id: number;
    workDate: string;
    createdAt: string;
    locationName: string;
    assignedBy: string;
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

    useEffect(() => {
        const fetchTaskDetail = async () => {
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
        };
        if (taskId) {
            fetchTaskDetail();
        }
    }, [taskId, router]);

    const formatFullThaiDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษาายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
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
        <div className="min-h-screen bg-gray-50 dark:bg-black py-10 px-4">
            <div className="mx-auto w-full max-w-[800px] bg-white dark:bg-[#121212] border border-[#CECFD2] dark:border-gray-700 rounded-[15px] shadow-sm flex flex-col p-10">
                
                {/* Header with Back Button */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center gap-1 text-[#A80689] font-medium mb-4 hover:underline transition-all"
                        >
                            <span className="material-symbols-rounded !text-[20px]">arrow_back</span>
                            กลับไปหน้าก่อนหน้า
                        </button>
                        <h1 className="text-[24px] font-bold text-black dark:text-white mb-1">
                            รายละเอียดการปฏิบัติงานนอกสถานที่
                        </h1>
                        <p className="text-[16px] text-[#61646C] dark:text-gray-400">
                            ข้อมูลรายละเอียดการมอบหมายงานนอกสถานที่
                        </p>
                    </div>
                    {task.isOwner && (
                        <button 
                            onClick={() => router.push(`/mentor/remote-work/form?id=${task.id}`)}
                            className="bg-[#FDF2FE] text-[#A80689] border border-[#F9E1F9] px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-[#A80689] hover:text-white transition-all"
                        >
                            <span className="material-symbols-rounded !text-[20px]">edit</span>
                            แก้ไขข้อมูล
                        </button>
                    )}
                </div>

                <div className="space-y-8">
                    {/* 1. Date & Location Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#FDF2FE] dark:bg-[#251025] rounded-2xl p-6 border border-[#F9E1F9] dark:border-[#3d1a3d]">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-rounded text-[#A80689]">calendar_today</span>
                                <span className="text-[14px] font-bold text-[#A80689] uppercase tracking-wider">วันที่ปฏิบัติงาน</span>
                            </div>
                            <p className="text-[20px] font-bold text-black dark:text-white">
                                {formatFullThaiDate(task.workDate)}
                            </p>
                            <p className="text-[12px] text-gray-500 mt-2 italic">
                                วันที่มอบหมาย: {formatFullThaiDate(task.createdAt)}
                            </p>
                        </div>

                        <div className="bg-[#FDF2FE] dark:bg-[#251025] rounded-2xl p-6 border border-[#F9E1F9] dark:border-[#3d1a3d]">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-rounded text-[#A80689]">location_on</span>
                                <span className="text-[14px] font-bold text-[#A80689] uppercase tracking-wider">สถานที่</span>
                            </div>
                            <p className="text-[20px] font-bold text-black dark:text-white">
                                {task.locationName}
                            </p>
                            <p className="text-[12px] text-gray-500 mt-2">
                                ผู้มอบหมาย: {task.assignedBy}
                            </p>
                        </div>
                    </div>

                    {/* 2. Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[#A80689] rounded-full"></div>
                            <h2 className="text-[18px] font-bold text-black dark:text-white">รายละเอียดงาน</h2>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                            <p className="text-[16px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {task.taskDetail}
                            </p>
                        </div>
                    </div>

                    {/* 3. Note */}
                    {task.note && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-[#A80689] rounded-full"></div>
                                <h2 className="text-[18px] font-bold text-black dark:text-white">หมายเหตุ</h2>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800 border-l-4 border-l-[#A80689]">
                                <p className="text-[16px] text-gray-700 dark:text-gray-300 italic">
                                    {task.note}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 4. Students */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-[#A80689] rounded-full"></div>
                            <h2 className="text-[18px] font-bold text-black dark:text-white">
                                นักศึกษาที่เข้าร่วม ({task.students.length} คน)
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {task.students.map((student) => (
                                <div key={student.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all shadow-sm">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm shrink-0 bg-gray-100">
                                        {student.image ? (
                                            <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg text-gray-400 font-bold bg-gray-200">
                                                {student.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-black dark:text-white">{student.name}</p>
                                        <p className="text-[12px] text-gray-500">รหัสนักศึกษา: {student.id}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button 
                        onClick={() => router.back()}
                        className="px-8 py-3 bg-[#61646C] text-white rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95"
                    >
                        ปิดหน้าต่างนี้
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RemoteWorkDetailPage;