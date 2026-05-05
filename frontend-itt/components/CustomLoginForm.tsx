'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import useAuthStore from '@/store/authStore';
import axios from '../api/axios';


export default function CustomLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const login = useAuthStore((state) => state.actionLogin);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const getHomeByRole = (roleId: number | undefined): string => {
        switch (roleId) {
            case 1: return '/admin';
            case 2: return '/mentor';
            default: return '/intern';
        }
    };

    const handleEmployeeLogin = async () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/sign-in/keycloak/itt`;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await login({ phoneNumber, password });

            Swal.fire({
                icon: 'success',
                title: 'เข้าสู่ระบบสำเร็จ',
                showConfirmButton: false,
                timer: 1500,
                customClass: {
                    popup: 'rounded-[20px]',
                },
            });

            setTimeout(() => {
                const callbackUrl = searchParams.get('callbackUrl');
                const freshUser = useAuthStore.getState().user;
                const home = getHomeByRole(freshUser?.roleId);

                if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.includes('/login')) {
                    router.push(callbackUrl);
                } else {
                    router.push(home);
                }
            }, 500);

        } catch (error) {
            let errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
                const status = axiosError.response?.status;

                if (status === 401 || status === 400) {
                    errorMessage = 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง';
                } else {
                    errorMessage = axiosError.response?.data?.message || errorMessage;
                }
            }

            Swal.fire({
                icon: 'error',
                title: 'เข้าสู่ระบบล้มเหลว',
                text: errorMessage,
                customClass: {
                    popup: 'rounded-[20px]',
                    confirmButton: 'bg-[#9A0D8A] rounded-[10px]',
                },
            });
        }
    };

    return (
        <div className="w-full max-w-[340px] mx-auto bg-white rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] p-8 relative border border-white/40">
            {/* Logo area */}
            <div className="flex justify-center mb-10 mt-2">
                <img 
                    src="/pwa-icon.svg" 
                    alt="PEA iTT Logo" 
                    className="h-[54px] w-auto drop-shadow-md"
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="phoneNumber" className="block text-[15px] font-bold text-[#333741] mb-2">
                        เบอร์โทร
                    </label>
                    <input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="เบอร์โทรศัพท์"
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#9A0D8A] text-sm text-[#333741] placeholder-gray-400"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-[15px] font-bold text-[#333741] mb-2">
                        รหัสผ่าน
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="รหัสผ่าน"
                            className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#9A0D8A] text-sm text-[#333741] placeholder-gray-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="pt-2 pb-2 space-y-4">
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-[#9A0D8A] hover:bg-[#7D0A6F] text-white rounded-[10px] text-[16px] font-normal transition-all shadow-[0_4px_10px_rgba(154,13,138,0.3)] hover:-translate-y-[1px]"
                    >
                        เข้าสู่ระบบ
                    </button>
                    <button
                        onClick={handleEmployeeLogin}
                        type="button"
                        className="w-full py-3 px-4 bg-white border-[1px] border-[#A80689] text-[#A80689] rounded-[5px] text-[16px] font-normal transition-all hover:bg-[#9A0D8A]/5 hover:-translate-y-[1px]"
                    >
                        เข้าสู่ระบบพนักงาน PEA
                    </button>
                </div>
            </form>
        </div>
    );
}
