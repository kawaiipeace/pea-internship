"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '@/api/axios';
import useAuthStore from '@/store/authStore';
import ImageWithAuth from '../../../../components/ImageWithAuth'; // ปรับ Path ให้ตรงกับที่อยู่ไฟล์จริง

const ProfilePage = () => {
    // Progress State
    const [progressData, setProgressData] = useState<{
        accumulatedHours: number;
        totalHoursGoal: number;
        percentage: number;
    } | null>(null);

    // Full name (read-only from API)
    const [fullName, setFullName] = useState('');

    // Loading state
    const [isLoading, setIsLoading] = useState(true);

    // Editable Form State
    const [userData, setUserData] = useState({
        nickname: '',
        gender: '',
        email: '',
        phone: '',
        educationStatus: '',
        institution: '',
        period: '',
        hoursRequired: '',
        department: '',
        position: '',
    });

    // Mentor state
    const [mentors, setMentors] = useState<{ name: string; email: string | null; phoneNumber: string | null }[]>([]);

    // Profile image state
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // validate type
        if (!file.type.startsWith('image/')) {
            alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
            return;
        }
        // validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('ขนาดไฟล์ต้องไม่เกิน 5 MB');
            return;
        }

        // local preview
        const previewUrl = URL.createObjectURL(file);
        setProfileImage(previewUrl);

        // upload
        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            await axiosInstance.put('/user/student/itt/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        } catch (error) {
            console.error('Error uploading profile image:', error);
            // revert preview on error
            setProfileImage(null);
            alert('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsUploadingImage(false);
            // reset input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const actionSetUser = useAuthStore((state) => state.actionSetUser);

    // ── Fetch student profile from /user/student ──────────────────────────────
    const fetchStudentProfile = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/user/profile');
            const data = response.data;
            if (data) {
                // Sync to global store
                actionSetUser(data);

                // ชื่อจริง - นามสกุล
                const name = [data.fname, data.lname].filter(Boolean).join(' ') || '';
                setFullName(name);

                // profile คือ studentProfiles ที่ merge มาจาก backend
                const profile = data.profile ?? {};

                // แปลง startDate / endDate → period
                const formatDate = (d: string | null | undefined) => {
                    if (!d) return '';
                    return new Date(d).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    });
                };
                const period =
                    profile.startDate && profile.endDate
                        ? `${formatDate(profile.startDate)} - ${formatDate(profile.endDate)}`
                        : '';

                setUserData({
                    nickname: data.displayUsername ?? '',              // ชื่อเล่น
                    gender: data.gender ?? '',                         // MALE / FEMALE / OTHER
                    email: data.email ?? '',
                    phone: data.phoneNumber ?? '',                     // phoneNumber (ไม่ใช่ phone)
                    educationStatus: profile.faculty ?? '',            // คณะ
                    institution: profile.major ?? '',                  // สาขา
                    period,                                            // วันเริ่ม - วันสิ้นสุด
                    hoursRequired: profile.hours ? `${profile.hours} ชั่วโมง` : '',
                    department: '',   // ยังไม่มีใน response นี้
                    position: '',     // ยังไม่มีใน response นี้
                });
            }
        } catch (error) {
            console.error('Error fetching student profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Fetch internship info (department, position, mentors) ─────────────────
    const fetchInternshipInfo = useCallback(async () => {
        try {
            const historyRes = await axiosInstance.get('/applications/history/me');
            const history: any[] = historyRes.data ?? [];

            // หา active record ล่าสุด
            const activeApp = history.find((h) => h.isActive) ?? history[0];
            if (!activeApp) return;

            const positionName: string = activeApp.positionName ?? '';
            const departmentId: number | null = activeApp.positionDepartmentId ?? null;

            setUserData((prev) => ({
                ...prev,
                position: positionName,
            }));

            if (!departmentId) return;

            // ดึง mentor จาก /position?departmentId=xxx
            const posRes = await axiosInstance.get(`/position?departmentId=${departmentId}`);
            const positions: any[] = posRes.data?.data ?? posRes.data ?? [];

            // หา position ที่ตรงกับ positionId ของ active app
            const matchedPos = positions.find((p: any) => p.id === activeApp.positionId) ?? positions[0];

            // ชื่อกองงาน จาก department
            const deptName: string =
                matchedPos?.departmentName ??
                matchedPos?.department?.deptFull ??
                matchedPos?.department?.deptShort ??
                '';

            setUserData((prev) => ({
                ...prev,
                department: deptName,
            }));

            const mentorList: any[] = matchedPos?.mentors ?? [];
            setMentors(
                mentorList.map((m: any) => ({
                    name: m.name ?? [m.fname, m.lname].filter(Boolean).join(' '),
                    email: m.email ?? null,
                    phoneNumber: m.phoneNumber ?? m.phone ?? null,
                }))
            );
        } catch (error) {
            console.error('Error fetching internship info:', error);
        }
    }, []);

    // ── Fetch progress ────────────────────────────────────────────────────────
    const fetchProgress = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/user/student/total-hours');
            if (response.data) {
                setProgressData(response.data);
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
            setProgressData({
                accumulatedHours: 420,
                totalHoursGoal: 560,
                percentage: (420 / 560) * 100,
            });
        }
    }, []);

    useEffect(() => {
        fetchStudentProfile();
        fetchProgress();
        fetchInternshipInfo();
    }, [fetchStudentProfile, fetchProgress, fetchInternshipInfo]);

    // ── Edit state ────────────────────────────────────────────────────────────
    const [editingField, setEditingField] = useState<'nickname' | 'email' | null>(null);
    const [tempValue, setTempValue] = useState('');

    const startEdit = (field: 'nickname' | 'email') => {
        setEditingField(field);
        setTempValue(userData[field]);
    };

    const confirmEdit = () => {
        if (editingField) {
            setUserData((prev) => ({ ...prev, [editingField]: tempValue }));
            setEditingField(null);
        }
    };

    const cancelEdit = () => {
        setEditingField(null);
    };

    const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=random&size=200`;
    const displayName = isLoading ? '...' : fullName || '-';

    return (
        <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDFBF7] dark:bg-[#0e1726] p-4 md:p-6 lg:p-10 rounded-none">

            {/* Hidden file input for avatar upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* ──────────── MOBILE VIEW ──────────── */}
            <div className="block md:hidden w-full mx-auto font-sans">
                {/* Progress bar */}
                <div className="flex flex-col items-center mb-6 mt-2">
                    <div className="text-[13px] font-bold text-[#333741] dark:text-gray-300 mb-2">
                        ความคืบหน้าในการฝึกงาน
                    </div>
                    <div className="w-full h-[18px] bg-[#e4e4e4] dark:bg-[#1b2e4b] rounded-full overflow-hidden relative shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.1)]">
                        <div
                            className="h-full bg-[#A80689]"
                            style={{ width: `${progressData?.percentage ?? (420 / 560) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-medium pointer-events-none drop-shadow-md">
                            {progressData?.accumulatedHours ?? 420} / {progressData?.totalHoursGoal ?? 560} ชั่วโมง
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-[#1b2e4b] rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5 mb-4 border border-gray-100 dark:border-gray-800">
                    {/* Avatar */}
                    <div className="flex justify-center mb-6 mt-1">
                        <div className="relative">
                            <div className="w-[84px] h-[84px] rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                                {profileImage ? (
                                    // ถ้ามีการอัปโหลดรูปใหม่ ให้โชว์รูป Preview ในเครื่องก่อน
                                    <img src={profileImage} className="w-full h-full object-cover" alt="Profile Preview" />
                                ) : (
                                    // ดึงรูปจาก API อย่างปลอดภัย
                                    <ImageWithAuth
                                        className="w-full h-full object-cover"
                                        fallbackSrc={defaultAvatarUrl}
                                    />
                                )}
                            </div>
                            {/* Loading overlay */}
                            {isUploadingImage && (
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                    <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={isUploadingImage}
                                className="absolute bottom-0 right-0 w-[28px] h-[28px] bg-[#FED8F6] dark:bg-[#1b2e4b] border-[1.5px] border-pink-200 dark:border-gray-600 rounded-full flex items-center justify-center text-[#A80689] dark:text-[#B10073] shadow-sm hover:bg-pink-200 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[14px] scale-[0.8]">edit_square</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* ข้อมูลส่วนตัว */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-[16px] font-bold text-[#2a303b] dark:text-white-light">ข้อมูลส่วนตัว</h2>

                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">ชื่อจริง - นามสกุล</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{displayName}</span>
                            </div>

                            {/* ชื่อเล่น (editable) */}
                            <div className="flex flex-col">
                                {editingField === 'nickname' ? (
                                    <>
                                        <div className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300 mb-1.5">ชื่อเล่น</div>
                                        <input
                                            type="text"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="w-full text-[13px] rounded-[6px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1b2e4b] p-2 focus:outline-none focus:border-[#A80689] focus:ring-1 focus:ring-[#A80689] transition-all"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button type="button" onClick={cancelEdit} className="px-4 py-1.5 text-[12px] font-medium text-[#A80689] bg-white border border-[#A80689] rounded-[6px] hover:bg-pink-50 transition-colors">ยกเลิก</button>
                                            <button type="button" onClick={confirmEdit} className="px-4 py-1.5 text-[12px] font-medium text-white bg-[#A80689] border border-[#A80689] rounded-[6px] hover:bg-[#8e0574] transition-colors">ยืนยัน</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => startEdit('nickname')}>
                                            <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300 hover:text-[#A80689] transition-colors">ชื่อเล่น</span>
                                            <span className="material-symbols-outlined text-[14px] text-[#A80689] scale-[0.7]">edit_square</span>
                                        </div>
                                        <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.nickname || '-'}</div>
                                    </>
                                )}
                            </div>

                            {/* อีเมล (editable) */}
                            <div className="flex flex-col">
                                {editingField === 'email' ? (
                                    <>
                                        <div className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300 mb-1.5">อีเมล</div>
                                        <input
                                            type="email"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            className="w-full text-[13px] rounded-[6px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1b2e4b] p-2 focus:outline-none focus:border-[#A80689] focus:ring-1 focus:ring-[#A80689] transition-all"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button type="button" onClick={cancelEdit} className="px-4 py-1.5 text-[12px] font-medium text-[#A80689] bg-white border border-[#A80689] rounded-[6px] hover:bg-pink-50 transition-colors">ยกเลิก</button>
                                            <button type="button" onClick={confirmEdit} className="px-4 py-1.5 text-[12px] font-medium text-white bg-[#A80689] border border-[#A80689] rounded-[6px] hover:bg-[#8e0574] transition-colors">ยืนยัน</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => startEdit('email')}>
                                            <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300 hover:text-[#A80689] transition-colors">อีเมล</span>
                                            <span className="material-symbols-outlined text-[14px] text-[#A80689] scale-[0.7]">edit_square</span>
                                        </div>
                                        <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.email || '-'}</div>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">เบอร์โทร</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.phone || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">เพศ</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.gender || '-'}</span>
                            </div>
                        </div>

                        {/* ข้อมูลการศึกษา */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-[16px] font-bold text-[#2a303b] dark:text-white-light mt-1">ข้อมูลการศึกษา</h2>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">การศึกษาปัจจุบัน</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.educationStatus || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">ชื่อสถาบัน</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.institution || '-'}</span>
                            </div>
                        </div>

                        {/* ข้อมูลการฝึกงาน */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-[16px] font-bold text-[#2a303b] dark:text-white-light mt-1">ข้อมูลการฝึกงาน</h2>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">ตำแหน่ง</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.position || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">ชื่อกองงาน</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.department || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">ระยะเวลาที่ฝึก</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.period || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#2a303b] dark:text-gray-300">ชั่วโมงที่ต้องฝึก</span>
                                <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{userData.hoursRequired || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mentors Card */}
                <div className="bg-white dark:bg-[#1b2e4b] rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5 border border-gray-100 dark:border-gray-800">
                    <h2 className="text-[16px] font-bold text-[#2a303b] dark:text-white-light mb-4">ข้อมูลพี่เลี้ยง</h2>
                    <div className="flex flex-col gap-4">
                        {mentors.length > 0 ? mentors.map((m, i) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-[14px] font-medium text-[#2a303b] dark:text-gray-300">{m.name || '-'}</span>
                                {m.phoneNumber && <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{m.phoneNumber}</span>}
                                {m.email && <span className="text-[13px] text-gray-500 dark:text-gray-400">{m.email}</span>}
                            </div>
                        )) : (
                            <span className="text-[13px] text-gray-400 dark:text-gray-500">-</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ──────────── DESKTOP VIEW ──────────── */}
            <div className="hidden md:block w-full max-w-[800px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
                    <div className="relative shrink-0">
                        <div className="w-[100px] h-[100px] rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {profileImage ? (
                                // ถ้ามีการอัปโหลดรูปใหม่ ให้โชว์รูป Preview ในเครื่องก่อน
                                <img src={profileImage} className="w-full h-full object-cover" alt="Profile Preview" />
                            ) : (
                                // ดึงรูปจาก API อย่างปลอดภัย
                                <ImageWithAuth
                                    className="w-full h-full object-cover"
                                    fallbackSrc={defaultAvatarUrl}
                                />
                            )}
                        </div>
                        {/* Loading overlay */}
                        {isUploadingImage && (
                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            disabled={isUploadingImage}
                            className="absolute bottom-0 right-0 w-[28px] h-[28px] bg-[#FED8F6] dark:bg-[#1b2e4b] border-[1.5px] border-pink-200 dark:border-gray-600 rounded-full flex items-center justify-center text-[#A80689] dark:text-[#B10073] shadow-sm hover:bg-pink-200 transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[14px] scale-[0.8] text-[#A80689]">edit_square</span>
                        </button>
                    </div>
                    <div className="flex flex-col flex-1 w-full mt-2 md:mt-0">
                        <h1 className="text-[32px] font-bold text-black dark:text-white-light leading-none mb-4 tracking-tight">
                            {displayName}
                        </h1>
                        <div className="text-[14px] font-bold text-[#333741] dark:text-gray-300 tracking-wide mb-2">
                            ความคืบหน้าในการฝึกงาน
                        </div>
                        <div className="flex items-center w-full max-w-[500px] gap-[10px] h-[22px] z-10">
                            <div className="flex-1 h-[18px] rounded-full overflow-hidden bg-gradient-to-b from-[#e4e4e4] to-[#f8f8f8] dark:from-[#1b2e4b] dark:to-[#0f1928] shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.1)] relative flex items-center min-w-0">
                                <div
                                    className="text-white text-[11px] h-[18px] flex justify-end pr-4 items-center font-medium rounded-full bg-[#A80689] shadow-[inset_0px_-4px_6px_rgba(0,0,0,0.4),inset_0px_2px_3px_rgba(255,255,255,0.4)] whitespace-nowrap"
                                    style={{ width: `${progressData?.percentage ?? (420 / 560) * 100}%`, minWidth: '75px' }}
                                >
                                    {progressData?.accumulatedHours ?? 420} ชั่วโมง
                                </div>
                            </div>
                            <div className="shrink-0 text-white text-[11px] px-3 min-w-[70px] h-[22px] rounded-full font-medium flex items-center justify-center bg-[#A80689] shadow-[inset_0px_-5px_7px_rgba(0,0,0,0.4),inset_0px_2px_4px_rgba(255,255,255,0.4)] whitespace-nowrap z-20">
                                {progressData?.totalHoursGoal ?? 560} ชั่วโมง
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Sections */}
                <div className="flex flex-col gap-10">

                    {/* Section 1 – ข้อมูลส่วนตัว */}
                    <div className="flex flex-col gap-5">
                        <h2 className="text-[20px] font-bold text-[#2a303b] dark:text-white-light">ข้อมูลส่วนตัว</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

                            {/* ชื่อเล่น (editable) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">ชื่อเล่น</label>
                                {editingField === 'nickname' ? (
                                    <>
                                        <input
                                            type="text"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            autoFocus
                                            className="w-full text-[14px] font-medium text-[#4b5563] dark:text-gray-200 bg-white dark:bg-[#1b2e4b] border border-gray-300 dark:border-gray-600 rounded-[6px] py-[10px] pl-4 pr-4 focus:outline-none focus:border-[#A80689] focus:ring-1 focus:ring-[#A80689] transition-all shadow-sm"
                                        />
                                        <div className="flex gap-2.5 mt-1">
                                            <button type="button" onClick={cancelEdit} className="px-5 py-2 text-[13px] font-medium text-[#A80689] bg-white border border-[#A80689] rounded-[6px] hover:bg-pink-50 transition-colors">ยกเลิก</button>
                                            <button type="button" onClick={confirmEdit} className="px-5 py-2 text-[13px] font-medium text-white bg-[#A80689] border border-[#A80689] rounded-[6px] hover:bg-[#8e0574] transition-colors">ยืนยัน</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative group cursor-pointer" onClick={() => startEdit('nickname')}>
                                        <input
                                            type="text"
                                            value={userData.nickname}
                                            readOnly
                                            className="w-full text-[14px] font-medium text-[#4b5563] dark:text-gray-200 bg-white dark:bg-[#1b2e4b] border border-transparent dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 rounded-[6px] py-[10px] pl-4 pr-10 cursor-pointer transition-all shadow-sm"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#A80689] transition-colors pointer-events-none">
                                            <span className="material-symbols-outlined text-[18px] text-[#A80689]">edit_square</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* เพศ (readonly) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">เพศ</label>
                                <input
                                    type="text"
                                    value={userData.gender}
                                    readOnly
                                    className="w-full text-[14px] font-medium text-[#6b7280] dark:text-gray-400 bg-[#ECECED] dark:bg-black/20 border border-transparent rounded-[6px] py-[10px] px-4 cursor-not-allowed"
                                />
                            </div>

                            {/* อีเมล (editable) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">อีเมล</label>
                                {editingField === 'email' ? (
                                    <>
                                        <input
                                            type="email"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            autoFocus
                                            className="w-full text-[14px] font-medium text-[#4b5563] dark:text-gray-200 bg-white dark:bg-[#1b2e4b] border border-gray-300 dark:border-gray-600 rounded-[6px] py-[10px] pl-4 pr-4 focus:outline-none focus:border-[#A80689] focus:ring-1 focus:ring-[#A80689] transition-all shadow-sm"
                                        />
                                        <div className="flex gap-2.5 mt-1">
                                            <button type="button" onClick={cancelEdit} className="px-5 py-2 text-[13px] font-medium text-[#A80689] bg-white border border-[#A80689] rounded-[6px] hover:bg-pink-50 transition-colors">ยกเลิก</button>
                                            <button type="button" onClick={confirmEdit} className="px-5 py-2 text-[13px] font-medium text-white bg-[#A80689] border border-[#A80689] rounded-[6px] hover:bg-[#8e0574] transition-colors">ยืนยัน</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative group cursor-pointer" onClick={() => startEdit('email')}>
                                        <input
                                            type="email"
                                            value={userData.email}
                                            readOnly
                                            className="w-full text-[14px] font-medium text-[#4b5563] dark:text-gray-200 bg-white dark:bg-[#1b2e4b] border border-transparent dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 rounded-[6px] py-[10px] pl-4 pr-10 cursor-pointer transition-all shadow-sm"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#A80689] transition-colors pointer-events-none">
                                            <span className="material-symbols-outlined text-[18px] text-[#A80689]">edit_square</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* เบอร์โทร (readonly) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">เบอร์โทร</label>
                                <input
                                    type="text"
                                    value={userData.phone}
                                    readOnly
                                    className="w-full text-[14px] font-medium text-[#6b7280] dark:text-gray-400 bg-[#ECECED] dark:bg-black/20 border border-transparent rounded-[6px] py-[10px] px-4 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2 – ข้อมูลการศึกษา */}
                    <div className="flex flex-col gap-5">
                        <h2 className="text-[20px] font-bold text-[#2a303b] dark:text-white-light">ข้อมูลการศึกษา</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">การศึกษาปัจจุบัน</label>
                                <input
                                    type="text"
                                    value={userData.educationStatus}
                                    readOnly
                                    className="w-full text-[14px] font-medium text-[#6b7280] dark:text-gray-400 bg-[#ECECED] dark:bg-black/20 border border-transparent rounded-[6px] py-[10px] px-4 cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">ชื่อสถาบัน</label>
                                <input
                                    type="text"
                                    value={userData.institution}
                                    readOnly
                                    className="w-full text-[14px] font-medium text-[#6b7280] dark:text-gray-400 bg-[#ECECED] dark:bg-black/20 border border-transparent rounded-[6px] py-[10px] px-4 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3 – ข้อมูลการฝึกงาน */}
                    <div className="flex flex-col gap-5">
                        <h2 className="text-[20px] font-bold text-[#2a303b] dark:text-white-light">ข้อมูลการฝึกงาน</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">ระยะเวลาที่ฝึก</label>
                                <input
                                    type="text"
                                    value={userData.period}
                                    readOnly
                                    className="w-full text-[14px] font-medium text-[#6b7280] dark:text-gray-400 bg-[#ECECED] dark:bg-black/20 border border-transparent rounded-[6px] py-[10px] px-4 cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">ชั่วโมงที่ต้องฝึก</label>
                                <input
                                    type="text"
                                    value={userData.hoursRequired}
                                    readOnly
                                    className="w-full text-[14px] font-medium text-[#6b7280] dark:text-gray-400 bg-[#ECECED] dark:bg-black/20 border border-transparent rounded-[6px] py-[10px] px-4 cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">ชื่อกองงาน</label>
                                <input
                                    type="text"
                                    value={userData.department}
                                    readOnly
                                    className="w-full text-[14px] font-medium text-[#6b7280] dark:text-gray-400 bg-[#ECECED] dark:bg-black/20 border border-transparent rounded-[6px] py-[10px] px-4 cursor-not-allowed"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[15px] font-bold text-[#2a303b] dark:text-gray-300">ตำแหน่ง</label>
                                <input
                                    type="text"
                                    value={userData.position}
                                    readOnly
                                    className="w-full text-[14px] font-medium text-[#6b7280] dark:text-gray-400 bg-[#ECECED] dark:bg-black/20 border border-transparent rounded-[6px] py-[10px] px-4 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4 – ข้อมูลพี่เลี้ยง */}
                    <div className="w-full">
                        <div className="bg-[#ECECED] dark:bg-[#1b2e4b] rounded-[10px] shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-[#17263c] p-6">
                            <h2 className="text-[18px] font-bold text-[#2a303b] dark:text-white-light mb-5">ข้อมูลพี่เลี้ยง</h2>
                            <div className="flex flex-col gap-6">
                                {mentors.length > 0 ? mentors.map((m, i) => (
                                    <div key={i} className="flex flex-col gap-1.5">
                                        <div className="text-[15px] font-medium text-[#2a303b] dark:text-white-light">{m.name || '-'}</div>
                                        {m.phoneNumber && <div className="text-[14px] text-[#5b6a80] dark:text-[#888ea8]">{m.phoneNumber}</div>}
                                        {m.email && <div className="text-[14px] text-[#5b6a80] dark:text-[#888ea8]">{m.email}</div>}
                                    </div>
                                )) : (
                                    <span className="text-[14px] text-[#5b6a80] dark:text-[#888ea8]">-</span>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
