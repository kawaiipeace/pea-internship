import CustomLoginForm from '@/app/(auth)/login/page';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Login',
};

export default function LoginPage() {
    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 overflow-hidden">
            {/* Global Fixed Background (Matching check-in page) */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-[#fdfbfe]">
                <div className="absolute inset-0 bg-[url('/bg-checkin.jpg')] bg-cover bg-center bg-no-repeat md:rotate-180 opacity-50"></div>
            </div>

            <div className="relative z-10 w-full flex justify-center items-center">
                <CustomLoginForm />
            </div>
        </div>
    );
}
