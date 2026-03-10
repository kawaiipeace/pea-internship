'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import IconUser from '@/components/icon/icon-user';

export default function ProfileSetup() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [nickname, setNickname] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!nickname.trim()) return;
        // TODO: save profile data to API
        router.push('/student/check-in');
    };

    const isFormValid = nickname.trim().length > 0;

    return (
        <div 
            className="flex min-h-screen items-center justify-center font-nunito"
            style={{ background: 'linear-gradient(135deg, #fcca6b 0%, #c465f0 40%, #b1078c 75%, #ffffff 100%)' }}
        >
            <div className="relative z-10 w-full max-w-md px-4">
                {/* Card */}
                <div className="rounded-2xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-[#0e1726]/80">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">ตั้งค่าโปรไฟล์</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">เพิ่มรูปภาพและชื่อเล่นของคุณ</p>
                    </div>

                    {/* Profile Image Upload */}
                    <div className="mb-6 flex flex-col items-center">
                        <div
                            className={`group relative mb-3 h-32 w-32 cursor-pointer overflow-hidden rounded-full border-2 border-dashed transition-all duration-300 ${
                                isDragging
                                    ? 'border-primary bg-primary/5 scale-105'
                                    : profileImage
                                      ? 'border-primary/40 hover:border-primary'
                                      : 'border-gray-300 hover:border-primary dark:border-gray-600'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {profileImage ? (
                                <>
                                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-gray-400 transition-colors group-hover:text-primary dark:text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="mb-1 h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-xs font-medium">อัพโหลดรูป</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500">คลิกหรือลากรูปภาพมาวาง</p>
                    </div>

                    {/* Nickname Input */}
                    <div className="mb-8">
                        <label htmlFor="nickname" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            ชื่อเล่น
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                                <IconUser className="h-5 w-5" />
                            </span>
                            <input
                                id="nickname"
                                type="text"
                                placeholder="กรอกชื่อเล่นของคุณ"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && isFormValid && handleSubmit()}
                                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-[#1a1f3c] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isFormValid}
                        className={`w-full rounded-xl py-3 text-sm font-bold tracking-wide text-white shadow-lg transition-all duration-300 ${
                            isFormValid
                                ? 'bg-[#b1078c] hover:bg-[#b1078c]/90 hover:shadow-[#b1078c]/30 active:scale-[0.98]'
                                : 'cursor-not-allowed bg-gray-300 shadow-none dark:bg-gray-700'
                        }`}
                    >
                        เริ่มต้นใช้งาน
                    </button>
                </div>

                {/* Footer text */}
                <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
                    Intern-iTT © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
