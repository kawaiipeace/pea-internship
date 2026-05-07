'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import IconUser from '@/components/icon/icon-user';
import { useDispatch } from 'react-redux';
import { setAdminRole } from '@/store/themeConfigSlice';
import { useRouter } from 'next/navigation';

interface RoleSwitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRole: 'admin' | 'mentor';
}

export const RoleSwitchModal = ({ isOpen, onClose, currentRole }: RoleSwitchModalProps) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // กำหนดบทบาทปลายทางที่จะสลับไป
    const targetRole = currentRole === 'admin' ? 'mentor' : 'admin';
    const targetRoleText = targetRole === 'admin' ? 'Admin' : 'Mentor';
    const fromRoleThai = currentRole === 'admin' ? 'แอดมิน' : 'พี่เลี้ยง';
    const toRoleThai = targetRole === 'admin' ? 'แอดมิน' : 'พี่เลี้ยง';

    const handleRoleSwitch = async () => {
        setIsLoading(true);
        
        // Simulate API call
        setTimeout(async () => {
            dispatch(setAdminRole(targetRole));
            
            onClose();
            
            // Show success modal (ปรับให้คล้ายในรูป)
            await Swal.fire({
                icon: 'success',
                title: 'สลับบทบาทสำเร็จ',
                showConfirmButton: false,
                timer: 1500,
                customClass: {
                    popup: 'rounded-[20px]',
                },
            });
            
            // Navigate to appropriate page
            router.push(targetRole === 'mentor' ? '/admin/mentor/approve' : '/admin');
            setIsLoading(false);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-[#0e1726]">
                
                {/* Icon Header */}
                <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-[#FDF2FD] p-4">
                        <IconUser className="h-8 w-8 text-[#9A0D8A]" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">
                        สลับบทบาทผู้ใช้งาน
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        คุณกำลังจะเปลี่ยนจาก <span className="font-semibold">{fromRoleThai}</span> เป็น <span className="font-semibold">{toRoleThai}</span>
                        <br />
                        การแสดงผลและสิทธิ์การใช้งานจะถูกปรับ
                        <br />
                        ตามบทบาทใหม่
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-1/2 rounded-lg border-2 border-gray-300 px-4 py-2 font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#253b5c] dark:text-gray-300 dark:hover:bg-[#1b2e4b]"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleRoleSwitch}
                        disabled={isLoading}
                        className="w-1/2 rounded-lg bg-[#9A0D8A] px-4 py-2 font-bold text-white transition-colors hover:bg-[#7a0a6a] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        เปลี่ยนเป็น {targetRoleText}
                    </button>
                </div>

            </div>
        </div>
    );
};
