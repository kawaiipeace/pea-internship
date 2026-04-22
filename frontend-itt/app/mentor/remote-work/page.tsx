"use client";
import React, { useState, useEffect, useCallback } from "react";
import MonthPicker from "@/components/history/month-picker";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axiosInstance from "@/api/axios";
import Swal from 'sweetalert2';
import ImageWithAuth from "@/components/ImageWithAuth";

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
    isOwner: boolean;
    students: Student[];
}

interface Staff {
    id: string;
    fname: string;
    lname: string;
    displayUsername: string | null;
}

interface MetaData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const RemoteWorkPage = () => {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear() + 543);
    const [currentPage, setCurrentPage] = useState(1);
    const [assignerFilter, setAssignerFilter] = useState({ label: "ทั้งหมด", value: "all" });
    const [activeSortField, setActiveSortField] = useState<'workDate' | 'assignedDate' | null>(null);
    const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
    const [assignedDateSortOrder, setAssignedDateSortOrder] = useState<'desc' | 'asc'>('desc');
    const [isWorkDateDropdownOpen, setIsWorkDateDropdownOpen] = useState(false);
    const [isAssignedDateDropdownOpen, setIsAssignedDateDropdownOpen] = useState(false);
    const [isAssignerDropdownOpen, setIsAssignerDropdownOpen] = useState(false);

    // Filter States
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Real Data State
    const [tasks, setTasks] = useState<OffsiteTask[]>([]);
    const [meta, setMeta] = useState<MetaData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleMonthSelect = (month: number, year: number) => {
        setCurrentMonth(month);
        setCurrentYear(year);
        setCurrentPage(1);
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setCurrentPage(1);
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setCurrentPage(1);
    };



    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {
                month: currentMonth + 1,
                year: currentYear - 543, // Convert Buddhist year to AD
                page: currentPage,
                limit: 10,
                sortBy: activeSortField === 'assignedDate' ? 'createdAt' : (activeSortField === 'workDate' ? 'workDate' : 'workDate'),
                sortOrder: activeSortField === 'assignedDate' ? assignedDateSortOrder : dateSortOrder,
            };

            if (assignerFilter.value === "mine") {
                params.viewMode = "mine";
            } else if (assignerFilter.value === "all") {
                params.viewMode = "all";
            } else {
                params.targetMentorId = assignerFilter.value;
            }

            const response = await axiosInstance.get('/offsite-tasks/mentor', { params });
            setTasks(response.data?.data || []);
            setMeta(response.data?.meta || null);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth, currentYear, currentPage, activeSortField, assignedDateSortOrder, dateSortOrder, assignerFilter]);

    const handleDeleteTask = async (id: number) => {
        const result = await Swal.fire({
            width: '380px',
            html: `
                <div class="flex flex-col items-center">
                    <div class="w-[64px] h-[64px] bg-[#FEE4E2] rounded-full flex items-center justify-center mb-6">
                        <div class="w-[44px] h-[44px] bg-[#D92D20] rounded-full flex items-center justify-center shadow-sm">
                            <span class="material-symbols-rounded text-white text-[24px]">close</span>
                        </div>
                    </div>
                    <h2 class="text-[16px] font-bold text-[#000] mb-2">ยืนยันการลบ?</h2>
                    <p class="text-[14px] text-gray-500 text-center">คุณต้องการลบรายการมอบหมายงานนอกสถานที่นี้ใช่หรือไม่?</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'ลบเลย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#D92D20',
            customClass: {
                popup: 'rounded-[16px] !p-7',
                confirmButton: 'w-[130px] h-[48px] !bg-[#D92D20] rounded-[8px] text-[16px] text-white  !mx-2',
                cancelButton: 'w-[130px] h-[48px] !bg-white rounded-[8px] text-[16px] border-2 border-black !text-black !mx-2'
            },
            reverseButtons: true,
            buttonsStyling: false,
        });

        if (result.isConfirmed) {
            try {
                await axiosInstance.delete(`/offsite-tasks/${id}`);
                await Swal.fire({
                    width: '380px',
                    html: `
                        <div class="flex flex-col items-center">
                            <div class="w-[64px] h-[64px] bg-[#DCFAE6] rounded-full flex items-center justify-center mb-6">
                                <div class="w-[44px] h-[44px] bg-[#17B26A] rounded-full flex items-center justify-center shadow-sm">
                                    <span class="material-symbols-rounded text-white text-[24px]">check</span>
                                </div>
                            </div>
                            <h2 class="text-[16px] font-bold text-[#000] mb-2">ลบสำเร็จ</h2>
                        </div>
                    `,
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#17B26A',
                    customClass: {
                        popup: 'rounded-[16px] !p-7',
                        confirmButton: 'w-[130px] h-[48px] !bg-[#17B26A] rounded-[8px] text-[16px] text-white '
                    },
                    buttonsStyling: false,
                });
                fetchTasks();
            } catch (error) {
                console.error('Error deleting task:', error);
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด!',
                    text: 'ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง',
                    confirmButtonColor: '#A80689',
                });
            }
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Get current user profile to find departmentId
                const profileRes = await axiosInstance.get('/user/profile');
                const user = profileRes.data;
                setCurrentUser(user);

                // 2. Get staff in the same department
                if (user.departmentId) {
                    const staffRes = await axiosInstance.get('/user/staff', {
                        params: { departmentId: user.departmentId }
                    });
                    const list = staffRes.data || [];
                    setStaffList(list);
                }
            } catch (error) {
                console.error('Error fetching initial filter data:', error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const formatThaiDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    const formatFullThaiDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black p-6 -m-6 pb-20">
            {/* Main Container */}
            <div className="mx-auto w-full max-w-[892px] flex flex-col gap-6">
                
                {/* Header Section */}
                <div className="flex justify-between items-start pt-4">
                    <div>
                        <h1 className="text-[24px] font-bold text-black dark:text-white mb-1">
                            ปฏิบัติงานนอกสถานที่
                        </h1>
                        <p className="text-[16px] text-[#61646C] dark:text-gray-400">
                            กำหนดการวันที่นักศึกษาต้องไปปฏิบัติงานนอกสถานที่
                        </p>
                    </div>

                    {/* Month Navigator */}
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 shadow-sm">
                        <button onClick={handlePrevMonth} className="p-1 hover:text-primary transition-colors text-gray-500">
                            <span className="material-symbols-rounded !text-[20px]">chevron_left</span>
                        </button>
                        <MonthPicker
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            onSelect={handleMonthSelect}
                        />
                        <button onClick={handleNextMonth} className="p-1 hover:text-primary transition-colors text-gray-500">
                            <span className="material-symbols-rounded !text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Section Header & Add Button */}
                <div className="flex justify-between items-center mt-2">
                    <h2 className="text-[16px] font-bold text-black dark:text-white">
                        รายการประวัติการลงเวลา
                    </h2>
                    <button 
                        onClick={() => router.push('/mentor/remote-work/form')}
                        style={{ width: '236px', height: '44px', borderRadius: '5px' }}
                        className="bg-[#A80689] hover:bg-[#8e0574] text-white  flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                    >
                        <span className="material-symbols-rounded !text-[24px]">add</span>
                        เพิ่มวันทำงานนอกสถานที่
                    </button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3 items-center">
                    
                    {/* Work Date Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsWorkDateDropdownOpen(!isWorkDateDropdownOpen)}
                            className={`flex items-center gap-4 bg-white dark:bg-gray-800 border ${activeSortField === 'workDate' ? 'border-[#A80689]' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-3 py-2 text-[12px] font-medium text-[#333] shadow-sm min-w-[150px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}
                        >
                            วันที่ปฏิบัติงาน {activeSortField === 'workDate' ? ` : ${dateSortOrder === 'desc' ? 'มากไปน้อย' : 'น้อยไปมาก'}` : ''}
                            <span className={`material-symbols-rounded !text-[18px] transition-transform ${isWorkDateDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {isWorkDateDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[40]" onClick={() => setIsWorkDateDropdownOpen(false)}></div>
                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[50] overflow-hidden py-1">
                                    <button 
                                        onClick={() => {
                                            setActiveSortField('workDate');
                                            setDateSortOrder('desc');
                                            setIsWorkDateDropdownOpen(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${activeSortField === 'workDate' && dateSortOrder === 'desc' ? 'bg-[#FDF2FE] text-[#A80689] font-medium' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        มากไปน้อย
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setActiveSortField('workDate');
                                            setDateSortOrder('asc');
                                            setIsWorkDateDropdownOpen(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${activeSortField === 'workDate' && dateSortOrder === 'asc' ? 'bg-[#FDF2FE] text-[#A80689] font-medium' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        น้อยไปมาก
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Assigned Date Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsAssignedDateDropdownOpen(!isAssignedDateDropdownOpen)}
                            className={`flex items-center gap-4 bg-white dark:bg-gray-800 border ${activeSortField === 'assignedDate' ? 'border-[#A80689]' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-3 py-2 text-[12px] font-medium text-[#333] shadow-sm min-w-[150px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}
                        >
                            วันที่มอบหมาย {activeSortField === 'assignedDate' ? ` : ${assignedDateSortOrder === 'desc' ? 'มากไปน้อย' : 'น้อยไปมาก'}` : ''}
                            <span className={`material-symbols-rounded !text-[18px] transition-transform ${isAssignedDateDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {isAssignedDateDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[40]" onClick={() => setIsAssignedDateDropdownOpen(false)}></div>
                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[50] overflow-hidden py-1">
                                    <button 
                                        onClick={() => {
                                            setActiveSortField('assignedDate');
                                            setAssignedDateSortOrder('desc');
                                            setIsAssignedDateDropdownOpen(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${activeSortField === 'assignedDate' && assignedDateSortOrder === 'desc' ? 'bg-[#FDF2FE] text-[#A80689] font-medium' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        มากไปน้อย
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setActiveSortField('assignedDate');
                                            setAssignedDateSortOrder('asc');
                                            setIsAssignedDateDropdownOpen(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${activeSortField === 'assignedDate' && assignedDateSortOrder === 'asc' ? 'bg-[#FDF2FE] text-[#A80689] font-medium' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        น้อยไปมาก
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Assigner Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsAssignerDropdownOpen(!isAssignerDropdownOpen)}
                            className={`flex items-center gap-4 bg-white dark:bg-gray-800 border ${assignerFilter.value !== 'all' ? 'border-[#A80689]' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-3 py-2 text-[12px] font-medium text-[#333] shadow-sm min-w-[150px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors`}
                        >
                            ผู้มอบหมาย : {assignerFilter.label}
                            <span className={`material-symbols-rounded !text-[18px] transition-transform ${isAssignerDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {isAssignerDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-[40]" onClick={() => setIsAssignerDropdownOpen(false)}></div>
                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[50] overflow-hidden py-1 max-h-[300px] overflow-y-auto">
                                    {/* All Option */}
                                    <button 
                                        onClick={() => {
                                            setAssignerFilter({ label: "ทั้งหมด", value: "all" });
                                            setIsAssignerDropdownOpen(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${assignerFilter.value === 'all' ? 'bg-[#FDF2FE] text-[#A80689] font-medium' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        ทั้งหมด
                                    </button>
                                    {/* Staff List */}
                                    {staffList.map((staff) => (
                                        <button 
                                            key={staff.id}
                                            onClick={() => {
                                                setAssignerFilter({ 
                                                    label: `${staff.fname} ${staff.lname}`, 
                                                    value: staff.id 
                                                });
                                                setIsAssignerDropdownOpen(false);
                                                setCurrentPage(1);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${assignerFilter.value === staff.id ? 'bg-[#FDF2FE] text-[#A80689] font-medium' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                        >
                                            {staff.fname} {staff.lname}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Assignment Cards List */}
                <div className="flex flex-col gap-4 mt-2">
                    {isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-full h-[120px] bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-[15px] p-4 flex gap-4 items-center animate-pulse">
                                    <div className="w-[80px] h-[80px] bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0"></div>
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4"></div>
                                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (tasks || []).length > 0 ? (
                        (tasks || []).map((item) => (
                            <div key={item.id} className="w-full min-h-[120px] bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-[15px] p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow relative">
                                {/* Date Badge */}
                                <div className="w-[80px] h-[80px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-xl flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[16px] font-bold text-black dark:text-white leading-tight text-center px-2">
                                        {formatThaiDate(item.workDate).split(' ')[0]} {formatThaiDate(item.workDate).split(' ')[1]}
                                    </span>
                                    <span className="text-[16px] font-bold text-black dark:text-white leading-tight">
                                        {formatThaiDate(item.workDate).split(' ')[2]}
                                    </span>
                                </div>

                                {/* Card Content */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    {/* Move date to below student section */}

                                    <div className="space-y-1 mt-1">
                                        <h3 className="text-[16px] text-[#344054] dark:text-gray-100 flex items-center">
                                            <span className="font-bold mr-1">สถานที่ :</span> {item.locationName}
                                        </h3>
                                        <h3 className="text-[16px] text-[#344054] dark:text-gray-100 flex items-center">
                                            <span className="font-bold mr-1">ผู้มอบหมาย :</span> {item.assignedBy}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[16px] font-bold text-[#344054] dark:text-gray-100">นักศึกษาที่ได้รับมอบหมาย :</span>
                                            <div className="flex -space-x-2">
                                                {(item.students || []).slice(0, 4).map((student: Student, idx: number) => (
                                                    <div key={idx} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800 bg-gray-200" title={student.name}>
                                                        <ImageWithAuth 
                                                            userId={student.id} 
                                                            className="w-full h-full object-cover" 
                                                            fallbackSrc="/assets/images/user-profile.jpeg"
                                                        />
                                                    </div>
                                                ))}
                                                {(item.students || []).length > 4 && (
                                                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-[#FDF2FE] flex items-center justify-center text-[10px] font-bold text-[#A80689] ring-1 ring-gray-100 dark:ring-gray-800">
                                                        +{item.students.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-[12px] text-[#344054] dark:text-gray-400 mt-0.5">
                                            วันที่ทำการมอบหมาย : {formatFullThaiDate(item.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Right Side - Aligned with the first line (Location) */}
                                <div className="flex items-center gap-0 ml-4 self-start mt-1">
                                    {item.isOwner && (
                                        <>
                                            <button 
                                                onClick={() => router.push(`/mentor/remote-work/form?id=${item.id}`)}
                                                className="p-1 text-gray-500 hover:text-[#A80689] transition-colors"
                                            >
                                                <span className="material-symbols-rounded !text-[20px]">edit_square</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTask(item.id)}
                                                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-rounded !text-[20px]">delete</span>
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => router.push(`/mentor/remote-work/${item.id}`)}
                                        className="ml-2 bg-[#E4E7EC] dark:bg-gray-800 text-[#333] dark:text-gray-300 px-4 py-2 rounded-[5px] text-[12px]  hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors hover:text-[#A80689]"
                                    >
                                        ดูรายละเอียด
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#121212]">
                            {/* Illustration */}
                            <div className="relative w-[280px] h-[200px] mb-6 flex items-center justify-center">
                                {/* Base Shadow */}
                                <div className="absolute bottom-4 w-[120px] h-[30px] bg-[#F2F4F7] dark:bg-gray-800 rounded-[100%] blur-sm"></div>
                                
                                {/* Calendar Body */}
                                <div className="relative w-[100px] h-[110px] bg-white dark:bg-gray-900 border-[6px] border-[#D0D5DD] dark:border-gray-700 rounded-[14px] shadow-sm flex flex-col overflow-hidden">
                                    <div className="h-4 bg-[#D0D5DD] dark:bg-gray-700 w-full"></div>
                                    <div className="flex-1 p-2 flex flex-col gap-2">
                                        <div className="h-1.5 w-full bg-[#EAECF0] dark:bg-gray-800 rounded-full"></div>
                                        <div className="h-1.5 w-10 bg-[#EAECF0] dark:bg-gray-800 rounded-full"></div>
                                        <div className="mt-2 h-8 w-8 bg-[#F2F4F7] dark:bg-gray-800 rounded-md self-center flex items-center justify-center">
                                            <span className="material-symbols-rounded !text-[16px] text-[#98A2B3]">public</span>
                                        </div>
                                    </div>
                                    {/* Calendar Rings */}
                                    <div className="absolute -top-1 left-4 w-1.5 h-3 bg-[#98A2B3] rounded-full"></div>
                                    <div className="absolute -top-1 right-4 w-1.5 h-3 bg-[#98A2B3] rounded-full"></div>
                                </div>

                                {/* Checklist Attachment Overlay */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 translate-y-2 translate-x-4 w-[75px] h-[90px] bg-white dark:bg-gray-900 border-[4px] border-[#EAECF0] dark:border-gray-800 rounded-[10px] shadow-md flex flex-col p-2 gap-2">
                                    <div className="h-1.5 w-8 bg-[#D0D5DD] dark:bg-gray-700 rounded-full"></div>
                                    <div className="flex flex-col gap-1.5 mt-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 bg-[#EAECF0] dark:bg-gray-800 rounded-[2px]"></div>
                                                <div className="h-1 w-full bg-[#F2F4F7] dark:bg-gray-800 rounded-full"></div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Globe Overlay on Checklist */}
                                    <div className="absolute -bottom-1 -left-1 w-7 h-7 bg-[#F2F4F7] dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">
                                        <span className="material-symbols-rounded !text-[14px] text-[#98A2B3]">public</span>
                                    </div>
                                </div>

                                {/* X Mark Overlay */}
                                <div className="absolute bottom-6 right-16 w-10 h-10 flex items-center justify-center opacity-30">
                                    <span className="material-symbols-rounded !text-[44px] text-[#98A2B3] rotate-45">add</span>
                                </div>
                            </div>

                            <div className="text-center space-y-5">
                                <h3 className="text-[24px]  text-[#61646C] dark:text-white">
                                    ไม่พบกำหนดการปฏิบัติงานนอกสถานที่
                                </h3>
                                <div className="text-[16px] sm:text-[16px] text-[#61646C] dark:text-gray-400 space-y-1">
                                    <p>ยังไม่พบกำหนดการปฏิบัติงานนอกสถานที่ในขณะนี้</p>
                                    <p>กรุณาตรวจสอบอีกครั้งในภายหลัง หรือปรับเงื่อนไขการกรอง</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                    <div className="flex justify-end items-center mt-6 mb-10">
                        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[14px] overflow-hidden shadow-sm">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={meta.page === 1}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-rounded !text-[20px]">chevron_left</span>
                            </button>
                            
                            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
                                <button 
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 flex items-center justify-center text-[14px] font-bold border-r border-gray-200 dark:border-gray-700 transition-colors ${meta.page === page ? 'bg-[#E4E7EC] dark:bg-gray-700 text-[#344054] dark:text-white' : 'text-[#344054] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    {page}
                                </button>
                            ))}
                            
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(meta.totalPages, prev + 1))}
                                disabled={meta.page === meta.totalPages}
                                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-rounded !text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default RemoteWorkPage;
