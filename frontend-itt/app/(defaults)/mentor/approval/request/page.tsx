import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'อนุมัติการลาและแก้ไขเวลา',
};

const ApprovalRequestPage = () => {
    const requests = [
        { id: 1, name: 'สมชาย รักเรียน', type: 'ลากิจ', date: '2024-03-26', reason: 'ธุระทางครอบครัว', status: 'รออนุมัติ' },
        { id: 2, name: 'สมหญิง จริงใจ', type: 'ลาป่วย', date: '2024-03-25', reason: 'ปวดหัว ตัวร้อน', status: 'รออนุมัติ' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">รายการรอนุมัติ</h5>
            </div>
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>ชื่อ-นามสกุล</th>
                                <th>ประเภท</th>
                                <th>วันที่</th>
                                <th>เหตุผล</th>
                                <th>สถานะ</th>
                                <th className="text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.id}>
                                    <td>{request.name}</td>
                                    <td>{request.type}</td>
                                    <td>{request.date}</td>
                                    <td>{request.reason}</td>
                                    <td><span className="badge badge-outline-warning">{request.status}</span></td>
                                    <td className="text-center">
                                        <button type="button" className="btn btn-sm btn-success mr-2">อนุมัติ</button>
                                        <button type="button" className="btn btn-sm btn-danger">ปฏิเสธ</button>
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

export default ApprovalRequestPage;

