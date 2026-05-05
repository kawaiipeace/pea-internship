import React from 'react';
import DetailAttendanceBadge from './DetailAttendanceBadge';

interface AttendanceHistoryTableProps {
    attendanceRecords: any[];
    onViewFile: (url: string) => void;
}

const AttendanceHistoryTable: React.FC<AttendanceHistoryTableProps> = ({
    attendanceRecords,
    onViewFile
}) => {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getDisplayHours = (row: any) => {
        if (row.status === 'ABSENT' || row.status === 'LEAVE') return 0;
        return Math.round(parseFloat(row.hours || 0));
    };

    return (
        <div className="panel p-0 border-[#CECFD2] border-[1px] shadow-sm overflow-hidden rounded-xl">
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse table-auto min-w-[1100px]">
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
                        {attendanceRecords.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-10 text-center text-gray-500">ไม่พบประวัติการลงเวลา</td>
                            </tr>
                        ) : attendanceRecords.map((row, i) => (
                            <tr key={row.id || i}>
                                <td className="py-4 px-6 text-center text-[16px] text-[#475467]">{formatDate(row.workDate)}</td>
                                <td className="py-4 px-6 flex justify-center">
                                    <DetailAttendanceBadge status={row.status} note={row.note} leaveType={row.leaveType} />
                                </td>
                                <td className="py-4 px-6 text-center text-[16px] text-[#475467]">
                                    {row.status === 'ABSENT' || row.status === 'LEAVE' ? '-' : `${row.checkInTime} - ${row.checkOutTime}`}
                                </td>
                                <td className="py-4 px-6 text-center text-[16px] text-[#475467] font-bold">{getDisplayHours(row)} ชม.</td>
                                <td className="py-4 px-6">
                                    <div className="flex justify-center">
                                        {row.evidenceUrl ? (
                                            <button
                                                type="button"
                                                onClick={() => onViewFile(row.evidenceUrl)}
                                                className="inline-flex items-center gap-2 px-1.5 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl hover:bg-[#E5E7EB] transition-colors cursor-pointer"
                                            >
                                                {row.evidenceUrl.toLowerCase().endsWith('.pdf') ? (
                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-[#111827] text-[24px]">
                                                            picture_as_pdf
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-[#ffffff] flex items-center justify-center shrink-0">
                                                        <span
                                                            className="material-symbols-outlined text-[#000000] text-[18px]"
                                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                                        >
                                                            image
                                                        </span>
                                                    </div>
                                                )}
                                                <span className="text-[15px] font-medium text-[#111827] pr-2">
                                                    หลักฐาน.{row.evidenceUrl.split('.').pop()?.substring(0, 4)}
                                                </span>
                                            </button>
                                        ) : row.status === 'LEAVE' ? (
                                            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl">
                                                <span className="text-[15px] font-medium text-[#6B7280]">
                                                    - ไม่มีไฟล์แนบ -
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[#98A2B3] text-[16px]">-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        {(() => {
                                            const allNotes: any[] = [];
                                            if (row.notes && Array.isArray(row.notes)) {
                                                row.notes.forEach((n: any) => {
                                                    if (n.detail) allNotes.push(n);
                                                });
                                            }
                                            if (row.note && !allNotes.some(n => n.detail === row.note)) {
                                                allNotes.push({ type: 'OTHER', detail: row.note });
                                            }
                                            if (allNotes.length === 0) return <span className="text-[16px] font-medium text-[#98A2B3]">-</span>;

                                            return allNotes.map((n, idx) => {
                                                const isCorrection = n.type === 'CORRECTION' || n.detail.includes('แก้ไขเวลา');
                                                const isOffsite = n.type === 'OFFSITE' || n.detail.includes('ปฏิบัติงานนอกสถานที่');
                                                if (row.status === 'LATE' && (n.detail === 'สาย' || !isCorrection && !isOffsite && n.type !== 'LEAVE')) {
                                                    return null;
                                                }
                                                const color = (isCorrection || isOffsite) ? 'text-[#D92D20]' : 'text-[#000000]';
                                                return (
                                                    <span key={idx} className={`text-[16px] font-medium ${color}`}>
                                                        {n.detail}
                                                    </span>
                                                );
                                            });
                                        })()}
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

export default AttendanceHistoryTable;
