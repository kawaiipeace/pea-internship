'use client';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/api/axios';
import IconXCircle from '@/components/icon/icon-x-circle';

// Shared Components
import StudentFilter from '@/components/student_mentor/StudentFilter';
import StudentTable from '@/components/student_mentor/StudentTable';

const StudentsPage = () => {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [5, 10, 20, 50];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [dateRange, setDateRange] = useState<any>(''); // Actual filter state (Date[])
    const [confirmedDateStr, setConfirmedDateStr] = useState(''); // Last confirmed formatted string
    const flatpickrRef = useRef<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/mentor/students', {
                params: { limit: 100, }
            });

            const rawStudents = response.data.data || [];

            // Fetch detail for each student to get internship period dates
            const detailPromises = rawStudents.map((s: any) =>
                axiosInstance.get(`/mentor/students/${s.id}`).catch(() => null)
            );
            const details = await Promise.all(detailPromises);

            const mappedStudents = rawStudents.map((s: any, index: number) => {
                const detail = details[index]?.data;
                const current = Math.round(Number(s.workHours?.accumulated || 0));
                const total = Math.round(Number(s.workHours?.goal || 560));
                const percent = total > 0 ? (current / total) * 100 : 0;

                const end = detail?.progress?.extendedEndDate
                    ? new Date(detail.progress.extendedEndDate)
                    : (detail?.profile?.period?.endDate ? new Date(detail.profile.period.endDate) : null);

                let statusMessage = 'กำลังฝึกงาน';
                let statusType = 'remaining';

                if (end) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const targetDate = new Date(end);
                    targetDate.setHours(0, 0, 0, 0);

                    if (today > targetDate) {
                        statusMessage = 'สิ้นสุดการฝึกงาน';
                        statusType = 'ended';
                    } else {
                        let workingDays = 0;
                        let tempDate = new Date(today);
                        while (tempDate <= targetDate) {
                            const day = tempDate.getDay();
                            if (day !== 0 && day !== 6) {
                                workingDays++;
                            }
                            tempDate.setDate(tempDate.getDate() + 1);
                        }

                        if (workingDays > 1) {
                            statusMessage = `เหลืออีก ${workingDays} วันทำการก่อนสิ้นสุดการฝึกงาน`;
                        } else if (workingDays === 1) {
                            statusMessage = 'ฝึกงานวันสุดท้าย';
                            statusType = 'last-day';
                        } else {
                            // If today <= targetDate but only weekends are left
                            statusMessage = 'สิ้นสุดการฝึกงาน';
                            statusType = 'ended';
                        }
                    }
                }

                const rawName = s.fullName || 'ไม่ระบุชื่อ';
                const nameParts = rawName.split(' (');
                const mainName = nameParts[0];
                const extractedNick = nameParts[1] ? nameParts[1].replace(')', '') : '';

                const nick = s.nickname || detail?.profile?.nickname || extractedNick;
                const displayName = nick ? `${mainName} (${nick})` : mainName;

                const compensationDays = Math.ceil((detail?.progress?.totalExtendedHours || 0) / 7);

                return {
                    id: s.id,
                    name: displayName,
                    nickname: nick,
                    role: detail?.profile?.position || 'นักศึกษาฝึกงาน',
                    university: detail?.profile?.institution || 'การไฟฟ้าส่วนภูมิภาค',
                    status: s.todayStatus?.code || 'IDLE',
                    avatar: s.image,
                    attendance: {
                        present: s.statistics?.present || 0,
                        late: s.statistics?.late || 0,
                        leave: s.statistics?.leave || 0,
                        absent: s.statistics?.absent || 0
                    },
                    progress: { current, total, percent: percent > 100 ? 100 : percent },
                    statusMessage,
                    statusType,
                    internshipStatus: detail?.profile?.internshipStatus,
                    compensationDays,
                    startDate: detail?.profile?.period?.startDate,
                    endDate: detail?.profile?.period?.endDate,
                    gender: detail?.profile?.gender,
                    position: detail?.profile?.position,
                    considerationStatus: detail?.profile?.internshipStatus === 'COMPLETE' ? 'COMPLETE' :
                        (statusType === 'ended' || statusType === 'last-day') ? 'AWAITING' :
                        (detail?.profile?.internshipStatus === 'EXTENDED' || compensationDays > 0) ? 'EXTENDED' : 'ACTIVE'
                };
            });

            setStudents(mappedStudents);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const filteredItems = useMemo(() => {
        let result = [...students];

        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter((item) =>
                item.name.toLowerCase().includes(searchLower) ||
                item.role.toLowerCase().includes(searchLower) ||
                item.university.toLowerCase().includes(searchLower)
            );
        }

        // Filter by internship period (date range from calendar)
        if (Array.isArray(dateRange) && dateRange.length > 0) {
            const start = dateRange[0];
            const end = dateRange.length === 2 ? dateRange[1] : dateRange[0];

            if (start && end) {
                const filterStart = new Date(start);
                const filterEnd = new Date(end);
                filterStart.setHours(0, 0, 0, 0);
                filterEnd.setHours(23, 59, 59, 999);

                result = result.filter((item) => {
                    if (!item.startDate || !item.endDate) return false;
                    const itemStart = new Date(item.startDate);
                    const itemEnd = new Date(item.endDate);
                    return itemStart <= filterEnd && itemEnd >= filterStart;
                });
            }
        }

        // Filter by status
        if (statusFilter !== 'ALL') {
            result = result.filter((item) => item.considerationStatus === statusFilter);
        }

        return result;
    }, [searchTerm, students, dateRange, statusFilter]);

    const records = useMemo(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        return filteredItems.slice(from, to);
    }, [page, pageSize, filteredItems]);

    const handleExportExcel = () => {
        const BOM = '\uFEFF';
        let csvContent = BOM + 'ลำดับ,ชื่อนักศึกษา,สถานะวันนี้,มา,สาย,ลา,ขาด,ชั่วโมงทำงาน(ปัจจุบัน),ชั่วโมงทำงาน(ทั้งหมด)\n';

        filteredItems.forEach((student, index) => {
            const statusLabel =
                student.status === 'PRESENT' ? 'เข้างานปกติ' :
                    student.status === 'LEAVE' ? 'ลากิจ' :
                        student.status === 'MISSING_OUT' ? 'ไม่ลงเวลาออก' :
                            student.status === 'ABSENT' ? 'ขาด' :
                                student.status === 'LATE' ? 'สาย' : '';

            const row = [
                index + 1,
                `"${student.name}"`,
                `"${statusLabel}"`,
                student.attendance.present,
                student.attendance.late,
                student.attendance.leave,
                student.attendance.absent,
                student.progress.current,
                student.progress.total
            ];
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `students_export_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-[24px] font-bold text-[#000000]">นักศึกษาในความดูแล</h1>
                <p className="text-[16px] font-normal text-[#61646C]">แสดงภาพรวมข้อมูลการฝึกงานของนักศึกษาในความดูแล</p>
            </div>

            <StudentFilter 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                confirmedDateStr={confirmedDateStr}
                setConfirmedDateStr={setConfirmedDateStr}
                dateRange={dateRange}
                setDateRange={setDateRange}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                flatpickrRef={flatpickrRef}
            />

            {isLoading ? (
                <div className=" flex items-center justify-center py-10 ]  ">
                    <span className="text-gray-500">กำลังโหลดข้อมูล...</span>
                </div>
            ) : records.length === 0 ? (
                <div className=" flex flex-col items-center justify-center py-16 gap-4  ">
                    <img src="/Notstudent.png" alt="ไม่มีนักศึกษา" className="w-[180px] h-auto opacity-80" />
                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <h2 className="text-[20px] font-bold text-[#1F2937]">ยังไม่มีนักศึกษาในความดูแล</h2>
                        <p className="text-[14px] text-[#9CA3AF] leading-relaxed">
                            คุณยังไม่มีรายชื่อนักศึกษาในความดูแลในขณะนี้<br />
                            ข้อมูลจะปรากฏขึ้นเมื่อคุณเริ่มเป็นพี่เลี้ยงให้กับนักศึกษา
                        </p>
                    </div>
                </div>
            ) : (
                <StudentTable records={records} router={router} />
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-8 pb-10 gap-6 px-2">
                <button
                    onClick={handleExportExcel}
                    className="flex items-center  text-[#A80689] font-bold text-[14px] "
                >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg text-[#A80689]">
                        <span className="material-symbols-outlined select-none text-[24px]">ios_share</span>
                    </div>
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

                    {Array.from({ length: Math.ceil(filteredItems.length / pageSize) }).map((_, index) => {
                        const pageNum = index + 1;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`w-11 h-10 flex items-center justify-center text-[14px] font-medium transition-all border-r border-[#CECFD2] ${page === pageNum ? 'bg-[#E4E7EC] text-[#1F2937]' : 'text-[#6B7280] hover:bg-gray-50'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setPage(Math.min(Math.ceil(filteredItems.length / pageSize), page + 1))}
                        disabled={page >= Math.ceil(filteredItems.length / pageSize)}
                        className="w-11 h-10 flex items-center justify-center text-[#000] font-bold hover:bg-gray-50 transition-colors disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentsPage;

