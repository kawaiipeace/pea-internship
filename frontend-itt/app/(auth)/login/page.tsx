import CustomLoginForm from '@/components/CustomLoginForm';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Login',
};

export default function LoginPage() {
    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 overflow-hidden font-nunito">
            {/* ----- Desktop Global Fixed Background ----- */}
            <div className="hidden md:block fixed inset-0 z-[1] pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin2.jpg')] bg-cover bg-center bg-no-repeat rotate-180 -scale-x-100 opacity-50"></div>
            </div>

            {/* ----- Mobile Global Fixed Background ----- */}
            <div className="md:hidden fixed inset-0 z-[1] pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin2.jpg')] bg-cover bg-center bg-no-repeat opacity-50"></div>
            </div>

            <div className="relative z-10 w-full flex justify-center items-center">
                <CustomLoginForm />
            </div>
        </div>
    );
}
