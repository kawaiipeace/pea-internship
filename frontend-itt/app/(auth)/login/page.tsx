import CustomLoginForm from '@/components/CustomLoginForm';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
    title: 'Login',
};

export default function LoginPage() {
    return (
        <div 
            className="relative min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 overflow-hidden font-nunito"
            style={{ background: 'linear-gradient(135deg, #fcca6b 0%, #c465f0 40%, #b1078c 75%, #ffffff 100%)' }}
        >
            <div className="relative z-10 w-full flex justify-center items-center">
                <CustomLoginForm />
            </div>
        </div>
    );
}
