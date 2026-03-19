'use client';

import React, { useEffect, useState } from 'react';
import EditTimeForm from '@/components/history/edit-time-form';
import { useRouter } from 'next/navigation';

const Page = () => {
    const [data, setData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const item = localStorage.getItem('editItem');

        if (item) {
            setData(JSON.parse(item));
        } else {
            router.push('/history');
        }
    }, []);

    if (!data) return null;

    return (
        // 🔥 พื้นหลัง
       <div className="max-screen bg-white flex justify-center p-6">
            
            {/* 🔥 กล่องหลัก (ตาม Figma แต่ไม่พัง) */}
            <div className="w-full max-w-[840px] p-6 flex flex-col gap-6">
                
                <EditTimeForm
                    selectedHistoryItem={data}
                    setIsEditingTime={() => router.back()}
                />

            </div>
        </div>
    );
};

export default Page;