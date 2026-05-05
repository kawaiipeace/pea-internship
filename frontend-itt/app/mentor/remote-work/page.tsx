"use client";
import React, { useState, useEffect, useCallback } from "react";
import MonthPicker from "@/components/history/month-picker";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axiosInstance from "@/api/axios";
import Swal from 'sweetalert2';
import ImageWithAuth from "@/components/ImageWithAuth";
import RemoteWorkHeader from "@/components/remote-work/remote-work-header";
import FilterSection from "@/components/remote-work/filter-section";
import RemoteWorkList from "@/components/remote-work/remote-work-list";
import PaginationControl from "@/components/remote-work/pagination-control";

interface Student {
    id: string;
    name: string;
    nickname: string;
    
}

interface OffsiteTask {
    id: number;
    workDate: string;
    createdAt: string;
    locationName: string;
    taskDetail: string;
    assignedBy: string;
    isOwner: boolean;
    students: Student[];
    updatedAt?: string;
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
    const [currentMonth, setCurrentMonth] = useState<number | null>(null);
    const [currentYear, setCurrentYear] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [assignerFilter, setAssignerFilter] = useState({ label: "ทั้งหมด", value: "all" });
    const [activeSortField, setActiveSortField] = useState<'workDate' | 'assignedDate' | null>(null);
    const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
    const [assignedDateSortOrder, setAssignedDateSortOrder] = useState<'desc' | 'asc'>('desc');
    const [isWorkDateDropdownOpen, setIsWorkDateDropdownOpen] = useState(false);
    const [isAssignedDateDropdownOpen, setIsAssignedDateDropdownOpen] = useState(false);
    const [isAssignerDropdownOpen, setIsAssignerDropdownOpen] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchTerm);
            if (searchTerm !== debouncedSearchQuery) {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, debouncedSearchQuery]);

    // Filter States
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Real Data State
    const [tasks, setTasks] = useState<OffsiteTask[]>([]);
    const [meta, setMeta] = useState<MetaData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleMonthSelect = (month: number | null, year: number | null) => {
        setCurrentMonth(month);
        setCurrentYear(year);
        setCurrentPage(1);
    };



    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {
                page: currentPage,
                limit: 10,
                sortBy: activeSortField === 'assignedDate' ? 'createdAt' : (activeSortField === 'workDate' ? 'workDate' : 'workDate'),
                sortOrder: activeSortField === 'assignedDate' ? assignedDateSortOrder : dateSortOrder,
            };

            if (currentMonth !== null && currentYear !== null) {
                params.month = currentMonth + 1;
                params.year = currentYear - 543;
            }

            if (assignerFilter.value === "mine") {
                params.viewMode = "mine";
            } else if (assignerFilter.value === "all") {
                params.viewMode = "all";
            } else {
                params.targetMentorId = assignerFilter.value;
            }

            if (debouncedSearchQuery) {
                params.search = debouncedSearchQuery;
            }

            const response = await axiosInstance.get('/offsite-tasks/mentor', { params });
            setTasks(response.data?.data || []);
            setMeta(response.data?.meta || null);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth, currentYear, currentPage, activeSortField, assignedDateSortOrder, dateSortOrder, assignerFilter, debouncedSearchQuery]);

    const handleDeleteTask = async (id: number) => {
        const result = await Swal.fire({
            html: `
                <div class="flex flex-col items-center">
                    <div class="w-[64px] h-[64px] bg-[#FEE4E2] rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <div class="w-[40px] h-[40px] bg-[#D92D20] rounded-full flex items-center justify-center shadow-md">
                            <span class="material-symbols-rounded text-white !text-[24px]">close</span>
                        </div>
                    </div>
                    <h2 class="text-[20px] font-bold text-[#1C1C1C] dark:text-white mb-2 text-center">ยืนยันการลบ?</h2>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'ลบเลย',
            cancelButtonText: 'ยกเลิก',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[24px] p-10 w-auto min-w-[340px] max-w-[400px] bg-white dark:bg-[#1A1A1A] shadow-xl',
                actions: 'flex gap-4 w-full px-2 mt-4',
                confirmButton: 'flex-1 h-[48px] bg-[#D92D20] hover:bg-[#B42318] text-white rounded-[12px] text-[16px] font-bold order-2 shadow-md transition-colors',
                cancelButton: 'flex-1 h-[48px] bg-white border border-[#1C1C1C] text-[#1C1C1C] rounded-[12px] text-[16px] font-bold order-1 transition-colors'
            }
        });

        if (result.isConfirmed) {
            try {
                await axiosInstance.delete(`/offsite-tasks/${id}`);
                await Swal.fire({
                    html: `
                        <div class="flex flex-col items-center py-4">
                            <div class="mb-6 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[#DCFAE6] shadow-sm">
                                <div class="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#17B26A] text-white">
                                    <span class="material-symbols-rounded !text-[32px]">check</span>
                                </div>
                            </div>
                            <h2 class="text-[22px] font-bold text-[#1C1C1C] dark:text-white mt-2">ลบสำเร็จ</h2>
                        </div>
                    `,
                    showConfirmButton: false,
                    timer: 2000,
                    customClass: {
                        popup: 'rounded-[24px] p-10 w-auto min-w-[300px] bg-white dark:bg-[#1A1A1A] shadow-xl',
                    }
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


    return (
        <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-6 -m-4 sm:-m-6 pb-20">
            {/* Main Container */}
            <div className="mx-auto w-full max-w-[892px] flex flex-col gap-6">
                
                {/* Header Section */}
                <RemoteWorkHeader
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onMonthSelect={handleMonthSelect}
                />

                {/* Filters & Add Button Section */}
                <FilterSection
                    onAddClick={() => router.push('/mentor/remote-work/form')}
                    isWorkDateDropdownOpen={isWorkDateDropdownOpen}
                    setIsWorkDateDropdownOpen={setIsWorkDateDropdownOpen}
                    activeSortField={activeSortField}
                    dateSortOrder={dateSortOrder}
                    onWorkDateSortChange={(order) => {
                        setActiveSortField('workDate');
                        setDateSortOrder(order);
                        setIsWorkDateDropdownOpen(false);
                        setCurrentPage(1);
                    }}
                    isAssignedDateDropdownOpen={isAssignedDateDropdownOpen}
                    setIsAssignedDateDropdownOpen={setIsAssignedDateDropdownOpen}
                    assignedDateSortOrder={assignedDateSortOrder}
                    onAssignedDateSortChange={(order) => {
                        setActiveSortField('assignedDate');
                        setAssignedDateSortOrder(order);
                        setIsAssignedDateDropdownOpen(false);
                        setCurrentPage(1);
                    }}
                    isAssignerDropdownOpen={isAssignerDropdownOpen}
                    setIsAssignerDropdownOpen={setIsAssignerDropdownOpen}
                    assignerFilter={assignerFilter}
                    onAssignerFilterChange={(filter) => {
                        setAssignerFilter(filter);
                        setIsAssignerDropdownOpen(false);
                        setCurrentPage(1);
                    }}
                    staffList={staffList}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                {/* Assignment Cards List */}
                <RemoteWorkList
                    tasks={tasks}
                    isLoading={isLoading}
                    onCardClick={(id) => router.push(`/mentor/remote-work/${id}`)}
                    onEditClick={(e, id) => {
                        e.stopPropagation();
                        router.push(`/mentor/remote-work/form?id=${id}`);
                    }}
                />

                {/* Pagination */}
                <PaginationControl
                    meta={meta}
                    onPageChange={setCurrentPage}
                />

            </div>
        </div>
    );
};

export default RemoteWorkPage;
