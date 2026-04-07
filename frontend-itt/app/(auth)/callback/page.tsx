'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import Swal from 'sweetalert2';
import axios from '@/api/axios';

export default function SSOCallbackPage() {
    const router = useRouter();
    const isProcessing = useRef(false);

    useEffect(() => {
        const processLogin = async () => {
            if (isProcessing.current) return;
            isProcessing.current = true;

            try {
                const profileRes = await axios.get('/user/profile');
                const userData = profileRes.data.data || profileRes.data;

                if (!userData) {
                    throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
                }

                const roleMap: Record<number, string> = {
                    1: 'admin',
                    2: 'mentor',
                    3: 'intern',
                };
                const role = roleMap[userData.roleId] ?? 'intern';

                const tokenForStore = userData.accessToken ?? "session-active";
                document.cookie = `token=${tokenForStore}; path=/; max-age=86400; SameSite=Lax`;
                document.cookie = `user_role=${role}; path=/; max-age=86400; SameSite=Lax`;

                useAuthStore.getState().actionSetUser(userData);
                useAuthStore.getState().actionSetToken(tokenForStore);

                if (userData.roleId === 1) {
                    router.push('/admin');
                } else if (userData.roleId === 2) {
                    router.push('/mentor');
                } else {
                    router.push('/intern');
                }

            } catch (error) {
                console.error('ดึง Session ล้มเหลว:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'เข้าสู่ระบบล้มเหลว',
                    text: 'ไม่สามารถยืนยันตัวตนพนักงานได้ โปรดลองใหม่อีกครั้ง'
                });
                useAuthStore.getState().actionClearAuth();
                router.push('/login');
            }
        };

        processLogin();
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center flex-col space-y-4">
            <div className="w-10 h-10 border-4 border-[#9A0D8A] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-bold text-[#9A0D8A]">กำลังเข้าสู่ระบบพนักงาน...</p>
        </div>
    );
}