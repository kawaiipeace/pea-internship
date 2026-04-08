"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

const RemoteWorkFormPage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black py-10 px-4">
            {/* Main Form Container */}
            <div 
                className="mx-auto w-[700px] h-full bg-white dark:bg-[#121212] border border-[#CECFD2] dark:border-gray-700 rounded-[15px] shadow-sm flex flex-col p-10 overflow-hidden"
                
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-[24px] font-bold text-black dark:text-white mb-1">
                        ปฏิบัติงานนอกสถานที่
                    </h1>
                    <p className="text-[16px] text-[#61646C] dark:text-gray-400">
                        กำหนดการวันที่นักศึกษาต้องไปปฏิบัติงานนอกสถานที่
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
                                type="text" 
                                placeholder="วว/ดด/ปป - วว/ดด/ปป" 
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
                            >
                                <option value="" disabled>ชื่อนักศึกษา</option>
                            </select>
                            <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
                        </div>
                        
                        {/* Add Student dashed button */}
                        <button className="w-full h-[54px] border-2 border-dashed border-[#CECFD2] dark:border-gray-700 rounded-[8px] flex items-center justify-center gap-2 text-gray-400 hover:text-[#A80689] hover:border-[#A80689] transition-all group">
                            <span className="material-symbols-rounded !text-[24px]">add</span>
                            <span className="text-[16px] font-medium">เพิ่มนักศึกษา</span>
                        </button>
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
                        className="flex-1 h-[54px] bg-[#A80689] text-white rounded-[8px] text-[16px] font-bold hover:bg-[#8e0574] transition-colors shadow-md"
                    >
                        เพิ่มนักศึกษาปฏิบัติงานนอกสถานที่
                    </button>
                </div>
            </div>


        </div>
    );
};

export default RemoteWorkFormPage;
