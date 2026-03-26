import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'ประวัติการอนุมัติ',
};

const ApprovalHistoryPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">ประวัติการอนุมัติ</h1>
            <p className="mt-4">หน้านี้สำหรับดูประวัติการอนุมัติทั้งหมด</p>
        </div>
    );
};

export default ApprovalHistoryPage;
