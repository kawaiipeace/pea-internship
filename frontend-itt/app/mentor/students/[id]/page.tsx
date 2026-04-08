'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import IconClock from '@/components/icon/icon-clock';
import IconExport from '@/components/icon/icon-export';

const StudentDetailPage = () => {
    const router = useRouter();
    const [page, setPage] = useState(1);
    
    // Mock data for student history
    const history = [
        { date: '16 มกราคม 2569', status: 'เข้างานปกติ', login: '08:30 - 16:30', hours: '7 ชั่วโมง', evidence: '', note: '' },
        { date: '15 มกราคม 2569', status: 'เข้างานปกติ', login: '08:30 - 16:30', hours: '7 ชั่วโมง', evidence: '', note: '' },
        { date: '14 มกราคม 2569', status: 'เข้างานปกติ', login: '08:30 - 16:30', hours: '7 ชั่วโมง', evidence: 'หลักฐาน.png', note: 'แก้ไขเวลาเข้างาน', noteType: 'warning' },
        { date: '13 มกราคม 2569', status: 'เข้างานปกติ', login: '08:30 - 16:30', hours: '7 ชั่วโมง', evidence: '', note: 'ปฏิบัติงานนอกสถานที่', noteType: 'location' },
        { date: '12 มกราคม 2569', status: 'เข้างานปกติ', login: '08:30 - 16:30', hours: '7 ชั่วโมง', evidence: 'หลักฐาน.png', note: 'แก้ไขเวลาออกงาน', noteType: 'warning' },
        { date: '11 มกราคม 2569', status: 'ลาป่วย', login: '08:30 - 16:30', hours: '7 ชั่วโมง', evidence: 'หลักฐาน.png', note: 'อาหารเป็นพิษ', noteType: 'normal' },
        { date: '10 มกราคม 2569', status: 'ไม่ลงเวลาออก', login: '08:30 - ไม่ลงเวลา', hours: '0 ชั่วโมง', evidence: '', note: '', noteType: '' },
        { date: '9 มกราคม 2569', status: 'ขาด', login: 'ไม่ลงเวลา', hours: '0 ชั่วโมง', evidence: '', note: '', noteType: '' },
        { date: '8 มกราคม 2569', status: 'สาย', login: '10:00 - 16:30', hours: '7 ชั่วโมง', evidence: '', note: '', noteType: '' },
        { date: '7 มกราคม 2569', status: 'ลากิจ', login: '08:30 - 16:30', hours: '0 ชั่วโมง', evidence: 'หลักฐาน.png', note: 'เข้าร่วมกิจกรรมมหาวิทยาลัย...', noteType: 'normal' },
    ];

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'เข้างานปกติ':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#E4FFEE] border border-[#75E0A7] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#079455] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>check</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">เข้างานปกติ</span>
                    </div>
                );
            case 'สาย':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FFF9E5] border border-[#FFCA5F] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#FDB022] text-white rounded-full shrink-0 shadow-sm transition-transform">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>schedule</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">สาย</span>
                    </div>
                );
            case 'ลากิจ':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#EEEFFF] border border-[#1A3CFF]/50 w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#1A3CFF] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>business_center</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลากิจ</span>
                    </div>
                );
            case 'ลาป่วย':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FFEFF3] border border-[#FF1A7D]/50 w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#FF1A7D] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>health_cross</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ลาป่วย</span>
                    </div>
                );
            case 'ไม่ลงเวลาออก':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#F0F1F1] border border-[#94969C] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#85888E] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '20px' }}>hourglass_disabled</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ไม่ลงเวลาออก</span>
                    </div>
                );
            case 'ขาด':
                return (
                    <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-[#FFF1EF] border border-[#FF8980] w-max">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#D92D20] text-white rounded-full shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[20px] select-none" style={{ fontSize: '26px' }}>close</span>
                        </div>
                        <span className="text-[#4b5563] font-medium text-[12px] whitespace-nowrap">ขาด</span>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-[#111827] hover:opacity-70 transition-all font-medium text-[15px]"
            >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                ย้อนกลับ
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-8">
                    <div className="flex items-start gap-6">
                        <img src="/assets/images/profile-1.jpeg" className="w-32 h-32 rounded-full object-cover border border-[#E5E7EB] shrink-0" alt="" 
                            onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Somjai&background=random' }}
                        />
                        <div className="flex flex-col">
                            <div className="px-3 py-1 rounded-full bg-[#FEF7EB] border border-[#FDB022] text-[#944900] text-[12px] font-bold flex items-center gap-2 w-max mb-5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FDB022]"></div>
                                อยู่ระหว่างฝึกงาน
                            </div>
                            <h1 className="text-[24px] font-medium text-[#111827] leading-tight">สมใจ ใฝ่ฝัน (ใจฝัน)</h1>
                            <p className="text-[#61646C] text-[14px] font-medium">นักออกแบบ UX/UI</p>
                            
                            <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-8">
                                <div>
                                    <p className="text-[#98A2B3] text-[15px] mb-0.5">ชื่อสถานบัน</p>
                                    <p className="text-[#111827] text-[18px] font-normal leading-tight">มหาวิทยาลัยแม่ฟ้าหลวง</p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[15px] mb-0.5">ระยะเวลาการฝึกงาน</p>
                                    <p className="text-[#111827] text-[18px] font-normal leading-tight">5 มกราคม 2569 - 24 เมษายน 2569</p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[15px] mb-0.5">อีเมล</p>
                                    <p className="text-[#111827] text-[18px] font-normal leading-tight">panaddanat1@gmail.com</p>
                                </div>
                                <div>
                                    <p className="text-[#98A2B3] text-[15px] mb-0.5">เบอร์โทร</p>
                                    <p className="text-[#111827] text-[18px] font-normal leading-tight">095 698 8888</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-8 flex flex-col items-start bg-white h-full relative">
                    <div className="space-y-4 w-full">
                        <h2 className="text-[#111827] font-bold text-[18px]">ความคืบหน้าในการฝึกงาน</h2>
                        <div className="flex flex-col gap-5">
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-[32px] font-bold text-[#A80689]">420</span>
                                <span className="text-[16px] text-[#61646C] font-medium">/ 560 ชั่วโมง</span>
                            </div>
                            <div className="w-full bg-[#F2F4F7] rounded-full h-3">
                                <div className="bg-[#A80689] h-3 rounded-full w-[75%] shadow-sm"></div>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <span 
                                    className="material-symbols-outlined select-none" 
                                    style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px', color: '#85888E' }}
                                >
                                    schedule
                                </span>
                                <span className="text-[14px] font-normal text-[#6b7280]">
                                    เหลืออีก 26 วันก่อนสิ้นสุดการฝึกงาน
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button className="w-full py-3.5 bg-[#6CE9A6] text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-12 hover:bg-[#5ED295] transition-colors shadow-sm">
                        <div className="w-7 h-7 flex items-center justify-center border-2 border-white rounded-full">
                             <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                        <span className="text-[18px]">ข้อความ</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'เข้างานปกติ', icon: 'check', color: '#079455', bg: '#E4FFEE' },
                    { label: 'สาย', icon: 'schedule', color: '#FDB022', bg: '#FFF9E5' },
                    { label: 'ลา', icon: 'business_center', color: '#1A3CFF', bg: '#EEEFFF' },
                    { label: 'ขาด', icon: 'close', color: '#D92D20', bg: '#FFF1EF' }
                ].map((stat, i) => (
                    <div key={i} className="panel border-[#CECFD2] border-[1px] shadow-sm rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: stat.color }}>
                            <span className="material-symbols-outlined text-white select-none" style={{ fontSize: '24px' }}>{stat.icon}</span>
                        </div>
                        <div>
                            <p className="text-[#61646C] text-[12px] font-medium">{stat.label}</p>
                            <p className="text-[#111827] text-[16px] font-bold">2 รายการ</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="panel p-0 border-[#CECFD2] border-[1px] shadow-sm overflow-hidden rounded-xl">
                <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse table-auto min-w-[1000px]">
                        <thead className="bg-[#F9FAFB] border-b border-[#F2F4F7]">
                            <tr className="text-[#111827] font-normal text-[14px]">
                                <th className="py-4 px-6 text-center font-normal">วันที่</th>
                                <th className="py-4 px-6 text-center font-normal">สถานะ</th>
                                <th className="py-4 px-6 text-center font-normal">เวลาเข้า - ออกงาน</th>
                                <th className="py-4 px-6 text-center font-normal">ชั่วโมงทำงาน</th>
                                <th className="py-4 px-6 text-center font-normal">หลักฐาน</th>
                                <th className="py-4 px-6 text-center font-normal">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2F4F7]">
                            {history.map((row, i) => (
                                <tr key={i}>
                                    <td className="py-4 px-6 text-center text-[14px] text-[#475467]">{row.date}</td>
                                    <td className="py-4 px-6 flex justify-center">{renderStatusBadge(row.status)}</td>
                                    <td className="py-4 px-6 text-center text-[14px] text-[#475467]">{row.login}</td>
                                    <td className="py-4 px-6 text-center text-[14px] text-[#475467] font-bold">{row.hours}</td>
                                    <td className="py-4 px-6 text-center">
                                        {row.evidence && (
                                            <div className="inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-lg border border-[#D0D5DD] bg-[#F2F4F7] text-[13px] font-medium text-[#111827]">
                                                <div className="w-8 h-8 flex items-center justify-center  text-[#000000] rounded-md shrink-0">
                                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>image</span>
                                                </div>
                                                {row.evidence}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <span className={`text-[12px] font-medium ${
                                            row.noteType === 'warning' ? 'text-[#D92D20]' : 
                                            row.noteType === 'location' ? 'text-[#D92D20]' : 'text-[#000000]'
                                        }`}>
                                            {row.note}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                <button className="flex items-center gap-2.5 text-[#A80689] font-bold text-[16px] hover:opacity-80 transition-all">
                    <span className="material-symbols-outlined">ios_share</span>
                    ส่งออกตาราง
                </button>

                <div className="flex items-center border border-[#CECFD2] rounded-full overflow-hidden bg-white shadow-sm">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="w-11 h-10 flex items-center justify-center text-[#000000] border-r border-[#CECFD2] disabled:opacity-30 disabled:bg-gray-50/50"
                    >
                        <span className="material-symbols-outlined text-[22px]">chevron_left</span>
                    </button>
                    <button onClick={() => setPage(1)} className={`w-11 h-10 flex items-center justify-center text-[14px] font-medium transition-all border-r border-[#CECFD2] ${page === 1 ? 'bg-[#E4E7EC] text-[#1F2937]' : 'text-[#6B7280] hover:bg-gray-50'}`}>1</button>
                    <button onClick={() => setPage(2)} className={`w-11 h-10 flex items-center justify-center text-[14px] font-medium transition-all border-r border-[#CECFD2] ${page === 2 ? 'bg-[#E4E7EC] text-[#1F2937]' : 'text-[#6B7280] hover:bg-gray-50'}`}>2</button>
                    <div className="w-11 h-10 flex items-center justify-center text-[#667085] text-[14px] border-r border-[#CECFD2]">...</div>
                    <button className="w-11 h-10 flex items-center justify-center text-[14px] font-medium text-[#6B7280] hover:bg-gray-50 border-r border-[#CECFD2]">9</button>
                    <button className="w-11 h-10 flex items-center justify-center text-[14px] font-medium text-[#6B7280] hover:bg-gray-50 border-r border-[#CECFD2]">10</button>
                    <button
                        onClick={() => setPage(page + 1)}
                        className="w-11 h-10 flex items-center justify-center text-[#000] font-bold hover:bg-gray-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailPage;

