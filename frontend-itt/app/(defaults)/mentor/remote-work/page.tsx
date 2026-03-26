import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'ปฏิบัติงานนอกสถานที่',
};

const RemoteWorkPage = () => {
    const remoteWorks = [
        { id: 1, name: 'วิชัย กล้าหาญ', date: '2024-03-26', location: 'PEA สำนักงานใหญ่', description: 'สำรวจหน้างานติดตั้งมิเตอร์', status: 'เรียบร้อย' },
        { id: 2, name: 'สมชาย รักเรียน', date: '2024-03-27', location: 'กฟส. รังสิต', description: 'อบรมระบบไฟฟ้าแรงสูง', status: 'รอดำเนินการ' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">รายการปฏิบัติงานนอกสถานที่</h5>
            </div>
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>ชื่อ-นามสกุล</th>
                                <th>วันที่</th>
                                <th>สถานที่</th>
                                <th>รายละเอียดงาน</th>
                                <th>สถานะ</th>
                                <th className="text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remoteWorks.map((work) => (
                                <tr key={work.id}>
                                    <td>{work.name}</td>
                                    <td>{work.date}</td>
                                    <td>{work.location}</td>
                                    <td>{work.description}</td>
                                    <td>
                                        <span className={`badge ${work.status === 'เรียบร้อย' ? 'badge-outline-primary' : 'badge-outline-info'} `}>
                                            {work.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button type="button" className="btn btn-sm btn-outline-primary mr-2">ดูพิกัด</button>
                                        <button type="button" className="btn btn-sm btn-outline-secondary">แก้ไข</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RemoteWorkPage;

