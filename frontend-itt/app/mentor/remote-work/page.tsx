"use client";
import React, { useState } from "react";
import MonthPicker from "@/components/history/month-picker";
import { useRouter } from "next/navigation";
import Image from "next/image";

const RemoteWorkPage = () => {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear() + 543);
    const [currentPage, setCurrentPage] = useState(1);
    const [assignerFilter, setAssignerFilter] = useState("ทั้งหมด");
    const [isAssignerDropdownOpen, setIsAssignerDropdownOpen] = useState(false);
    const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
    const [assignedDateSortOrder, setAssignedDateSortOrder] = useState<'desc' | 'asc'>('desc');
    const [activeSortField, setActiveSortField] = useState<'workDate' | 'assignedDate'>('workDate');

    const handleMonthSelect = (month: number, year: number) => {
        setCurrentMonth(month);
        setCurrentYear(year);
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Dummy Data for the list
    // Dummy Data     // Dummy Data for the list
    const remoteWorkData = [
        {
            id: 1,
            workDate: "15 เม.ย. 2569",
            isoDate: "2026-04-15",
            location: "สำนักงานตำรวจแห่งชาติ",
            assigner: "มั่นคง ทรงดี",
            assignerId: "<รหัสพนักงาน>",
            assignedDate: "7 เมษายน 2569",
            isoAssignedDate: "2026-04-07",
            students: [
                { id: 1, avatar: "https://i.pravatar.cc/150?u=1" },
                { id: 2, avatar: "https://i.pravatar.cc/150?u=2" },
                { id: 3, avatar: "https://i.pravatar.cc/150?u=3" },
                { id: 4, avatar: "https://i.pravatar.cc/150?u=4" },
            ]
        },
        {
            id: 2,
            workDate: "14 เม.ย. 2569",
            isoDate: "2026-04-14",
            location: "สำนักงานตำรวจแห่งชาติ",
            assigner: "มั่นคง ทรงดี",
            assignerId: "<รหัสพนักงาน>",
            assignedDate: "7 เมษายน 2569",
            isoAssignedDate: "2026-04-07",
            students: [
                { id: 1, avatar: "https://i.pravatar.cc/150?u=1" },
                { id: 2, avatar: "https://i.pravatar.cc/150?u=2" },
                { id: 3, avatar: "https://i.pravatar.cc/150?u=3" },
                { id: 4, avatar: "https://i.pravatar.cc/150?u=4" },
            ]
        },
        {
            id: 3,
            workDate: "13 เม.ย. 2569",
            isoDate: "2026-04-13",
            location: "สำนักงานตำรวจแห่งชาติ",
            assigner: "มั่นคง ทรงดี",
            assignerId: "<รหัสพนักงาน>",
            assignedDate: "7 เมษายน 2569",
            isoAssignedDate: "2026-04-07",
            students: [
                { id: 1, avatar: "https://i.pravatar.cc/150?u=1" },
                { id: 2, avatar: "https://i.pravatar.cc/150?u=2" },
                { id: 3, avatar: "https://i.pravatar.cc/150?u=3" },
                { id: 4, avatar: "https://i.pravatar.cc/150?u=4" },
            ]
        },
        {
            id: 4,
            workDate: "12 เม.ย. 2569",
            isoDate: "2026-04-12",
            location: "สำนักงานตำรวจแห่งชาติ",
            assigner: "มั่นคง ทรงดี",
            assignerId: "<รหัสพนักงาน>",
            assignedDate: "7 เมษายน 2569",
            isoAssignedDate: "2026-04-07",
            students: [
                { id: 1, avatar: "https://i.pravatar.cc/150?u=1" },
                { id: 2, avatar: "https://i.pravatar.cc/150?u=2" },
                { id: 3, avatar: "https://i.pravatar.cc/150?u=3" },
                { id: 4, avatar: "https://i.pravatar.cc/150?u=4" },
            ]
        },
        {
            id: 5,
            workDate: "9 เม.ย. 2569",
            isoDate: "2026-04-09",
            location: "สำนักงานตำรวจแห่งชาติ",
            assigner: "มั่นคง ทรงดี",
            assignerId: "<รหัสพนักงาน>",
            assignedDate: "7 เมษายน 2569",
            isoAssignedDate: "2026-04-07",
            students: [
                { id: 1, avatar: "https://i.pravatar.cc/150?u=1" },
                { id: 2, avatar: "https://i.pravatar.cc/150?u=2" },
                { id: 3, avatar: "https://i.pravatar.cc/150?u=3" },
                { id: 4, avatar: "https://i.pravatar.cc/150?u=4" },
            ]
        }
    ];

    const filteredAndSortedData = remoteWorkData
        .filter((item) => {
            const date = new Date(item.isoDate);
            const monthMatches = date.getMonth() === currentMonth;
            const yearMatches = (date.getFullYear() + 543) === currentYear;
            return monthMatches && yearMatches;
        })
        .sort((a, b) => {
            if (activeSortField === 'workDate') {
                const dateA = new Date(a.isoDate).getTime();
                const dateB = new Date(b.isoDate).getTime();
                return dateSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else {
                const dateA = new Date(a.isoAssignedDate).getTime();
                const dateB = new Date(b.isoAssignedDate).getTime();
                return assignedDateSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            }
        });

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
                    {/* Sort By Date */}
                    <button 
                        onClick={() => {
                            setActiveSortField('workDate');
                            setDateSortOrder(dateSortOrder === 'desc' ? 'asc' : 'desc');
                        }}
                        className={`flex items-center gap-2 bg-white dark:bg-gray-800 border ${activeSortField === 'workDate' ? 'border-[#A80689]' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-3 py-2 text-[12px] font-medium shadow-sm transition-all`}
                    >
                        วันที่ปฏิบัติงาน
                        <div className={`${activeSortField === 'workDate' ? 'bg-[#A80689]' : 'bg-gray-400'} rounded-full w-4 h-4 flex items-center justify-center text-white transition-colors`}>
                            <span className="material-symbols-rounded !text-[12px]">{activeSortField === 'workDate' ? (dateSortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward') : 'arrow_downward'}</span>
                        </div>
                    </button>

                    {/* Filter By Assign Date */}
                    <button 
                        onClick={() => {
                            setActiveSortField('assignedDate');
                            setAssignedDateSortOrder(assignedDateSortOrder === 'desc' ? 'asc' : 'desc');
                        }}
                        className={`flex items-center gap-2 bg-white dark:bg-gray-800 border ${activeSortField === 'assignedDate' ? 'border-[#A80689]' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-3 py-2 text-[12px] font-medium shadow-sm transition-all`}
                    >
                        วันที่มอบหมาย
                        <div className={`${activeSortField === 'assignedDate' ? 'bg-[#A80689]' : 'bg-gray-400'} rounded-full w-4 h-4 flex items-center justify-center text-white transition-colors`}>
                            <span className="material-symbols-rounded !text-[12px]">{activeSortField === 'assignedDate' ? (assignedDateSortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward') : 'arrow_downward'}</span>
                        </div>
                    </button>

                    {/* Assigner Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsAssignerDropdownOpen(!isAssignerDropdownOpen)}
                            className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[12px] font-medium text-[#333] shadow-sm min-w-[150px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                            ผู้มอบหมาย : {assignerFilter}
                            <span className={`material-symbols-rounded !text-[18px] transition-transform ${isAssignerDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        {isAssignerDropdownOpen && (
                            <>
                                {/* Backdrop to close dropdown */}
                                <div className="fixed inset-0 z-[40]" onClick={() => setIsAssignerDropdownOpen(false)}></div>
                                
                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-[50] overflow-hidden py-1">
                                    <button 
                                        onClick={() => {
                                            setAssignerFilter("ทั้งหมด");
                                            setIsAssignerDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${assignerFilter === "ทั้งหมด" ? 'bg-[#FDF2FE] text-[#A80689] font-medium' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        ทั้งหมด
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setAssignerFilter("ที่ฉันสร้าง");
                                            setIsAssignerDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${assignerFilter === "ที่ฉันสร้าง" ? 'bg-[#FDF2FE] text-[#A80689] font-medium' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        ที่ฉันสร้าง
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Assignment Cards List */}
                <div className="flex flex-col gap-4 mt-2">
                    {filteredAndSortedData.length > 0 ? (
                        filteredAndSortedData.map((item) => (
                            <div key={item.id} className="w-[892px] h-[120px] bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-[15px] p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow relative">
                                {/* Date Badge */}
                                <div className="w-[80px] h-[80px] bg-[#FDF2FE] dark:bg-[#251025] border border-[#F9E1F9] dark:border-[#3d1a3d] rounded-xl flex flex-col items-center justify-center shrink-0">
                                    <span className="text-[16px] font-bold text-black dark:text-white leading-tight text-center px-2">
                                        {item.workDate.split(' ')[0]} {item.workDate.split(' ')[1]}
                                    </span>
                                    <span className="text-[16px] font-bold text-black dark:text-white leading-tight">
                                        {item.workDate.split(' ')[2]}
                                    </span>
                                </div>

                                {/* Card Content */}
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    {/* Assign Date (Desktop Position) */}
                                    <div className="absolute top-3 right-5 text-[12px] text-[#344054] ">
                                        วันที่ทำการมอบหมาย : {item.assignedDate}
                                    </div>

                                    <div className="space-y-1 mt-1">
                                        <h3 className="text-[16px] text-[#344054] dark:text-gray-100 flex items-center">
                                            <span className="font-bold mr-1">สถานที่ :</span> {item.location}
                                        </h3>
                                        <h3 className="text-[16px] text-[#344054] dark:text-gray-100 flex items-center">
                                            <span className="font-bold mr-1">ผู้มอบหมาย :</span> {item.assigner} {item.assignerId}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[16px] font-bold text-[#344054] dark:text-gray-100">นักศึกษาที่ได้รับมอบหมาย :</span>
                                            <div className="flex -space-x-2">
                                                {item.students.map((student, idx) => (
                                                    <div key={idx} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800">
                                                        <img src={student.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-[#FDF2FE] flex items-center justify-center text-[10px] font-bold text-[#A80689] ring-1 ring-gray-100 dark:ring-gray-800">
                                                    +1
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Right Side */}
                                <div className="flex items-center gap-0 ml-4">
                                    <button className="p-1 text-gray-500 hover:text-primary transition-colors">
                                        <span className="material-symbols-rounded !text-[20px]">edit_square</span>
                                    </button>
                                    <button className="p-1 text-gray-500 hover:text-red-500 transition-colors">
                                        <span className="material-symbols-rounded !text-[20px]">delete</span>
                                    </button>
                                    <button className="ml-2 bg-[#E4E7EC] dark:bg-gray-800 text-[#333] dark:text-gray-300 px-4 py-2 rounded-[5px] text-[12px]  hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
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
                {filteredAndSortedData.length > 0 && (
                    <div className="flex justify-end items-center mt-6 mb-10">
                        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[14px] overflow-hidden shadow-sm">
                            <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700 transition-colors">
                                <span className="material-symbols-rounded !text-[20px]">chevron_left</span>
                            </button>
                            {[1, 2, "...", 9, 10].map((page, idx) => (
                                <button 
                                    key={idx}
                                    className={`w-10 h-10 flex items-center justify-center text-[14px] font-bold border-r border-gray-200 dark:border-gray-700 transition-colors ${page === 1 ? 'bg-[#E4E7EC] dark:bg-gray-700 text-[#344054] dark:text-white' : 'text-[#344054] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
