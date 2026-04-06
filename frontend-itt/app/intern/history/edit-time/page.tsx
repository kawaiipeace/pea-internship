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
            router.push('/intern/history');
        }
    }, []);

    if (!data) return null;

    return (

        <div className="-m-6 min-h-screen bg-[#FCFAEE] lg:bg-white dark:bg-black flex justify-center p-0 lg:p-6">


            <div className="w-full max-w-[840px] p-4 lg:p-6 flex flex-col gap-6">

                <EditTimeForm
                    selectedHistoryItem={data}
                    setIsEditingTime={() => router.push('/intern/history')}
                />

            </div>
        </div>
    );
};

export default Page;