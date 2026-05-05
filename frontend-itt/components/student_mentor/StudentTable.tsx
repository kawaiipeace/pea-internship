import React from 'react';
import ImageWithAuth from '@/components/ImageWithAuth';
import AttendanceBadge from './AttendanceBadge';
import ConsiderationBadge from './ConsiderationBadge';

interface StudentTableProps {
    records: any[];
    router: any;
}

const StudentTable: React.FC<StudentTableProps> = ({ records, router }) => {
    return (
        <div className="panel p-0 border-[#CECFD2] border-[1px] shadow-sm overflow-hidden rounded-xl">
            <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full border-collapse table-auto min-w-[1100px]">
                    <thead className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                        <tr>
                            <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">นักศึกษา</th>
                            <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">สถานะวันนี้</th>
                            <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">สถิติการมาฝึกงาน</th>
                            <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">ชั่วโมงทำงาน</th>
                            <th className="py-5 px-6 text-center text-[#111827] font-normal text-[14px] whitespace-nowrap">ผลการพิจารณา</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2F4F7]">
                        {records.map((student) => (
                            <tr
                                key={student.id}
                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/mentor/students/${student.id}`)}
                            >
                                <td className="py-4 px-6 text-left">
                                    <div className="flex items-center gap-4">
                                        <ImageWithAuth
                                            userId={student.id}
                                            className="w-12 h-12 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                                            fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                                        />
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-[#111827] text-[14px] whitespace-nowrap">
                                                    {student.name.split(' (')[0]}
                                                </span>
                                                {student.nickname && (
                                                    <span className="font-bold text-[#000000] text-[14px] whitespace-nowrap">
                                                        ({student.nickname})
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[12px] text-[#9ca3af] whitespace-nowrap font-medium">{student.role}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex justify-center">
                                        <div className="w-[124px] flex justify-start">
                                            <AttendanceBadge status={student.status} />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex justify-center gap-2">
                                        <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                                            <span className="text-[18px] font-bold text-[#079455] leading-none">{student.attendance.present}</span>
                                            <span className="text-[11px] text-[#61646C] font-medium mt-0">มา</span>
                                        </div>
                                        <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                                            <span className="text-[18px] font-bold text-[#FDB022] leading-none">{student.attendance.late}</span>
                                            <span className="text-[11px] text-[#61646C] font-medium mt-0">สาย</span>
                                        </div>
                                        <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                                            <span className="text-[18px] font-bold text-[#0FA3ED] leading-none">{student.attendance.leave}</span>
                                            <span className="text-[11px] text-[#61646C] font-medium mt-0">ลา</span>
                                        </div>
                                        <div className="w-[52px] h-[52px] flex flex-col items-center justify-center border-2 border-[#94969C] bg-white rounded-[5px]">
                                            <span className="text-[18px] font-bold text-[#D92D20] leading-none">{student.attendance.absent}</span>
                                            <span className="text-[11px] text-[#61646C] font-medium mt-0">ขาด</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto">
                                        <div className="flex items-center justify-end px-1 mb-1">
                                            <span className="text-[10px] text-[#9ca3af] font-medium uppercase tracking-wider">
                                                <b className="text-[#a80689] text-[14px]">{student.progress.current}</b>
                                                / {student.progress.total} ชั่วโมง
                                            </span>
                                        </div>
                                        <div className="w-full h-[14px] bg-[#f3f4f6] rounded-full overflow-hidden shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                                            <div
                                                className="h-full bg-[#A80689] rounded-full transition-all duration-700 shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.3),inset_0px_1px_2px_rgba(255,255,255,0.3)]"
                                                style={{ width: `${student.progress.percent}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 px-1 mt-1">
                                            <span
                                                className="material-symbols-outlined select-none"
                                                style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: (student.statusType === 'ended' || student.statusType === 'last-day') ? '#B42318' : '#85888E' }}
                                            >
                                                schedule
                                            </span>
                                            <span className={`text-[12px] font-normal ${student.statusType === 'ended' ? 'text-[#D92D20]' :
                                                student.statusType === 'last-day' ? 'text-[#D92D20]' : 'text-[#6b7280]'
                                                }`}>
                                                {student.statusMessage}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-center w-full">
                                        <ConsiderationBadge 
                                            considerationStatus={student.considerationStatus} 
                                            compensationDays={student.compensationDays} 
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentTable;
