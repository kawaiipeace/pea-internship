import { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'นักศึกษาในดูแล',
};

const StudentsPage = () => {
    const students = [
        { id: 1, name: 'สมชาย รักเรียน', university: 'มหาวิทยาลัยเทคโนโลยีราชมงคล', department: 'วิศวกรรมคอมพิวเตอร์', status: 'กำลังฝึกงาน' },
        { id: 2, name: 'สมหญิง จริงใจ', university: 'มหาวิทยาลัยเกษตรศาสตร์', department: 'วิทยาการคอมพิวเตอร์', status: 'กำลังฝึกงาน' },
        { id: 3, name: 'วิชัย กล้าหาญ', university: 'สถาบันเทคโนโลยีพระจอมเกล้า', department: 'วิศวกรรมไฟฟ้า', status: 'กำลังฝึกงาน' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">นักศึกษาในดูแล</h5>
                <Link href="#" className="btn btn-primary">เพิ่มข้อมูลนักศึกษา</Link>
            </div>
            <div className="panel">
                <div className="table-responsive">
                    <table className="table-hover">
                        <thead>
                            <tr>
                                <th>ชื่อ-นามสกุล</th>
                                <th>มหาวิทยาล้ย</th>
                                <th>แผนก/สาขา</th>
                                <th>สถานะ</th>
                                <th className="text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.name}</td>
                                    <td>{student.university}</td>
                                    <td>{student.department}</td>
                                    <td>
                                        <span className={`badge ${student.status === 'กำลังฝึกงาน' ? 'badge-outline-success' : 'badge-outline-primary'} `}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button type="button" className="btn btn-sm btn-outline-primary mr-2">ดูรายละเอียด</button>
                                        <button type="button" className="btn btn-sm btn-outline-danger">รายงาน</button>
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

export default StudentsPage;

