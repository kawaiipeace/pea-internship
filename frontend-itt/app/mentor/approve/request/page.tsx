import { Metadata } from 'next';
import React from 'react';
import IconNotes from '@/components/icon/icon-notes';
import IconPencilPaper from '@/components/icon/icon-pencil-paper';
import IconCalendar from '@/components/icon/icon-calendar';
import IconEye from '@/components/icon/icon-eye';
import IconCircleCheck from '@/components/icon/icon-circle-check';
import IconXCircle from '@/components/icon/icon-x-circle';

export const metadata: Metadata = {
    title: 'รายการคำขออนุมัติ',
};

const ApprovalRequestPage = () => {
    const summaryCards = [
        {
            title: 'คำขอลา',
            count: '2 รายการ',
            icon: (
                <div className="p-2 rounded-lg bg-blue-500">
                    <IconNotes className="w-6 h-6 text-white" />
                </div>
            ),
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconBg: 'bg-blue-100',
            countColor: 'text-gray-800'
        },
        {
            title: 'คำขอแก้ไขเวลา',
            count: '3 รายการ',
            icon: (
                <div className="p-2 rounded-lg bg-orange-500">
                    <IconPencilPaper className="w-6 h-6 text-white" />
                </div>
            ),
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            iconBg: 'bg-orange-100',
            countColor: 'text-gray-800'
        }
    ];

    const requests = [
        {
            id: 1,
            studentName: 'สมหมาย สายเสมอ (นาย)',
            type: 'ลากิจ',
            typeColor: 'text-blue-600 bg-blue-50 border-blue-200',
            dotColor: 'bg-blue-600',
            requestDate: '12 มกราคม 2569',
            leaveTime: '08:30 - 12:00',
            reason: 'เข้าร่วมกิจกรรมมหาวิทยาลัย ขาดไม่ได้',
            profileImg: '/assets/images/profile-1.jpeg',
            attachment: {
                name: 'หลักฐานการเข้าอบรม.pdf',
                size: '2MB',
                thumbnail: '/assets/images/file-preview.svg'
            }
        },
        {
            id: 2,
            studentName: 'สมหมาย สายเสมอ (นาย)',
            type: 'ลาป่วย',
            typeColor: 'text-pink-600 bg-pink-50 border-pink-200',
            dotColor: 'bg-pink-600',
            requestDate: '9 มกราคม 2569',
            leaveTime: '08:30 - 12:00',
            reason: 'ท้องเสียเนื่องจากอาหารเป็นพิษ',
            profileImg: '/assets/images/profile-2.jpeg',
            attachment: {
                name: 'ใบรับรองแพทย์.pdf',
                size: '105KB',
                thumbnail: '/assets/images/file-preview.svg'
            }
        }
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white-light">รายการคำขออนุมัติ</h1>
                <p className="text-gray-500 mt-2 text-lg">แสดงรายการคำขอจากนักศึกษาที่อยู่ในการดูแล เพื่อพิจารณาอนุมัติหรือปฏิเสธ</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {summaryCards.map((card, index) => (
                    <div key={index} className={`flex items-center p-6 rounded-2xl border-2 ${card.bgColor} ${card.borderColor} shadow-sm group hover:scale-[1.02] transition-transform duration-300`}>
                        <div className="mr-6">
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-md font-bold text-gray-700">{card.title}</p>
                            <p className={`text-2xl font-black ${card.countColor}`}>{card.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* List Header */}
            <div className="mb-4">
                <h5 className="text-xl font-bold text-gray-500">รายการทั้งหมด</h5>
            </div>

            {/* Request List */}
            <div className="space-y-6">
                {requests.map((request) => (
                    <div key={request.id} className="bg-white dark:bg-[#0e1726] border-2 border-gray-100 dark:border-white-dark/10 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="p-6 md:p-8">
                            {/* Date Header */}
                            <div className="flex justify-end items-center text-sm text-gray-400 mb-6">
                                <IconCalendar className="w-5 h-5 mr-2" />
                                <span>วันที่ส่งคำขอ : <span className="font-bold text-gray-800 dark:text-white-light">{request.requestDate}</span></span>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center bg-gray-50/50 dark:bg-black/20 p-6 rounded-[1.5rem] border border-gray-100 dark:border-white-dark/10">
                                {/* Student Info */}
                                <div className="flex-shrink-0 mx-auto md:mx-0">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg ring-2 ring-gray-100 dark:ring-white-dark/10">
                                        <img src={request.profileImg} alt="Student" className="w-full h-full object-cover" />
                                    </div>
                                </div>

                                <div className="flex-grow space-y-4 w-full">
                                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                                        <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white-light leading-tight">{request.studentName}</h3>
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold ${request.typeColor}`}>
                                            <span className={`w-2.5 h-2.5 rounded-full ${request.dotColor}`}></span>
                                            {request.type}
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-md">
                                        <p className="text-gray-500 font-medium">ระยะเวลาการลา : <span className="text-gray-800 dark:text-white-light font-bold ml-1">{request.leaveTime}</span></p>
                                        <p className="text-gray-500 font-medium">เหตุผลการลา : <span className="text-gray-800 dark:text-white-light font-bold ml-1">{request.reason}</span></p>
                                    </div>

                                    {/* Attachment */}
                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 mb-3 text-gray-800 dark:text-white-light font-bold">
                                            <IconNotes className="w-5 h-5 text-gray-600" />
                                            หลักฐานการลางาน
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1b2e4b] border-2 border-gray-100 dark:border-white-dark/10 rounded-2xl max-w-md group/file cursor-pointer hover:border-primary/30 transition-colors">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-12 h-12 bg-gray-50 dark:bg-black/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/file:bg-primary/10 transition-colors">
                                                    <img src={request.attachment.thumbnail} alt="" className="w-8 h-8 opacity-40 group-hover/file:opacity-70 transition-opacity" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-white-light truncate group-hover/file:text-primary transition-colors">{request.attachment.name}</p>
                                                    <p className="text-xs text-gray-400 font-bold">({request.attachment.size})</p>
                                                </div>
                                            </div>
                                            <button className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                <IconEye className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
                                <button className="btn bg-red-500 hover:bg-red-600 text-white border-0 w-full sm:w-auto px-12 py-3.5 rounded-2xl shadow-xl shadow-red-200 dark:shadow-none font-black text-lg flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:scale-95">
                                    <IconXCircle className="w-6 h-6" />
                                    ไม่นุมัติ
                                </button>
                                <button className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-0 w-full sm:w-auto px-12 py-3.5 rounded-2xl shadow-xl shadow-emerald-200 dark:shadow-none font-black text-lg flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:scale-95">
                                    <IconCircleCheck className="w-6 h-6" />
                                    อนุมัติ
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center md:justify-end mt-12 py-4">
                <nav className="flex items-center gap-2">
                    <button className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-primary border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-all">&lt;</button>
                    <button className="w-11 h-11 flex items-center justify-center bg-gray-200 text-gray-700 font-black rounded-xl border-2 border-gray-200 scale-110 shadow-sm">1</button>
                    <button className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-500 font-bold rounded-xl border-2 border-transparent transition-all">2</button>
                    <span className="px-1 text-gray-300 font-bold">...</span>
                    <button className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-500 font-bold rounded-xl border-2 border-transparent transition-all">9</button>
                    <button className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-500 font-bold rounded-xl border-2 border-transparent transition-all">10</button>
                    <button className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-primary border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-all">&gt;</button>
                </nav>
            </div>
        </div>
    );
};

export default ApprovalRequestPage;



