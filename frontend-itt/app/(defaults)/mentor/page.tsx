import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Mentor',
};

const MentorPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">หน้าหลักพี่เลี้ยง (Mentor)</h1>
            <p className="mt-4">ยินดีต้อนรับสู่ระบบสำหรับพี่เลี้ยง</p>
        </div>
    );
};

export default MentorPage;
